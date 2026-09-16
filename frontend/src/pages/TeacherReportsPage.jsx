import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, Download, Eye, FileSpreadsheet, FileText, Sparkles, Users, X } from "lucide-react";
import { getCurrentTeacher } from "../auth/teacherAuth";
import { students } from "../auth/studentAuth";
import {
  getTeacherAssignments,
  getAssignmentById,
  getClassAnalytics,
  getRubricAnalytics,
  getStudentReport,
  getStudentSubmission,
  workflowSubmissions,
} from "../data/workflowData";
import {
  buildGradeSheet,
  buildGradeSheetCsv,
  getGradeSheetExcelFilename,
  getGradeSheetPdfFilename,
} from "../data/gradeSheetData";
import { inSemExam } from "../data/inSemData";
import { endSemExam } from "../data/endSemData";
import "./TeacherReportsPage.css";

const normStr = (str) => String(str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const isStudentTargeted = (student, assessment) => {
  if (!student || !assessment) return false;
  const studBranch = normStr(student.branch || "ENTC");
  const studDiv = normStr(student.division || "TE ENTC – A");
  const asgBranch = normStr(assessment.branch || "ENTC");
  const asgDiv = normStr(assessment.division || "TE ENTC – A");
  return studBranch === asgBranch && studDiv === asgDiv;
};

function TeacherReportsPage() {
  const currentTeacher = getCurrentTeacher();
  const teacherId = currentTeacher?.teacherId || currentTeacher?.id;
  const navigate = useNavigate();

  const teacherAssignments = useMemo(() => {
    if (!teacherId) return [];
    return getTeacherAssignments(teacherId);
  }, [teacherId]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedInSemId, setSelectedInSemId] = useState(inSemExam?.id || "");
  const [selectedEndSemId, setSelectedEndSemId] = useState(endSemExam?.id || "");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [preview, setPreview] = useState(null);
  const [gradeSheetType, setGradeSheetType] = useState(null);
  const [notice, setNotice] = useState("");

  // Sync selectedAssignmentId when teacherAssignments update
  useEffect(() => {
    if (teacherAssignments.length > 0) {
      if (!selectedAssignmentId || !teacherAssignments.some((a) => a.id === selectedAssignmentId)) {
        setSelectedAssignmentId(teacherAssignments[0].id);
      }
    } else {
      setSelectedAssignmentId("");
    }
  }, [teacherAssignments, selectedAssignmentId]);

  const selectedAssignment = useMemo(() => {
    if (!selectedAssignmentId) return null;
    const asg = teacherAssignments.find((a) => a.id === selectedAssignmentId) || getAssignmentById(selectedAssignmentId);
    // Security check: Teacher ownership
    if (asg && teacherId && asg.createdByTeacherId && asg.createdByTeacherId !== teacherId) {
      return null;
    }
    return asg;
  }, [selectedAssignmentId, teacherAssignments, teacherId]);

  const classAnalytics = useMemo(
    () => (selectedAssignment ? getClassAnalytics(selectedAssignment.id) : null),
    [selectedAssignment]
  );

  const rubricAnalyticsData = useMemo(
    () => (selectedAssignment ? getRubricAnalytics(selectedAssignment.id) : []),
    [selectedAssignment]
  );

  const targetedStudents = useMemo(() => {
    if (!selectedAssignment) return [];
    return students.filter((s) => isStudentTargeted(s, selectedAssignment));
  }, [selectedAssignment]);

  const notify = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3200);
  };

  if (!currentTeacher || !teacherId) {
    return <Navigate to="/teacher/login" replace />;
  }

  const handleStudentReport = () => {
    if (!selectedStudent) {
      notify("Please select a student to generate their report.");
      return;
    }
    const studentObj = students.find(
      (s) => s.name === selectedStudent || s.id === selectedStudent || s.roll === selectedStudent
    );

    let submission = workflowSubmissions.find(
      (item) =>
        (item.student === selectedStudent || item.studentName === selectedStudent || item.studentId === selectedStudent || (studentObj && item.studentId === studentObj.id)) &&
        (!selectedAssignment || item.assignmentId === selectedAssignment.id || item.assessmentId === selectedAssignment.id)
    );

    if (!submission && studentObj && selectedAssignment) {
      const getSub = getStudentSubmission(studentObj, selectedAssignment.id);
      if (getSub && getSub.evaluation) {
        submission = getSub;
      }
    }

    if (submission) {
      const evalId = submission.evaluationId || submission.id || `eval-${selectedAssignment?.id || 'asg'}-${studentObj?.id || submission.studentId || 'stu'}`;
      if (!submission.evaluationId) {
        submission.evaluationId = evalId;
      }
      navigate(`/teacher/reports/${evalId}`);
    } else {
      notify("No evaluation found for the selected student on this assessment.");
    }
  };

  const handleGradeSheetPreview = (type) => {
    let targetId = null;
    if (type === "assignment") targetId = selectedAssignmentId;
    else if (type === "in-sem") targetId = selectedInSemId;
    else if (type === "end-sem") targetId = selectedEndSemId;

    const gradeSheet = buildGradeSheet(type, targetId);
    if (!gradeSheet || !gradeSheet.exam) {
      if (type === "assignment") notify("No assignments available to generate grade sheet.");
      else if (type === "in-sem") notify("No In-Sem examination data available.");
      else notify("No End-Sem examination data available.");
      return;
    }

    setGradeSheetType(type);
    setPreview({
      type,
      title: gradeSheet.exam.title,
      scope: gradeSheet.exam.division || "TE ENTC – A",
      gradeSheet,
    });
  };

  const handleExportExcel = (type) => {
    let targetId = null;
    if (type === "assignment") targetId = selectedAssignmentId;
    else if (type === "in-sem") targetId = selectedInSemId;
    else if (type === "end-sem") targetId = selectedEndSemId;

    const gradeSheet = buildGradeSheet(type, targetId);
    if (!gradeSheet || !gradeSheet.exam || gradeSheet.rows.length === 0) {
      notify("No evaluation data is available for export.");
      return;
    }
    const csv = buildGradeSheetCsv(gradeSheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getGradeSheetExcelFilename(type, gradeSheet.exam);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`${getGradeSheetExcelFilename(type, gradeSheet.exam)} is ready for download.`);
  };

  const handleExportPdf = (type) => {
    let targetId = null;
    if (type === "assignment") targetId = selectedAssignmentId;
    else if (type === "in-sem") targetId = selectedInSemId;
    else if (type === "end-sem") targetId = selectedEndSemId;

    const gradeSheet = buildGradeSheet(type, targetId);
    if (!gradeSheet || !gradeSheet.exam || gradeSheet.rows.length === 0) {
      notify("No evaluation data is available for export.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      notify("Please allow pop-ups to export the PDF.");
      return;
    }

    const exam = gradeSheet.exam;
    const summary = gradeSheet.summary;
    const rowsHtml = gradeSheet.rows
      .map(
        (row) => `<tr>
          <td>${row.srNo}</td>
          <td>${row.rollNumber}</td>
          <td>${row.studentName}</td>
          <td>${row.classDivision}</td>
          <td>${row.subject}</td>
          <td>${row.examination}</td>
          <td>${row.totalMarks}</td>
          <td>${row.obtainedMarks}</td>
          <td>${row.percentage === "—" ? "—" : `${row.percentage}%`}</td>
          <td>${row.grade}</td>
          <td>${row.status}</td>
        </tr>`
      )
      .join("");

    const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const headerTitle =
      type === "assignment"
        ? "ASSIGNMENT GRADE SHEET"
        : type === "in-sem"
        ? "IN-SEMESTER EXAMINATION GRADE SHEET"
        : "END-SEMESTER EXAMINATION GRADE SHEET";

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${getGradeSheetPdfFilename(type, exam)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 32px; }
  .brand { color: #2563eb; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-align: center; }
  h1 { text-align: center; font-size: 20px; margin: 8px 0 2px; letter-spacing: 0.5px; }
  .subtitle { text-align: center; font-size: 12px; color: #475569; margin-bottom: 18px; }
  .rule { height: 2px; background: #2563eb; margin: 14px 0; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 12px; margin-bottom: 16px; }
  .meta div { display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding: 3px 0; }
  .meta span { color: #64748b; }
  .meta strong { color: #0f172a; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 7px; text-align: left; }
  th { background: #eff6ff; color: #1d4ed8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { color: #334155; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
  .summary div { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc; }
  .summary small { display: block; color: #64748b; font-size: 10px; }
  .summary strong { display: block; margin-top: 3px; font-size: 14px; color: #0f172a; }
  .footer { margin-top: 22px; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 12px; } }
</style>
</head>
<body>
  <div class="brand">EVALAI · AI-POWERED ACADEMIC ASSESSMENT PLATFORM</div>
  <h1>${exam.title}</h1>
  <div class="subtitle">${headerTitle}</div>
  <div class="rule"></div>
  <div class="meta">
    <div><span>College / Institution</span><strong>State Engineering College</strong></div>
    <div><span>Department</span><strong>ENTC Engineering</strong></div>
    <div><span>Class / Division</span><strong>${exam.division || "TE ENTC – A"}</strong></div>
    <div><span>Subject</span><strong>${exam.subjectName || exam.subject || "N/A"}</strong></div>
    <div><span>Examination</span><strong>${exam.title}</strong></div>
    <div><span>Academic Year</span><strong>2026</strong></div>
    <div><span>Generated Date</span><strong>${generatedDate}</strong></div>
    <div><span>Total Marks</span><strong>${exam.totalMarks} Marks</strong></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Sr</th><th>Roll No</th><th>Student Name</th><th>Class</th><th>Subject</th><th>Exam</th><th>Total</th><th>Obtained</th><th>%</th><th>Grade</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="summary">
    <div><small>Total Students</small><strong>${summary.totalStudents}</strong></div>
    <div><small>Evaluated Students</small><strong>${summary.evaluatedStudents}</strong></div>
    <div><small>Pending Evaluations</small><strong>${summary.pendingEvaluations}</strong></div>
    <div><small>Average Marks</small><strong>${summary.averageMarks} / ${exam.totalMarks}</strong></div>
    <div><small>Highest Marks</small><strong>${summary.highestMarks} / ${exam.totalMarks}</strong></div>
    <div><small>Lowest Marks</small><strong>${summary.lowestMarks} / ${exam.totalMarks}</strong></div>
    <div><small>Pass Percentage</small><strong>${summary.passPercentage}%</strong></div>
  </div>
  <div class="footer">Generated by EvalAI · AI-Powered Academic Assessment Platform</div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`);
    printWindow.document.close();
    notify(`${getGradeSheetPdfFilename(type, exam)} export initiated.`);
  };

  return (
    <div className="reports-center">
      {notice && (
        <div className="reports-toast">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}
      <header className="reports-heading">
        <div>
          <p>ASSESSMENT OUTPUTS</p>
          <h1>Reports Center</h1>
          <span>Generate polished academic reports from verified assessment data.</span>
        </div>
        <div className="reports-badge">
          <FileSpreadsheet size={17} />
          Report Center
        </div>
      </header>

      {/* Top Filter Bar for Teacher Assignments */}
      {teacherAssignments.length > 0 ? (
        <section className="analytics-filters">
          <label>
            <span>Active Assessment Scope</span>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
            >
              {teacherAssignments.map((asg) => (
                <option key={asg.id} value={asg.id}>
                  {asg.title} ({asg.courseCode || asg.subjectName})
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : (
        <div className="analytics-empty surface" style={{ marginBottom: "18px" }}>
          <FileSpreadsheet size={32} style={{ color: "#94a3b8" }} />
          <h2>No assignments available</h2>
          <p>Create and publish an assignment to generate reports.</p>
        </div>
      )}

      {/* Selected Assignment Metadata Panel */}
      {selectedAssignment && (
        <section className="analytics-metadata-panel">
          <div className="meta-item">
            <span>Assessment Title</span>
            <strong>{selectedAssignment.title}</strong>
          </div>
          <div className="meta-item">
            <span>Subject</span>
            <strong>{selectedAssignment.subjectName || selectedAssignment.subject || "N/A"}</strong>
          </div>
          <div className="meta-item">
            <span>Course Code</span>
            <strong>{selectedAssignment.courseCode || "N/A"}</strong>
          </div>
          <div className="meta-item">
            <span>Branch</span>
            <strong>{selectedAssignment.branch || "ENTC"}</strong>
          </div>
          <div className="meta-item">
            <span>Division</span>
            <strong>{selectedAssignment.division || "TE ENTC – A"}</strong>
          </div>
          <div className="meta-item">
            <span>Total Marks</span>
            <strong>{selectedAssignment.totalMarks} Marks</strong>
          </div>
          <div className="meta-item">
            <span>Due Date</span>
            <strong>
              {selectedAssignment.dueDate || "N/A"}{" "}
              {selectedAssignment.dueTime ? `at ${selectedAssignment.dueTime}` : ""}
            </strong>
          </div>
        </section>
      )}

      <section className="reports-grid">
        {/* Class Performance Report */}
        <article className="report-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>ACADEMIC REPORT</p>
          <h2>Class Performance Report</h2>
          <span>Overview of marks, trends and learning insights.</span>
          <dl>
            <div>
              <dt>Scope</dt>
              <dd>{selectedAssignment?.division || "TE ENTC – A"}</dd>
            </div>
            <div>
              <dt>Data status</dt>
              <dd>Updated today</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <button
              onClick={() =>
                setPreview({
                  title: "Class Performance Report",
                  scope: selectedAssignment?.division || "TE ENTC – A",
                  assignment: selectedAssignment,
                  analytics: classAnalytics,
                })
              }
            >
              <Eye size={15} />
              Preview
            </button>
            <button className="generate" onClick={() => notify("Class Performance Report is ready.")}>
              <Sparkles size={15} />
              Generate
            </button>
            <button className="export" onClick={() => notify("Class Performance Report exported.")}>
              <Download size={15} />
            </button>
          </div>
        </article>

        {/* Assignment Evaluation Report */}
        <article className="report-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>ACADEMIC REPORT</p>
          <h2>Assignment Evaluation Report</h2>
          <span>Detailed outcomes, scores and teacher approval status.</span>
          <dl>
            <div>
              <dt>Scope</dt>
              <dd>{selectedAssignment?.title || "No Assignment"}</dd>
            </div>
            <div>
              <dt>Data status</dt>
              <dd>Updated today</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <button
              onClick={() => {
                if (!selectedAssignment) {
                  notify("No assignments available.");
                  return;
                }
                setPreview({
                  title: "Assignment Evaluation Report",
                  scope: selectedAssignment.title,
                  assignment: selectedAssignment,
                  analytics: classAnalytics,
                });
              }}
            >
              <Eye size={15} />
              Preview
            </button>
            <button className="generate" onClick={() => notify("Assignment Evaluation Report is ready.")}>
              <Sparkles size={15} />
              Generate
            </button>
            <button className="export" onClick={() => notify("Assignment Evaluation Report exported.")}>
              <Download size={15} />
            </button>
          </div>
        </article>

        {/* Student Progress Report */}
        <article className="report-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>ACADEMIC REPORT</p>
          <h2>Student Progress Report</h2>
          <span>Individual performance history and feedback summary.</span>
          <dl>
            <div>
              <dt>Scope</dt>
              <dd>{selectedStudent || "Select a student"}</dd>
            </div>
            <div>
              <dt>Data status</dt>
              <dd>Updated today</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <select
              className="student-report-select"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select student…</option>
              {(targetedStudents.length > 0 ? targetedStudents : students).map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name} · {item.roll}
                </option>
              ))}
            </select>
            <button className="generate" onClick={handleStudentReport}>
              <Sparkles size={15} />
              Generate
            </button>
          </div>
        </article>

        {/* Rubric Analysis */}
        <article className="report-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>ACADEMIC REPORT</p>
          <h2>Rubric Analysis</h2>
          <span>Criterion-level performance and scoring consistency.</span>
          <dl>
            <div>
              <dt>Scope</dt>
              <dd>{selectedAssignment?.subjectName || selectedAssignment?.subject || "Subject Rubric"}</dd>
            </div>
            <div>
              <dt>Data status</dt>
              <dd>Updated today</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <button
              onClick={() => {
                if (!selectedAssignment) {
                  notify("No assignments available.");
                  return;
                }
                setPreview({
                  title: "Rubric Analysis",
                  scope: selectedAssignment.title,
                  rubricData: rubricAnalyticsData,
                  assignment: selectedAssignment,
                });
              }}
            >
              <Eye size={15} />
              Preview
            </button>
            <button className="generate" onClick={() => notify("Rubric Analysis is ready.")}>
              <Sparkles size={15} />
              Generate
            </button>
            <button className="export" onClick={() => notify("Rubric Analysis exported.")}>
              <Download size={15} />
            </button>
          </div>
        </article>
      </section>

      <h2 style={{ marginTop: "28px", marginBottom: "14px", color: "var(--dark-navy)", fontSize: "18px" }}>
        Official Examination Grade Sheets
      </h2>

      <section className="reports-grid">
        {/* Assignment Grade Sheet */}
        <article className="report-template grade-sheet-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>OFFICIAL GRADE SHEET</p>
          <h2>Assignment — Grade Sheet</h2>
          <span>Complete verified assignment marks for all targeted students.</span>
          <dl>
            <div>
              <dt>Selected Assignment</dt>
              <dd>{selectedAssignment?.title || "No Assignment Selected"}</dd>
            </div>
            <div>
              <dt>Total Marks</dt>
              <dd>{selectedAssignment ? `${selectedAssignment.totalMarks} Marks` : "—"}</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <button onClick={() => handleGradeSheetPreview("assignment")}>
              <Eye size={15} />
              Preview
            </button>
            <button className="generate" onClick={() => handleGradeSheetPreview("assignment")}>
              <Sparkles size={15} />
              Generate
            </button>
            <button
              className="export"
              onClick={() => handleExportExcel("assignment")}
              title="Export Excel"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              className="export"
              onClick={() => handleExportPdf("assignment")}
              title="Export PDF"
            >
              <FileText size={15} />
            </button>
          </div>
        </article>

        {/* In-Sem Examination Grade Sheet */}
        <article className="report-template grade-sheet-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>OFFICIAL GRADE SHEET</p>
          <h2>In-Sem Examination — Grade Sheet</h2>
          <span>In-Semester examination marks record (30 Marks).</span>
          <dl>
            <div>
              <dt>Scope</dt>
              <dd>{inSemExam?.division || "TE ENTC – A"}</dd>
            </div>
            <div>
              <dt>Total Marks</dt>
              <dd>30 Marks</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <button onClick={() => handleGradeSheetPreview("in-sem")}>
              <Eye size={15} />
              Preview
            </button>
            <button className="generate" onClick={() => handleGradeSheetPreview("in-sem")}>
              <Sparkles size={15} />
              Generate
            </button>
            <button
              className="export"
              onClick={() => handleExportExcel("in-sem")}
              title="Export Excel"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              className="export"
              onClick={() => handleExportPdf("in-sem")}
              title="Export PDF"
            >
              <FileText size={15} />
            </button>
          </div>
        </article>

        {/* End-Sem Examination Grade Sheet */}
        <article className="report-template grade-sheet-template">
          <div className="report-icon">
            <FileSpreadsheet size={21} />
          </div>
          <p>OFFICIAL GRADE SHEET</p>
          <h2>End-Sem Examination — Grade Sheet</h2>
          <span>End-Semester examination marks record (60 Marks).</span>
          <dl>
            <div>
              <dt>Scope</dt>
              <dd>{endSemExam?.division || "TE ENTC – A"}</dd>
            </div>
            <div>
              <dt>Total Marks</dt>
              <dd>60 Marks</dd>
            </div>
          </dl>
          <div className="report-card-actions">
            <button onClick={() => handleGradeSheetPreview("end-sem")}>
              <Eye size={15} />
              Preview
            </button>
            <button className="generate" onClick={() => handleGradeSheetPreview("end-sem")}>
              <Sparkles size={15} />
              Generate
            </button>
            <button
              className="export"
              onClick={() => handleExportExcel("end-sem")}
              title="Export Excel"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              className="export"
              onClick={() => handleExportPdf("end-sem")}
              title="Export PDF"
            >
              <FileText size={15} />
            </button>
          </div>
        </article>
      </section>

      {/* Preview Modal for Standard Reports */}
      {preview && !preview.gradeSheet && (
        <div className="report-overlay" onMouseDown={() => setPreview(null)}>
          <section
            className="report-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Report preview"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setPreview(null)}>
              <X size={18} />
            </button>
            <p className="report-brand">EVALAI · ACADEMIC ASSESSMENT PLATFORM</p>
            <h2>{preview.title}</h2>
            <span>
              {preview.assignment
                ? `${preview.assignment.title} · Total ${preview.assignment.totalMarks} Marks`
                : "State Engineering College · ENTC Engineering"}
            </span>
            <div className="modal-rule" />
            <div className="modal-details">
              <div>
                <small>Scope</small>
                <strong>{preview.scope}</strong>
              </div>
              <div>
                <small>Generated for</small>
                <strong>{currentTeacher?.name || "Professor"}</strong>
              </div>
              <div>
                <small>Class Average</small>
                <strong>
                  {preview.analytics?.averageScore !== undefined
                    ? `${preview.analytics.averageScore} / ${preview.assignment?.totalMarks || 30}`
                    : preview.analytics?.averagePercentage
                    ? `${preview.analytics.averagePercentage}%`
                    : "—"}
                </strong>
              </div>
              <div>
                <small>Evaluation Status</small>
                <strong>{preview.analytics?.completionPercentage || 0}% complete</strong>
              </div>
            </div>

            {preview.title === "Student Progress Report" && preview.studentReport ? (
              <>
                <h3>Student Evaluation Summary</h3>
                <div className="modal-details" style={{ marginTop: "12px", marginBottom: "16px" }}>
                  <div><small>Student Name</small><strong>{preview.studentReport.student}</strong></div>
                  <div><small>Roll Number</small><strong>{preview.studentReport.roll}</strong></div>
                  <div><small>Score</small><strong>{preview.studentReport.score} / {preview.studentReport.totalMarks}</strong></div>
                  <div><small>Percentage</small><strong>{preview.studentReport.percentage}%</strong></div>
                  <div><small>Grade</small><strong>{preview.studentReport.grade}</strong></div>
                  <div><small>Status</small><strong>{preview.studentReport.status}</strong></div>
                </div>
                {preview.studentReport.rubric && preview.studentReport.rubric.length > 0 && (
                  <div className="grade-sheet-table-wrap">
                    <table className="grade-sheet-table">
                      <thead>
                        <tr><th>Rubric Criterion</th><th>Marks</th></tr>
                      </thead>
                      <tbody>
                        {preview.studentReport.rubric.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td>{item.score} / {item.max}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : preview.title === "Rubric Analysis" ? (
              <>
                <h3>Rubric Criteria Performance</h3>
                {preview.rubricData && preview.rubricData.length > 0 ? (
                  <div className="grade-sheet-table-wrap">
                    <table className="grade-sheet-table">
                      <thead>
                        <tr>
                          <th>Criterion</th>
                          <th>Max Marks</th>
                          <th>Average Awarded Marks</th>
                          <th>Class Score %</th>
                          <th>Performance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rubricData.map((item, idx) => {
                          const pct = item.percentage ?? item.score ?? 0;
                          const perf = pct >= 75 ? "Excellent" : pct >= 60 ? "Good" : pct > 0 ? "Needs Attention" : "Not Evaluated";
                          return (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td>{item.max}</td>
                              <td>{item.averageMarks !== undefined ? `${item.averageMarks} / ${item.max}` : "—"}</td>
                              <td>{pct}%</td>
                              <td>{perf}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="analytics-muted" style={{ padding: "12px 0" }}>
                    No rubric analysis available for this assessment.
                  </p>
                )}
              </>
            ) : preview.assignment ? (
              <>
                <h3>Assessment Evaluation Summary</h3>
                <p style={{ marginBottom: "14px", color: "#475569", fontSize: "13px" }}>
                  {preview.analytics?.evaluatedCount || 0} evaluations completed out of{" "}
                  {preview.analytics?.totalStudents || targetedStudents.length} targeted students (
                  {preview.analytics?.completionPercentage || 0}% complete). Class average score is{" "}
                  {preview.analytics?.averageScore || 0} / {preview.assignment.totalMarks} (
                  {preview.analytics?.averagePercentage || 0}%).
                </p>

                <div className="grade-sheet-table-wrap">
                  <table className="grade-sheet-table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Obtained Score</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(targetedStudents.length > 0 ? targetedStudents : students).map((student) => {
                        const sub = workflowSubmissions.find(
                          (s) =>
                            (s.assignmentId === preview.assignment.id || s.assessmentId === preview.assignment.id) &&
                            (s.studentId === student.id || s.rollNumber === student.roll || s.studentName === student.name)
                        );
                        const score = sub?.evaluation?.obtainedMarks ?? sub?.evaluation?.score ?? (sub?.status === "Missing / Failed" ? 0 : "—");
                        const total = preview.assignment.totalMarks;
                        const pct = typeof score === "number" ? Math.round((score / total) * 100) : "—";
                        const grade = sub?.evaluation?.grade ?? (sub?.status === "Missing / Failed" ? "F" : "—");
                        const status = sub?.status || "Pending";
                        return (
                          <tr key={student.id}>
                            <td>{student.roll}</td>
                            <td>{student.name}</td>
                            <td>{status}</td>
                            <td>{typeof score === "number" ? `${score} / ${total}` : "—"}</td>
                            <td>{typeof pct === "number" ? `${pct}%` : "—"}</td>
                            <td>{grade}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="analytics-muted" style={{ padding: "12px 0" }}>
                No evaluated results available yet.
              </p>
            )}

            <button className="modal-export" onClick={() => notify(`${preview.title} export complete.`)}>
              <Download size={15} />
              Export Report
            </button>
          </section>
        </div>
      )}

      {/* Preview Modal for Official Grade Sheets */}
      {preview?.gradeSheet && (
        <div className="report-overlay" onMouseDown={() => setPreview(null)}>
          <section
            className="report-preview-modal grade-sheet-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Grade sheet preview"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setPreview(null)}>
              <X size={18} />
            </button>
            <p className="report-brand">EVALAI · AI-POWERED ACADEMIC ASSESSMENT PLATFORM</p>
            <h2>
              {gradeSheetType === "assignment"
                ? "ASSIGNMENT GRADE SHEET"
                : gradeSheetType === "in-sem"
                ? "IN-SEMESTER EXAMINATION"
                : "END-SEMESTER EXAMINATION"}
            </h2>
            <span>
              {preview.gradeSheet.exam?.title || "OFFICIAL GRADE SHEET"} (Total{" "}
              {preview.gradeSheet.exam?.totalMarks || (gradeSheetType === "end-sem" ? 60 : 30)} Marks)
            </span>
            <div className="modal-rule" />
            <div className="modal-details">
              <div>
                <small>College / Institution</small>
                <strong>State Engineering College</strong>
              </div>
              <div>
                <small>Department</small>
                <strong>ENTC Engineering</strong>
              </div>
              <div>
                <small>Class / Division</small>
                <strong>{preview.gradeSheet.exam?.division || "TE ENTC – A"}</strong>
              </div>
              <div>
                <small>Subject</small>
                <strong>{preview.gradeSheet.exam?.subjectName || preview.gradeSheet.exam?.subject || "N/A"}</strong>
              </div>
              <div>
                <small>Examination</small>
                <strong>{preview.gradeSheet.exam?.title}</strong>
              </div>
              <div>
                <small>Academic Year</small>
                <strong>2026</strong></div>
              <div>
                <small>Generated Date</small>
                <strong>
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </div>
              <div>
                <small>Total Marks</small>
                <strong>{preview.gradeSheet.exam?.totalMarks || (gradeSheetType === "end-sem" ? 60 : 30)} Marks</strong>
              </div>
            </div>
            <h3>Student Marks</h3>
            {preview.gradeSheet.rows.length > 0 ? (
              <div className="grade-sheet-table-wrap">
                <table className="grade-sheet-table">
                  <thead>
                    <tr>
                      <th>Sr</th>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Exam</th>
                      <th>Total</th>
                      <th>Obtained</th>
                      <th>%</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.gradeSheet.rows.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>{row.rollNumber}</td>
                        <td>{row.studentName}</td>
                        <td>{row.classDivision}</td>
                        <td>{row.subject}</td>
                        <td>{row.examination}</td>
                        <td>{row.totalMarks}</td>
                        <td>{row.obtainedMarks}</td>
                        <td>{row.percentage === "—" ? "—" : `${row.percentage}%`}</td>
                        <td>{row.grade}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="analytics-muted" style={{ padding: "16px 0", textAlign: "center" }}>
                {gradeSheetType === "in-sem"
                  ? "No In-Sem examination data available."
                  : gradeSheetType === "end-sem"
                  ? "No End-Sem examination data available."
                  : "No evaluation data is available for this assessment."}
              </p>
            )}
            <h3>Summary</h3>
            <div className="grade-sheet-summary">
              <div>
                <small>Total Students</small>
                <strong>{preview.gradeSheet.summary.totalStudents}</strong>
              </div>
              <div>
                <small>Evaluated Students</small>
                <strong>{preview.gradeSheet.summary.evaluatedStudents}</strong>
              </div>
              <div>
                <small>Pending Evaluations</small>
                <strong>{preview.gradeSheet.summary.pendingEvaluations}</strong>
              </div>
              <div>
                <small>Average Marks</small>
                <strong>
                  {preview.gradeSheet.summary.averageMarks} /{" "}
                  {preview.gradeSheet.exam?.totalMarks || (gradeSheetType === "end-sem" ? 60 : 30)}
                </strong>
              </div>
              <div>
                <small>Highest Marks</small>
                <strong>
                  {preview.gradeSheet.summary.highestMarks} /{" "}
                  {preview.gradeSheet.exam?.totalMarks || (gradeSheetType === "end-sem" ? 60 : 30)}
                </strong>
              </div>
              <div>
                <small>Lowest Marks</small>
                <strong>
                  {preview.gradeSheet.summary.lowestMarks} /{" "}
                  {preview.gradeSheet.exam?.totalMarks || (gradeSheetType === "end-sem" ? 60 : 30)}
                </strong>
              </div>
              <div>
                <small>Pass Percentage</small>
                <strong>{preview.gradeSheet.summary.passPercentage}%</strong>
              </div>
            </div>
            <div className="grade-sheet-modal-actions">
              <button
                className="modal-export"
                onClick={() => handleExportExcel(gradeSheetType)}
              >
                <FileSpreadsheet size={15} />
                Export Excel
              </button>
              <button
                className="modal-export"
                onClick={() => handleExportPdf(gradeSheetType)}
              >
                <FileText size={15} />
                Export PDF
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default TeacherReportsPage;