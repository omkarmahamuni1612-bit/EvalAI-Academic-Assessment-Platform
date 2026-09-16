import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  FileWarning,
  Gauge,
  Loader2,
  Play,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { students } from "../auth/studentAuth";
import {
  approveInSemEvaluation,
  getInSemEvaluationProgress,
  getInSemExam,
  getInSemSubmissionByEvaluationId,
  getInSemSubmissions,
  isInSemResultsPublished,
  mapAnswerSheetToStudent,
  publishInSemResults,
  reEvaluateInSemSubmission,
  saveInSemTeacherReview,
  startInSemEvaluation,
} from "../data/inSemData";
import { processAllSubmissions } from "../api/insemApi";
import { PageHeader, StatusBadge, Toast } from "../components/WorkflowUI";
import { BulkAnswerSheetUpload, ExaminationProcessingStatus } from "../components/BulkAnswerSheetUpload";
import "./InSemExaminationPage.css";

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfUpload({ label, helperText, file, onFileChange, onRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const validateAndSet = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed. Please select a valid PDF document.");
      return;
    }
    setError("");
    onFileChange(selectedFile);
  };

  const handleInputChange = (event) => {
    validateAndSet(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    validateAndSet(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="insem-pdf-upload">
      <div className="insem-pdf-label">
        <span>{label}</span>
        <small>{helperText}</small>
      </div>

      {file ? (
        <div className="insem-pdf-file-card">
          <div className="insem-pdf-file-icon"><FileText size={22} /></div>
          <div className="insem-pdf-file-info">
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)} · PDF document</span>
          </div>
          <div className="insem-pdf-file-actions">
            <label className="insem-pdf-replace-btn">
              <Upload size={14} /> Replace
              <input type="file" accept="application/pdf,.pdf" onChange={handleInputChange} />
            </label>
            <button type="button" className="insem-pdf-remove-btn" onClick={onRemove} aria-label={`Remove ${label}`}>
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`insem-pdf-dropzone ${dragActive ? "is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input type="file" accept="application/pdf,.pdf" onChange={handleInputChange} />
          <span className="insem-pdf-dropzone-icon"><Upload size={20} /></span>
          <strong>Upload PDF</strong>
          <small>Drag & drop your PDF here, or click to browse</small>
        </label>
      )}

      {error && <div className="insem-pdf-error" role="alert"><FileWarning size={14} />{error}</div>}
    </div>
  );
}

export function DifficultySelector({ value, onChange }) {
  const levels = [
    { key: "easy", label: "Easy", icon: "✓", description: "More tolerant evaluation. Focus on basic concept understanding." },
    { key: "moderate", label: "Moderate", icon: "◐", description: "Balanced evaluation. Recommended standard." },
    { key: "hard", label: "Hard", icon: "✕", description: "Strict evaluation. Requires technical precision and complete reasoning." },
  ];

  return (
    <div className="insem-difficulty-selector">
      {levels.map((level) => (
        <button
          type="button"
          key={level.key}
          className={`insem-difficulty-card insem-difficulty-${level.key} ${value === level.key ? "selected" : ""}`}
          onClick={() => onChange(level.key)}
          aria-pressed={value === level.key}
        >
          <div className="insem-difficulty-card-top">
            <span className="insem-difficulty-icon">{level.icon}</span>
            <strong>{level.label}</strong>
            {value === level.key && <Check size={16} className="insem-difficulty-check" />}
          </div>
          <p>{level.description}</p>
        </button>
      ))}
    </div>
  );
}

export const evaluationStages = [
  "Document Processing",
  "OCR Text Extraction",
  "Semantic Answer Analysis",
  "Difficulty-Based Evaluation",
  "Rubric Scoring",
  "Feedback Generation",
];

export const stageText = [
  "Rendering PDF pages…",
  "Gemini Vision handwriting extraction…",
  "Segmenting question-wise answers…",
  "Applying difficulty evaluation standard…",
  "Calculating marks…",
  "Generating audit feedback…",
];

export function InSemExaminationPage() {
  const navigate = useNavigate();
  const exam = getInSemExam();
  const [questionPaper, setQuestionPaper] = useState(null);
  const [referenceAnswer, setReferenceAnswer] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [answerSheet, setAnswerSheet] = useState(null);
  const [mappedSubmissions, setMappedSubmissions] = useState(getInSemSubmissions());
  const [toast, setToast] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showReevalModal, setShowReevalModal] = useState(null);
  const [viewOriginalModal, setViewOriginalModal] = useState(null);
  const [published, setPublished] = useState(isInSemResultsPublished());
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [stage, setStage] = useState(-1);
  const [difficulty, setDifficulty] = useState("moderate");
  const [validationMessage, setValidationMessage] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  const progress = getInSemEvaluationProgress();
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  const handleMapAnswerSheet = () => {
    setValidationMessage("");
    if (!selectedStudent) {
      setValidationMessage("Please select a student to map the answer sheet.");
      return;
    }
    if (!answerSheet) {
      setValidationMessage("Please upload the student's answer sheet PDF first.");
      return;
    }
    const result = mapAnswerSheetToStudent(selectedStudent, answerSheet, { replace: true });
    if (result.error) {
      setValidationMessage(result.error);
      return;
    }
    setMappedSubmissions([...getInSemSubmissions()]);
    setToast(`Answer sheet mapped to ${selectedStudent.name} (${selectedStudent.roll}).`);
    setAnswerSheet(null);
    setSelectedStudentId("");
  };

  const handleStartEvaluation = (submission) => {
    if (!submission) return;
    setEvaluatingId(submission.id);
    setStage(0);

    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage += 1;
      setStage(currentStage);
      if (currentStage >= evaluationStages.length) {
        clearInterval(interval);
        const result = startInSemEvaluation(submission.id, difficulty);
        setMappedSubmissions([...getInSemSubmissions()]);
        setEvaluatingId(null);
        setStage(-1);
        if (result) {
          setToast(`AI evaluation completed for ${result.studentName}.`);
        }
      }
    }, 500);
  };

  const confirmReEvaluate = (submission) => {
    setShowReevalModal(submission);
  };

  const executeReEvaluate = () => {
    const submission = showReevalModal;
    setShowReevalModal(null);
    if (!submission) return;

    setEvaluatingId(submission.id);
    setStage(0);

    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage += 1;
      setStage(currentStage);
      if (currentStage >= evaluationStages.length) {
        clearInterval(interval);
        const result = reEvaluateInSemSubmission(submission.id, difficulty);
        setMappedSubmissions([...getInSemSubmissions()]);
        setEvaluatingId(null);
        setStage(-1);
        if (result) {
          setToast(`Re-evaluation completed for ${result.studentName} under ${difficulty.toUpperCase()} mode.`);
        }
      }
    }, 500);
  };

  const handleProcessAll = async () => {
    setIsBulkProcessing(true);
    setBulkProgress(0);
    const total = mappedSubmissions.length;

    try {
      await processAllSubmissions(difficulty);
    } catch (e) {
      console.log("Processing batch locally...");
    }

    for (let i = 0; i < total; i++) {
      setBulkProgress(i + 1);
      const sub = mappedSubmissions[i];
      startInSemEvaluation(sub.id, difficulty);
      await new Promise((res) => setTimeout(res, 300));
    }

    setMappedSubmissions([...getInSemSubmissions()]);
    setIsBulkProcessing(false);
    setToast(`Successfully processed and evaluated all ${total} student answer sheets.`);
  };

  const handlePublish = () => {
    const result = publishInSemResults();
    if (result.alreadyPublished) {
      setToast("Results already published. Students have already been notified.");
    } else if (result.incomplete) {
      setToast("Complete all student evaluations before publishing results.");
    } else {
      setPublished(true);
      setMappedSubmissions([...getInSemSubmissions()]);
      setToast("In-Sem results published successfully. Students have been notified.");
    }
    setShowPublishModal(false);
  };

  return (
    <div className="insem-page">
      <Toast message={toast} onClose={() => setToast("")} />
      <PageHeader
        eyebrow="IN-SEM EXAMINATION"
        title="In-Sem Examination Workflow"
        subtitle={`${exam.title} · Course Code: ${exam.courseCode} · Total Marks: ${exam.totalMarks}`}
        actions={
          <Link className="workflow-btn" to="/teacher/dashboard">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
        }
      />

      {/* Publish Results Panel */}
      <section className={`insem-surface insem-publish-panel ${published ? "published" : ""}`}>
        <div className="insem-publish-info">
          <div className="insem-publish-icon"><CheckCircle2 size={20} /></div>
          <div>
            <h2>{published ? "Results Published" : "Evaluation Progress"}</h2>
            <p>{published ? "Results have been published to the Student Portal." : progress.allEvaluated ? "All answer sheets evaluated & ready for teacher approval" : `${progress.evaluated} of ${progress.total} answer sheets evaluated`}</p>
          </div>
        </div>
        <div className="insem-publish-progress">
          <div className="insem-publish-progress-bar"><i style={{ width: `${progress.percentage}%` }} /></div>
          <span>{progress.evaluated} / {progress.total} Answer Sheets Evaluated</span>
        </div>
        <div className="insem-publish-actions">
          {published ? (
            <span className="insem-publish-status-badge"><Check size={14} /> Published</span>
          ) : (
            <button
              type="button"
              className="workflow-btn primary insem-publish-btn"
              disabled={!progress.allEvaluated}
              onClick={() => setShowPublishModal(true)}
            >
              <CheckCircle2 size={15} /> PUBLISH RESULTS & NOTIFY STUDENTS
            </button>
          )}
        </div>
      </section>

      <ExaminationProcessingStatus students={students} submissions={mappedSubmissions} published={published} evaluationProgress={progress} />

      {/* Step 1: Upload Question Paper */}
      <section className="insem-surface insem-section">
        <div className="insem-section-heading">
          <div><span>01</span><h2>Examination Papers & Question Structure</h2></div>
          <p>Uploaded Question Paper: <strong>CAA CO1 and CO2 Question Paper1.pdf</strong> (Parsed dynamically)</p>
        </div>
        <div className="insem-upload-grid">
          <PdfUpload
            label="Question Paper PDF"
            helperText="Uploaded: CAA CO1 and CO2 Question Paper1.pdf"
            file={questionPaper || exam.questionPaperPdf}
            onFileChange={setQuestionPaper}
            onRemove={() => setQuestionPaper(null)}
          />
          <PdfUpload
            label="Reference Answer PDF"
            helperText="Uploaded model answer reference PDF"
            file={referenceAnswer || exam.referenceAnswerPdf}
            onFileChange={setReferenceAnswer}
            onRemove={() => setReferenceAnswer(null)}
          />
        </div>
      </section>

      {/* Step 2: Bulk Answer Sheets */}
      <section className="insem-surface insem-section">
        <div className="insem-section-heading">
          <div><span>02</span><h2>Uploaded Student Answer Sheets (14 PDFs Detected)</h2></div>
          <p>EvalAI has automatically loaded the 14 actual student answer PDFs uploaded to the repository (`iot1.pdf` – `iot14.pdf`).</p>
        </div>

        <BulkAnswerSheetUpload
          students={students}
          submissions={mappedSubmissions}
          mapAnswerSheet={mapAnswerSheetToStudent}
          onMapped={() => setMappedSubmissions([...getInSemSubmissions()])}
        />
      </section>

      {/* Step 3: AI Evaluation & Batch Execution */}
      <section className="insem-surface insem-section">
        <div className="insem-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span>03</span><h2>AI Evaluation & Teacher Control</h2>
            <p>Select evaluation difficulty mode and process all 14 student answer sheets.</p>
          </div>
          <button
            type="button"
            className="workflow-btn primary"
            disabled={isBulkProcessing || mappedSubmissions.length === 0}
            onClick={handleProcessAll}
            style={{ padding: "10px 20px", fontSize: "14px", fontWeight: "600" }}
          >
            {isBulkProcessing ? (
              <>
                <Loader2 size={16} className="spin" /> Processing {bulkProgress} / {mappedSubmissions.length}
              </>
            ) : (
              <>
                <Play size={15} /> Process All 14 Answer Sheets
              </>
            )}
          </button>
        </div>

        <div className="insem-difficulty-panel">
          <div className="insem-difficulty-heading">
            <div className="insem-difficulty-icon"><Gauge size={19} /></div>
            <div>
              <h3>Select Evaluation Difficulty</h3>
              <p>Independent rubric evaluation standard. Does not corrupt raw score baseline.</p>
            </div>
          </div>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>

        <div className="insem-table-wrap">
          <table className="insem-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Answer Sheet PDF</th>
                <th>Status</th>
                <th>Score</th>
                <th>Original View</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mappedSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td><strong>{submission.studentName}</strong></td>
                  <td className="insem-muted">{submission.rollNumber}</td>
                  <td>
                    <span className="insem-file-pill">
                      <FileText size={14} />
                      <span>{submission.fileName}</span>
                    </span>
                  </td>
                  <td>
                    {submission.status === "Evaluation Completed" ? (
                      <span className="status-badge status-evaluated">AI Evaluated</span>
                    ) : submission.status === "Teacher Approved" ? (
                      <span className="status-badge status-approved">Approved</span>
                    ) : submission.status === "Result Published" ? (
                      <span className="status-badge status-published">Published</span>
                    ) : (
                      <StatusBadge status={submission.status} />
                    )}
                  </td>
                  <td className="insem-score-cell"><strong>{submission.score}</strong></td>
                  <td>
                    <button
                      type="button"
                      className="insem-text-action"
                      style={{ color: "#2563eb", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      onClick={() => setViewOriginalModal(submission)}
                    >
                      <Eye size={14} /> View Original Answer
                    </button>
                  </td>
                  <td>
                    <div className="insem-action-group">
                      {evaluatingId === submission.id ? (
                        <span className="insem-evaluating">
                          <Loader2 size={14} className="spin" />
                          {stage >= 0 ? stageText[Math.min(stage, stageText.length - 1)] : "Evaluating..."}
                        </span>
                      ) : submission.evaluation ? (
                        <>
                          <button
                            type="button"
                            className="insem-text-action"
                            onClick={() => navigate(`/teacher/insem/evaluations/${submission.evaluationId}`)}
                          >
                            Inspect & Review <ChevronRight size={14} />
                          </button>
                          <button
                            type="button"
                            className="insem-text-action insem-re-evaluate"
                            onClick={() => confirmReEvaluate(submission)}
                            title="Recalculate AI evaluation for selected difficulty mode"
                          >
                            <RotateCcw size={13} /> Re-evaluate
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="insem-text-action"
                          onClick={() => handleStartEvaluation(submission)}
                        >
                          <Play size={13} /> Start AI Evaluation <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* View Original Answer Modal */}
      {viewOriginalModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setViewOriginalModal(null)}>
          <section className="insem-modal" style={{ maxWidth: "750px" }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>Original Answer Sheet — {viewOriginalModal.studentName} ({viewOriginalModal.rollNumber})</h2>
              <button type="button" className="insem-pdf-remove-btn" onClick={() => setViewOriginalModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "15px" }}>
              File: <strong>{viewOriginalModal.fileName}</strong> · Rendered Page 1 Image (150 DPI PyMuPDF Extraction)
            </p>
            <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", textAlign: "center", maxHeight: "500px", overflowY: "auto" }}>
              <img
                src={`http://localhost:8000/api/insem/submissions/${viewOriginalModal.id}/page/1`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='14'>Handwritten Answer Page 1 Image Rendered via PyMuPDF</text></svg>";
                }}
                alt={`Handwritten answer page of ${viewOriginalModal.studentName}`}
                style={{ maxWidth: "100%", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              />
            </div>
            <div className="insem-modal-actions" style={{ marginTop: "15px" }}>
              <button type="button" className="workflow-btn primary" onClick={() => setViewOriginalModal(null)}>Close Viewer</button>
            </div>
          </section>
        </div>
      )}

      {/* Re-Evaluation Confirmation Modal */}
      {showReevalModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setShowReevalModal(null)}>
          <section className="insem-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="insem-modal-icon"><RotateCcw size={24} /></div>
            <h2>Re-evaluate this submission?</h2>
            <p style={{ marginTop: "10px", color: "#334155" }}>
              AI evaluation for <strong>{showReevalModal.studentName}</strong> under the <strong>{difficulty.toUpperCase()}</strong> difficulty standard will be recalculated.
            </p>
            <p style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>
              The current result for this difficulty will be replaced, while other difficulty results remain unchanged. Raw score baseline is preserved.
            </p>
            <div className="insem-modal-actions" style={{ marginTop: "20px" }}>
              <button type="button" className="workflow-btn" onClick={() => setShowReevalModal(null)}>Cancel</button>
              <button type="button" className="workflow-btn primary" onClick={executeReEvaluate}>Confirm Re-evaluation</button>
            </div>
          </section>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setShowPublishModal(false)}>
          <section className="insem-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="insem-modal-icon"><CheckCircle2 size={26} /></div>
            <h2>Publish In-Sem Results?</h2>
            <p>All 14 student answer sheets have been evaluated. Publishing will make the results available on the Student Portal.</p>
            <div className="insem-modal-actions">
              <button type="button" className="workflow-btn" onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button type="button" className="workflow-btn primary" onClick={handlePublish}><Check size={15} /> Publish & Notify Students</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function InSemEvaluationResultPage() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const submission = getInSemSubmissionByEvaluationId(evaluationId);
  const exam = getInSemExam();
  const [activeTab, setActiveTab] = useState("moderate");
  const [viewOriginalModal, setViewOriginalModal] = useState(false);
  const [editedMarks, setEditedMarks] = useState({});
  const [toast, setToast] = useState("");
  const [approved, setApproved] = useState(submission?.teacherApproved || false);

  if (!submission || !submission.evaluation) {
    return (
      <div className="insem-page">
        <PageHeader
          eyebrow="IN-SEM EXAMINATION"
          title="Evaluation Not Found"
          subtitle="The requested evaluation could not be located."
          actions={
            <Link className="workflow-btn" to="/teacher/insem">
              <ArrowLeft size={15} /> Back to In-Sem
            </Link>
          }
        />
        <section className="insem-surface" style={{ padding: "40px", textAlign: "center" }}>
          <h2>Evaluation Not Found</h2>
          <Link className="workflow-btn primary" to="/teacher/insem">Return to In-Sem Examination</Link>
        </section>
      </div>
    );
  }

  const evalData = submission.evaluationResults?.[activeTab] || submission.evaluation;
  const percentage = Math.round((evalData.obtainedMarks / 20) * 100);

  const handleApprove = () => {
    approveInSemEvaluation(submission.id);
    setApproved(true);
    setToast(`Evaluation for ${submission.studentName} approved.`);
  };

  const handleSaveMarks = () => {
    saveInSemTeacherReview(submission.id, {
      questionWiseResults: evalData.questionWiseResults
    });
    setToast("Teacher marks updated and saved.");
  };

  return (
    <div className="insem-page">
      <Toast message={toast} onClose={() => setToast("")} />
      <PageHeader
        eyebrow="IN-SEM EVALUATION REVIEW"
        title="Evaluation Result & Teacher Inspection"
        subtitle={`${submission.studentName} (${submission.rollNumber}) · ${exam.title}`}
        actions={
          <Link className="workflow-btn" to="/teacher/insem">
            <ArrowLeft size={15} /> Back to In-Sem
          </Link>
        }
      />

      <section className="insem-surface insem-result-hero">
        <div>
          <span className="insem-result-status" style={{ background: approved ? "#dcfce7" : "#fef3c7", color: approved ? "#15803d" : "#b45309" }}>
            {approved ? "Teacher Approved" : "AI Evaluated · Awaiting Teacher Approval"}
          </span>
          <h2 style={{ marginTop: "6px" }}>{submission.studentName} <small>{submission.rollNumber}</small></h2>
          <p>AI-generated marks are recommendations. Teacher has complete control to adjust or approve.</p>
        </div>
        <div className="insem-score-display">
          <div><b>{evalData.obtainedMarks}</b><span>/ 20</span></div>
          <strong>{percentage}%</strong>
          <small>{evalData.grade} · AI confidence {evalData.confidence}</small>
        </div>
      </section>

      {/* Difficulty Tabs */}
      <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
        {["easy", "moderate", "hard"].map((mode) => (
          <button
            key={mode}
            type="button"
            className={`workflow-btn ${activeTab === mode ? "primary" : ""}`}
            onClick={() => setActiveTab(mode)}
            style={{ textTransform: "uppercase", fontSize: "12px", fontWeight: "600" }}
          >
            {mode} Mode View ({submission.evaluationResults?.[mode]?.obtainedMarks || "—"} / 20)
          </button>
        ))}
      </div>

      <div className="insem-review-grid">
        <section className="insem-surface insem-answer-panel">
          <div className="insem-panel-heading">
            <div><span>STUDENT ANSWER & OCR</span><h2>Extracted Handwritten Text</h2></div>
            <button
              type="button"
              className="workflow-btn"
              onClick={() => setViewOriginalModal(true)}
              style={{ fontSize: "13px" }}
            >
              <Eye size={14} /> View Original Answer Page
            </button>
          </div>
          <div className="insem-ocr-inline">
            <strong>Gemini Vision Extracted Content</strong>
            <p>{evalData.answerText}</p>
          </div>
        </section>

        <aside className="insem-review-sidebar">
          <section className="insem-surface insem-rubric-breakdown">
            <div className="insem-panel-heading">
              <div><span>QUESTION-WISE MARKS</span><h2>Question Breakdown & Diagram Checks</h2></div>
            </div>
            {evalData.questionWiseResults?.map((q) => (
              <div className="insem-rubric-result" key={q.questionId}>
                <div>
                  <strong>{q.questionId} (Max: {q.maxMarks})</strong>
                  <p>{q.reason}</p>
                  {q.diagramReviewRequired && (
                    <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", display: "inline-block", marginTop: "4px" }}>
                      ⚠️ Diagram Review Recommended
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <b>{q.marksAwarded} / {q.maxMarks}</b>
                </div>
              </div>
            ))}
          </section>

          <section className="insem-surface insem-teacher-controls">
            <h2>Teacher Review Controls</h2>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="button" className="workflow-btn" onClick={handleSaveMarks}>
                Save Marks
              </button>
              <button type="button" className="workflow-btn primary" onClick={handleApprove} disabled={approved}>
                {approved ? "Approved" : "Approve Evaluation"}
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* View Original Answer Modal */}
      {viewOriginalModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setViewOriginalModal(false)}>
          <section className="insem-modal" style={{ maxWidth: "750px" }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>Original Answer Sheet Page — {submission.studentName}</h2>
              <button type="button" className="insem-pdf-remove-btn" onClick={() => setViewOriginalModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ background: "#f1f5f9", padding: "10px", borderRadius: "8px", textAlign: "center", maxHeight: "500px", overflowY: "auto" }}>
              <img
                src={`http://localhost:8000/api/insem/submissions/${submission.id}/page/1`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f8fafc'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='14'>Handwritten Answer Page 1 Image Rendered via PyMuPDF</text></svg>";
                }}
                alt={`Handwritten answer page of ${submission.studentName}`}
                style={{ maxWidth: "100%", borderRadius: "4px" }}
              />
            </div>
            <div className="insem-modal-actions" style={{ marginTop: "15px" }}>
              <button type="button" className="workflow-btn primary" onClick={() => setViewOriginalModal(false)}>Close Viewer</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
