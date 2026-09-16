import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  FileWarning,
  Info,
  Loader2,
  Minus,
  Plus,
  Printer,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { getPersistedPdfUrl, publishAssignmentAndNotifyStudents, registerCreatedAssessment } from "../data/workflowData";
import { getCurrentTeacher } from "../auth/teacherAuth";
import "./CreateAssignmentPage.css";

const initialCriteria = [
  {
    id: 1,
    name: "Concept Understanding",
    description: "Assess understanding of tree & heap concepts and traversal principles.",
    marks: 5,
  },
  {
    id: 2,
    name: "Technical Accuracy",
    description: "Evaluate algorithm correctness, terminology, and technical implementation details.",
    marks: 7,
  },
  {
    id: 3,
    name: "Explanation & Reasoning",
    description: "Assess the clarity of reasoning, examples, and justification of the approach.",
    marks: 5,
  },
  {
    id: 4,
    name: "Presentation / Structure",
    description: "Review organization, readability, and appropriate use of diagrams or notation.",
    marks: 3,
  },
];

const initialForm = {
  assessmentCategory: "assignment",
  title: "Binary Trees & Heap Operations",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  academicYear: "2026–27",
  assignmentType: "Written Assignment",
  totalMarks: 20,
  dueDate: "2026-08-30",
  dueTime: "23:59",
  description: "Complete all questions detailing binary search tree balancing, heapify algorithms, and time complexity derivations.",
  referenceAnswer: "",
};

function SectionCard({ number, title, description, badge, split, children }) {
  return (
    <section className="assignment-section">
      <div className={`section-heading ${split ? "split-heading" : ""}`}>
        <div>
          <span>{number}</span>
          <h2>{title}</h2>
        </div>
        {badge}
      </div>
      <p className="section-description">{description}</p>
      {children}
    </section>
  );
}

function Toggle({ enabled, disabled, onChange, title, description }) {
  return (
    <button
      type="button"
      className={`assignment-toggle ${enabled ? "is-enabled" : ""} ${disabled ? "is-disabled" : ""}`}
      onClick={onChange}
      disabled={disabled}
    >
      <div className="toggle-info">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <div className="toggle-switch">
        <div className="toggle-knob" />
      </div>
    </button>
  );
}

function Dialog({ children, onClose, wide = false }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`assignment-dialog ${wide ? "assignment-dialog-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function PdfUpload({ label, helperText, file, onFileChange, onRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const validateAndSet = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are allowed. Please select a valid PDF document.");
      return;
    }
    if (selectedFile.size === 0) {
      setError("The selected PDF file is empty. Please select a valid PDF.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("The selected PDF file exceeds the 10 MB maximum allowed size.");
      return;
    }
    setError("");

    if (typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onload = () => {
        const pdfRecord = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type || "application/pdf",
          data: reader.result,
          uploadedAt: new Date().toISOString(),
          rawFile: selectedFile,
        };
        onFileChange(pdfRecord);
      };
      reader.onerror = () => {
        setError("Failed to read the selected PDF file. Please try again.");
      };
      reader.readAsDataURL(selectedFile);
    } else {
      onFileChange({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type || "application/pdf",
        uploadedAt: new Date().toISOString(),
        rawFile: selectedFile,
      });
    }
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
    <div className="pdf-upload-block">
      <div className="pdf-upload-label">
        <span>{label}</span>
        <small>{helperText}</small>
      </div>

      {file ? (
        <div className="pdf-file-card">
          <div className="pdf-file-icon"><FileText size={22} /></div>
          <div className="pdf-file-info">
            <strong>{file.name}</strong>
            <span>{formatFileSize(file.size)} · PDF document</span>
          </div>
          <div className="pdf-file-actions">
            <label className="pdf-replace-btn">
              <Upload size={14} /> Replace
              <input type="file" accept="application/pdf,.pdf" onChange={handleInputChange} />
            </label>
            <button type="button" className="pdf-remove-btn" onClick={onRemove} aria-label={`Remove ${label}`}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`pdf-dropzone ${dragActive ? "is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input type="file" accept="application/pdf,.pdf" onChange={handleInputChange} />
          <span className="pdf-dropzone-icon"><Upload size={20} /></span>
          <strong>Upload PDF</strong>
          <small>Drag & drop your PDF here, or click to browse</small>
        </label>
      )}

      {error && <div className="pdf-upload-error" role="alert"><FileWarning size={14} />{error}</div>}
    </div>
  );
}

function QuestionPaperPreview({ assignment, assignmentPdf, onClose }) {
  const pdfUrl = useMemo(
    () => getPersistedPdfUrl(assignmentPdf, assignment),
    [assignmentPdf, assignment],
  );

  const handleDownload = () => {
    if (!assignmentPdf || !pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = assignmentPdf.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="qp-preview-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="qp-preview-shell" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="qp-toolbar">
          <div className="qp-toolbar-title">
            <FileText size={17} />
            <div>
              <strong>Assignment Paper Preview</strong>
              <span>{assignmentPdf?.name || assignment.title}</span>
            </div>
          </div>
          <div className="qp-toolbar-actions">
            <button type="button" className="qp-tool-btn" onClick={handleDownload}>
              <Download size={15} /> Download
            </button>
            <button type="button" className="qp-tool-btn" onClick={handlePrint}>
              <Printer size={15} /> Print / PDF
            </button>
            <button type="button" className="qp-tool-btn qp-tool-close" onClick={onClose} aria-label="Close preview">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="qp-scroll-area">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={assignmentPdf?.name || "Assignment PDF"}
              className="qp-pdf-frame"
            />
          ) : (
            <div className="qp-pdf-empty">No PDF available to preview.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateAssignmentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [features, setFeatures] = useState({
    ocr: true,
    semantic: true,
    rubric: true,
    feedback: true,
  });
  const [notice, setNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showPublished, setShowPublished] = useState(false);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [assignmentPdf, setAssignmentPdf] = useState(null);
  const [referenceAnswerPdf, setReferenceAnswerPdf] = useState(null);

  const allocatedMarks = useMemo(
    () => criteria.reduce((total, criterion) => total + (Number(criterion.marks) || 0), 0),
    [criteria],
  );
  const totalMarks = Number(form.totalMarks) || 0;
  const isMarksBalanced = allocatedMarks === totalMarks;
  const referenceReady = Boolean(referenceAnswerPdf) || Boolean(form.referenceAnswer && form.referenceAnswer.trim().length > 0);

  const updateForm = (event) => {
    const { name, value } = event.target;
    if (name === "assessmentCategory") {
      const defaultTotal = value === "in-sem" ? 30 : value === "end-sem" ? 60 : 20;
      setForm((current) => ({ ...current, [name]: value, totalMarks: defaultTotal }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
    setValidationMessage("");
  };

  const updateCriterion = (id, field, value) => {
    setCriteria((current) =>
      current.map((criterion) =>
        criterion.id === id ? { ...criterion, [field]: value } : criterion,
      ),
    );
  };

  const addCriterion = () => {
    setCriteria((current) => [
      ...current,
      {
        id: Date.now(),
        name: "New Criterion",
        description: "Describe what the AI and teacher should assess.",
        marks: 0,
      },
    ]);
  };

  const removeCriterion = (id) => {
    setCriteria((current) => current.filter((criterion) => criterion.id !== id));
  };

  const showSavedNotice = () => {
    setNotice("Draft saved locally. You can continue refining this assignment.");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const handleGenerateQuestionPaper = () => {
    if (!assignmentPdf) {
      setValidationMessage("Please upload the Assignment PDF first.");
      return;
    }
    setValidationMessage("");
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
      setShowQuestionPaper(true);
    }, 900);
  };

  const handlePublish = () => {
    const currentTeacher = getCurrentTeacher();
    const teacherId = currentTeacher?.teacherId || currentTeacher?.id || currentTeacher?.email || "teacher-123";

    if (!form.title || !form.title.trim()) {
      setValidationMessage("Assignment Title is required. Please enter a valid assignment title.");
      return;
    }
    if (!form.subjectName || !form.subjectName.trim()) {
      setValidationMessage("Subject Name is required. Please enter a subject name.");
      return;
    }
    if (!form.courseCode || !form.courseCode.trim()) {
      setValidationMessage("Course Code is required. Please enter a course code.");
      return;
    }
    if (!form.branch || !form.branch.trim()) {
      setValidationMessage("Branch is required. Please enter a branch (e.g. ENTC).");
      return;
    }
    if (!form.division || !form.division.trim()) {
      setValidationMessage("Division is required. Please enter a division (e.g. SE ENTC – A).");
      return;
    }
    if (!form.description || !form.description.trim()) {
      setValidationMessage("Description / Instructions are required. Please enter instructions for students.");
      return;
    }
    if (!assignmentPdf) {
      setValidationMessage("Question Paper PDF is required. Please upload the Question Paper PDF.");
      return;
    }
    if (!referenceAnswerPdf) {
      setValidationMessage("Reference Answer PDF is required. Please upload the Reference Answer PDF.");
      return;
    }
    if (!form.dueDate) {
      setValidationMessage("Due Date is required. Please select a due date.");
      return;
    }
    if (!form.dueTime) {
      setValidationMessage("Due Time is required. Please select a due time.");
      return;
    }
    const parsedTotalMarks = Number(form.totalMarks);
    if (!form.totalMarks || isNaN(parsedTotalMarks) || !Number.isInteger(parsedTotalMarks) || parsedTotalMarks <= 0) {
      setValidationMessage("Total Marks is required and must be a positive whole number (e.g. 20, 30, 40, 50, 60).");
      return;
    }
    const incompleteRubric = criteria.length === 0 || criteria.some((item) => !item.name.trim());
    if (incompleteRubric) {
      setValidationMessage("All rubric criteria must have a non-empty criterion name.");
      return;
    }
    if (!isMarksBalanced) {
      setValidationMessage(`Match the allocated rubric marks (${allocatedMarks}) to the total assignment marks (${parsedTotalMarks}) before publishing.`);
      return;
    }

    const subName = form.subjectName.trim();
    const cCode = form.courseCode.trim();
    const br = form.branch.trim();
    const div = form.division.trim();

    // Register & Publish assessment into active client data store and notify students
    publishAssignmentAndNotifyStudents({
      ...form,
      title: form.title.trim(),
      subjectName: subName,
      courseCode: cCode,
      course: `${subName} (${cCode})`,
      subject: subName,
      branch: br,
      division: div,
      academicYear: form.academicYear,
      assignmentType: form.assignmentType,
      totalMarks: parsedTotalMarks,
      description: form.description.trim(),
      questions: criteria,
      assignmentPdf,
      questionPaperPdf: assignmentPdf,
      referenceAnswerPdf,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      createdByTeacherId: teacherId,
      createdAt: new Date().toISOString(),
      status: "Published",
    });

    setValidationMessage("");
    setShowPublished(true);
  };

  const dueDateLabel = form.dueDate
    ? `${form.dueDate}${form.dueTime ? ` at ${form.dueTime}` : ""}`
    : "Not set";

  return (
    <div className="create-assignment-page">
      {notice && (
        <div className="assignment-notice" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}

      <header className="assignment-page-header">
        <div>
          <Link to="/teacher/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="page-heading">
            <div className="heading-icon"><ClipboardCheck size={22} /></div>
            <div>
              <h1>Create Assignment</h1>
              <p>Create a new assessment and configure AI-assisted evaluation.</p>
            </div>
          </div>
        </div>
        <div className="assignment-header-actions">
          <button type="button" className="assignment-btn assignment-btn-secondary" onClick={showSavedNotice}>
            <Save size={16} /> Save Draft
          </button>
          <button type="button" className="assignment-btn assignment-btn-secondary" onClick={() => setShowPreview(true)}>
            <Eye size={16} /> Preview
          </button>
          <button
            type="button"
            className="assignment-btn assignment-btn-generate"
            onClick={handleGenerateQuestionPaper}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
            {isGenerating ? "Generating..." : "Generate Question Paper"}
          </button>
          <button type="button" className="assignment-btn assignment-btn-primary" onClick={handlePublish}>
            <Sparkles size={16} /> Publish Assignment
          </button>
        </div>
      </header>

      {validationMessage && <div className="publish-validation" role="alert"><Info size={17} />{validationMessage}</div>}

      <div className="assignment-workspace">
        <form className="assignment-form" onSubmit={(event) => event.preventDefault()}>
          <section className="assignment-section">
            <div className="section-heading">
              <div><span>01</span><h2>Assignment Details</h2></div>
              <p>Set the academic context and requirements for this assessment.</p>
            </div>
            <div className="form-grid">
              <label className="field field-wide">
                Assessment Category
                <select name="assessmentCategory" value={form.assessmentCategory} onChange={updateForm}>
                  <option value="assignment">Assignment (Default: 20 Marks — Student Uploads Enabled)</option>
                  <option value="in-sem">In-Sem Examination (Default: 30 Marks — Teacher Uploads Only)</option>
                  <option value="end-sem">End-Sem Examination (Default: 60 Marks — Teacher Uploads Only)</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <div className="field-wide" style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: form.assessmentCategory === "assignment" ? "#F0FDF4" : "#EFF6FF",
                border: `1px solid ${form.assessmentCategory === "assignment" ? "#BBF7D0" : "#BFDBFE"}`,
                fontSize: "13px",
                color: form.assessmentCategory === "assignment" ? "#166534" : "#1E40AF",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Info size={16} style={{ flexShrink: 0 }} />
                <span>
                  {form.assessmentCategory === "assignment" && `Assignment Mode: Students submit answer PDFs via Student Portal. Total: ${form.totalMarks || 20} marks.`}
                  {form.assessmentCategory === "in-sem" && `In-Sem Exam Mode: Teacher/Evaluator uploads bulk answer sheet PDFs. Total: ${form.totalMarks || 30} marks. Student upload option disabled.`}
                  {form.assessmentCategory === "end-sem" && `End-Sem Exam Mode: Teacher/Evaluator uploads bulk answer sheet PDFs. Total: ${form.totalMarks || 60} marks. Student upload option disabled.`}
                </span>
              </div>

              <label className="field field-wide">
                Assignment Title
                <input
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  placeholder="e.g. Binary Trees & Heap Operations"
                  required
                />
              </label>

              <label className="field">
                Subject Name
                <input
                  name="subjectName"
                  value={form.subjectName}
                  onChange={updateForm}
                  placeholder="e.g. Digital Signal Processing"
                  required
                />
              </label>

              <label className="field">
                Course Code
                <input
                  name="courseCode"
                  value={form.courseCode}
                  onChange={updateForm}
                  placeholder="e.g. ET305"
                  required
                />
              </label>

              <label className="field">
                Branch
                <input
                  name="branch"
                  value={form.branch}
                  onChange={updateForm}
                  placeholder="e.g. ENTC"
                  required
                />
              </label>

              <label className="field">
                Division
                <input
                  name="division"
                  value={form.division}
                  onChange={updateForm}
                  placeholder="e.g. SE ENTC – A"
                  required
                />
              </label>

              <label className="field">
                Academic Year
                <select name="academicYear" value={form.academicYear} onChange={updateForm}>
                  <option>2026–27</option>
                  <option>2025–26</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="field">
                Assignment Type
                <select name="assignmentType" value={form.assignmentType} onChange={updateForm}>
                  <option>Written Assignment</option>
                  <option>Lab Assessment</option>
                  <option>Midterm Examination</option>
                  <option>Project Review</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="field">
                Due Date
                <input type="date" name="dueDate" value={form.dueDate} onChange={updateForm} required />
              </label>

              <label className="field">
                Due Time
                <input type="time" name="dueTime" value={form.dueTime} onChange={updateForm} required />
              </label>

              <label className="field">
                Total Marks
                <input
                  type="number"
                  name="totalMarks"
                  value={form.totalMarks}
                  onChange={updateForm}
                  placeholder="Enter total marks"
                  min="1"
                  step="1"
                  required
                />
              </label>

              <label className="field field-wide">
                Description / Instructions
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows="4"
                  placeholder="Explain the assignment expectations and instructions for students..."
                />
              </label>
            </div>
            <PdfUpload
              label="Assignment PDF"
              helperText="Upload the assignment/question paper PDF"
              file={assignmentPdf}
              onFileChange={setAssignmentPdf}
              onRemove={() => setAssignmentPdf(null)}
            />
          </section>

          <section className="assignment-section">
            <div className="section-heading split-heading">
              <div><span>02</span><h2>Evaluation Setup</h2></div>
              <div className="teacher-control-note"><Info size={15} /> Professor approval is required for final marks.</div>
            </div>
            <div className="ai-control-panel">
              <div className="ai-control-intro"><div className="ai-control-icon"><Sparkles size={19} /></div><div><h3>AI-Assisted Evaluation</h3><p>Enable intelligent analysis to support a faster, more consistent evaluation workflow.</p></div></div>
              <Toggle enabled={aiEnabled} onChange={() => setAiEnabled((value) => !value)} title="AI evaluation" description={aiEnabled ? "Enabled for this assignment" : "Disabled — manual review only"} />
            </div>
            <div className="evaluation-options-grid">
              <Toggle enabled={features.ocr} disabled={!aiEnabled} onChange={() => setFeatures((value) => ({ ...value, ocr: !value.ocr }))} title="OCR Text Extraction" description="Extract text from uploaded answer sheets." />
              <Toggle enabled={features.semantic} disabled={!aiEnabled} onChange={() => setFeatures((value) => ({ ...value, semantic: !value.semantic }))} title="Semantic Answer Matching" description="Assess conceptual similarity beyond keywords." />
              <Toggle enabled={features.rubric} disabled={!aiEnabled} onChange={() => setFeatures((value) => ({ ...value, rubric: !value.rubric }))} title="Rubric-Based Grading" description="Score answers against your defined criteria." />
              <Toggle enabled={features.feedback} disabled={!aiEnabled} onChange={() => setFeatures((value) => ({ ...value, feedback: !value.feedback }))} title="Personalized Feedback" description="Generate constructive improvement guidance." />
            </div>
          </section>

          <section className="assignment-section">
            <div className="section-heading"><div><span>03</span><h2>Reference Answer</h2></div><p>Provide an academic benchmark for AI-assisted evaluation.</p></div>
            <PdfUpload
              label="Reference Answer PDF"
              helperText="Upload the model/reference answer PDF used for AI evaluation"
              file={referenceAnswerPdf}
              onFileChange={setReferenceAnswerPdf}
              onRemove={() => setReferenceAnswerPdf(null)}
            />
          </section>

          <section className="assignment-section rubric-section">
            <div className="section-heading split-heading"><div><span>04</span><h2>Rubric Builder</h2></div><div className={`marks-indicator ${isMarksBalanced ? "balanced" : "unbalanced"}`}>{isMarksBalanced ? <Check size={15} /> : <Info size={15} />} Allocated Marks: {allocatedMarks} / {totalMarks}</div></div>
            {!isMarksBalanced && <div className="marks-warning"><Info size={16} /> Rubric marks must equal the total assignment marks before publishing.</div>}
            <div className="rubric-list">
              {criteria.map((criterion, index) => (
                <article className="rubric-card" key={criterion.id}>
                  <div className="rubric-number">{String(index + 1).padStart(2, "0")}</div>
                  <div className="rubric-fields"><label className="field">Criterion Name<input value={criterion.name} onChange={(event) => updateCriterion(criterion.id, "name", event.target.value)} /></label><label className="field">Description / Evaluation Guidance<textarea rows="2" value={criterion.description} onChange={(event) => updateCriterion(criterion.id, "description", event.target.value)} /></label></div>
                  <label className="field marks-field">Maximum Marks<input type="number" min="0" value={criterion.marks} onChange={(event) => updateCriterion(criterion.id, "marks", event.target.value)} /></label>
                  <button type="button" className="remove-criterion" onClick={() => removeCriterion(criterion.id)} disabled={criteria.length === 1} aria-label={`Remove ${criterion.name}`}><Minus size={16} /> Remove</button>
                </article>
              ))}
            </div>
            <button type="button" className="add-criterion" onClick={addCriterion}><Plus size={17} /> Add Criterion</button>
          </section>

        </form>

        <aside className="evaluation-summary">
          <div className="summary-sticky">
            <div className="summary-title"><div><span>AT A GLANCE</span><h2>Evaluation Summary</h2></div><div className={`summary-status ${aiEnabled ? "active" : "inactive"}`}>{aiEnabled ? "AI Ready" : "Manual"}</div></div>
            <div className="summary-score"><span>Total Marks</span><strong>{totalMarks}</strong><small>points available</small></div>
            <dl className="summary-list"><div><dt>Rubric Criteria</dt><dd>{criteria.length} criteria</dd></div><div><dt>AI Evaluation</dt><dd>{aiEnabled ? "Enabled" : "Manual review"}</dd></div><div><dt>Due Date</dt><dd>{dueDateLabel}</dd></div><div><dt>Reference Answer</dt><dd className={referenceReady ? "ready" : "not-ready"}>{referenceReady ? "Ready" : "Not added"}</dd></div></dl>
            <div className="summary-tip"><Sparkles size={16} /><p>AI suggestions will remain editable. You retain control over every final grade.</p></div>
          </div>
        </aside>
      </div>

      {showPreview && (
        <Dialog onClose={() => setShowPreview(false)} wide>
          <button type="button" className="dialog-close" onClick={() => setShowPreview(false)} aria-label="Close preview">
            <X size={19} />
          </button>
          <div className="preview-eyebrow"><Eye size={15} /> ASSIGNMENT PREVIEW</div>
          <h2>{form.title || "Untitled Assignment"}</h2>
          <p className="preview-course">
            {form.subjectName ? `${form.subjectName} (${form.courseCode})` : form.course} · {form.branch || "ENTC"} · {form.division || "TE ENTC – A"} · {form.assignmentType}
          </p>
          <div className="preview-detail-grid">
            <div><span>Subject</span><strong>{form.subjectName || "Not set"} ({form.courseCode || "—"})</strong></div>
            <div><span>Branch & Division</span><strong>{form.branch || "ENTC"} · {form.division || "TE ENTC – A"}</strong></div>
            <div><span>Academic Year</span><strong>{form.academicYear}</strong></div>
            <div><span>Due Date & Time</span><strong>{dueDateLabel}</strong></div>
            <div><span>Total Marks</span><strong>{totalMarks} marks</strong></div>
            <div><span>Evaluation</span><strong>{aiEnabled ? "AI-assisted" : "Manual review"}</strong></div>
            <div><span>Question Paper PDF</span><strong>{assignmentPdf ? assignmentPdf.name : "Not uploaded"}</strong></div>
            <div><span>Reference Answer PDF</span><strong>{referenceAnswerPdf ? referenceAnswerPdf.name : (form.referenceAnswer ? "Text provided" : "Not added")}</strong></div>
          </div>
          <h3>Description / Instructions</h3>
          <p className="preview-copy">{form.description || "No instructions added."}</p>
          <h3>Evaluation Rubric</h3>
          <div className="preview-rubric">
            {criteria.map((item) => (
              <div key={item.id}>
                <span>{item.name || "Untitled criterion"}</span>
                <strong>{item.marks} marks</strong>
              </div>
            ))}
          </div>
          <button type="button" className="assignment-btn assignment-btn-primary preview-close" onClick={() => setShowPreview(false)}>
            Continue Editing
          </button>
        </Dialog>
      )}

      {showQuestionPaper && (
        <QuestionPaperPreview
          assignment={form}
          assignmentPdf={assignmentPdf}
          onClose={() => setShowQuestionPaper(false)}
        />
      )}

      {showPublished && (
        <Dialog onClose={() => setShowPublished(false)}>
          <div className="success-icon"><Check size={30} /></div>
          <div className="success-copy">
            <span>ASSESSMENT CREATED ({form.totalMarks} MARKS)</span>
            <h2>
              {form.assessmentCategory === "in-sem" ? "In-Sem Examination Created" : form.assessmentCategory === "end-sem" ? "End-Sem Examination Created" : "Assignment Published Successfully"}
            </h2>
            <p>
              {form.title} ({form.totalMarks} Marks) has been created for {form.division}.
              {form.assessmentCategory === "assignment"
                ? " Students can now submit their answer PDFs via Student Portal."
                : " Teacher/Evaluator upload mode is active. Answer sheets can be uploaded via the Examination Workspace."}
            </p>
            {(assignmentPdf || referenceAnswerPdf) && (
              <div className="published-pdf-summary">
                {assignmentPdf ? <span><FileText size={13} /> Question Paper PDF: {assignmentPdf.name}</span> : null}
                {referenceAnswerPdf ? <span><FileText size={13} /> Reference Answer PDF: {referenceAnswerPdf.name}</span> : null}
              </div>
            )}
          </div>
          <div className="success-actions">
            <button type="button" className="assignment-btn assignment-btn-secondary" onClick={() => navigate("/teacher/dashboard")}>Back to Dashboard</button>
            <button type="button" className="assignment-btn assignment-btn-primary" onClick={() => navigate(form.assessmentCategory === "in-sem" ? "/teacher/insem" : form.assessmentCategory === "end-sem" ? "/teacher/endsem" : "/teacher/submissions")}>
              {form.assessmentCategory === "assignment" ? "View Submissions" : "Go to Examination Workspace"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default CreateAssignmentPage;