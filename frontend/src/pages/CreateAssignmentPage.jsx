import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ClipboardCheck,
  Eye,
  FileText,
  FileWarning,
  Info,
  Minus,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import "./CreateAssignmentPage.css";

const initialCriteria = [
  {
    id: 1,
    name: "Concept Understanding",
    description: "Assess understanding of binary tree concepts and traversal principles.",
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
  title: "Binary Trees & Heap Operations",
  course: "Data Structures (ET202)",
  academicYear: "2026–27",
  division: "SE ENTC – A",
  assignmentType: "Written Assignment",
  dueDate: "2026-08-14T23:59",
  totalMarks: 20,
  description:
    "Explain binary tree traversals and heap operations with suitable examples. Include the relevant algorithms, time complexity, and a brief comparison of min-heaps and max-heaps.",
  referenceAnswer:
    "A binary tree is a hierarchical structure where each node has at most two children. In-order traversal visits the left subtree, root, then right subtree. A heap is a complete binary tree that satisfies the heap-order property; min-heaps store the smallest element at the root while max-heaps store the largest.",
};

function Toggle({ enabled, onChange, title, description, disabled = false }) {
  return (
    <div className={`evaluation-option ${disabled ? "is-disabled" : ""}`}>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className={`toggle-control ${enabled ? "is-on" : ""}`}
        aria-pressed={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${title}`}
        onClick={onChange}
        disabled={disabled}
      >
        <span />
      </button>
    </div>
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
  const inputId = `pdf-upload-${label.toLowerCase().replaceAll(" ", "-")}`;

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
          <input type="file" id={inputId} accept="application/pdf,.pdf" onChange={handleInputChange} />
          <span className="pdf-dropzone-icon"><Upload size={20} /></span>
          <strong>Upload PDF</strong>
          <small>Drag & drop your PDF here, or click to browse</small>
        </label>
      )}

      {error && <div className="pdf-upload-error" role="alert"><FileWarning size={14} />{error}</div>}
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
  const [validationMessage, setValidationMessage] = useState("");
  const [assignmentPdf, setAssignmentPdf] = useState(null);
  const [referenceAnswerPdf, setReferenceAnswerPdf] = useState(null);

  const allocatedMarks = useMemo(
    () => criteria.reduce((total, criterion) => total + (Number(criterion.marks) || 0), 0),
    [criteria],
  );
  const totalMarks = Number(form.totalMarks) || 0;
  const isMarksBalanced = allocatedMarks === totalMarks;
  const referenceReady = form.referenceAnswer.trim().length > 0;

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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

  const handlePublish = () => {
    const missingDetails = !form.title.trim() || !form.course || !form.dueDate || totalMarks < 1;
    const incompleteRubric = criteria.length === 0 || criteria.some((item) => !item.name.trim());

    if (missingDetails || incompleteRubric || !isMarksBalanced) {
      setValidationMessage(
        !isMarksBalanced
          ? "Match the allocated rubric marks to the total marks before publishing."
          : "Complete the required assignment details and rubric criteria before publishing.",
      );
      return;
    }

    // Preserve selected PDF info in the assignment demo data (frontend-only storage)
    const publishedAssignment = {
      ...form,
      assignmentPdf: assignmentPdf
        ? { name: assignmentPdf.name, size: assignmentPdf.size, type: assignmentPdf.type }
        : null,
      referenceAnswerPdf: referenceAnswerPdf
        ? { name: referenceAnswerPdf.name, size: referenceAnswerPdf.size, type: referenceAnswerPdf.type }
        : null,
    };

    setValidationMessage("");
    setShowPublished(true);
  };

  const dueDateLabel = form.dueDate
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(form.dueDate),
      )
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
              <label className="field field-wide">Assignment Title<input name="title" value={form.title} onChange={updateForm} required /></label>
              <label className="field">Course / Subject<select name="course" value={form.course} onChange={updateForm}><option>Data Structures (ET202)</option><option>Signals & Systems (ET301)</option><option>Embedded Systems (ET304)</option></select><ChevronDown size={16} /></label>
              <label className="field">Academic Year<select name="academicYear" value={form.academicYear} onChange={updateForm}><option>2026–27</option><option>2025–26</option></select><ChevronDown size={16} /></label>
              <label className="field">Division<select name="division" value={form.division} onChange={updateForm}><option>SE ENTC – A</option><option>SE ENTC – B</option><option>TE ENTC – A</option></select><ChevronDown size={16} /></label>
              <label className="field">Assignment Type<select name="assignmentType" value={form.assignmentType} onChange={updateForm}><option>Written Assignment</option><option>Lab Assessment</option><option>Midterm Examination</option><option>Project Review</option></select><ChevronDown size={16} /></label>
              <label className="field">Due Date<input type="datetime-local" name="dueDate" value={form.dueDate} onChange={updateForm} required /></label>
              <label className="field">Total Marks<input type="number" name="totalMarks" min="1" value={form.totalMarks} onChange={updateForm} required /></label>
              <label className="field field-wide">Description / Instructions<textarea name="description" value={form.description} onChange={updateForm} rows="4" /></label>
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
            <label className="field field-wide">Reference Answer / Model Answer<textarea name="referenceAnswer" value={form.referenceAnswer} onChange={updateForm} rows="7" placeholder="Add a model answer or key concepts..." /></label>
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

      {showPreview && <Dialog onClose={() => setShowPreview(false)} wide><button type="button" className="dialog-close" onClick={() => setShowPreview(false)} aria-label="Close preview"><X size={19} /></button><div className="preview-eyebrow"><Eye size={15} /> ASSIGNMENT PREVIEW</div><h2>{form.title || "Untitled Assignment"}</h2><p className="preview-course">{form.course} · {form.division} · {form.assignmentType}</p><div className="preview-detail-grid"><div><span>Due date</span><strong>{dueDateLabel}</strong></div><div><span>Total marks</span><strong>{totalMarks} marks</strong></div><div><span>Evaluation</span><strong>{aiEnabled ? "AI-assisted" : "Manual review"}</strong></div></div><h3>Instructions</h3><p className="preview-copy">{form.description || "No instructions added."}</p><h3>Evaluation rubric</h3><div className="preview-rubric">{criteria.map((item) => <div key={item.id}><span>{item.name || "Untitled criterion"}</span><strong>{item.marks} marks</strong></div>)}</div><button type="button" className="assignment-btn assignment-btn-primary preview-close" onClick={() => setShowPreview(false)}>Continue Editing</button></Dialog>}

      {showPublished && <Dialog onClose={() => setShowPublished(false)}><div className="success-icon"><Check size={30} /></div><div className="success-copy"><span>READY FOR STUDENTS</span><h2>Assignment Published Successfully</h2><p>{form.title} is now available to {form.division}. AI-assisted evaluation settings and your rubric have been saved for the demo.</p>{(assignmentPdf || referenceAnswerPdf) && <div className="published-pdf-summary">{(assignmentPdf ? <span><FileText size={13} /> Assignment PDF: {assignmentPdf.name}</span> : null)}{(referenceAnswerPdf ? <span><FileText size={13} /> Reference PDF: {referenceAnswerPdf.name}</span> : null)}</div>}</div><div className="success-actions"><button type="button" className="assignment-btn assignment-btn-secondary" onClick={() => navigate("/teacher/dashboard")}>Back to Dashboard</button><button type="button" className="assignment-btn assignment-btn-primary" onClick={() => navigate("/teacher/submissions")}>View Submissions</button></div></Dialog>}
    </div>
  );
}

export default CreateAssignmentPage;
