import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Download, Eye, FileSpreadsheet, Sparkles, X } from "lucide-react";
import { getClassAnalytics, getStudentReport, workflowSubmissions } from "../data/workflowData";
import "./TeacherReportsPage.css";

function TeacherReportsPage() {
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const navigate = useNavigate();
  const analytics = getClassAnalytics();
  const notify = (name) => { setNotice(`${name} is ready for download.`); setTimeout(() => setNotice(""), 3200); };

  const reports = [
    ["Class Performance Report", "Overview of marks, trends and learning insights.", "TE ENTC - A"],
    ["Assignment Evaluation Report", "Detailed outcomes, scores and teacher approval status.", "DSP Assignment 03"],
    ["Student Progress Report", "Individual performance history and feedback summary.", selectedStudent || "Select a student"],
    ["Rubric Analysis", "Criterion-level performance and scoring consistency.", "Digital Signal Processing"],
    ["Grade Sheet", "Verified assessment marks for department records.", "TE ENTC - A"],
  ];

  const handleStudentReport = () => {
    if (!selectedStudent) {
      setNotice("Please select a student to generate their report.");
      setTimeout(() => setNotice(""), 3200);
      return;
    }
    const submission = workflowSubmissions.find((item) => item.student === selectedStudent);
    if (submission?.evaluationId) {
      navigate(`/teacher/reports/${submission.evaluationId}`);
    } else {
      setNotice("No evaluation found for the selected student.");
      setTimeout(() => setNotice(""), 3200);
    }
  };

  return <div className="reports-center">{notice && <div className="reports-toast"><CheckCircle2 size={17}/>{notice}</div>}<header className="reports-heading"><div><p>ASSESSMENT OUTPUTS</p><h1>Reports Center</h1><span>Generate polished academic reports from verified assessment data.</span></div><div className="reports-badge"><FileSpreadsheet size={17}/>5 report templates</div></header><section className="reports-grid">{reports.map(([title, description, scope]) => <article className="report-template" key={title}><div className="report-icon"><FileSpreadsheet size={21}/></div><p>ACADEMIC REPORT</p><h2>{title}</h2><span>{description}</span><dl><div><dt>Scope</dt><dd>{scope}</dd></div><div><dt>Data status</dt><dd>Updated today</dd></div></dl><div className="report-card-actions">{title === "Student Progress Report" ? <><select className="student-report-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}><option value="">Select student…</option>{workflowSubmissions.map((item) => <option key={item.id} value={item.student}>{item.student} · {item.roll}</option>)}</select><button className="generate" onClick={handleStudentReport}><Sparkles size={15}/>Generate</button></> : <><button onClick={() => setPreview({ title, scope })}><Eye size={15}/>Preview</button><button className="generate" onClick={() => notify(title)}><Sparkles size={15}/>Generate</button></>}<button className="export" onClick={() => notify(title)} aria-label={`Export ${title}`}><Download size={15}/></button></div></article>)}</section>{preview && <div className="report-overlay" onMouseDown={() => setPreview(null)}><section className="report-preview-modal" role="dialog" aria-modal="true" aria-label="Report preview" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPreview(null)}><X size={18}/></button><p className="report-brand">EVALAI · ACADEMIC ASSESSMENT PLATFORM</p><h2>{preview.title}</h2><span>State Engineering College · ENTC Engineering</span><div className="modal-rule"/><div className="modal-details"><div><small>Scope</small><strong>{preview.scope}</strong></div><div><small>Generated for</small><strong>Professor123</strong></div><div><small>Class average</small><strong>{analytics?.averagePercentage || "—"}%</strong></div><div><small>Evaluation status</small><strong>{analytics?.completionPercentage || "—"}% complete</strong></div></div><h3>Assessment Summary</h3><p>{analytics?.evaluatedCount || 0} submissions received; {analytics?.evaluatedCount || 0} evaluations completed. The class shows strong conceptual understanding, with mathematical reasoning identified as the primary improvement area.</p><h3>Grade Snapshot</h3><div className="grade-row"><span>A · {workflowSubmissions.filter((s) => s.evaluation?.grade === "Grade A" || s.evaluation?.grade === "Grade A+").length} students</span><span>B · {workflowSubmissions.filter((s) => s.evaluation?.grade === "Grade B").length} students</span><span>C · {workflowSubmissions.filter((s) => s.evaluation?.grade === "Grade C").length} students</span></div><button className="modal-export" onClick={() => notify(preview.title)}><Download size={15}/>Export report</button></section></div>}</div>;
}
export default TeacherReportsPage;