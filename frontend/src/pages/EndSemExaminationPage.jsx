import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileWarning,
  Gauge,
  Loader2,
  Play,
  Upload,
} from "lucide-react";
import { students } from "../auth/studentAuth";
import {
  getEndSemEvaluationProgress,
  getEndSemExam,
  getEndSemSubmissionByEvaluationId,
  getEndSemSubmissions,
  isEndSemResultsPublished,
  mapEndSemAnswerSheetToStudent,
  publishEndSemResults,
  reEvaluateEndSemSubmission,
  startEndSemEvaluation,
} from "../data/endSemData";
import { PageHeader, StatusBadge, Toast } from "../components/WorkflowUI";
import {
  DifficultySelector,
  PdfUpload,
  evaluationStages,
  stageText,
} from "./InSemExaminationPage";
import { BulkAnswerSheetUpload, ExaminationProcessingStatus } from "../components/BulkAnswerSheetUpload";
import "./InSemExaminationPage.css";

export function EndSemExaminationPage() {
  const navigate = useNavigate();
  const exam = getEndSemExam();
  const [questionPaper, setQuestionPaper] = useState(null);
  const [referenceAnswer, setReferenceAnswer] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [answerSheet, setAnswerSheet] = useState(null);
  const [mappedSubmissions, setMappedSubmissions] = useState(getEndSemSubmissions());
  const [toast, setToast] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [published, setPublished] = useState(isEndSemResultsPublished());
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [stage, setStage] = useState(-1);
  const [difficulty, setDifficulty] = useState("moderate");
  const [validationMessage, setValidationMessage] = useState("");

  const progress = getEndSemEvaluationProgress();
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
    const result = mapEndSemAnswerSheetToStudent(selectedStudent, answerSheet, { replace: true });
    if (result.error) {
      setValidationMessage(result.error);
      return;
    }
    setMappedSubmissions([...getEndSemSubmissions()]);
    setToast(`Answer sheet mapped to ${selectedStudent.name} (${selectedStudent.roll}).`);
    setAnswerSheet(null);
    setSelectedStudentId("");
  };

  const canStartEvaluation = (submission) => {
    return submission && submission.fileName && submission.status !== "Evaluation Completed" && submission.status !== "Result Published";
  };

  const handleStartEvaluation = (submission) => {
    if (!submission) return;
    setEvaluatingId(submission.id);
    setStage(0);
    // Simulate the evaluation stages
    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage += 1;
      setStage(currentStage);
      if (currentStage >= evaluationStages.length) {
        clearInterval(interval);
        const result = startEndSemEvaluation(submission.id, difficulty);
        setMappedSubmissions([...getEndSemSubmissions()]);
        setEvaluatingId(null);
        setStage(-1);
        if (result) {
          setToast(`AI evaluation completed for ${result.studentName}.`);
        }
      }
    }, 700);
  };

  const handleReEvaluate = (submission) => {
    if (!submission) return;
    setEvaluatingId(submission.id);
    setStage(0);
    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage += 1;
      setStage(currentStage);
      if (currentStage >= evaluationStages.length) {
        clearInterval(interval);
        const result = reEvaluateEndSemSubmission(submission.id, difficulty);
        setMappedSubmissions([...getEndSemSubmissions()]);
        setEvaluatingId(null);
        setStage(-1);
        if (result) {
          setToast(`Re-evaluation completed for ${result.studentName}.`);
        }
      }
    }, 700);
  };

  const handlePublish = () => {
    const result = publishEndSemResults();
    if (result.alreadyPublished) {
      setToast("Results already published. Students have already been notified.");
    } else if (result.incomplete) {
      setToast("Complete all student evaluations before publishing results.");
    } else {
      setPublished(true);
      setMappedSubmissions([...getEndSemSubmissions()]);
      setToast("End-Sem results published successfully. Students have been notified.");
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
        eyebrow="END-SEM EXAMINATION"
        title="End-Sem Examination Workflow"
        subtitle={`${exam.title} · ${exam.division} · Total Marks: ${exam.totalMarks}`}
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

      <ExaminationProcessingStatus students={students} submissions={mappedSubmissions} published={published} evaluationProgress={progress} />

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
            file={questionPaper}
            onFileChange={setQuestionPaper}
            onRemove={() => setQuestionPaper(null)}
          />
          <PdfUpload
            label="Reference Answer PDF"
            helperText="Upload the model/reference answer PDF"
            file={referenceAnswer}
            onFileChange={setReferenceAnswer}
            onRemove={() => setReferenceAnswer(null)}
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
          students={students}
          submissions={mappedSubmissions}
          mapAnswerSheet={mapEndSemAnswerSheetToStudent}
          onMapped={() => setMappedSubmissions([...getEndSemSubmissions()])}
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
                {students.map((student) => (
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
              file={answerSheet}
              onFileChange={setAnswerSheet}
              onRemove={() => setAnswerSheet(null)}
            />
          </div>
        </div>

        {validationMessage && <div className="insem-validation" role="alert"><FileWarning size={15} />{validationMessage}</div>}

        <div className="insem-map-actions">
          <button
            type="button"
            className="workflow-btn primary"
            onClick={handleMapAnswerSheet}
            disabled={!selectedStudent || !answerSheet}
          >
            <Upload size={15} /> Map Answer Sheet to Student
          </button>
        </div>
      </section>

      {/* Step 3: Mapped Answer Sheets & Evaluation */}
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
                    <td>{getStatusBadge(submission.status)}</td>
                    <td className="insem-score-cell">{submission.score}</td>
                    <td>
                      <div className="insem-action-group">
                        {evaluatingId === submission.id ? (
                          <span className="insem-evaluating">
                            <Loader2 size={14} className="spin" />
                            {stage >= 0 ? stageText[Math.min(stage, stageText.length - 1)] : "Evaluating..."}
                          </span>
                        ) : submission.status === "Evaluation Completed" || submission.status === "Result Published" ? (
                          <>
                            <button
                              type="button"
                              className="insem-text-action"
                              onClick={() => navigate(`/teacher/endsem/evaluations/${submission.evaluationId}`)}
                            >
                              View Result <ChevronRight size={14} />
                            </button>
                            <button
                              type="button"
                              className="insem-text-action insem-re-evaluate"
                              onClick={() => handleReEvaluate(submission)}
                            >
                              Re-evaluate <ChevronRight size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="insem-text-action"
                            onClick={() => handleStartEvaluation(submission)}
                            disabled={!canStartEvaluation(submission)}
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
        )}
      </section>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="insem-modal-backdrop" onMouseDown={() => setShowPublishModal(false)}>
          <section className="insem-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className="insem-modal-icon"><CheckCircle2 size={26} /></div>
            <h2>Publish End-Sem Results?</h2>
            <p>All student answer sheets have been evaluated. Publishing will make the results available to students and send them a notification.</p>
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

export function EndSemEvaluationResultPage() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const submission = getEndSemSubmissionByEvaluationId(evaluationId);
  const exam = getEndSemExam();

  if (!submission || !submission.evaluation) {
    return (
      <div className="insem-page">
        <PageHeader
          eyebrow="END-SEM EXAMINATION"
          title="Evaluation Not Found"
          subtitle="The requested evaluation could not be located."
          actions={
            <Link className="workflow-btn" to="/teacher/endsem">
              <ArrowLeft size={15} /> Back to End-Sem
            </Link>
          }
        />
        <section className="insem-surface" style={{ padding: "40px", textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "10px" }}>Evaluation Not Found</h2>
          <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
            We could not locate an evaluation for ID: <strong>{evaluationId}</strong>.
          </p>
          <Link className="workflow-btn primary" to="/teacher/endsem">Return to End-Sem Examination</Link>
        </section>
      </div>
    );
  }

  const evaluation = submission.evaluation;
  const percentage = Math.round((evaluation.score / evaluation.totalMarks) * 100);
  const difficultyLabel = evaluation.evaluationDifficulty
    ? evaluation.evaluationDifficulty.charAt(0).toUpperCase() + evaluation.evaluationDifficulty.slice(1)
    : "Moderate";

  return (
    <div className="insem-page">
      <PageHeader
        eyebrow="END-SEM EVALUATION REVIEW"
        title="Evaluation Result"
        subtitle={`${submission.studentName} · ${exam.title}`}
        actions={
          <Link className="workflow-btn" to="/teacher/endsem">
            <ArrowLeft size={15} /> Back to End-Sem
          </Link>
        }
      />

      <section className="insem-surface insem-result-hero">
        <div>
          <span className="insem-result-status">AI Evaluated · Awaiting Teacher Approval</span>
          <h2>{submission.studentName} <small>{submission.rollNumber}</small></h2>
          <p>AI-generated marks are recommendations. Final grading remains under teacher control.</p>
        </div>
        <div className="insem-score-display">
          <div><b>{evaluation.score}</b><span>/ {evaluation.totalMarks}</span></div>
          <strong>{percentage}%</strong>
          <small>{evaluation.grade} · AI confidence {evaluation.confidence}</small>
        </div>
      </section>

      <div className="insem-difficulty-result-row">
        <span className={`insem-difficulty-badge insem-difficulty-badge-${evaluation.evaluationDifficulty || "moderate"}`}>
          <Gauge size={13} />{difficultyLabel}
        </span>
        <span>Evaluation Difficulty: <strong>{difficultyLabel}</strong></span>
        <span>Semantic Relevance: <strong>{evaluation.semanticRelevance}</strong></span>
        <span>AI Confidence: <strong>{evaluation.confidence}</strong></span>
      </div>

      <div className="insem-review-grid">
        <section className="insem-surface insem-answer-panel">
          <div className="insem-panel-heading">
            <div><span>STUDENT ANSWER</span><h2>Answer Sheet & OCR</h2></div>
            <span className="insem-file-pill"><FileText size={14} /><span>{submission.fileName}</span></span>
          </div>
          <div className="insem-ocr-inline">
            <strong>OCR Extracted Answer</strong>
            <p>{evaluation.answerText}</p>
          </div>
        </section>

        <aside className="insem-review-sidebar">
          <section className="insem-surface insem-comparison-card">
            <div className="insem-panel-heading">
              <div><span>AI EVALUATION</span><h2>Reference Answer Comparison</h2></div>
            </div>
            <p>{evaluation.referenceAnswer}</p>
            <div className="insem-similarity-row">
              <span>Semantic relevance</span>
              <b>{evaluation.semanticRelevance}</b>
            </div>
          </section>

          <section className="insem-surface insem-rubric-breakdown">
            <div className="insem-panel-heading">
              <div><span>RUBRIC BREAKDOWN</span><h2>Recommended Marks</h2></div>
            </div>
            {evaluation.rubric.map((item) => (
              <div className="insem-rubric-result" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.reason}</p>
                  <small>{item.confidence} confidence</small>
                </div>
                <b>{item.score} / {item.max}</b>
              </div>
            ))}
            <div className="insem-rubric-total">
              <span>Total recommended</span>
              <strong>{evaluation.score} / {evaluation.totalMarks}</strong>
            </div>
          </section>

          <section className="insem-surface insem-feedback-card">
            <h2>Answer Analysis</h2>
            {evaluation.feedback.difficultyNote && (
              <div className="insem-difficulty-feedback-note">
                <strong>Evaluation Standard ({difficultyLabel})</strong>
                <p>{evaluation.feedback.difficultyNote}</p>
              </div>
            )}
            <div><strong>Strengths</strong><p>{evaluation.feedback.strengths}</p></div>
            <div><strong>Areas for Improvement</strong><p>{evaluation.feedback.improvements}</p></div>
            <div><strong>Missing Concept</strong><p>{evaluation.feedback.missing}</p></div>
          </section>

          <section className="insem-surface insem-teacher-controls">
            <h2>Teacher Review Controls</h2>
            <div>
              <button className="workflow-btn" onClick={() => navigate("/teacher/endsem")}>
                <ArrowLeft size={14} /> Back to End-Sem
              </button>
              <button className="workflow-btn primary" onClick={() => navigate("/teacher/endsem")}>
                <Check size={14} /> Approve Evaluation
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
