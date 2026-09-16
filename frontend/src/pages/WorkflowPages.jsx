import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ChevronRight, Cpu, Download, Edit3, Eye, FileSpreadsheet, FileText, FileWarning, Gauge, Play, RotateCcw, Save, Search, Sparkles, WandSparkles } from "lucide-react";
import { analyticsTrend, approveEvaluation, createdAssessments, demoAssignment, difficultyConfig, getAssignmentById, getClassAnalytics, getEvaluationProgress, getPersistedPdfUrl, getStudentReport, getSubmissionByEvaluationId, getSubmissionById, getTeacherAssignments, hasValidAnswerText, isAssignmentPastDueDate, isResultsPublished, markAsEvaluated, publishResults, reEvaluateSubmission, rubricAnalytics, saveTeacherReview, scoreDistribution, workflowSubmissions } from "../data/workflowData";
import { getCurrentTeacher } from "../auth/teacherAuth";
import { teacherProfile } from "../data/mockData";
import { students } from "../auth/studentAuth";
import { getInSemExam, getInSemSubmissions, startInSemEvaluation } from "../data/inSemData";
import { getEndSemExam, getEndSemSubmissions, startEndSemEvaluation } from "../data/endSemData";
import { FilePill, PageHeader, PaperPreview, StatusBadge, Toast } from "../components/WorkflowUI";
import "./WorkflowPages.css";

function NotFoundState({ title, message, id }) {
  return (
    <div className="workflow-page">
      <PageHeader
        eyebrow="ASSESSMENT WORKSPACE"
        title={title}
        subtitle="The requested record could not be found."
        actions={
          <Link className="workflow-btn" to="/teacher/submissions">
            <ArrowLeft size={15} /> Back to Submissions
          </Link>
        }
      />
      <section className="surface" style={{ padding: "40px", textAlign: "center", borderRadius: "10px" }}>
        <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "10px" }}>{title}</h2>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
          {message} <strong>{id || "none"}</strong>.
        </p>
        <Link className="workflow-btn primary" to="/teacher/submissions">
          Return to Submissions List
        </Link>
      </section>
    </div>
  );
}

function DifficultySelector({ value, onChange, compact = false }) {
  const levels = [
    { key: "easy", label: "Easy", icon: "✓", description: "More tolerant evaluation. Focus on basic concept understanding. Minor wording differences have less penalty." },
    { key: "moderate", label: "Moderate", icon: "◐", description: "Balanced evaluation. Evaluate concept understanding, technical accuracy and explanation normally. Recommended." },
    { key: "hard", label: "Hard", icon: "✕", description: "Strict evaluation. Require accurate technical concepts and complete reasoning. Missing concepts have stronger penalties." },
  ];

  return (
    <div className={`difficulty-selector ${compact ? "difficulty-compact" : ""}`}>
      {levels.map((level) => (
        <button
          type="button"
          key={level.key}
          className={`difficulty-card difficulty-${level.key} ${value === level.key ? "selected" : ""}`}
          onClick={() => onChange(level.key)}
          aria-pressed={value === level.key}
        >
          <div className="difficulty-card-top">
            <span className="difficulty-icon">{level.icon}</span>
            <strong>{level.label}</strong>
            {value === level.key && <Check size={16} className="difficulty-check" />}
          </div>
          <p>{level.description}</p>
        </button>
      ))}
    </div>
  );
}

function DifficultyBadge({ difficulty }) {
  const config = difficultyConfig[difficulty] || difficultyConfig.moderate;
  return <span className={`difficulty-badge difficulty-badge-${difficulty}`}><Gauge size={13} />{config.label}</span>;
}

export function SubmissionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Latest");
  const [status, setStatus] = useState("All statuses");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedAsgId, setSelectedAsgId] = useState(
    createdAssessments.length > 0 ? createdAssessments[createdAssessments.length - 1].id : demoAssignment.id
  );
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishToast, setPublishToast] = useState("");

  const published = isResultsPublished(selectedAsgId);
  const inSemSubs = getInSemSubmissions();
  const endSemSubs = getEndSemSubmissions();

  const availableAssignments = useMemo(() => {
    const list = [...createdAssessments];
    if (!list.some((a) => a.id === demoAssignment.id)) {
      list.push(demoAssignment);
    }
    return list;
  }, []);

  const selectedAssignment = useMemo(() => {
    return availableAssignments.find((a) => a.id === selectedAsgId) || availableAssignments[0] || demoAssignment;
  }, [availableAssignments, selectedAsgId]);

  const enrolledStudents = useMemo(() => {
    if (!selectedAssignment || selectedAssignment.id === demoAssignment.id) {
      return students;
    }
    const targetBranch = (selectedAssignment.branch || "ENTC").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const targetDiv = (selectedAssignment.division || "TE ENTC – A").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return students.filter((s) => {
      const sBranch = (s.branch || "ENTC").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const sDiv = (s.division || "TE ENTC – A").toUpperCase().replace(/[^A-Z0-9]/g, "");
      return sBranch === targetBranch && sDiv === targetDiv;
    });
  }, [selectedAssignment]);

  const allSubmissions = useMemo(() => {
    const normRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const isPastDue = isAssignmentPastDueDate(selectedAssignment);

    const asgList = enrolledStudents.map((student) => {
      const targetRoll = normRoll(student.roll);
      const existing = workflowSubmissions.find(
        (s) =>
          (s.assignmentId === selectedAsgId || (!s.assignmentId && selectedAsgId === demoAssignment.id)) &&
          ((s.studentId && s.studentId === student.id) || (s.roll && normRoll(s.roll) === targetRoll))
      );

      if (existing) {
        return {
          ...existing,
          id: existing.id || `sub-${student.id}-${selectedAsgId}`,
          studentId: student.id,
          student: student.name,
          roll: student.roll,
          assignmentId: selectedAsgId,
          assessmentCategory: "assignment",
          assessmentTitle: selectedAssignment.title || demoAssignment.shortTitle,
          totalMarks: selectedAssignment.totalMarks || 20,
        };
      }

      if (isPastDue) {
        return {
          id: `missing-${selectedAsgId}-${student.id}`,
          studentId: student.id,
          student: student.name,
          roll: student.roll,
          assignmentId: selectedAsgId,
          assessmentCategory: "assignment",
          assessmentTitle: selectedAssignment.title || demoAssignment.shortTitle,
          submittedAt: "Not Submitted",
          file: "No file uploaded",
          fileName: "No file uploaded",
          status: "Missing / Failed",
          submissionStatus: "Missing / Failed",
          score: "0 / 20",
          totalMarks: selectedAssignment.totalMarks || 20,
          isNonSubmissionZero: true,
        };
      }

      return {
        id: `pending-${selectedAsgId}-${student.id}`,
        studentId: student.id,
        student: student.name,
        roll: student.roll,
        assignmentId: selectedAsgId,
        assessmentCategory: "assignment",
        assessmentTitle: selectedAssignment.title || demoAssignment.shortTitle,
        submittedAt: "—",
        file: "Awaiting upload",
        fileName: "Awaiting upload",
        status: "Pending",
        submissionStatus: "Pending",
        score: "—",
        totalMarks: selectedAssignment.totalMarks || 20,
      };
    });

    const inSemList = inSemSubs.map((item) => ({
      ...item,
      student: item.studentName,
      roll: item.rollNumber,
      file: item.fileName,
      assessmentCategory: "in-sem",
      assessmentTitle: "In-Sem Exam",
      totalMarks: 30,
    }));
    const endSemList = endSemSubs.map((item) => ({
      ...item,
      student: item.studentName,
      roll: item.rollNumber,
      file: item.fileName,
      assessmentCategory: "end-sem",
      assessmentTitle: "End-Sem Exam",
      totalMarks: 60,
    }));

    if (categoryFilter === "assignment") return asgList;
    if (categoryFilter === "in-sem") return inSemList;
    if (categoryFilter === "end-sem") return endSemList;
    return [...asgList, ...inSemList, ...endSemList];
  }, [categoryFilter, selectedAsgId, selectedAssignment, inSemSubs, endSemSubs]);

  const cards = useMemo(() => {
    const studentSet = new Set(allSubmissions.map((s) => s.studentId || s.roll));
    const totalStudents = studentSet.size || 7;
    const submittedCount = allSubmissions.filter((s) => s.status === "Submitted" || s.status === "Evaluated" || s.status === "Approved" || s.status === "Result Published").length;
    const lateCount = allSubmissions.filter((s) => s.status === "Late / Failed" || s.evaluation?.isLateFailed).length;
    const evaluatedCount = allSubmissions.filter((s) => s.evaluation && (s.status === "Evaluated" || s.status === "Evaluation Completed" || s.status === "Approved" || s.status === "Result Published")).length;
    const pendingCount = allSubmissions.filter((s) => s.status === "Pending" || s.status === "Processing" || s.status === "Under Evaluation" || s.status === "Not Submitted").length;

    return [
      ["Total Students", String(totalStudents), "Enrolled students in selection"],
      ["Submitted", String(submittedCount), "On-time answer sheets"],
      ["Late / Failed", String(lateCount), "Submissions received after due date"],
      ["Evaluated", String(evaluatedCount), "AI & teacher reviewed"],
      ["Pending / Missing", String(pendingCount), "Awaiting submission or evaluation"],
    ];
  }, [allSubmissions]);

  const filtered = useMemo(() => {
    return allSubmissions
      .filter((item) => {
        const matchesTab = tab === "All" ? true : tab === "Evaluated" ? (item.status === "Evaluated" || item.status === "Evaluation Completed") : tab === "Pending" ? (item.status === "Pending" || item.status === "Processing" || item.status === "Under Evaluation") : tab === "Late / Failed" ? (item.status === "Late / Failed" || item.evaluation?.isLateFailed) : tab === "Approved" ? (item.status === "Approved" || item.evaluationStatus === "Approved") : tab === "Published" ? (item.status === "Result Published" || item.published) : item.status === tab;
        const matchesStatus = status === "All statuses" ? true : item.status === status;
        const matchesQuery = `${item.student || ""} ${item.roll || ""}`.toLowerCase().includes(query.toLowerCase());
        return matchesTab && matchesStatus && matchesQuery;
      })
      .sort((a, b) => (sort === "Student" ? (a.student || "").localeCompare(b.student || "") : (a.id || "").localeCompare(b.id || "")));
  }, [allSubmissions, tab, status, query, sort]);

  const progress = getEvaluationProgress(selectedAsgId);

  const getAction = (item) => {
    if (item.assessmentCategory === "in-sem") {
      return (
        <button className="text-action" onClick={() => navigate("/teacher/insem")}>
          In-Sem Workspace <ChevronRight size={14} />
        </button>
      );
    }
    if (item.assessmentCategory === "end-sem") {
      return (
        <button className="text-action" onClick={() => navigate("/teacher/endsem")}>
          End-Sem Workspace <ChevronRight size={14} />
        </button>
      );
    }
    if (item.status === "Late / Failed" || item.evaluation?.isLateFailed) {
      return <span style={{ color: "#dc2626", fontSize: "13px", fontWeight: 500 }}>Evaluation Unavailable (Late)</span>;
    }
    if (item.status === "Not Submitted" || item.isNonSubmissionZero) {
      return <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>No Submission (0 Marks)</span>;
    }
    if (item.status === "Evaluated") {
      return (
        <div className="action-group">
          <button className="text-action" onClick={() => navigate(`/teacher/evaluations/${item.evaluationId || item.id}`)}>View Result<ChevronRight size={14}/></button>
          <button className="text-action re-evaluate-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>Re-evaluate<ChevronRight size={14}/></button>
        </div>
      );
    }
    if (item.status === "Processing") {
      return <button className="text-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>View Evaluation<ChevronRight size={14}/></button>;
    }
    return <button className="text-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>Start AI Evaluation<ChevronRight size={14}/></button>;
  };

  const handlePublish = () => {
    const result = publishResults(selectedAsgId);
    if (result.alreadyPublished) {
      setPublishToast("Results already published. Students have already been notified.");
    } else if (result.incomplete) {
      setPublishToast("Complete all student evaluations before publishing results.");
    } else {
      setPublishToast("Results published successfully. Students have been notified.");
    }
    setShowPublishModal(false);
  };

  return (
    <div className="workflow-page">
      <Toast message={publishToast} onClose={() => setPublishToast("")}/>
      <PageHeader
        eyebrow="ASSESSMENT WORKSPACE"
        title="Student Submissions"
        subtitle="Review student responses and manage AI-assisted evaluation across all assessments."
        actions={
          <>
            <select
              className="compact-select"
              aria-label="Select Assignment"
              value={selectedAsgId}
              onChange={(e) => setSelectedAsgId(e.target.value)}
            >
              {availableAssignments.map((asg) => (
                <option key={asg.id} value={asg.id}>
                  {asg.title} ({asg.courseCode || asg.subjectName || "Assignment"}) · {asg.division}
                </option>
              ))}
            </select>
            <select
              className="compact-select"
              aria-label="Filter by assessment type"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Assessments</option>
              <option value="assignment">Assignment (20 Marks)</option>
              <option value="in-sem">In-Sem Exam (30 Marks)</option>
              <option value="end-sem">End-Sem Exam (60 Marks)</option>
            </select>
            <Link className="workflow-btn" to="/teacher/create-assignment">Create Assessment</Link>
          </>
        }
      />

      <div className="metric-grid">
        {cards.map(([name, value, note]) => (
          <div className="metric-card" key={name}>
            <span>{name}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      {/* Publish Results Panel */}
      <section className={`surface publish-panel ${published ? "published" : ""}`}>
        <div className="publish-panel-info">
          <div className="publish-panel-icon"><CheckCircle2 size={20} /></div>
          <div>
            <h2>{published ? "Results Published" : "Evaluation Progress"}</h2>
            <p>{published ? "Results have been published and students have been notified." : progress.allEvaluated ? "All submissions evaluated" : `${progress.evaluated} of ${progress.total} submissions evaluated`}</p>
          </div>
        </div>
        <div className="publish-progress">
          <div className="publish-progress-bar"><i style={{ width: `${progress.percentage}%` }} /></div>
          <span>{progress.evaluated} / {progress.total} Submissions Evaluated</span>
        </div>
        <div className="publish-panel-actions">
          {published ? (
            <span className="publish-status-badge"><Check size={14} /> Published</span>
          ) : (
            <button
              type="button"
              className="workflow-btn primary publish-btn"
              disabled={!progress.allEvaluated}
              onClick={() => setShowPublishModal(true)}
            >
              <CheckCircle2 size={15} /> PUBLISH RESULTS & NOTIFY STUDENTS
            </button>
          )}
        </div>
        {!progress.allEvaluated && !published && <div className="publish-hint">Complete all student evaluations before publishing results.</div>}
      </section>

      <section className="surface submissions-surface">
        <div className="table-toolbar">
          <div className="status-tabs">
            {["All", "Pending", "Submitted", "Late / Failed", "Evaluated", "Approved", "Published"].map((item) => (
              <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>
            ))}
          </div>
          <div className="toolbar-controls">
            <label className="search-field">
              <Search size={16}/>
              <input aria-label="Search students" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students or roll no." />
            </label>
            <select className="compact-select" aria-label="Status filter" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All statuses</option>
              {["Submitted", "Late / Failed", "Processing", "Evaluated", "Pending", "Approved", "Result Published"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="compact-select" aria-label="Sort submissions" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="Latest">Latest submitted</option>
              <option value="Student">Student name</option>
            </select>
          </div>
        </div>

        <div className="workflow-table-wrap">
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <p style={{ fontSize: "15px", fontWeight: "500", marginBottom: "4px" }}>No submissions match the selected filters.</p>
              <small>Try selecting "All Assessments" or clearing your search query.</small>
            </div>
          ) : (
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll Number</th>
                  <th>Assessment</th>
                  <th>Submitted At</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.student}</strong></td>
                    <td className="muted">{item.roll}</td>
                    <td><span className="font-medium">{item.assessmentTitle}</span> ({item.totalMarks}m)</td>
                    <td className="muted">{item.submittedAt}</td>
                    <td><FilePill name={item.file} pages={item.pages}/></td>
                    <td><StatusBadge status={item.status}/></td>
                    <td className="score-cell">{item.score}</td>
                    <td>{getAction(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    
    {/* Publish Confirmation Modal */}
    {showPublishModal && (
      <div className="publish-modal-backdrop" onMouseDown={() => setShowPublishModal(false)}>
        <section className="publish-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
          <div className="publish-modal-icon"><CheckCircle2 size={26} /></div>
          <h2>Publish Evaluation Results?</h2>
          <p>All student submissions have been evaluated. Publishing will make the results available to students and send them a notification.</p>
          <div className="publish-modal-actions">
            <button type="button" className="workflow-btn" onClick={() => setShowPublishModal(false)}>Cancel</button>
            <button type="button" className="workflow-btn primary" onClick={handlePublish}><Check size={15} /> Publish & Notify Students</button>
          </div>
        </section>
      </div>
    )}
  </div>
  );
}

export function SubmissionDetailPage() {
  const { submissionId } = useParams();
  const submission = getSubmissionById(submissionId);
  const navigate = useNavigate();

  if (!submission) {
    return <NotFoundState title="Submission Not Found" message="We could not locate any student submission matching the submission ID:" id={submissionId} />;
  }

  const assessment = getAssignmentById(submission.assignmentId) || demoAssignment;
  const evaluation = submission.evaluation || null;
  const answerText = evaluation?.answerText || "No extracted answer text available for this submission.";

  return <div className="workflow-page"><PageHeader eyebrow="STUDENT RESPONSE" title="Submission Details" subtitle={`${submission.student} · ${assessment.title}`} actions={<Link className="workflow-btn" to="/teacher/submissions"><ArrowLeft size={15}/> Back to Submissions</Link>} />
  <div className="detail-meta surface"><div><span>Student</span><strong>{submission.student}</strong><small>{submission.roll}</small></div><div><span>Submission time</span><strong>{submission.submittedAt}</strong><small>Received through Student Portal</small></div><div><span>Document</span><FilePill name={submission.file} pages={submission.pages}/><small>PDF answer script</small></div><div><span>Current status</span><StatusBadge status={submission.status}/><small>Assessment total: {assessment.totalMarks} marks</small></div></div>
  <div className="detail-grid"><section className="surface answer-panel"><div className="panel-heading"><div><span>SUBMITTED ANSWER</span><h2>Answer Paper Preview</h2></div><FilePill name={submission.file}/></div><PaperPreview student={submission.student} roll={submission.roll} course={assessment.subjectName || assessment.courseCode || assessment.title} answerText={answerText} pages={submission.pages}/></section><aside className="detail-sidebar"><section className="surface ocr-card"><div className="panel-heading"><div><span>OCR PREVIEW</span><h2>Extracted Answer Text</h2></div><StatusBadge status="Processing"/></div><p>{answerText}</p><div className="ocr-confidence"><span>Mock OCR confidence</span><strong>96%</strong></div></section><section className="evaluate-card"><Cpu size={21}/><h2>Ready for AI-assisted review</h2><p>EvalAI will use the configured rubric and reference answer to recommend marks. Final grading remains with Professor123.</p><button className="workflow-btn primary" onClick={() => navigate(`/teacher/evaluate/${submission.id}`)}><Sparkles size={15}/> Evaluate with AI</button></section></aside></div></div>;
}

const stages = ["Document Processing", "OCR Text Extraction", "Semantic Answer Analysis", "Difficulty-Based Evaluation", "Rubric Scoring", "Feedback Generation"];
const stageText = ["Processing document…", "Extracting answer text…", "Analyzing semantic relevance…", "Applying evaluation difficulty…", "Calculating marks…", "Generating personalized feedback…"];

const evaluationRouteKey = (submission) => `${submission.assessmentType || "assignment"}__${submission.submissionId || submission.id}`;

export function SelectSubmissionPage() {
  const navigate = useNavigate();
  const currentTeacher = getCurrentTeacher();
  const teacherId = currentTeacher?.teacherId || currentTeacher?.id;

  const teacherAssignments = useMemo(() => {
    return getTeacherAssignments(teacherId) || [];
  }, [teacherId]);

  const [assessmentId, setAssessmentId] = useState(() => teacherAssignments[0]?.id || "");
  const [className, setClassName] = useState("All classes");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");

  useEffect(() => {
    if (teacherAssignments.length > 0 && !teacherAssignments.some((a) => a.id === assessmentId)) {
      setAssessmentId(teacherAssignments[0].id);
    }
  }, [teacherAssignments, assessmentId]);

  const selectedAssessment = useMemo(() => {
    return teacherAssignments.find((a) => a.id === assessmentId) || null;
  }, [teacherAssignments, assessmentId]);

  const submissions = useMemo(() => {
    if (!selectedAssessment) return [];
    return workflowSubmissions
      .filter((item) => item.assignmentId === selectedAssessment.id)
      .map((item) => ({
        ...item,
        submissionId: item.id,
        roll: item.roll || item.rollNumber,
        student: item.student || item.studentName,
        file: item.file || item.fileName,
      }));
  }, [selectedAssessment]);

  const statusLabel = (value) => {
    if (value === "Submitted" || value === "Pending") return "Ready for Evaluation";
    if (value === "Processing") return "Evaluating";
    if (value === "Evaluated") return "AI Evaluation Completed";
    return value;
  };

  const filtered = useMemo(() => {
    return submissions
      .filter((item) => status === "All statuses" || statusLabel(item.status) === status)
      .filter((item) => `${item.student} ${item.roll} ${item.file}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (a.roll || "").localeCompare(b.roll || "", undefined, { numeric: true }));
  }, [submissions, query, status]);

  if (teacherAssignments.length === 0) {
    return (
      <div className="workflow-page evaluation-center-page">
        <PageHeader
          eyebrow="TEACHER WORKSPACE"
          title="AI Evaluation Center"
          subtitle="Select an assessment and answer sheet, review the source documents, and start teacher-controlled AI evaluation."
          actions={
            <Link className="workflow-btn" to="/teacher/submissions">
              <ArrowLeft size={15} /> Back to Submissions
            </Link>
          }
        />
        <section className="surface evaluation-center-empty" style={{ padding: "48px", textAlign: "center" }}>
          <FileText size={36} style={{ marginBottom: "12px", color: "var(--text-secondary)" }} />
          <h3>No assignments available for AI evaluation.</h3>
          <p style={{ color: "#64748b", marginTop: "8px" }}>Create an assignment first in the Teacher Portal.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="workflow-page evaluation-center-page">
      <PageHeader
        eyebrow="TEACHER WORKSPACE"
        title="AI Evaluation Center"
        subtitle="Select an assessment and answer sheet, review the source documents, and start teacher-controlled AI evaluation."
        actions={
          <Link className="workflow-btn" to="/teacher/submissions">
            <ArrowLeft size={15} /> Back to Submissions
          </Link>
        }
      />
      <section className="surface evaluation-center-filters">
        <div className="evaluation-center-filter-heading">
          <div>
            <span>ASSESSMENT QUEUE</span>
            <h2>Select an evaluation context</h2>
          </div>
          <StatusBadge status={`${filtered.length} submissions`} />
        </div>
        <div className="evaluation-filter-grid">
          <label>
            <span>Assessment</span>
            <select
              value={assessmentId}
              onChange={(event) => {
                setAssessmentId(event.target.value);
                setQuery("");
                setStatus("All statuses");
              }}
            >
              {teacherAssignments.map((asg) => {
                const formattedTitle = asg.title.startsWith("Assignment:") ? asg.title : `Assignment: ${asg.title}`;
                return (
                  <option key={asg.id} value={asg.id}>
                    {formattedTitle}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span>Class</span>
            <select value={className} onChange={(event) => setClassName(event.target.value)}>
              <option value="All classes">
                {selectedAssessment
                  ? `${selectedAssessment.branch ? selectedAssessment.branch + " · " : ""}${selectedAssessment.division || "TE ENTC – A"}`
                  : "All classes"}
              </option>
            </select>
          </label>
          <label className="evaluation-search-field">
            <span>Student / Roll Number</span>
            <div>
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or roll number" />
            </div>
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All statuses</option>
              <option>Ready for Evaluation</option>
              <option>Evaluating</option>
              <option>AI Evaluation Completed</option>
              <option>Needs Teacher Review</option>
              <option>Approved</option>
              <option>Published</option>
            </select>
          </label>
        </div>
      </section>

      <section className="surface submissions-surface evaluation-center-list">
        <div className="evaluation-center-list-heading">
          <div>
            <span>ANSWER SHEETS</span>
            <h2>{selectedAssessment?.title || "Assessment"} submissions</h2>
          </div>
          <span className="evaluation-sort-note">Roll number · ascending</span>
        </div>
        {filtered.length === 0 ? (
          <div className="evaluation-center-empty">
            <FileText size={22} />
            <h3>No answer sheets found</h3>
            <p>Choose another status or search term.</p>
          </div>
        ) : (
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>File</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="muted">
                      <strong>{item.roll}</strong>
                    </td>
                    <td>
                      <strong>{item.student}</strong>
                    </td>
                    <td>
                      <FilePill name={item.file} pages={item.pages} />
                    </td>
                    <td>
                      <StatusBadge status={statusLabel(item.status)} />
                    </td>
                    <td className="score-cell">{item.score || "—"}</td>
                    <td>
                      <button
                        className="text-action"
                        onClick={() => navigate(`/teacher/evaluate/${evaluationRouteKey(item)}`)}
                      >
                        {item.status === "Evaluation Completed" || item.status === "Evaluated" ? "Review" : "Evaluate"}
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DocumentPreview({ title, eyebrow, file, text }) {
  return <section className="surface evaluation-document-card"><div className="panel-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{file ? <FilePill name={file} /> : <StatusBadge status="Not available" />}</div><div className="evaluation-document-preview"><FileText size={21}/><strong>{file || `${title} is not available.`}</strong><p>{text || `${title} is not available.`}</p></div></section>;
}

const getEvaluationPageRecord = (routeKey) => {
  const currentTeacher = getCurrentTeacher();
  const teacherId = currentTeacher?.teacherId || currentTeacher?.id;
  const decoded = decodeURIComponent(routeKey || "");
  const separator = decoded.indexOf("__");
  const type = separator >= 0 ? decoded.slice(0, separator) : "assignment";
  const id = separator >= 0 ? decoded.slice(separator + 2) : decoded;

  if (type === "in-sem") {
    const assessment = getInSemExam();
    const source = getInSemSubmissions().find((item) => item.id === id) || null;
    return { assessment, assessmentType: type, submission: source && { ...source, id: source.id, student: source.studentName, roll: source.rollNumber, file: source.fileName } };
  }
  if (type === "end-sem") {
    const assessment = getEndSemExam();
    const source = getEndSemSubmissions().find((item) => item.id === id) || null;
    return { assessment, assessmentType: type, submission: source && { ...source, id: source.id, student: source.studentName, roll: source.rollNumber, file: source.fileName } };
  }

  const source = getSubmissionById(id) || getSubmissionById(routeKey);
  if (!source) return { assessment: null, assessmentType: "assignment", submission: null };

  const realAsg = getAssignmentById(source.assignmentId);
  if (!realAsg) return { assessment: null, assessmentType: "assignment", submission: source };

  // Teacher ownership check
  if (teacherId && realAsg.createdByTeacherId && realAsg.createdByTeacherId !== teacherId && realAsg.publishedBy !== teacherId) {
    return { assessment: null, assessmentType: "assignment", submission: source, isUnauthorized: true };
  }

  return { assessment: realAsg, assessmentType: "assignment", submission: source };
};

export function EvaluationPage() {
  const { submissionId } = useParams();
  const evaluationRecord = getEvaluationPageRecord(submissionId);
  const submission = evaluationRecord?.submission;
  const assessment = evaluationRecord?.assessment;
  const assessmentType = evaluationRecord?.assessmentType;
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);
  const [difficulty, setDifficulty] = useState("moderate");
  const [startError, setStartError] = useState("");

  const isReEvaluation = submission?.status === "Evaluated";

  useEffect(() => {
    if (!submission) return undefined;
    if (!running) return undefined;
    if (stage >= 5) {
      const finish = setTimeout(() => {
        setDone(true);
        setRunning(false);
        const result = assessmentType === "assignment"
          ? (isReEvaluation ? reEvaluateSubmission(submission.id, difficulty) : markAsEvaluated(submission.id, difficulty))
          : assessmentType === "in-sem"
            ? startInSemEvaluation(submission.id, difficulty)
            : startEndSemEvaluation(submission.id, difficulty);
        if (result?.evaluationStatus === "Evaluation Failed" || result?.evaluation?.error) {
          setStartError(result.evaluationError || "AI evaluation could not be completed. Please try again.");
          setDone(false);
          return;
        }
        navigate(assessmentType === "assignment" ? `/teacher/evaluations/${submission.evaluationId}` : `/teacher/${assessmentType}/evaluations/${submission.evaluationId}`);
      }, 760);
      return () => clearTimeout(finish);
    }
    const timer = setTimeout(() => setStage((value) => value + 1), 760);
    return () => clearTimeout(timer);
  }, [navigate, running, stage, submission?.evaluationId, submission, isReEvaluation, difficulty]);

  if (evaluationRecord?.isUnauthorized) {
    return <NotFoundState title="Access Denied" message="You do not have authorization to access or evaluate this assignment." id={submissionId} />;
  }

  if (!submission || !assessment) {
    return <NotFoundState title="Submission Not Found" message="We could not locate any student submission matching the submission ID:" id={submissionId} />;
  }

  const evaluation = submission.evaluation || null;
  const rawText = submission.extractedAnswerText || submission.answerText || submission.extractedText || evaluation?.answerText;
  const isValidText = hasValidAnswerText(rawText);
  const answerText = isValidText ? rawText : "";
  const semanticRelevance = (isValidText && evaluation?.semanticRelevance) ? evaluation.semanticRelevance : "88%";
  const confidence = (isValidText && evaluation?.confidence) ? evaluation.confidence : "92%";
  const potentialScore = (isValidText && evaluation?.score !== undefined && evaluation?.score !== "—") ? `${evaluation.score} / ${assessment.totalMarks}` : "—";
  const studentAnswerPdfUrl = getPersistedPdfUrl(submission.answerPdf || submission.file, assessment);
  const qpPdfName = assessment.questionPaperPdf?.name || `${assessment.title}_QuestionPaper.pdf`;
  const qpDescription = assessment.description || "Question paper instructions and problem statements.";
  const refAnswer = assessment.referenceAnswer || "Model solution for evaluation.";

  const start = () => {
    setStartError("");
    if (!isValidText) {
      setStartError("Unable to extract answer text from this PDF. Please verify that the PDF contains readable text before starting AI evaluation.");
      return;
    }
    if (!submission.studentId || !submission.id || (!submission.answerSheetId && !submission.file)) {
      setStartError("Select a student with an available answer sheet before starting evaluation.");
      return;
    }
    setDone(false); setStage(0); setRunning(true);
  };

  return <div className="workflow-page"><PageHeader eyebrow="AI-ASSISTED EVALUATION" title="AI Evaluation" subtitle={`${submission.student} · ${assessment.title} · ${submission.id.toUpperCase()}`} actions={<Link className="workflow-btn" to={`/teacher/submissions/${submission.id}`}><ArrowLeft size={15}/> Submission</Link>} />
  <section className="surface evaluation-top"><div><span>ASSESSMENT CONTEXT</span><h2>{assessment.title}</h2><p>{submission.student} · {submission.roll} · Total marks: {assessment.totalMarks}</p></div>{done ? <button className="workflow-btn primary" onClick={() => navigate(`/teacher/evaluations/${submission.evaluationId}`)}><CheckCircle2 size={16}/> Review Evaluation</button> : <button className="workflow-btn primary" onClick={start} disabled={running || !isValidText} title={!isValidText ? "Text extraction failed. Evaluation disabled." : ""}><Play size={15}/>{running ? "Evaluation in Progress" : isReEvaluation ? "Re-evaluate Submission" : "Start AI Evaluation"}</button>}</section>

  {/* Difficulty Selection Panel */}
  {!running && !done && (
    <section className="surface difficulty-panel">
      <div className="difficulty-panel-heading">
        <div className="difficulty-panel-icon"><Gauge size={19} /></div>
        <div>
          <h2>Select Evaluation Difficulty</h2>
          <p>Choose how strictly the AI should evaluate this submission. The selected difficulty affects scoring, confidence, and feedback.</p>
        </div>
      </div>
      <DifficultySelector value={difficulty} onChange={setDifficulty} />
    </section>
  )}

  {startError && <div className="evaluation-start-error" role="alert"><FileWarning size={15}/>{startError}</div>}

  <section className="evaluation-documents"><DocumentPreview title="Question Paper" eyebrow="SOURCE DOCUMENT" file={qpPdfName} text={qpDescription} /><DocumentPreview title="Reference Answer" eyebrow="REFERENCE DOCUMENT" file={assessment.referenceAnswerPdf?.name || "Reference answer provided"} text={refAnswer} /><section className="surface evaluation-document-card"><div className="panel-heading"><div><span>STUDENT ANSWER</span><h2>Answer Sheet</h2></div><FilePill name={submission.file || submission.fileName} pages={submission.pages}/></div><PaperPreview student={submission.student} roll={submission.roll} course={assessment.courseCode || assessment.subjectName || "ET305"} answerText={answerText} pages={submission.pages} pdfUrl={studentAnswerPdfUrl} fileName={submission.answerPdf?.name || submission.fileName || submission.file} fileSize={submission.answerPdf?.size ? `${Math.round(submission.answerPdf.size / 1024)} KB` : null} extractionStatus={submission.extractionStatusLabel || "Text extracted successfully"} /></section></section>

  <section className="surface stepper-card"><div className="evaluation-state"><Cpu size={19}/><div><strong>{done ? "Evaluation Complete" : stage >= 0 ? stageText[stage] : "Ready to evaluate this submission"}</strong><span>{done ? "AI recommendations are ready for teacher review." : "Real assignment context loaded into evaluation engine."}</span></div></div><div className="evaluation-stepper">{stages.map((name, index) => <div className={`eval-step ${index <= stage ? "complete" : ""} ${index === stage && running ? "current" : ""}`} key={name}><b>{index < stage || done ? <Check size={13}/> : index + 1}</b><span>{name}</span></div>)}</div></section>
  <div className="analysis-grid"><section className="surface analysis-main"><div className="panel-heading"><div><span>LIVE ANALYSIS</span><h2>Response and Reference Context</h2></div>{stage >= 1 && <StatusBadge status="Processing"/>}</div><div className="analysis-copy"><div><h3>Extracted Student Answer Text</h3>{isValidText ? <p>{answerText}</p> : <div className="paper-extraction-error" style={{ padding: "12px", borderRadius: "6px", background: "#fef2f2", color: "#991b1b", fontSize: "13px" }}>⚠ Unable to extract readable text from this PDF. AI evaluation cannot proceed without readable text.</div>}</div><div><h3>Reference Answer</h3><p>{refAnswer}</p></div></div></section><aside className="analysis-metrics">{[["Semantic Similarity", semanticRelevance], ["Rubric Match", isValidText ? "4 / 4" : "—"], ["AI Confidence", confidence], ["Potential Score", potentialScore]].map(([name, value]) => <div className="surface analysis-metric" key={name}><span>{name}</span><strong>{stage >= 2 || done ? value : "—"}</strong><small>{stage >= 2 || done ? "Evaluated value" : "Available during analysis"}</small></div>)}</aside></div><div className="teacher-control-banner"><WandSparkles size={18}/><span>AI assists the evaluation process. <strong>Teacher remains responsible for final marks and feedback.</strong></span></div></div>;
}

const getReviewQuestions = (evaluation, assessment) => {
  if (evaluation?.questionWiseResults?.length) return evaluation.questionWiseResults;
  const questions = assessment?.questions || [];
  if (questions.length) {
    return questions.map((question, index) => ({
      questionNumber: question.id,
      questionText: question.text,
      maximumMarks: question.marks,
      awardedMarks: Number(evaluation?.rubric?.[index]?.score || 0),
      feedback: evaluation?.rubric?.[index]?.reason || "Review this answer against the question requirements.",
    }));
  }
  return demoAssignment.questions.map((question, index) => ({
    questionNumber: question.id,
    questionText: question.text,
    maximumMarks: question.marks,
    awardedMarks: Number(evaluation?.rubric?.[index]?.score || 0),
    feedback: evaluation?.rubric?.[index]?.reason || "Review this answer against the question requirements.",
  }));
};

function EvaluationResultPageInner() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const submission = useMemo(() => {
    if (!evaluationId) return null;
    return getSubmissionByEvaluationId(evaluationId);
  }, [evaluationId]);
  const evaluationRecord = submission ? getEvaluationPageRecord(submission.id || evaluationId) : null;
  const assessment = evaluationRecord?.assessment;

  const [selectedDifficulty, setSelectedDifficulty] = useState(() => {
    return submission?.activeDifficulty || submission?.evaluation?.evaluationDifficulty || "moderate";
  });

  const evaluation = (submission?.evaluationResults && submission.evaluationResults[selectedDifficulty])
    ? submission.evaluationResults[selectedDifficulty]
    : (submission?.evaluation || null);

  const [marks, setMarks] = useState(evaluation?.score ?? 0);
  const [comment, setComment] = useState(submission?.teacherComment || "");
  const [approved, setApproved] = useState(submission?.status === "Approved" || submission?.evaluationStatus === "Approved");
  const [toast, setToast] = useState("");

  const [feedbackDraft, setFeedbackDraft] = useState(() => ({
    strengths: evaluation?.feedback?.strengths || "",
    improvements: evaluation?.feedback?.improvements || "",
    overall: evaluation?.feedback?.overall || evaluation?.overallFeedback || ""
  }));
  const [questionMarks, setQuestionMarks] = useState(() => getReviewQuestions(evaluation, assessment).map((q) => String(q.awardedMarks)));
  const [editingFeedback, setEditingFeedback] = useState(false);
  const [showReevaluate, setShowReevaluate] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [reevalDifficulty, setReevalDifficulty] = useState(selectedDifficulty);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (evaluation) {
      setMarks(evaluation.score ?? 0);
      setQuestionMarks(getReviewQuestions(evaluation, assessment).map((q) => String(q.awardedMarks)));
      setFeedbackDraft({
        strengths: evaluation?.feedback?.strengths || "",
        improvements: evaluation?.feedback?.improvements || "",
        overall: evaluation?.feedback?.overall || evaluation?.overallFeedback || ""
      });
      setReevalDifficulty(selectedDifficulty);
    }
  }, [selectedDifficulty, evaluation, assessment]);

  if (evaluationRecord?.isUnauthorized) {
    return <NotFoundState title="Access Denied" message="You do not have authorization to view this evaluation." id={evaluationId} />;
  }

  if (!submission || !evaluation || !assessment) {
    return (
      <NotFoundState title="Evaluation Not Found" message="We could not locate any student submission matching the evaluation ID:" id={evaluationId} />
    );
  }

  const switchDifficulty = (diffKey) => {
    setSelectedDifficulty(diffKey);
    setReevalDifficulty(diffKey);
    if (submission) {
      if (!submission.evaluationResults || typeof submission.evaluationResults !== "object") {
        submission.evaluationResults = {};
      }
      if (!submission.evaluationResults[diffKey]) {
        const realAsg = getAssignmentById(submission.assignmentId) || assessment;
        submission.evaluationResults[diffKey] = evaluateAssessmentSubmission(submission, realAsg, diffKey);
        persistWorkflowEvaluations();
      }
      submission.activeDifficulty = diffKey;
      submission.evaluation = submission.evaluationResults[diffKey];
      submission.evaluationDifficulty = diffKey;
      submission.score = `${submission.evaluation.score} / ${submission.evaluation.totalMarks}`;
      setMarks(submission.evaluation.score);
    }
  };

  const handleCalculateDifficulty = (diffKey) => {
    switchDifficulty(diffKey);
    setToast(`AI Evaluation completed for ${difficultyConfig[diffKey]?.label || diffKey} mode.`);
  };

  const handleReevaluate = () => {
    setIsEvaluating(true);
    setReviewError("");
    setTimeout(() => {
      const targetDiff = reevalDifficulty || selectedDifficulty;
      const result = reEvaluateSubmission(submission.id, targetDiff);
      setIsEvaluating(false);
      setShowReevaluate(false);
      if (!result || result.evaluationStatus === "Evaluation Failed" || result.evaluationError) {
        setReviewError(result?.evaluationError || "Re-evaluation could not be completed. Please try again.");
        return;
      }
      setSelectedDifficulty(targetDiff);
      if (result.evaluation) {
        setMarks(result.evaluation.score);
      }
      setToast(`AI Evaluation recalculated for ${difficultyConfig[targetDiff]?.label || targetDiff} mode.`);
    }, 500);
  };

  const getGrade = (score) => {
    const total = evaluation.totalMarks || assessment.totalMarks || 20;
    const pct = score / total;
    if (pct >= 0.9) return "Grade A+";
    if (pct >= 0.8) return "Grade A";
    if (pct >= 0.7) return "Grade B";
    if (pct >= 0.6) return "Grade C";
    return "Grade D";
  };

  const approve = () => {
    const teacherProfile = getCurrentTeacher() || { name: "Professor" };
    const result = approveEvaluation(submission.id, teacherProfile.name);
    if (result.error) {
      setReviewError(result.error);
      return;
    }
    setApproved(true);
    setShowApprove(false);
    setToast("Evaluation approved. Results remain pending publication.");
  };

  const evalData = evaluation;
  const difficultyLabel = difficultyConfig[evalData.evaluationDifficulty]?.label || "Moderate";
  const statusLabel = submission.isPublished || (assessment && isResultsPublished(assessment.id))
    ? "Published"
    : (approved || submission.status === "Approved" || submission.evaluationStatus === "Approved" || submission.evaluationStatus === "Teacher Approved")
      ? "Teacher Approved"
      : "AI Evaluated · Awaiting Teacher Approval";

  return (
    <div className="workflow-page">
      <Toast message={toast} onClose={() => setToast("")} />
      <PageHeader
        eyebrow="AI EVALUATION REVIEW"
        title="Evaluation Result"
        subtitle={`${submission.student} · ${assessment.title}`}
        actions={
          <Link className="workflow-btn" to="/teacher/submissions">
            <ArrowLeft size={15} /> Submissions
          </Link>
        }
      />
      <section className="result-hero surface">
        <div>
          <span className="result-status">
            {statusLabel}
          </span>
          <h2>
            {submission.student} <small>{submission.roll}</small>
          </h2>
          <p>AI-generated marks are recommendations. Final grading remains under teacher control.</p>
        </div>
        <div className="score-display">
          <div>
            <b>{marks}</b>
            <span>/ {evalData.totalMarks}</span>
          </div>
          <strong>{Math.round((marks / evalData.totalMarks) * 100)}%</strong>
          <small>
            {getGrade(marks)} · AI confidence {evalData.confidence}
          </small>
        </div>
      </section>

      <section className="surface evaluation-summary-card">
        <div>
          <span>EVALUATION SUMMARY</span>
          <h2>Question-wise evaluation complete</h2>
        </div>
        <div className="evaluation-summary-grid">
          <div>
            <small>Assessment</small>
            <strong>{assessment.title || demoAssignment.title}</strong>
          </div>
          <div>
            <small>Student / Roll Number</small>
            <strong>
              {submission.student} · {submission.roll}
            </strong>
          </div>
          <div>
            <small>Obtained Marks</small>
            <strong>
              {evalData.obtainedMarks ?? evalData.score} / {evalData.totalMarks}
            </strong>
          </div>
          <div>
            <small>Percentage / Grade</small>
            <strong>
              {evalData.percentage ?? Math.round((evalData.score / evalData.totalMarks) * 100)}% · {evalData.grade}
            </strong>
          </div>
          <div>
            <small>Questions Evaluated</small>
            <strong>
              {evalData.questionWiseResults?.length || evalData.rubric?.length || 0} / {(assessment.questions || demoAssignment.questions).length}
            </strong>
          </div>
          <div>
            <small>Status</small>
            <strong>{statusLabel}</strong>
          </div>
        </div>
      </section>

      {/* Difficulty Control Section */}
      <section className="surface evaluation-difficulty-control" style={{ padding: "18px", margin: "16px 0", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Gauge size={20} style={{ color: "#2563eb" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Evaluation Difficulty Control</h3>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Select a difficulty standard or re-evaluate the submission.</span>
        </div>

        <div className="difficulty-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {["easy", "moderate", "hard"].map((diffKey) => {
            const cfg = difficultyConfig[diffKey];
            const res = submission.evaluationResults?.[diffKey];
            const isSelected = selectedDifficulty === diffKey;
            return (
              <div
                key={diffKey}
                className={`difficulty-control-card ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  if (res) {
                    switchDifficulty(diffKey);
                  } else {
                    handleCalculateDifficulty(diffKey);
                  }
                }}
                style={{
                  border: isSelected ? "2px solid #2563eb" : "1px solid var(--border-color, #e2e8f0)",
                  background: isSelected ? "var(--bg-active-card, #f0f7ff)" : "var(--bg-surface, #ffffff)",
                  borderRadius: "10px",
                  padding: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "14px", color: isSelected ? "#1e40af" : "var(--text-primary)" }}>{cfg.label} Mode</strong>
                    {isSelected && <span style={{ fontSize: "11px", fontWeight: 700, background: "#2563eb", color: "#ffffff", padding: "2px 8px", borderRadius: "12px" }}>Active</span>}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: "1.3" }}>{cfg.description}</p>
                </div>

                <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid var(--border-color, #f1f5f9)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {res ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{res.score} / {res.totalMarks}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginLeft: "6px" }}>({res.grade})</span>
                      </div>
                      {isSelected && (
                        <button
                          type="button"
                          className="workflow-btn sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReevalDifficulty(diffKey);
                            setShowReevaluate(true);
                          }}
                          style={{ fontSize: "12px", padding: "4px 10px", gap: "4px" }}
                        >
                          <RotateCcw size={12} /> Re-evaluate
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="workflow-btn primary sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCalculateDifficulty(diffKey);
                      }}
                      style={{ fontSize: "12px", padding: "4px 12px", gap: "4px", width: "100%", justifyContent: "center" }}
                    >
                      <Play size={12} /> Calculate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="difficulty-result-row">
        <DifficultyBadge difficulty={evalData.evaluationDifficulty || "moderate"} />
        <span>
          Evaluation Difficulty: <strong>{difficultyLabel}</strong>
        </span>
        {evalData.semanticRelevance && (
          <span>
            Semantic Relevance: <strong>{evalData.semanticRelevance}</strong>
          </span>
        )}
        {evalData.confidence && (
          <span>
            AI Confidence: <strong>{evalData.confidence}</strong>
          </span>
        )}
      </div>

      {reviewError && <div className="review-error" role="alert" style={{ margin: "12px 0" }}><FileWarning size={15} />{reviewError}</div>}

      <section className="surface question-wise-results">
        <div className="panel-heading">
          <div>
            <span>QUESTION-WISE EVALUATION</span>
            <h2>Marks and academic feedback ({difficultyLabel} Mode)</h2>
          </div>
        </div>
        {getReviewQuestions(evalData, assessment).map((question) => (
          <article className="question-result" key={question.questionNumber}>
            <div className="question-result-heading">
              <div>
                <strong>Q{question.questionNumber}</strong>
                <p>{question.questionText}</p>
              </div>
              <b>
                {question.awardedMarks} / {question.maximumMarks}
              </b>
            </div>
            <div className="question-result-meta">
              <span>
                Correctness: <strong>{question.correctness || "Reviewed"}</strong>
              </span>
              <span>
                Understanding: <strong>{question.conceptualUnderstanding || "Reviewed"}</strong>
              </span>
              <span>
                Completeness: <strong>{question.completeness || "Reviewed"}</strong>
              </span>
            </div>
            <p className="question-result-feedback">{question.feedback}</p>
            <div className="question-result-concepts">
              <div>
                <small>Key Concepts Covered</small>
                <span>{question.keyConceptsCovered?.length ? question.keyConceptsCovered.join(" · ") : "None identified"}</span>
              </div>
              <div>
                <small>Missing / Incorrect Concepts</small>
                <span>{[...(question.missingConcepts || []), ...(question.incorrectStatements || [])].join(" · ") || "None identified"}</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="review-grid">
        <section className="surface answer-panel">
          <div className="panel-heading">
            <div>
              <span>STUDENT ANSWER</span>
              <h2>Submitted Paper & OCR</h2>
            </div>
            <FilePill name={submission.file} pages={submission.pages} />
          </div>
          <PaperPreview
            student={submission.student}
            roll={submission.roll}
            course={assessment.title || demoAssignment.course}
            answerText={evalData.answerText}
            pages={submission.pages}
          />
          <div className="ocr-inline">
            <strong>OCR Extracted Answer</strong>
            <p>{evalData.answerText}</p>
          </div>
        </section>

        <aside className="review-sidebar">
          <section className="surface comparison-card">
            <div className="panel-heading">
              <div>
                <span>AI EVALUATION</span>
                <h2>Reference Answer Comparison</h2>
              </div>
            </div>
            <p>{evalData.referenceAnswer}</p>
            <div className="similarity-row">
              <span>Semantic relevance</span>
              <b>{evalData.semanticRelevance}</b>
            </div>
          </section>

          <section className="surface rubric-breakdown">
            <div className="panel-heading">
              <div>
                <span>RUBRIC BREAKDOWN</span>
                <h2>Recommended Marks ({difficultyLabel})</h2>
              </div>
            </div>
            {evalData.rubric.map((item) => (
              <div className="rubric-result" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.reason}</p>
                  <small>{item.confidence} confidence</small>
                </div>
                <b>
                  {item.score} / {item.max}
                </b>
              </div>
            ))}
            <div className="rubric-total">
              <span>Total recommended</span>
              <strong>
                {marks} / {evalData.totalMarks}
              </strong>
            </div>
          </section>

          <section className="surface feedback-card">
            <h2>Answer Analysis</h2>
            {evalData.feedback?.difficultyNote && (
              <div className="difficulty-feedback-note">
                <strong>Evaluation Standard ({difficultyLabel})</strong>
                <p>{evalData.feedback.difficultyNote}</p>
              </div>
            )}
            <div>
              <strong>Strengths</strong>
              <p>{evalData.feedback?.strengths || "Core concepts demonstrated."}</p>
            </div>
            <div>
              <strong>Areas for Improvement</strong>
              <p>{evalData.feedback?.improvements || "Additional technical details suggested."}</p>
            </div>
            <div>
              <strong>Missing Concept</strong>
              <p>{evalData.feedback?.missing || "No major missing concepts."}</p>
            </div>
          </section>

          <section className="surface teacher-controls legacy-review-controls">
            <h2>Teacher Review Controls</h2>
            <label>
              Final marks
              <input
                type="number"
                min="0"
                max={evalData.totalMarks}
                value={marks}
                onChange={(event) => setMarks(Number(event.target.value))}
              />
            </label>
            <label>
              Teacher comment
              <textarea
                rows="3"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add optional feedback for the student…"
              />
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              <button
                type="button"
                className="workflow-btn"
                onClick={() => {
                  setReevalDifficulty(selectedDifficulty);
                  setShowReevaluate(true);
                }}
              >
                <RotateCcw size={14} /> Re-evaluate
              </button>
              <button type="button" className="workflow-btn primary" onClick={() => setShowApprove(true)} disabled={approved}>
                {approved ? <><Check size={15} /> Approved</> : "Approve Evaluation"}
              </button>
            </div>
          </section>
        </aside>
      </div>

      {/* Re-Evaluate Confirmation Modal */}
      {showReevaluate && (
        <div className="review-modal-backdrop" onMouseDown={() => !isEvaluating && setShowReevaluate(false)}>
          <section className="review-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="review-modal-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
              <RotateCcw size={22} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "8px 0 4px", color: "#0f172a" }}>Re-evaluate this submission?</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 14px", lineHeight: "1.4" }}>
              AI evaluation for the selected difficulty will be recalculated. The current result for this difficulty will be replaced, while other difficulty results remain unchanged.
            </p>

            <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "13px" }}>
              <div style={{ marginBottom: "4px" }}><strong style={{ color: "#334155" }}>Student:</strong> <span style={{ color: "#0f172a", fontWeight: 600 }}>{submission.student}</span> ({submission.roll})</div>
              <div><strong style={{ color: "#334155" }}>Assignment:</strong> <span style={{ color: "#0f172a", fontWeight: 600 }}>{assessment.title || demoAssignment.title}</span> ({assessment.totalMarks || 20} Marks)</div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>Selected Evaluation Difficulty Mode:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["easy", "moderate", "hard"].map((dKey) => {
                  const cfg = difficultyConfig[dKey];
                  const isChecked = reevalDifficulty === dKey;
                  return (
                    <label
                      key={dKey}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: isChecked ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        background: isChecked ? "#eff6ff" : "#ffffff",
                        cursor: isEvaluating ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <input
                        type="radio"
                        name="reeval-difficulty-radio"
                        value={dKey}
                        checked={isChecked}
                        onChange={() => setReevalDifficulty(dKey)}
                        disabled={isEvaluating}
                        style={{ marginTop: "3px" }}
                      />
                      <div>
                        <strong style={{ fontSize: "13px", color: isChecked ? "#1e40af" : "#0f172a", display: "block" }}>{cfg.label} Mode</strong>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{cfg.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {isEvaluating && (
              <div style={{ padding: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", color: "#1e40af", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Loader2 size={16} className="spin" style={{ flexShrink: 0 }} />
                <div>
                  <strong>AI Evaluation in progress…</strong>
                  <div style={{ fontSize: "11px", opacity: 0.8 }}>Evaluating {submission.student}'s submission under {difficultyConfig[reevalDifficulty]?.label} mode.</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="workflow-btn" onClick={() => setShowReevaluate(false)} disabled={isEvaluating}>
                Cancel
              </button>
              <button type="button" className="workflow-btn primary" onClick={handleReevaluate} disabled={isEvaluating}>
                {isEvaluating ? "Evaluating..." : "Re-evaluate"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApprove && (
        <div className="review-modal-backdrop" onMouseDown={() => setShowApprove(false)}>
          <section className="review-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="review-modal-icon">
              <CheckCircle2 size={22} />
            </div>
            <h2>Approve this evaluation?</h2>
            <p>After approval, the evaluation is finalized for result processing. Student visibility still depends on publication.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button type="button" className="workflow-btn" onClick={() => setShowApprove(false)}>
                Cancel
              </button>
              <button type="button" className="workflow-btn primary" onClick={approve}>
                Approve
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function EvaluationResultPage() {
  const { evaluationId } = useParams();
  return <EvaluationResultPageInner key={evaluationId} />;
}

export function AnalyticsPage() {
  const analytics = getClassAnalytics();
  const cards = [
    ["Class Average", analytics ? `${analytics.averagePercentage}%` : "—", "+3.2% vs previous assessment"],
    ["Highest Score", analytics ? `${analytics.highestPercentage}%` : "—", analytics?.highestStudent || "Top performing student"],
    ["Lowest Score", analytics ? `${analytics.lowestPercentage}%` : "—", analytics?.lowestStudent || "Additional support recommended"],
    ["Evaluation Completion", analytics ? `${analytics.completionPercentage}%` : "—", `${analytics?.evaluatedCount || 0} of ${analytics?.totalStudents || 0} submissions`]
  ];
  return <div className="workflow-page"><PageHeader eyebrow="ACADEMIC INSIGHTS" title="Performance Analytics" subtitle="Understand class performance and identify learning gaps." actions={<select className="compact-select"><option>{demoAssignment.shortTitle}</option></select>} /><div className="metric-grid">{cards.map(([a,b,c])=><div className="metric-card" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div><div className="chart-grid"><ChartCard title="Class Performance Trend"><ResponsiveContainer width="100%" height={250}><AreaChart data={analyticsTrend}><defs><linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity=".25"/><stop offset="95%" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid stroke="#eef2f7" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis domain={[50,100]} tick={{fontSize:11}}/><Tooltip/><Area dataKey="score" stroke="#2563eb" strokeWidth={2.5} fill="url(#scoreFill)"/></AreaChart></ResponsiveContainer></ChartCard><ChartCard title="Score Distribution"><ResponsiveContainer width="100%" height={250}><BarChart data={scoreDistribution}><CartesianGrid stroke="#eef2f7" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="students" fill="#2563eb" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Rubric Performance"><ResponsiveContainer width="100%" height={250}><BarChart layout="vertical" data={rubricAnalytics}><XAxis type="number" domain={[0,100]} tick={{fontSize:11}}/><YAxis type="category" dataKey="name" tick={{fontSize:11}} width={78}/><Tooltip/><Bar dataKey="score" fill="#3b82f6" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Submission Status"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={[{name:"Evaluated",value:analytics?.evaluatedCount || 0},{name:"Pending",value:analytics?.pendingCount || 0}]} dataKey="value" innerRadius={55} outerRadius={82}>{["#16a34a","#d97706"].map((color)=><Cell key={color} fill={color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="chart-legend">Evaluated {analytics?.evaluatedCount || 0} · Pending {analytics?.pendingCount || 0}</div></ChartCard></div><section className="insights-card"><div><Sparkles size={20}/><div><span>DEMO AI INSIGHTS</span><h2>Learning insights for {demoAssignment.course}</h2></div></div><ul><li>Students demonstrate strong conceptual understanding but weaker mathematical reasoning.</li><li>Sampling Theory has the highest class performance across the current assessment.</li><li>Four students may need additional support with Fourier Transform concepts.</li></ul></section></div>;
}
function ChartCard({title,children}) { return <section className="surface chart-card-new"><h2>{title}</h2>{children}</section>; }

export function StudentReportPage() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const submission = getSubmissionByEvaluationId(evaluationId);
  const report = getStudentReport(submission);

  if (!report) {
    return <NotFoundState title="Report Not Found" message="We could not locate a report for the evaluation ID:" id={evaluationId} />;
  }

  const difficultyLabel = difficultyConfig[report.evaluationDifficulty]?.label || "Moderate";

  return <div className="workflow-page"><Toast message={toast} onClose={() => setToast("")}/><PageHeader eyebrow="STUDENT PROGRESS REPORT" title="Student Report" subtitle={`${report.student} · ${report.assignment.title}`} actions={<Link className="workflow-btn" to={`/teacher/evaluations/${report.evaluationId}`}><ArrowLeft size={15}/> Back to Evaluation</Link>} />
  <section className="result-hero surface"><div><span className="result-status">{report.status}</span><h2>{report.student} <small>{report.roll}</small></h2><p>{report.assignment.course} · {report.assignment.division}</p></div><div className="score-display"><div><b>{report.score}</b><span>/ {report.totalMarks}</span></div><strong>{report.percentage}%</strong><small>{report.grade} · AI confidence {report.confidence}</small></div></section>
  <div className="difficulty-result-row"><DifficultyBadge difficulty={report.evaluationDifficulty} /><span>Evaluation Difficulty: <strong>{difficultyLabel}</strong></span><span>Semantic Relevance: <strong>{report.semanticRelevance}</strong></span><span>AI Confidence: <strong>{report.confidence}</strong></span></div>
  <div className="review-grid"><section className="surface answer-panel"><div className="panel-heading"><div><span>SUBMISSION DETAILS</span><h2>Answer Paper & OCR</h2></div><FilePill name={report.file} pages={report.pages}/></div><PaperPreview student={report.student} roll={report.roll} course={report.assignment.course} answerText={report.answerText} pages={report.pages}/><div className="ocr-inline"><strong>OCR Extracted Answer</strong><p>{report.answerText}</p></div></section><aside className="review-sidebar"><section className="surface comparison-card"><div className="panel-heading"><div><span>AI EVALUATION</span><h2>Reference Answer Comparison</h2></div></div><p>{report.referenceAnswer}</p><div className="similarity-row"><span>Semantic relevance</span><b>{report.semanticRelevance}</b></div></section><section className="surface rubric-breakdown"><div className="panel-heading"><div><span>RUBRIC BREAKDOWN</span><h2>Recommended Marks</h2></div></div>{report.rubric.map((item) => <div className="rubric-result" key={item.name}><div><strong>{item.name}</strong><p>{item.reason}</p><small>{item.confidence} confidence</small></div><b>{item.score} / {item.max}</b></div>)}<div className="rubric-total"><span>Total recommended</span><strong>{report.score} / {report.totalMarks}</strong></div></section><section className="surface feedback-card"><h2>Answer Analysis</h2>{report.feedback.difficultyNote && <div className="difficulty-feedback-note"><strong>Evaluation Standard ({difficultyLabel})</strong><p>{report.feedback.difficultyNote}</p></div>}<div><strong>Strengths</strong><p>{report.feedback.strengths}</p></div><div><strong>Areas for Improvement</strong><p>{report.feedback.improvements}</p></div><div><strong>Missing Concept</strong><p>{report.feedback.missing}</p></div></section><section className="surface teacher-controls"><h2>Report Actions</h2><div><button className="workflow-btn" onClick={() => setToast("PDF export prepared for this student report.")}><Download size={14}/> Export PDF</button><button className="workflow-btn primary" onClick={() => setToast("Excel export prepared for this student report.")}><Download size={14}/> Export Excel</button></div></section></aside></div></div>;
}

export function ReportsPage() {
  const [preview, setPreview] = useState(null);
  const [toast, setToast] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const navigate = useNavigate();
  const reports = [
    ["Class Performance Report", "Overview of marks, trends and learning insights.", "All TE ENTC – A", "Generated today"],
    ["Assignment Evaluation Report", "Detailed evaluation outcomes for Assignment 03.", demoAssignment.title, "Generated today"],
    ["Student Progress Report", "Individual performance record and teacher feedback.", selectedStudent || "Select a student", "Not generated"],
    ["Rubric Analysis Report", "Criterion-level outcomes and scoring consistency.", demoAssignment.course, "Generated 12 Aug"],
    ["Grade Sheet", "Verified assessment marks for department records.", "TE ENTC – A", "Generated today"]
  ];

  const handleStudentReport = () => {
    if (!selectedStudent) {
      setToast("Please select a student to generate their report.");
      return;
    }
    const submission = workflowSubmissions.find((item) => item.student === selectedStudent);
    if (submission?.evaluationId) {
      navigate(`/teacher/reports/${submission.evaluationId}`);
    } else {
      setToast("No evaluation found for the selected student.");
    }
  };

  return <div className="workflow-page"><Toast message={toast} onClose={() => setToast("")}/><PageHeader eyebrow="ASSESSMENT OUTPUTS" title="Academic Reports" subtitle="Generate and manage assessment reports."/><div className="report-grid">{reports.map(([title, description, scope, last]) => <article className="surface report-card" key={title}><div className="report-icon"><FileSpreadsheet size={20}/></div><span>REPORT TEMPLATE</span><h2>{title}</h2><p>{description}</p><dl><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Last generated</dt><dd>{last}</dd></div></dl><div className="report-actions">{title === "Student Progress Report" ? <><select className="compact-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}><option value="">Select student…</option>{workflowSubmissions.map((item) => <option key={item.id} value={item.student}>{item.student} · {item.roll}</option>)}</select><button className="workflow-btn primary" onClick={handleStudentReport}><Sparkles size={14}/> Generate</button></> : <><button className="workflow-btn" onClick={() => setPreview({ title, scope })}><Eye size={14}/> Preview</button><button className="workflow-btn primary" onClick={() => setToast(`${title} generated successfully for demo preview.`)}><Sparkles size={14}/> Generate</button></>}</div></article>)}</div>{preview && <div className="report-modal-backdrop" onMouseDown={() => setPreview(null)}><section className="report-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}><button className="modal-x" onClick={() => setPreview(null)}>×</button><div className="report-brand">EVALAI ACADEMIC ASSESSMENT PLATFORM</div><h2>{preview.title}</h2><p className="report-subtitle">State Engineering College · ENTC Engineering</p><div className="report-rule"/><div className="report-preview-grid"><div><span>Assignment</span><strong>{demoAssignment.title}</strong></div><div><span>Teacher</span><strong>Professor123</strong></div><div><span>Department</span><strong>ENTC Engineering</strong></div><div><span>Class average</span><strong>{getClassAnalytics()?.averagePercentage || "—"}%</strong></div></div><h3>Evaluation Summary</h3><p>{getClassAnalytics()?.evaluatedCount || 0} submissions received; {getClassAnalytics()?.evaluatedCount || 0} evaluations completed. The class shows strong conceptual understanding, with mathematical reasoning identified as the primary improvement area.</p><h3>Grade Snapshot</h3><div className="grade-snapshot"><span>A: {workflowSubmissions.filter((s) => s.evaluation?.grade === "Grade A" || s.evaluation?.grade === "Grade A+").length} students</span><span>B: {workflowSubmissions.filter((s) => s.evaluation?.grade === "Grade B").length} students</span><span>C: {workflowSubmissions.filter((s) => s.evaluation?.grade === "Grade C").length} students</span></div><div className="report-export"><button className="workflow-btn" onClick={() => setToast("PDF export prepared for this frontend demo.")}><Download size={14}/> Export PDF</button><button className="workflow-btn primary" onClick={() => setToast("Excel export prepared for this frontend demo.")}><Download size={14}/> Export Excel</button></div></section></div>}</div>;
}
