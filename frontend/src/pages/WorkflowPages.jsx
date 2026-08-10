import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Cpu, Download, Eye, FileSpreadsheet, Play, Search, Sparkles, WandSparkles } from "lucide-react";
import { analyticsTrend, demoAssignment, getClassAnalytics, getStudentReport, getSubmissionByEvaluationId, getSubmissionById, markAsEvaluated, reEvaluateSubmission, rubricAnalytics, scoreDistribution, workflowSubmissions } from "../data/workflowData";
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

export function SubmissionsPage() {
  const navigate = useNavigate(); const [tab, setTab] = useState("All"); const [query, setQuery] = useState(""); const [sort, setSort] = useState("Latest"); const [status, setStatus] = useState("All statuses");
  const filtered = useMemo(() => workflowSubmissions.filter((item) => (tab === "All" || item.status === tab) && (status === "All statuses" || item.status === status) && `${item.student} ${item.roll}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "Student" ? a.student.localeCompare(b.student) : a.id.localeCompare(b.id)), [tab, query, sort, status]);
  const cards = [["Total Students", "51", "All enrolled students"], ["Submitted", "43", "84% submission rate"], ["Evaluated", "36", "AI and teacher reviewed"], ["Pending", "8", "Awaiting submission or review"]];

  const getAction = (item) => {
    if (item.status === "Evaluated") {
      return <div className="action-group"><button className="text-action" onClick={() => navigate(`/teacher/evaluations/${item.evaluationId}`)}>View Result<ChevronRight size={14}/></button><button className="text-action re-evaluate-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>Re-evaluate<ChevronRight size={14}/></button></div>;
    }
    if (item.status === "Processing") {
      return <button className="text-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>View Evaluation<ChevronRight size={14}/></button>;
    }
    return <button className="text-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>Start AI Evaluation<ChevronRight size={14}/></button>;
  };

  return <div className="workflow-page"><PageHeader eyebrow="ASSESSMENT WORKSPACE" title="Student Submissions" subtitle="Review student responses and manage AI-assisted evaluation." actions={<><select className="compact-select" aria-label="Select assignment"><option>{demoAssignment.shortTitle}</option><option>Signals & Systems — Assignment 02</option></select><Link className="workflow-btn" to="/teacher/create-assignment">Create Assignment</Link></>} />
    <div className="metric-grid">{cards.map(([name, value, note]) => <div className="metric-card" key={name}><span>{name}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <section className="surface submissions-surface"><div className="table-toolbar"><div className="status-tabs">{["All", "Submitted", "Processing", "Evaluated", "Pending"].map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div><div className="toolbar-controls"><label className="search-field"><Search size={16}/><input aria-label="Search students" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students or roll no." /></label><select className="compact-select" aria-label="Assignment filter"><option>All assignments</option><option>DSP Assignment 03</option></select><select className="compact-select" aria-label="Status filter" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{["Submitted", "Processing", "Evaluated", "Pending"].map((item) => <option key={item}>{item}</option>)}</select><select className="compact-select" aria-label="Sort submissions" value={sort} onChange={(event) => setSort(event.target.value)}><option value="Latest">Latest submitted</option><option value="Student">Student name</option></select></div></div>
      <div className="workflow-table-wrap"><table className="workflow-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Assignment</th><th>Submitted At</th><th>File</th><th>Status</th><th>Score</th><th>Action</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><strong>{item.student}</strong></td><td className="muted">{item.roll}</td><td>{demoAssignment.shortTitle}</td><td className="muted">{item.submittedAt}</td><td><FilePill name={item.file} pages={item.pages}/></td><td><StatusBadge status={item.status}/></td><td className="score-cell">{item.score}</td><td>{getAction(item)}</td></tr>)}</tbody></table></div></section></div>;
}

export function SubmissionDetailPage() {
  const { submissionId } = useParams();
  const submission = getSubmissionById(submissionId);
  const navigate = useNavigate();

  if (!submission) {
    return <NotFoundState title="Submission Not Found" message="We could not locate any student submission matching the submission ID:" id={submissionId} />;
  }

  const evaluation = submission.evaluation || null;
  const answerText = evaluation?.answerText || "No extracted answer text available for this submission.";

  return <div className="workflow-page"><PageHeader eyebrow="STUDENT RESPONSE" title="Submission Details" subtitle={`${submission.student} · ${demoAssignment.title}`} actions={<Link className="workflow-btn" to="/teacher/submissions"><ArrowLeft size={15}/> Back to Submissions</Link>} />
  <div className="detail-meta surface"><div><span>Student</span><strong>{submission.student}</strong><small>{submission.roll}</small></div><div><span>Submission time</span><strong>{submission.submittedAt}</strong><small>Received through Student Portal</small></div><div><span>Document</span><FilePill name={submission.file} pages={submission.pages}/><small>PDF answer script</small></div><div><span>Current status</span><StatusBadge status={submission.status}/><small>Assessment total: 20 marks</small></div></div>
  <div className="detail-grid"><section className="surface answer-panel"><div className="panel-heading"><div><span>SUBMITTED ANSWER</span><h2>Answer Paper Preview</h2></div><FilePill name={submission.file}/></div><PaperPreview student={submission.student} roll={submission.roll} course={demoAssignment.course} answerText={answerText} pages={submission.pages}/></section><aside className="detail-sidebar"><section className="surface ocr-card"><div className="panel-heading"><div><span>OCR PREVIEW</span><h2>Extracted Answer Text</h2></div><StatusBadge status="Processing"/></div><p>{answerText}</p><div className="ocr-confidence"><span>Mock OCR confidence</span><strong>96%</strong></div></section><section className="evaluate-card"><Cpu size={21}/><h2>Ready for AI-assisted review</h2><p>EvalAI will use the configured rubric and reference answer to recommend marks. Final grading remains with Professor123.</p><button className="workflow-btn primary" onClick={() => navigate(`/teacher/evaluate/${submission.id}`)}><Sparkles size={15}/> Evaluate with AI</button></section></aside></div></div>;
}

const stages = ["Document Processing", "OCR Text Extraction", "Semantic Answer Analysis", "Rubric Mapping", "Score Generation", "Feedback Generation"];
const stageText = ["Processing document…", "Extracting answer text…", "Analyzing semantic relevance…", "Mapping response to rubric…", "Calculating marks…", "Generating personalized feedback…"];
export function SelectSubmissionPage() {
  const navigate = useNavigate();
  const eligible = workflowSubmissions.filter((item) => item.status === "Submitted" || item.status === "Pending");

  return <div className="workflow-page"><PageHeader eyebrow="AI-ASSISTED EVALUATION" title="Select Submission for AI Evaluation" subtitle="Choose a submitted or pending paper to run the AI evaluation workflow." actions={<Link className="workflow-btn" to="/teacher/submissions"><ArrowLeft size={15}/> Back to Submissions</Link>} />
  {eligible.length === 0 ? <section className="surface" style={{ padding: "40px", textAlign: "center", borderRadius: "10px" }}><h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "10px" }}>No submissions available</h2><p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>All submissions have already been evaluated.</p><Link className="workflow-btn primary" to="/teacher/submissions">Return to Submissions List</Link></section> : <section className="surface submissions-surface"><div className="table-toolbar"><div className="status-tabs"><span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", letterSpacing: "0.45px", textTransform: "uppercase" }}>Eligible for AI Evaluation</span></div></div><div className="workflow-table-wrap"><table className="workflow-table"><thead><tr><th>Student</th><th>Roll Number</th><th>Assignment</th><th>Submitted At</th><th>File</th><th>Status</th><th>Action</th></tr></thead><tbody>{eligible.map((item) => <tr key={item.id}><td><strong>{item.student}</strong></td><td className="muted">{item.roll}</td><td>{demoAssignment.shortTitle}</td><td className="muted">{item.submittedAt}</td><td><FilePill name={item.file} pages={item.pages}/></td><td><StatusBadge status={item.status}/></td><td><button className="text-action" onClick={() => navigate(`/teacher/evaluate/${item.id}`)}>Start AI Evaluation<ChevronRight size={14}/></button></td></tr>)}</tbody></table></div></section>}</div>;
}

export function EvaluationPage() {
  const { submissionId } = useParams();
  const submission = getSubmissionById(submissionId);
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1);
  const [done, setDone] = useState(false);

  const isReEvaluation = submission?.status === "Evaluated";

  useEffect(() => {
    if (!submission) return undefined;
    if (!running) return undefined;
    if (stage >= 5) {
      const finish = setTimeout(() => {
        setDone(true);
        setRunning(false);
        if (isReEvaluation) {
          reEvaluateSubmission(submission.id);
        } else {
          markAsEvaluated(submission.id);
        }
        navigate(`/teacher/evaluations/${submission.evaluationId}`);
      }, 760);
      return () => clearTimeout(finish);
    }
    const timer = setTimeout(() => setStage((value) => value + 1), 760);
    return () => clearTimeout(timer);
  }, [navigate, running, stage, submission?.evaluationId, submission, isReEvaluation]);

  if (!submission) {
    return <NotFoundState title="Submission Not Found" message="We could not locate any student submission matching the submission ID:" id={submissionId} />;
  }

  const evaluation = submission.evaluation || null;
  const answerText = evaluation?.answerText || "No extracted answer text available for this submission.";
  const semanticRelevance = evaluation?.semanticRelevance || "—";
  const confidence = evaluation?.confidence || "—";
  const potentialScore = evaluation ? `${evaluation.score} / ${evaluation.totalMarks}` : "—";

  const start = () => { setDone(false); setStage(0); setRunning(true); };
  return <div className="workflow-page"><PageHeader eyebrow="AI-ASSISTED EVALUATION" title="AI Evaluation" subtitle={`${submission.student} · ${demoAssignment.title} · ${submission.id.toUpperCase()}`} actions={<Link className="workflow-btn" to={`/teacher/submissions/${submission.id}`}><ArrowLeft size={15}/> Submission</Link>} />
  <section className="surface evaluation-top"><div><span>ASSESSMENT CONTEXT</span><h2>{demoAssignment.title}</h2><p>{submission.student} · {submission.roll} · Total marks: {demoAssignment.totalMarks}</p></div>{done ? <button className="workflow-btn primary" onClick={() => navigate(`/teacher/evaluations/${submission.evaluationId}`)}><CheckCircle2 size={16}/> Review Evaluation</button> : <button className="workflow-btn primary" onClick={start} disabled={running}><Play size={15}/>{running ? "Evaluation in Progress" : isReEvaluation ? "Re-evaluate Submission" : "Start AI Evaluation"}</button>}</section>
  <section className="surface stepper-card"><div className="evaluation-state"><Cpu size={19}/><div><strong>{done ? "Evaluation Complete" : stage >= 0 ? stageText[stage] : "Ready to evaluate this submission"}</strong><span>{done ? "AI recommendations are ready for teacher review." : "This is a local demo simulation. No external AI is used."}</span></div></div><div className="evaluation-stepper">{stages.map((name, index) => <div className={`eval-step ${index <= stage ? "complete" : ""} ${index === stage && running ? "current" : ""}`} key={name}><b>{index < stage || done ? <Check size={13}/> : index + 1}</b><span>{name}</span></div>)}</div></section>
  <div className="analysis-grid"><section className="surface analysis-main"><div className="panel-heading"><div><span>LIVE ANALYSIS</span><h2>Response and Reference Context</h2></div>{stage >= 1 && <StatusBadge status="Processing"/>}</div><div className="analysis-copy"><div><h3>OCR Extracted Text</h3><p>{answerText}</p></div><div><h3>Reference Answer</h3><p>{demoAssignment.referenceAnswer}</p></div></div></section><aside className="analysis-metrics">{[["Semantic Similarity", semanticRelevance], ["Rubric Match", "4 / 4"], ["AI Confidence", confidence], ["Potential Score", potentialScore]].map(([name, value]) => <div className="surface analysis-metric" key={name}><span>{name}</span><strong>{stage >= 2 || done ? value : "—"}</strong><small>{stage >= 2 || done ? "Demo analysis value" : "Available during analysis"}</small></div>)}</aside></div><div className="teacher-control-banner"><WandSparkles size={18}/><span>AI assists the evaluation process. <strong>Professor123 remains responsible for final marks and feedback.</strong></span></div></div>;
}

function EvaluationResultPageInner() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const submission = useMemo(() => {
    if (!evaluationId) return null;
    return getSubmissionByEvaluationId(evaluationId);
  }, [evaluationId]);

  const evaluation = submission?.evaluation || null;
  const initialMarks = evaluation ? evaluation.score : 0;
  const initialApproved = submission ? submission.status === "Approved" : false;

  const [marks, setMarks] = useState(initialMarks);
  const [comment, setComment] = useState("");
  const [approved, setApproved] = useState(initialApproved);
  const [toast, setToast] = useState("");

  if (!submission || !evaluation) {
    return (
      <NotFoundState title="Evaluation Not Found" message="We could not locate any student submission matching the evaluation ID:" id={evaluationId} />
    );
  }

  const getGrade = (score) => {
    if (score >= 18) return "Grade A+";
    if (score >= 16) return "Grade A";
    if (score >= 14) return "Grade B";
    if (score >= 12) return "Grade C";
    return "Grade D";
  };

  const approve = () => {
    setApproved(true);
    setToast("Evaluation approved. Final marks are now ready for reporting.");
  };

  const evalData = evaluation;

  return <div className="workflow-page"><Toast message={toast} onClose={() => setToast("")}/><PageHeader eyebrow="AI EVALUATION REVIEW" title="Evaluation Result" subtitle={`${submission.student} · ${demoAssignment.title}`} actions={<Link className="workflow-btn" to="/teacher/submissions"><ArrowLeft size={15}/> Submissions</Link>} />
  <section className="result-hero surface"><div><span className="result-status">{approved ? "Approved" : "AI Evaluated · Awaiting Teacher Approval"}</span><h2>{submission.student} <small>{submission.roll}</small></h2><p>AI-generated marks are recommendations. Final grading remains under teacher control.</p></div><div className="score-display"><div><b>{marks}</b><span>/ {evalData.totalMarks}</span></div><strong>{Math.round((marks / evalData.totalMarks) * 100)}%</strong><small>{getGrade(marks)} · AI confidence {evalData.confidence}</small></div></section>
  <div className="review-grid"><section className="surface answer-panel"><div className="panel-heading"><div><span>STUDENT ANSWER</span><h2>Submitted Paper & OCR</h2></div><FilePill name={submission.file} pages={submission.pages}/></div><PaperPreview student={submission.student} roll={submission.roll} course={demoAssignment.course} answerText={evalData.answerText} pages={submission.pages}/><div className="ocr-inline"><strong>OCR Extracted Answer</strong><p>{evalData.answerText}</p></div></section><aside className="review-sidebar"><section className="surface comparison-card"><div className="panel-heading"><div><span>AI EVALUATION</span><h2>Reference Answer Comparison</h2></div></div><p>{evalData.referenceAnswer}</p><div className="similarity-row"><span>Semantic relevance</span><b>{evalData.semanticRelevance}</b></div></section><section className="surface rubric-breakdown"><div className="panel-heading"><div><span>RUBRIC BREAKDOWN</span><h2>Recommended Marks</h2></div></div>{evalData.rubric.map((item) => <div className="rubric-result" key={item.name}><div><strong>{item.name}</strong><p>{item.reason}</p><small>{item.confidence} confidence</small></div><b>{item.score} / {item.max}</b></div>)}<div className="rubric-total"><span>Total recommended</span><strong>{marks} / {evalData.totalMarks}</strong></div></section><section className="surface feedback-card"><h2>Answer Analysis</h2><div><strong>Strengths</strong><p>{evalData.feedback.strengths}</p></div><div><strong>Areas for Improvement</strong><p>{evalData.feedback.improvements}</p></div><div><strong>Missing Concept</strong><p>{evalData.feedback.missing}</p></div></section><section className="surface teacher-controls"><h2>Teacher Review Controls</h2><label>Final marks<input type="number" min="0" max={evalData.totalMarks} value={marks} onChange={(event) => setMarks(Number(event.target.value))}/></label><label>Teacher comment<textarea rows="3" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add optional feedback for the student…" /></label><div><button className="workflow-btn" onClick={() => setToast("Re-evaluation request recorded for this demo.")}>Request Re-evaluation</button><button className="workflow-btn primary" onClick={approve} disabled={approved}>{approved ? <><Check size={15}/> Approved</> : "Approve Evaluation"}</button></div></section></aside></div>{approved && <section className="post-approval surface"><CheckCircle2 size={20}/><span>Evaluation approved by Professor123.</span><button className="text-action" onClick={() => navigate("/teacher/analytics")}>View Analytics <ChevronRight size={14}/></button><button className="text-action" onClick={() => navigate(`/teacher/reports/${submission.evaluationId}`)}>Generate Report <ChevronRight size={14}/></button></section>}</div>;
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

  return <div className="workflow-page"><Toast message={toast} onClose={() => setToast("")}/><PageHeader eyebrow="STUDENT PROGRESS REPORT" title="Student Report" subtitle={`${report.student} · ${report.assignment.title}`} actions={<Link className="workflow-btn" to={`/teacher/evaluations/${report.evaluationId}`}><ArrowLeft size={15}/> Back to Evaluation</Link>} />
  <section className="result-hero surface"><div><span className="result-status">{report.status}</span><h2>{report.student} <small>{report.roll}</small></h2><p>{report.assignment.course} · {report.assignment.division}</p></div><div className="score-display"><div><b>{report.score}</b><span>/ {report.totalMarks}</span></div><strong>{report.percentage}%</strong><small>{report.grade} · AI confidence {report.confidence}</small></div></section>
  <div className="review-grid"><section className="surface answer-panel"><div className="panel-heading"><div><span>SUBMISSION DETAILS</span><h2>Answer Paper & OCR</h2></div><FilePill name={report.file} pages={report.pages}/></div><PaperPreview student={report.student} roll={report.roll} course={report.assignment.course} answerText={report.answerText} pages={report.pages}/><div className="ocr-inline"><strong>OCR Extracted Answer</strong><p>{report.answerText}</p></div></section><aside className="review-sidebar"><section className="surface comparison-card"><div className="panel-heading"><div><span>AI EVALUATION</span><h2>Reference Answer Comparison</h2></div></div><p>{report.referenceAnswer}</p><div className="similarity-row"><span>Semantic relevance</span><b>{report.semanticRelevance}</b></div></section><section className="surface rubric-breakdown"><div className="panel-heading"><div><span>RUBRIC BREAKDOWN</span><h2>Recommended Marks</h2></div></div>{report.rubric.map((item) => <div className="rubric-result" key={item.name}><div><strong>{item.name}</strong><p>{item.reason}</p><small>{item.confidence} confidence</small></div><b>{item.score} / {item.max}</b></div>)}<div className="rubric-total"><span>Total recommended</span><strong>{report.score} / {report.totalMarks}</strong></div></section><section className="surface feedback-card"><h2>Answer Analysis</h2><div><strong>Strengths</strong><p>{report.feedback.strengths}</p></div><div><strong>Areas for Improvement</strong><p>{report.feedback.improvements}</p></div><div><strong>Missing Concept</strong><p>{report.feedback.missing}</p></div></section><section className="surface teacher-controls"><h2>Report Actions</h2><div><button className="workflow-btn" onClick={() => setToast("PDF export prepared for this student report.")}><Download size={14}/> Export PDF</button><button className="workflow-btn primary" onClick={() => setToast("Excel export prepared for this student report.")}><Download size={14}/> Export Excel</button></div></section></aside></div></div>;
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
