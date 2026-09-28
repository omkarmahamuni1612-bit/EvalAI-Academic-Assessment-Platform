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
  Plus,
  RotateCcw,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import {
  approveInSemEvaluation,
  enrollStudentInExam,
  getInSemEnrolledStudents,
  getInSemEvaluationProgress,
  getInSemExam,
  getInSemSubmissionByEvaluationId,
  getInSemSubmissions,
  isInSemResultsPublished,
  mapAnswerSheetToStudent,
  publishInSemResults,
  reEvaluateInSemSubmission,
  saveInSemTeacherReview,
} from "../data/inSemData";
import {
  approveSubmissionApi,
  enrollStudentApi,
  evaluateSubmissionApi,
  extractSubmission,
  fetchExamDetails,
  getQuestionPaperPdfUrl,
  getReferenceAnswerPdfUrl,
  getStudentAnswerSheetPdfUrl,
  publishResultsApi,
  reevaluateSubmissionApi,
  uploadQuestionPaperApi,
  uploadReferenceAnswerApi,
  uploadStudentAnswerSheetApi
} from "../api/insemApi";
import { PageHeader, StatusBadge, Toast } from "../components/WorkflowUI";
import { BulkAnswerSheetUpload, ExaminationProcessingStatus } from "../components/BulkAnswerSheetUpload";
import "./InSemExaminationPage.css";

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "PDF document";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfUpload({ label, helperText, file, onFileChange, onRemove, onViewOriginal }) {
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
            {onViewOriginal && (
              <button
                type="button"
                className="insem-pdf-replace-btn"
                onClick={onViewOriginal}
                style={{ color: "#2563eb", borderColor: "#bfdbfe", background: "#eff6ff" }}
              >
                <Eye size={14} /> View Original
              </button>
            )}
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
  const [enrolledStudents, setEnrolledStudents] = useState(getInSemEnrolledStudents());
  const [submissions, setSubmissions] = useState(getInSemSubmissions());
  const [questionPaper, setQuestionPaper] = useState(null);
  const [referenceAnswer, setReferenceAnswer] = useState(null);
  const [toast, setToast] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showReevalModal, setShowReevalModal] = useState(null);
  const [viewOriginalModal, setViewOriginalModal] = useState(null);
  const [viewPdfModal, setViewPdfModal] = useState(null);
  const [published, setPublished] = useState(isInSemResultsPublished());
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [extractingId, setExtractingId] = useState(null);
  const [difficulty, setDifficulty] = useState("moderate");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedIndividualFile, setSelectedIndividualFile] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");

  // Form state for enrolling a student
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentRoll, setNewStudentRoll] = useState("");
  const [newStudentBranch, setNewStudentBranch] = useState("ENTC");
  const [newStudentDivision, setNewStudentDivision] = useState("TE ENTC – A");

  const progress = getInSemEvaluationProgress();
  const selectedStudent = enrolledStudents.find((s) => s.id === selectedStudentId) || null;
  const mappedSubmissions = submissions.filter(
    (sub) => sub && sub.fileName && sub.fileName.trim() !== ""
  );

  useEffect(() => {
    async function syncBackendData() {
      const details = await fetchExamDetails(exam.id || "insem-001");
      if (details) {
        if (details.students && details.students.length > 0) {
          setEnrolledStudents(details.students);
        }
        if (details.submissions) {
          const mappedOnly = details.submissions.filter(
            (s) => s && s.fileName && s.fileName.trim() !== ""
          );
          setSubmissions(mappedOnly);
        }
        if (details.exam) {
          if (details.exam.questionPaperPdf && details.exam.questionPaperPdf.name) {
            setQuestionPaper(details.exam.questionPaperPdf);
          }
          if (details.exam.referenceAnswerPdf && details.exam.referenceAnswerPdf.name) {
            setReferenceAnswer(details.exam.referenceAnswerPdf);
          }
        }
      }
    }
    syncBackendData();
  }, [exam.id]);

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRoll.trim()) {
      setToast("Student Name and Roll Number are required.");
      return;
    }

    const res = enrollStudentInExam({
      name: newStudentName,
      roll: newStudentRoll,
      branch: newStudentBranch,
      division: newStudentDivision
    });

    await enrollStudentApi(exam.id || "insem-001", {
      name: newStudentName,
      roll: newStudentRoll,
      branch: newStudentBranch,
      division: newStudentDivision
    });

    setEnrolledStudents([...getInSemEnrolledStudents()]);
    setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
    setShowEnrollModal(false);
    setNewStudentName("");
    setNewStudentRoll("");
    setToast(`Enrolled student ${newStudentName} (${newStudentRoll}) successfully.`);
  };

  const handleMapAnswerSheet = async () => {
    setValidationMessage("");
    if (!selectedStudent) {
      setValidationMessage("Please select a student to map the answer sheet.");
      return;
    }
    if (!selectedIndividualFile) {
      setValidationMessage("Please upload the student's answer sheet PDF first.");
      return;
    }
    mapAnswerSheetToStudent(selectedStudent, selectedIndividualFile, { replace: true });
    await uploadStudentAnswerSheetApi(exam.id || "insem-001", selectedStudent.id, selectedIndividualFile);
    setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
    setToast(`Uploaded and mapped answer sheet (${selectedIndividualFile.name}) for ${selectedStudent.name}.`);
    setSelectedIndividualFile(null);
    setSelectedStudentId("");
  };

  const handleExtractAnswers = async (submission) => {
    setExtractingId(submission.id);
    const apiRes = await extractSubmission(submission.id);
    setExtractingId(null);

    if (apiRes && apiRes.success) {
      submission.extractedAnswers = apiRes.submission.extractedAnswers;
      submission.mappedAnswers = apiRes.submission.mappedAnswers;
      submission.status = "Extracted";
      setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
      setToast(`Extracted handwritten text for ${submission.studentName}.`);
    } else {
      submission.status = "Extraction Failed";
      submission.evaluationError = apiRes?.error || "AI extraction/evaluation unavailable. Please retry.";
      setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
      setToast("AI extraction/evaluation unavailable. Please retry.");
    }
  };

  const handleEvaluate = async (submission) => {
    setEvaluatingId(submission.id);
    const apiRes = await evaluateSubmissionApi(submission.id, difficulty);
    setEvaluatingId(null);

    if (apiRes && apiRes.success) {
      submission.evaluationResults = apiRes.submission.evaluationResults;
      submission.evaluation = apiRes.submission.evaluation;
      submission.score = apiRes.submission.score;
      submission.status = "Evaluation Completed";
      setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
      setToast(`Evaluated ${submission.studentName} under ${difficulty.toUpperCase()} standard.`);
    } else {
      submission.status = "Evaluation Failed";
      submission.evaluationError = apiRes?.error || "AI extraction/evaluation unavailable. Please retry.";
      setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
      setToast("AI extraction/evaluation unavailable. Please retry.");
    }
  };

  const executeReEvaluate = async () => {
    const submission = showReevalModal;
    setShowReevalModal(null);
    if (!submission) return;

    setEvaluatingId(submission.id);
    const apiRes = await reevaluateSubmissionApi(submission.id, difficulty);
    setEvaluatingId(null);

    if (apiRes && apiRes.success) {
      submission.evaluationResults = apiRes.submission.evaluationResults;
      submission.evaluation = apiRes.submission.evaluation;
      submission.score = apiRes.submission.score;
      setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
      setToast(`Re-evaluated ${submission.studentName} under ${difficulty.toUpperCase()} standard.`);
    } else {
      setToast("AI extraction/evaluation unavailable. Please retry.");
    }
  };

  const handlePublish = async () => {
    const result = publishInSemResults();
    await publishResultsApi(exam.id || "insem-001");

    if (result.alreadyPublished) {
      setToast("Results already published to students.");
    } else if (result.incomplete) {
      setToast("Complete all student evaluations before publishing results.");
    } else {
      setPublished(true);
      setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)]);
      setToast("In-Sem examination results published successfully.");
    }
    setShowPublishModal(false);
  };

  const getStatusBadge = (status) => {
    if (status === "Evaluation Completed") return <StatusBadge status="Evaluated" />;
    if (status === "Result Published") return <StatusBadge status="Evaluated" />;
    return <StatusBadge status={status} />;
  };

  return (
    <div className="insem-page">
      <Toast message={toast} onClose={() => setToast("")} />
      <PageHeader
        eyebrow="IN-SEM EXAMINATION"
        title="In-Sem Examination Workflow"
        subtitle={`${exam.title} · ${exam.course} (${exam.courseCode}) · Total Marks: ${exam.totalMarks}`}
        actions={
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="workflow-btn primary"
              onClick={() => setShowEnrollModal(true)}
            >
              <UserPlus size={15} /> Enroll Student
            </button>
            <Link className="workflow-btn" to="/teacher/dashboard">
              <ArrowLeft size={15} /> Back to Dashboard
            </Link>
          </div>
        }
      />

      {/* Publish Results Panel */}
      <section className={`insem-surface insem-publish-panel ${published ? "published" : ""}`}>
        <div className="insem-publish-info">
          <div className="insem-publish-icon"><CheckCircle2 size={20} /></div>
          <div>
            <h2>{published ? "Results Published" : "Evaluation Progress"}</h2>
            <p>{published ? "Results have been published and students have been notified." : progress.allEvaluated ? "All answer sheets evaluated" : `${progress.evaluated} of ${progress.total} answer sheets evaluated`}</p>
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
        {!progress.allEvaluated && !published && <div className="insem-publish-hint">Complete all student evaluations before publishing results.</div>}
      </section>

      <ExaminationProcessingStatus students={enrolledStudents} submissions={mappedSubmissions} published={published} evaluationProgress={progress} />

      {/* Step 1: Upload Question Paper & Reference Answer */}
      <section className="insem-surface insem-section">
        <div className="insem-section-heading">
          <div><span>01</span><h2>Upload Examination Papers</h2></div>
          <p>Upload the question paper and reference answer PDFs for this examination.</p>
        </div>
        <div className="insem-upload-grid">
          <PdfUpload
            label="Question Paper PDF"
            helperText="Upload the examination question paper PDF"
            file={questionPaper || exam.questionPaperPdf}
            onFileChange={async (f) => {
              setQuestionPaper(f);
              const res = await uploadQuestionPaperApi(exam.id || "insem-001", f);
              if (res && res.exam && res.exam.questionPaperPdf) {
                setQuestionPaper(res.exam.questionPaperPdf);
                setToast("Question Paper PDF uploaded & extracted successfully.");
              }
            }}
            onRemove={() => setQuestionPaper(null)}
            onViewOriginal={() => {
              setViewPdfModal({
                title: "Question Paper PDF",
                fileName: (questionPaper || exam.questionPaperPdf)?.name || "Question Paper.pdf",
                url: getQuestionPaperPdfUrl(exam.id || "insem-001")
              });
            }}
          />
          <PdfUpload
            label="Reference Answer PDF"
            helperText="Upload the model/reference answer PDF"
            file={referenceAnswer || exam.referenceAnswerPdf}
            onFileChange={async (f) => {
              setReferenceAnswer(f);
              const res = await uploadReferenceAnswerApi(exam.id || "insem-001", f, null);
              if (res && res.exam && res.exam.referenceAnswerPdf) {
                setReferenceAnswer(res.exam.referenceAnswerPdf);
                setToast("Reference Answer PDF uploaded & extracted successfully.");
              }
            }}
            onRemove={() => setReferenceAnswer(null)}
            onViewOriginal={() => {
              setViewPdfModal({
                title: "Reference Answer PDF",
                fileName: (referenceAnswer || exam.referenceAnswerPdf)?.name || "Reference Answer.pdf",
                url: getReferenceAnswerPdfUrl(exam.id || "insem-001")
              });
            }}
          />
        </div>
      </section>

      {/* Step 2: Upload & Map Student Answer Sheet */}
      <section className="insem-surface insem-section">
        <div className="insem-section-heading">
          <div><span>02</span><h2>Upload & Map Student Answer Sheet</h2></div>
          <p>Select a student, upload their answer sheet PDF, and map it to them.</p>
        </div>

        <BulkAnswerSheetUpload
          students={enrolledStudents}
          submissions={mappedSubmissions}
          mapAnswerSheet={(student, file, options) => {
            const res = mapAnswerSheetToStudent(student, file, options);
            if (student && file) {
              uploadStudentAnswerSheetApi(exam.id || "insem-001", student.id, file);
            }
            return res;
          }}
          onMapped={() => setSubmissions([...getInSemSubmissions().filter((s) => s && s.fileName)])}
        />

        <div className="bulk-individual-divider"><span>Individual Answer Sheet Upload</span></div>

        <div className="insem-map-grid">
          <div className="insem-map-fields">
            <label className="insem-field">
              <span>Student</span>
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                <option value="">Select Student</option>
                {enrolledStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.roll}
                  </option>
                ))}
              </select>
            </label>
            <label className="insem-field">
              <span>Roll Number</span>
              <input
                type="text"
                value={selectedStudent ? selectedStudent.roll : ""}
                placeholder="Automatically populated"
                readOnly
              />
            </label>
          </div>

          <div className="insem-map-upload">
            <PdfUpload
              label="Student Answer Sheet"
              helperText="Upload the student's answer sheet PDF"
              file={selectedIndividualFile}
              onFileChange={setSelectedIndividualFile}
              onRemove={() => setSelectedIndividualFile(null)}
            />
          </div>
        </div>

        {validationMessage && <div className="insem-validation" role="alert"><FileWarning size={15} />{validationMessage}</div>}

        <div className="insem-map-actions">
          <button
            type="button"
            className="workflow-btn primary"
            onClick={handleMapAnswerSheet}
            disabled={!selectedStudent || !selectedIndividualFile}
          >
            <Upload size={15} /> Map Answer Sheet to Student
          </button>
        </div>
      </section>

      {/* Step 3: Mapped Answer Sheets & AI Evaluation */}
      <section className="insem-surface insem-section">
        <div className="insem-section-heading">
          <div><span>03</span><h2>Mapped Answer Sheets & AI Evaluation</h2></div>
          <p>Review mapped answer sheets and start AI evaluation for each student.</p>
        </div>

        <div className="insem-difficulty-panel">
          <div className="insem-difficulty-heading">
            <div className="insem-difficulty-icon"><Gauge size={19} /></div>
            <div>
              <h3>Select Evaluation Difficulty</h3>
              <p>Choose how strictly the AI should evaluate the answer sheets.</p>
            </div>
          </div>
          <DifficultySelector value={difficulty} onChange={setDifficulty} />
        </div>

        {mappedSubmissions.length === 0 ? (
          <div className="insem-empty-state">
            <FileText size={24} />
            <h3>No answer sheets mapped yet</h3>
            <p>Upload and map student answer sheets to begin AI evaluation.</p>
          </div>
        ) : (
          <div className="insem-table-wrap">
            <table className="insem-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Answer Sheet</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mappedSubmissions.map((submission) => {
                  const isExtracting = extractingId === submission.id;
                  const isEvaluating = evaluatingId === submission.id;
                  const isExtracted = submission.mappedAnswers && submission.mappedAnswers.length > 0;
                  const isEvaluated = Boolean(submission.evaluation);

                  return (
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
                        {submission.status === "Extraction Failed" || submission.status === "Evaluation Failed" ? (
                          <span className="status-badge status-missing" title={submission.evaluationError}>
                            Failed
                          </span>
                        ) : (
                          getStatusBadge(submission.status)
                        )}
                      </td>
                      <td className="insem-score-cell">{submission.score || "—"}</td>
                      <td>
                        <div className="insem-action-group">
                          {isExtracting ? (
                            <span className="insem-evaluating">
                              <Loader2 size={14} className="spin" /> Extracting PyMuPDF…
                            </span>
                          ) : isEvaluating ? (
                            <span className="insem-evaluating">
                              <Loader2 size={14} className="spin" /> Gemini Evaluating…
                            </span>
                          ) : isEvaluated ? (
                            <>
                              <button
                                type="button"
                                className="insem-text-action"
                                onClick={() => setViewOriginalModal(submission)}
                              >
                                <Eye size={14} /> View Original
                              </button>
                              <button
                                type="button"
                                className="insem-text-action"
                                onClick={() => navigate(`/teacher/insem/evaluations/${submission.evaluationId}`)}
                              >
                                View Result <ChevronRight size={14} />
                              </button>
                              <button
                                type="button"
                                className="insem-text-action insem-re-evaluate"
                                onClick={() => setShowReevalModal(submission)}
                              >
                                Re-evaluate <ChevronRight size={14} />
                              </button>
                            </>
                          ) : isExtracted ? (
                            <>
                              <button
                                type="button"
                                className="insem-text-action"
                                onClick={() => setViewOriginalModal(submission)}
                              >
                                <Eye size={14} /> View Original
                              </button>
                              <button
                                type="button"
                                className="insem-text-action"
                                onClick={() => handleEvaluate(submission)}
                              >
                                <Play size={13} /> Start AI Evaluation <ChevronRight size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="insem-text-action"
                                onClick={() => setViewOriginalModal(submission)}
                              >
                                <Eye size={14} /> View Original
                              </button>
                              <button
                                type="button"
                                className="insem-text-action"
                                onClick={() => handleExtractAnswers(submission)}
                              >
                                <Play size={13} /> Extract Answers <ChevronRight size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Exam PDF View Original Modal */}
      {viewPdfModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setViewPdfModal(null)}>
          <section className="insem-modal" style={{ maxWidth: "850px", width: "95%" }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>{viewPdfModal.title} — {viewPdfModal.fileName}</h2>
              <button type="button" className="insem-pdf-remove-btn" onClick={() => setViewPdfModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ background: "#f1f5f9", borderRadius: "8px", height: "550px", overflow: "hidden" }}>
              <iframe
                src={viewPdfModal.url}
                title={viewPdfModal.title}
                style={{ width: "100%", height: "100%", border: "0" }}
              />
            </div>
            <div className="insem-modal-actions" style={{ marginTop: "15px" }}>
              <a
                href={viewPdfModal.url}
                target="_blank"
                rel="noreferrer"
                className="workflow-btn"
                style={{ textDecoration: "none" }}
              >
                Open in New Tab
              </a>
              <button type="button" className="workflow-btn primary" onClick={() => setViewPdfModal(null)}>Close Viewer</button>
            </div>
          </section>
        </div>
      )}

      {/* Manual Student Enrollment Modal */}
      {showEnrollModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setShowEnrollModal(false)}>
          <section className="insem-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="insem-modal-icon"><UserPlus size={24} /></div>
            <h2>Enroll Student Manually</h2>
            <p style={{ fontSize: "13px", color: "#64748b" }}>Add a student to the roster for In-Sem Exam ID `{exam.id}`.</p>

            <form onSubmit={handleEnrollSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
              <label className="insem-field">
                <span>Student Name *</span>
                <input
                  type="text"
                  placeholder="e.g. Rahul Patil"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  required
                />
              </label>

              <label className="insem-field">
                <span>Roll Number *</span>
                <input
                  type="text"
                  placeholder="e.g. ET202-041"
                  value={newStudentRoll}
                  onChange={(e) => setNewStudentRoll(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <label className="insem-field">
                  <span>Branch</span>
                  <input
                    type="text"
                    value={newStudentBranch}
                    onChange={(e) => setNewStudentBranch(e.target.value)}
                  />
                </label>
                <label className="insem-field">
                  <span>Division</span>
                  <input
                    type="text"
                    value={newStudentDivision}
                    onChange={(e) => setNewStudentDivision(e.target.value)}
                  />
                </label>
              </div>

              <div className="insem-modal-actions" style={{ marginTop: "15px" }}>
                <button type="button" className="workflow-btn" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                <button type="submit" className="workflow-btn primary"><Plus size={15} /> Enroll Student</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* View Original Answer Modal */}
      {viewOriginalModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setViewOriginalModal(null)}>
          <section className="insem-modal" style={{ maxWidth: "850px", width: "95%" }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>Original Answer Sheet — {viewOriginalModal.studentName} ({viewOriginalModal.rollNumber})</h2>
              <button type="button" className="insem-pdf-remove-btn" onClick={() => setViewOriginalModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "15px" }}>
              Submission ID: <strong>{viewOriginalModal.submissionId || viewOriginalModal.id}</strong> · File: <strong>{viewOriginalModal.fileName}</strong>
            </p>
            <div style={{ background: "#f1f5f9", borderRadius: "8px", height: "550px", overflow: "hidden" }}>
              <iframe
                src={getStudentAnswerSheetPdfUrl(viewOriginalModal.id || viewOriginalModal.submissionId)}
                title={`Answer sheet of ${viewOriginalModal.studentName}`}
                style={{ width: "100%", height: "100%", border: "0" }}
              />
            </div>
            <div className="insem-modal-actions" style={{ marginTop: "15px" }}>
              <a
                href={getStudentAnswerSheetPdfUrl(viewOriginalModal.id || viewOriginalModal.submissionId)}
                target="_blank"
                rel="noreferrer"
                className="workflow-btn"
                style={{ textDecoration: "none" }}
              >
                Open in New Tab
              </a>
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
              The current result for this difficulty will be replaced, while other difficulty results remain unchanged. Other students' evaluations remain untouched.
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
            <p>All student answer sheets have been evaluated. Publishing will make the results available on the Student Portal.</p>
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
          <p style={{ color: "#64748b", margin: "10px 0 20px" }}>Evaluation ID: {evaluationId}</p>
          <Link className="workflow-btn primary" to="/teacher/insem">Return to In-Sem Examination</Link>
        </section>
      </div>
    );
  }

  const evalData = submission.evaluationResults?.[activeTab] || submission.evaluation;
  const percentage = Math.round((evalData.obtainedMarks / 20) * 100);

  const handleApprove = async () => {
    approveInSemEvaluation(submission.id);
    await approveSubmissionApi(submission.id);
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
            <p>{evalData.answerText || "No extracted text available."}</p>
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
          <section className="insem-modal" style={{ maxWidth: "850px", width: "95%" }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>Original Answer Sheet — {submission.studentName} ({submission.rollNumber})</h2>
              <button type="button" className="insem-pdf-remove-btn" onClick={() => setViewOriginalModal(false)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "15px" }}>
              Submission ID: <strong>{submission.submissionId || submission.id}</strong> · File: <strong>{submission.fileName}</strong>
            </p>
            <div style={{ background: "#f1f5f9", borderRadius: "8px", height: "550px", overflow: "hidden" }}>
              <iframe
                src={getStudentAnswerSheetPdfUrl(submission.id || submission.submissionId)}
                title={`Answer sheet of ${submission.studentName}`}
                style={{ width: "100%", height: "100%", border: "0" }}
              />
            </div>
            <div className="insem-modal-actions" style={{ marginTop: "15px" }}>
              <a
                href={getStudentAnswerSheetPdfUrl(submission.id || submission.submissionId)}
                target="_blank"
                rel="noreferrer"
                className="workflow-btn"
                style={{ textDecoration: "none" }}
              >
                Open in New Tab
              </a>
              <button type="button" className="workflow-btn primary" onClick={() => setViewOriginalModal(false)}>Close Viewer</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
