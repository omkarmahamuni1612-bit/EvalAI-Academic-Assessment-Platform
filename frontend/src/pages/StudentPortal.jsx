import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Bell, BookOpen, CheckCircle2, ChevronRight, Download, Eye, EyeOff, FileText, FileWarning, GraduationCap, Loader2, Lock, LogOut, ShieldAlert, Sparkles, TrendingUp, Upload, X } from "lucide-react";
import { createdAssessments, demoAssignment, getActiveStudentAssignmentId, getAssignmentById, getEvaluationStatus, getPersistedPdfUrl, getQuestionPaperPdf, getStudentAssignment, getStudentNotifications, getSubmissionByEvaluationId, getSubmissionById, getSubmissionStatusLabel, isAssignmentAssessment, isAssignmentPastDueDate, isResultsPublished, isStudentTargeted, markNotificationRead, submitAssignment } from "../data/workflowData";
import { getInSemExam, getInSemStudentNotifications, getInSemStudentResult, getInSemStudentStatus, getInSemSubmissionByEvaluationId, getInSemSubmissionById, getInSemSubmissionByStudent, isInSemResultsPublished, markInSemNotificationRead } from "../data/inSemData";
import { getEndSemExam, getEndSemStudentNotifications, getEndSemStudentResult, getEndSemStudentStatus, getEndSemSubmissionByEvaluationId, getEndSemSubmissionById, getEndSemSubmissionByStudent, isEndSemResultsPublished, markEndSemNotificationRead } from "../data/endSemData";
import { DEMO_STUDENT_PASSWORD, getCurrentStudent, getStudentSubmission, loginStudent, logoutStudent, students } from "../auth/studentAuth";
import { StatusBadge } from "../components/WorkflowUI";
import "./StudentPortal.css";

function StudentShell({ student, submission, children }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const studentName = student?.name || "Student";
  const initials = studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const notifications = student?.id ? (getStudentNotifications(student.id, student) || []) : [];
  const inSemNotifications = student?.id ? (getInSemStudentNotifications(student.id) || []) : [];
  const endSemNotifications = student?.id ? (getEndSemStudentNotifications(student.id) || []) : [];
  const allNotifications = [...notifications, ...inSemNotifications, ...endSemNotifications];
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    if (notification.type === "assignment_published" || (!notification.evaluationId && notification.assignmentId)) {
      markNotificationRead(notification.id);
      setShowNotifications(false);
      navigate(`/student/assignments/${notification.assignmentId}`);
      return;
    }
    if (notification.assessmentId && notification.assessmentTitle?.includes("End-Sem")) {
      markEndSemNotificationRead(notification.id);
      setShowNotifications(false);
      navigate("/student/endsem");
      return;
    }
    if (notification.assessmentId) {
      markInSemNotificationRead(notification.id);
      setShowNotifications(false);
      navigate("/student/insem");
      return;
    }
    markNotificationRead(notification.id);
    setShowNotifications(false);
    navigate(`/student/results/${notification.evaluationId}`);
  };

  const handleLogout = () => {
    logoutStudent();
    navigate("/student/login", { replace: true });
  };

  const isNavActive = (path) => {
    if (path === "/student/dashboard") return location.pathname === "/student/dashboard";
    return location.pathname.startsWith(path);
  };
  const activeAsgId = getActiveStudentAssignmentId(student);
  const assignmentsTarget = activeAsgId ? `/student/assignments/${activeAsgId}` : "/student/dashboard";

  return <div className="student-shell"><header className="student-topbar"><div className="student-brand-nav"><Link to="/student/dashboard" className="student-brand"><span><Sparkles size={18}/></span><b>EvalAI</b><small>STUDENT PORTAL</small></Link><nav className="student-nav-menu"><Link to="/student/dashboard" className={`student-nav-item ${isNavActive("/student/dashboard") ? "active" : ""}`}>Dashboard</Link><Link to={assignmentsTarget} className={`student-nav-item ${isNavActive("/student/assignments") ? "active" : ""}`}>Assignments</Link><Link to="/student/insem" className={`student-nav-item ${isNavActive("/student/insem") ? "active" : ""}`}>In-Sem Exam</Link><Link to="/student/endsem" className={`student-nav-item ${isNavActive("/student/endsem") ? "active" : ""}`}>End-Sem Exam</Link><Link to="/student/results" className={`student-nav-item ${isNavActive("/student/results") ? "active" : ""}`}>Results</Link></nav></div><div className="student-topbar-right"><div className="student-notifications">
    <button type="button" className="student-notif-btn" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications">
      <Bell size={18} />
      {unreadCount > 0 && <span className="student-notif-badge">{unreadCount}</span>}
    </button>
    {showNotifications && (
      <div className="student-notif-dropdown">
        <div className="student-notif-header"><strong>Notifications</strong><span>{unreadCount} unread</span></div>
        {allNotifications.length === 0 ? (
          <div className="student-notif-empty">No new notifications</div>
        ) : (
          allNotifications.map((notification) => (
            <button type="button" key={notification.id} className={`student-notif-item ${notification.read ? "read" : ""}`} onClick={() => handleNotificationClick(notification)}>
              <div className="student-notif-dot" />
              <div>
                <strong>{notification.assignmentTitle || notification.assessmentTitle || "Notification"}</strong>
                <p>{notification.message}</p>
                <span>{notification.score} · {notification.grade}</span>
              </div>
              <ChevronRight size={14} />
            </button>
          ))
        )}
      </div>
    )}
  </div><button type="button" className="student-logout-btn" onClick={handleLogout} aria-label="Log Out" title="Log Out"><LogOut size={17} /></button><div className="student-profile"><div>{initials}</div><span><strong>{studentName}</strong><small>{student?.roll || "ENTC Engineering"}</small></span></div></div></header><main>{children}</main></div>
}

export function StudentLogin() {
  const [show, setShow] = useState(false);
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    // Simulate a short authentication delay for the loading state.
    setTimeout(() => {
      const student = loginStudent(roll, password);
      if (!student) {
        setLoading(false);
        setError("Invalid roll number or password. Please try again.");
        return;
      }
      navigate("/student/dashboard", { replace: true });
    }, 450);
  };

  return <div className="student-login"><div className="student-login-aside"><Link to="/" className="student-back"><ArrowLeft size={15}/> Back to Home</Link><div><span className="student-login-tag"><GraduationCap size={14}/> EVALAI STUDENT PORTAL</span><h1>Stay informed.<br/><em>Learn with clarity.</em></h1><p>Track assignment progress, access released evaluation feedback, and understand your academic performance.</p><ul><li><CheckCircle2 size={16}/> View assessment outcomes</li><li><CheckCircle2 size={16}/> Understand approved feedback</li><li><CheckCircle2 size={16}/> Track academic progress</li></ul></div><small>EvalAI Academic Assessment Platform · Student Access</small></div><section className="student-login-main"><div className="student-login-card"><div className="student-login-icon"><GraduationCap size={24}/></div><h2>Student Login</h2><p>Sign in with your roll number to access your assignments and results.</p><div className="student-demo"><Lock size={15}/><span><b>Demo Access Enabled</b> · Password: {DEMO_STUDENT_PASSWORD}</span></div><form onSubmit={handleSubmit}><label>Student Roll Number / Student ID<input type="text" placeholder="e.g. ET202-041" value={roll} onChange={(event)=>setRoll(event.target.value)} autoComplete="username" required/></label><label>Password<div className="student-password"><input type={show?"text":"password"} placeholder="Enter your password" value={password} onChange={(event)=>setPassword(event.target.value)} autoComplete="current-password" required/><button type="button" onClick={()=>setShow(!show)} aria-label="Toggle password visibility">{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>{error && <p className="student-login-error" role="alert">{error}</p>}<button className="student-login-btn" disabled={loading}>{loading ? "Signing in…" : "Sign In to Student Portal"}</button></form><small className="student-login-note">Demo students: {students.map((s)=>s.name).join(" · ")}</small></div></section></div>;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const currentStudent = getCurrentStudent();

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  const activeAssignmentId = getActiveStudentAssignmentId(currentStudent);
  const defaultSub = activeAssignmentId ? getStudentSubmission(currentStudent, activeAssignmentId) : null;
  const studentName = currentStudent.name || "Student";
  const firstName = studentName.split(" ")[0] || "Student";
  const initials = studentName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";

  // In-Sem Examination status for the logged-in student
  const inSemExam = getInSemExam() || { title: "In-Sem Examination", course: "DSP", courseCode: "ET305", division: "SE ENTC – A", totalMarks: 30, duration: "1 Hr", examDate: "TBD" };
  const inSemStatus = getInSemStudentStatus(currentStudent) || { label: "Not Published" };

  // End-Sem Examination status for the logged-in student
  const endSemExam = getEndSemExam() || { title: "End-Sem Examination", course: "DSP", courseCode: "ET305", division: "SE ENTC – A", totalMarks: 60, duration: "2 Hrs", examDate: "TBD" };
  const endSemStatus = getEndSemStudentStatus(currentStudent) || { label: "Not Published" };

  // Build the assignment list ONLY from real published assignments targeted to this logged-in student
  const createdPublished = (createdAssessments || []).filter(
    (a) => a && a.status === "Published" && a.id !== demoAssignment.id && isStudentTargeted(currentStudent, a)
  );

  const assignmentItems = createdPublished.map((asg) => {
    const sub = getStudentSubmission(currentStudent, asg.id);
    const pub = isResultsPublished(asg.id);
    const isPastDue = isAssignmentPastDueDate(asg);
    const hasValidSubmission = Boolean(sub && sub.file && sub.status !== "Pending");
    const isMissing = !hasValidSubmission && isPastDue;
    const evalObj = sub?.evaluation || null;

    let displayStatus = "Pending";
    if (isMissing) {
      displayStatus = "Missing / Failed";
    } else if (hasValidSubmission) {
      displayStatus = sub.status === "Processing" ? "Under Evaluation" : (sub.status || "Submitted");
    }

    return {
      id: asg.id,
      evaluationId: sub?.evaluationId || `eval-${asg.id}-${currentStudent.id}`,
      title: asg.title || "Assignment",
      subjectName: asg.subjectName || asg.subject || asg.course || "Subject",
      courseCode: asg.courseCode || "",
      subject: `${asg.subjectName || asg.subject || "Subject"} (${asg.courseCode || ""})`.trim(),
      targetInfo: `${asg.branch || "ENTC"} · ${asg.division || "SE ENTC – A"}`,
      due: asg.dueDate ? `Due: ${asg.dueDate}${asg.dueTime ? ` · ${asg.dueTime}` : ""}` : "Due TBD",
      totalMarks: asg.totalMarks || 20,
      status: displayStatus,
      evaluation: evalObj,
      published: pub || isMissing,
      isPastDue,
      isMissing,
      hasValidSubmission,
    };
  });

  const parseScoreNumber = (evalObj) => {
    if (!evalObj) return 0;
    if (typeof evalObj.obtainedMarks === "number") return evalObj.obtainedMarks;
    if (typeof evalObj.score === "number") return evalObj.score;
    const raw = String(evalObj.obtainedMarks ?? evalObj.score ?? 0);
    const parsed = parseFloat(raw.split("/")[0].trim());
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalAssignments = assignmentItems.length;
  const submittedCount = assignmentItems.filter((item) => item.hasValidSubmission).length;
  const pendingCount = assignmentItems.filter((item) => !item.hasValidSubmission && !item.isPastDue).length;
  const evaluatedItems = assignmentItems.filter((item) => (item.published || item.isMissing) && item.evaluation);
  const totalAwarded = evaluatedItems.reduce((acc, item) => acc + parseScoreNumber(item.evaluation), 0);
  const totalPossible = evaluatedItems.reduce((acc, item) => acc + (item.totalMarks || 20), 0);
  const averageScore = totalPossible > 0 ? Math.round((totalAwarded / totalPossible) * 100) : null;
  const evaluatedCount = evaluatedItems.length;

  const recentResults = assignmentItems.filter((item) => (item.published || item.isMissing) && item.evaluation);

  // Dynamically derive enrolled subject modules from targeted assignments
  const enrolledSubjectsMap = new Map();
  createdPublished.forEach((asg) => {
    const key = asg.courseCode || asg.subjectName || asg.subject || "Subject";
    if (!enrolledSubjectsMap.has(key)) {
      enrolledSubjectsMap.set(key, {
        subjectName: asg.subjectName || asg.subject || asg.course,
        courseCode: asg.courseCode || "",
        teacher: asg.teacher || "Faculty",
        division: asg.division || currentStudent.division || "SE ENTC – A",
        branch: asg.branch || currentStudent.branch || "ENTC",
        totalMarks: asg.totalMarks || 20,
      });
    }
  });
  const enrolledSubjects = Array.from(enrolledSubjectsMap.values());

  return <StudentShell student={currentStudent} submission={defaultSub}><div className="student-page"><header className="student-welcome"><div><span>ACADEMIC OVERVIEW</span><h1>Welcome back, {firstName}</h1><p>Here is a snapshot of your current assessment activity.</p></div><div className="student-performance"><TrendingUp size={18}/><span>Current performance</span><strong>{averageScore !== null ? `${averageScore}%` : "—"}</strong></div></header>{recentResults.length > 0 && <div className="student-result-banner"><CheckCircle2 size={18}/><span>Your assignment evaluation is published. <button onClick={()=>navigate(`/student/results/${recentResults[0].evaluationId}`)}>View Results <ChevronRight size={14}/></button></span></div>}<section className="student-surface student-profile-card"><div className="student-profile-avatar">{initials}</div><div className="student-profile-info"><span>STUDENT PROFILE</span><h2>{currentStudent.name}</h2><p>Roll Number: {currentStudent.roll} · {currentStudent.branch || "ENTC"} · {currentStudent.division || "SE ENTC – A"}</p></div></section><div className="student-stat-grid student-stat-grid-five">{[["Total Assignments", totalAssignments, "Assigned this term"],["Submitted", submittedCount, "Submitted for evaluation"],["Pending", pendingCount, "Awaiting submission"],["Evaluated", evaluatedCount, "Results released"],["Average Score", averageScore !== null ? `${averageScore}%` : "—", "Across evaluated work"]].map(([a,b,c])=><div key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div><div className="student-quick-actions"><button onClick={()=>navigate(activeAssignmentId ? `/student/assignments/${activeAssignmentId}` : "/student/dashboard")}><BookOpen size={16}/> My Assignments</button><button onClick={()=>navigate(activeAssignmentId ? `/student/assignments/${activeAssignmentId}` : "/student/dashboard")}><FileText size={16}/> Submit Assignment</button><button onClick={()=>recentResults.length > 0 ? navigate(`/student/results/${recentResults[0].evaluationId}`) : navigate("/student/dashboard")}><CheckCircle2 size={16}/> View Results</button><button onClick={()=>navigate("/student/insem")}><FileText size={16}/> In-Sem Exam</button><button onClick={()=>navigate("/student/endsem")}><FileText size={16}/> End-Sem Exam</button></div><section className="student-surface student-assignment-list"><div className="student-section-heading"><div><span>MY SUBJECTS</span><h2>Enrolled Courses & Academic Modules</h2></div><BookOpen size={19}/></div>{enrolledSubjects.length === 0 ? <p className="student-empty" style={{ padding: "20px 0", textAlign: "center", color: "#64748b" }}>No active course modules published for your division yet.</p> : enrolledSubjects.map((subItem)=><article key={subItem.courseCode || subItem.subjectName}><div><h3>{subItem.subjectName} {subItem.courseCode ? `(${subItem.courseCode})` : ""}</h3><p>Teacher: {subItem.teacher} · Division: {subItem.division} · Department: {subItem.branch} Engineering</p><p className="student-eval-status">Active Modules: Assignments ({subItem.totalMarks}m) · In-Sem Exam (30m) · End-Sem Exam (60m)</p></div><div><button onClick={() => navigate(activeAssignmentId ? `/student/assignments/${activeAssignmentId}` : "/student/dashboard")}>View Course Work <ChevronRight size={14}/></button></div></article>)}</section><section className="student-surface student-assignment-list"><div className="student-section-heading"><div><span>MY ASSIGNMENTS</span><h2>Assigned work</h2></div><BookOpen size={19}/></div>{assignmentItems.length === 0 ? <div className="student-empty" style={{ padding: "36px 16px", textAlign: "center", color: "#64748b" }}><BookOpen size={32} style={{ marginBottom: "12px", color: "#94a3b8" }} /><h3 style={{ fontSize: "17px", fontWeight: "600", color: "#334155", margin: "4px 0" }}>No assignments published yet.</h3><p style={{ fontSize: "13.5px", margin: 0, color: "#64748b" }}>Your teacher has not published any assignments for your division yet.</p></div> : assignmentItems.map((item)=><article key={item.id}><div><h3>{item.title}</h3><p>{item.subject} · {item.targetInfo} · {item.due} · Total Marks: {item.totalMarks}</p>{item.status === "Pending" && <p className="student-eval-status">You have not submitted any answer PDF yet.</p>}<p className="student-eval-status">Evaluation: {item.published && item.evaluation ? (item.isMissing ? "Missing / Failed" : "Results Published") : item.evaluation ? "Evaluation Completed (Pending Publication)" : "Not Evaluated"}</p></div><div><StatusBadge status={item.published && item.evaluation && !item.isMissing ? "Evaluated" : item.status}/>{item.published && item.evaluation ? <button onClick={()=>navigate(`/student/results/${item.evaluationId}`)}>View Result <ChevronRight size={14}/></button> : <button onClick={()=>navigate(`/student/assignments/${item.id}`)}>View Assignment <ChevronRight size={14}/></button>}</div></article>)}</section><section className="student-surface student-assignment-list"><div className="student-section-heading"><div><span>IN-SEM EXAMINATION</span><h2>{inSemExam.title}</h2></div><FileText size={19}/></div><article><div><h3>{inSemExam.course} ({inSemExam.courseCode})</h3><p>{inSemExam.division} · Total Marks: {inSemExam.totalMarks} · Duration: {inSemExam.duration} · {inSemExam.examDate}</p><p className="student-eval-status">Status: {inSemStatus.label}</p></div><div><StatusBadge status={inSemStatus.label}/><button onClick={()=>navigate("/student/insem")}>View Details <ChevronRight size={14}/></button></div></article></section><section className="student-surface student-assignment-list"><div className="student-section-heading"><div><span>END-SEM EXAMINATION</span><h2>{endSemExam.title}</h2></div><FileText size={19}/></div><article><div><h3>{endSemExam.course} ({endSemExam.courseCode})</h3><p>{endSemExam.division} · Total Marks: {endSemExam.totalMarks} · Duration: {endSemExam.duration} · {endSemExam.examDate}</p><p className="student-eval-status">Status: {endSemStatus.label}</p></div><div><StatusBadge status={endSemStatus.label}/><button onClick={()=>navigate("/student/endsem")}>View Details <ChevronRight size={14}/></button></div></article></section><section className="student-surface student-results-list"><div className="student-section-heading"><div><span>RECENT RESULTS</span><h2>Evaluated assignments</h2></div><CheckCircle2 size={19}/></div>{recentResults.length === 0 ? <p className="student-empty">Your results will appear here after evaluation and publication.</p> : recentResults.map((item)=><article key={item.id}><div><h3>{item.title}</h3><p>{item.subject}</p></div><div><span className="student-result-score">{item.evaluation.score} / {item.totalMarks}</span><span className="student-result-grade">{item.evaluation.grade}</span><StatusBadge status={item.isMissing ? "Missing / Failed" : "Evaluated"}/><button onClick={()=>navigate(`/student/results/${item.evaluationId}`)}>View Result <ChevronRight size={14}/></button></div></article>)}</section></div></StudentShell>;
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function StudentAssignmentsRedirect() {
  const currentStudent = getCurrentStudent();
  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }
  const activeAsgId = getActiveStudentAssignmentId(currentStudent);
  if (activeAsgId) {
    return <Navigate to={`/student/assignments/${activeAsgId}`} replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
}

export function StudentAssignmentDetail() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const currentStudent = getCurrentStudent();
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState("");
  const [submitState, setSubmitState] = useState("idle");
  const [submissionResult, setSubmissionResult] = useState(null);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  const assignment = getAssignmentById(assignmentId);
  const isPastDue = assignment ? isAssignmentPastDueDate(assignment) : false;
  const isOwner = Boolean(
    assignment &&
      assignment.status === "Published" &&
      assignment.id !== demoAssignment.id &&
      isStudentTargeted(currentStudent, assignment)
  );
  const submission = isOwner ? getStudentSubmission(currentStudent, assignmentId) : null;
  const alreadySubmitted = Boolean(submission && submission.file && submission.status !== "Pending");

  const questionPaperPdf = getQuestionPaperPdf(assignmentId);
  const questionPaperUrl = getPersistedPdfUrl(questionPaperPdf, assignment);

  const evaluationStatus = getEvaluationStatus(submission, assignmentId);
  const submissionStatusLabel = getSubmissionStatusLabel(submission, assignmentId);
  const submissionData = submission?.evaluation ? submission : null;

  const validateFile = (file) => {
    setFileError("");
    if (!file) return false;
    const isPdfType = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfType) {
      setFileError("Only PDF files are supported. Please select a valid PDF document.");
      return false;
    }
    if (file.size === 0) {
      setFileError("The selected file is empty (0 bytes). Please upload a valid PDF document.");
      return false;
    }
    if (file.size > 25 * 1024 * 1024) {
      setFileError("File size exceeds maximum limit of 25MB.");
      return false;
    }
    return true;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setFileError("Please select a PDF file before submitting.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSubmit = () => {
    setShowConfirm(false);
    setSubmitState("submitting");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const result = submitAssignment(currentStudent, assignmentId, selectedFile, dataUrl);

      if (result.error) {
        setFileError(result.error);
        setSubmitState("idle");
        return;
      }

      setSubmissionResult(result);
      setSubmitState("success");
    };
    reader.onerror = () => {
      setFileError("Failed to read the file. Please try again.");
      setSubmitState("idle");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDownloadQuestionPaper = () => {
    if (!questionPaperPdf) return;
    const link = document.createElement("a");
    link.href = questionPaperUrl;
    link.download = questionPaperPdf.name || "Question_Paper.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOwner) {
    return <StudentShell student={currentStudent} submission={getStudentSubmission(currentStudent)}><div className="student-page"><Link className="student-back-result" to="/student/dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link><header className="student-result-header"><div><span>ASSIGNMENT</span><h1>Access Denied</h1><p>The requested assignment could not be found or is not assigned to you.</p></div></header><div className="student-result-grid"><section className="student-surface student-access-denied"><ShieldAlert size={26}/><h2>Submission Not Found</h2><p>We could not locate the requested assignment for your account. You can only view assignments assigned to you.</p></section></div></div></StudentShell>;
  }

  return <StudentShell student={currentStudent} submission={submission}><div className="student-page"><Link className="student-back-result" to="/student/dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link><header className="student-result-header"><div><span>ASSIGNMENT DETAILS</span><h1>{assignment.title}</h1><p>{assignment.subject} ({assignment.courseCode}) · {assignment.division}</p></div><div className="student-score"><StatusBadge status={submissionStatusLabel} /></div></header><div className="student-result-grid"><div className="student-content-grid"><section className="student-surface"><div className="student-section-heading"><div><span>ASSIGNMENT DETAILS</span><h2>Overview</h2></div><BookOpen size={19}/></div><div className="student-detail-grid"><div><span>Subject</span><strong>{assignment.subject} ({assignment.courseCode})</strong></div><div><span>Topic</span><strong>{assignment.topic}</strong></div><div><span>Teacher</span><strong>{assignment.teacher}</strong></div><div><span>Total Marks</span><strong>{assignment.totalMarks}</strong></div><div><span>Due Date</span><strong>{assignment.dueDate}</strong></div><div><span>Submission</span><strong>{submissionStatusLabel}</strong></div><div><span>Evaluation</span><strong>{evaluationStatus.label}</strong></div><div><span>Created</span><strong>{assignment.createdDate}</strong></div></div><h3 className="student-detail-subheading">Description / Instructions</h3><p className="student-detail-description">{assignment.description}</p></section><section className="student-surface"><div className="student-section-heading"><div><span>QUESTION PAPER</span><h2>Assignment question paper</h2></div><FileText size={19}/></div>{questionPaperPdf ? <><div className="student-qp-actions"><button type="button" onClick={()=>setShowQuestionPaper(true)}><Eye size={15}/> View PDF</button><button type="button" onClick={handleDownloadQuestionPaper}><Download size={15}/> Download PDF</button></div><p className="student-qp-file">File: {questionPaperPdf.name} · {formatFileSize(questionPaperPdf.size)}</p></> : <div className="student-qp-empty"><FileWarning size={18}/><p>Question paper is not available yet. Please contact your teacher.</p></div>}</section><section className="student-surface">{alreadySubmitted ? <><div className="student-section-heading"><div><span>SUBMISSION</span><h2>Already Submitted</h2></div><StatusBadge status={submissionStatusLabel} /></div><div className="student-submission-details"><div><span>Status</span><strong>{submissionData?.submissionStatus || submissionStatusLabel}</strong></div><div><span>File</span><strong>{submissionData?.fileName || submission.file}</strong></div><div><span>Submitted</span><strong>{submissionData?.submissionDate || submission.submittedAt}</strong></div><div><span>Evaluation</span><strong>{evaluationStatus.label}</strong></div></div><p className="student-eval-status">Your answer has already been submitted.</p>{evaluationStatus.key === "result-available" && <button className="student-result-link" onClick={()=>navigate(`/student/results/${submission.evaluationId}`)}>View Result <ChevronRight size={14}/></button>}</> : <><div className="student-section-heading"><div><span>SUBMISSION</span><h2>Submit Your Answer</h2></div><StatusBadge status={submissionStatusLabel} /></div>{submitState === "success" ? <div className="student-submit-success"><CheckCircle2 size={20}/><h3>Submission Successful</h3><p>Assignment: {assignment.title}</p><p>Status: Submitted</p><p>Answer File: {submissionResult?.submission?.fileName || submissionResult?.submission?.file}</p><p>Submitted: {submissionResult?.submission?.submissionDate || submissionResult?.submission?.submittedAt}</p><p className="student-eval-status">Evaluation: Waiting for Evaluation</p></div> : <div className="student-submit-form"><span className="student-upload-title">Upload Your Answer PDF</span><label className={`student-upload-dropzone ${dragActive ? "is-dragging" : ""}`} onDragOver={(event)=>{event.preventDefault(); setDragActive(true);}} onDragLeave={()=>setDragActive(false)} onDrop={handleDrop}><input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} /><Upload size={20}/><strong>Drag & drop your PDF here</strong><span className="student-browse-btn">Browse Files</span></label><p className="student-upload-note">Accepted format: PDF only</p>{selectedFile && <div className="student-file-card"><FileText size={18}/><div className="student-file-info"><span className="student-file-label">Selected File:</span><strong className="student-file-name">{selectedFile.name}</strong><span className="student-file-label">File Size:</span><span className="student-file-size">{formatFileSize(selectedFile.size)}</span></div><button type="button" className="student-replace-btn" onClick={()=>fileInputRef.current?.click()}>Replace PDF</button></div>}{fileError && <div className="student-upload-error" role="alert"><FileWarning size={14}/>{fileError}</div>}{submitState === "uploading" && <div className="student-submit-progress"><Loader2 size={16} className="spin"/>Uploading...</div>}{submitState === "submitting" && <div className="student-submit-progress"><Loader2 size={16} className="spin"/>Submitting...</div>}<button className="student-submit-btn" onClick={handleSubmit} disabled={!selectedFile || submitState === "uploading" || submitState === "submitting"}>Submit Assignment</button></div>}</>}</section></div><aside className="student-side"><section className="student-surface"><span>SUBMISSION STATUS</span><h2 className="student-side-title">Current status</h2><p className="student-side-copy">{alreadySubmitted ? "You have already submitted this assignment. No further action is required." : "Upload your answer PDF to submit this assignment for evaluation."}</p><div className="student-status-pill"><StatusBadge status={submissionStatusLabel} /></div><div className="student-eval-pill"><StatusBadge status={evaluationStatus.label} /></div></section></aside></div></div>{showQuestionPaper && questionPaperPdf && <div className="student-qp-backdrop" role="presentation" onMouseDown={()=>setShowQuestionPaper(false)}><div className="student-qp-modal" role="dialog" aria-modal="true" onMouseDown={(e)=>e.stopPropagation()}><div className="student-qp-header"><div><FileText size={17}/><div><strong>Question Paper</strong><span>{assignment.title}</span></div></div><button type="button" onClick={()=>setShowQuestionPaper(false)} aria-label="Close"><X size={17}/></button></div><div className="student-qp-body"><div className="student-qp-meta"><span>Subject: {assignment.subject}</span><span>Total Marks: {assignment.totalMarks}</span><span>Due: {assignment.dueDate}</span></div><div className="student-qp-pdf"><iframe src={questionPaperUrl} title={questionPaperPdf.name} className="student-qp-frame" /></div></div></div></div>}{showConfirm && <div className="student-qp-backdrop" role="presentation" onMouseDown={()=>setShowConfirm(false)}><div className="student-confirm-modal" role="dialog" aria-modal="true" onMouseDown={(e)=>e.stopPropagation()}><div className="student-confirm-icon"><AlertTriangle size={22}/></div><h2>Submit Assignment?</h2><p>Are you sure you want to submit this answer? Make sure you have uploaded the correct PDF.</p><div className="student-confirm-file"><FileText size={16}/><span>{selectedFile?.name}</span><small>{formatFileSize(selectedFile?.size)}</small></div><div className="student-confirm-actions"><button type="button" className="student-confirm-cancel" onClick={()=>setShowConfirm(false)}>Cancel</button><button type="button" className="student-confirm-submit" onClick={confirmSubmit}>Submit Answer</button></div></div></div>}</StudentShell>;
}

export function StudentResult() {
  const { assignmentId } = useParams();
  const currentStudent = getCurrentStudent();

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  const normalizeRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const studentRollNorm = normalizeRoll(currentStudent.roll);

  let submission = getSubmissionById(assignmentId) || getSubmissionByEvaluationId(assignmentId) || getStudentSubmission(currentStudent, assignmentId);
  const targetAsg = getAssignmentById(submission?.assignmentId || assignmentId);
  let title = targetAsg?.title || (submission?.assignmentId ? "Assignment Result" : demoAssignment.title);
  let published = isResultsPublished(submission?.assignmentId || assignmentId || targetAsg?.id || demoAssignment.id);
  let totalMarks = targetAsg?.totalMarks || demoAssignment.totalMarks;
  const isPastDue = targetAsg ? isAssignmentPastDueDate(targetAsg) : false;
  const isMissingFailed = submission?.status === "Missing / Failed" || submission?.evaluation?.evaluationStatus === "Missing / Failed" || submission?.isNonSubmissionZero;
  let isOwner = Boolean(
    submission &&
    currentStudent &&
    (submission.studentId === currentStudent.id ||
      normalizeRoll(submission.roll || submission.rollNumber) === studentRollNorm) &&
    (!targetAsg || targetAsg.id === demoAssignment.id || isStudentTargeted(currentStudent, targetAsg))
  );

  if (!submission) {
    const inSemExam = getInSemExam();
    const inSemSub = getInSemSubmissionByEvaluationId(assignmentId) || getInSemSubmissionById(assignmentId) || (assignmentId === inSemExam.id ? getInSemSubmissionByStudent(currentStudent) : null);
    if (inSemSub) {
      submission = inSemSub;
      title = inSemExam.title;
      published = isInSemResultsPublished();
      totalMarks = inSemExam.totalMarks;
      isOwner = Boolean(
        currentStudent &&
        (inSemSub.studentId === currentStudent.id ||
          normalizeRoll(inSemSub.rollNumber || inSemSub.roll) === studentRollNorm)
      );
    }
  }

  if (!submission) {
    const endSemExam = getEndSemExam();
    const endSemSub = getEndSemSubmissionByEvaluationId(assignmentId) || getEndSemSubmissionById(assignmentId) || (assignmentId === endSemExam.id ? getEndSemSubmissionByStudent(currentStudent) : null);
    if (endSemSub) {
      submission = endSemSub;
      title = endSemExam.title;
      published = isEndSemResultsPublished();
      totalMarks = endSemExam.totalMarks;
      isOwner = Boolean(
        currentStudent &&
        (endSemSub.studentId === currentStudent.id ||
          normalizeRoll(endSemSub.rollNumber || endSemSub.roll) === studentRollNorm)
      );
    }
  }

  const evaluation = (isOwner && (published || isPastDue || isMissingFailed)) ? submission.evaluation : null;

  if (!isOwner || !evaluation) {
    const isPendingPub = isOwner && submission && !published && !isPastDue && !isMissingFailed;
    return (
      <StudentShell student={currentStudent} submission={null}>
        <div className="student-page">
          <Link className="student-back-result" to="/student/dashboard">
            <ArrowLeft size={15} /> Back to Dashboard
          </Link>
          <header className="student-result-header">
            <div>
              <span>RELEASED RESULT</span>
              <h1>{isPendingPub ? "Result Pending Publication" : "Result Not Found"}</h1>
              <p>{isPendingPub ? "Your evaluation is complete and awaiting teacher publication." : "The requested result could not be found or is not assigned to you."}</p>
            </div>
          </header>
          <div className="student-result-grid">
            <section className="student-surface" style={{ padding: "30px", textAlign: "center" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>{isPendingPub ? "Result Not Yet Published" : "No result available"}</h2>
              <p style={{ color: "#64748b" }}>{isPendingPub ? "Results will become visible here once the teacher publishes them." : "We could not locate a result for the requested assignment."}</p>
            </section>
          </div>
        </div>
      </StudentShell>
    );
  }

  const studentName = submission.student || submission.studentName || currentStudent.name;
  const maxMarks = evaluation.totalMarks || totalMarks;
  const percentage = Math.round((evaluation.score / maxMarks) * 100);

  const rubricItems = Array.isArray(evaluation.questionWiseResults) && evaluation.questionWiseResults.length > 0
    ? evaluation.questionWiseResults.map((q) => ({
        name: `Q${q.questionNumber || q.id}: ${q.questionText || ""}`.trim(),
        score: q.awardedMarks ?? q.score ?? 0,
        max: q.maximumMarks ?? q.marks ?? 10,
        reason: q.feedback || q.reason || "Evaluated against rubric guidelines.",
      }))
    : Array.isArray(evaluation.rubric) && evaluation.rubric.length > 0
    ? evaluation.rubric
    : null;

  return (
    <StudentShell student={currentStudent} submission={submission}>
      <div className="student-page">
        <Link className="student-back-result" to="/student/dashboard">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
        <header className="student-result-header">
          <div>
            <span>RELEASED RESULT</span>
            <h1>{title}</h1>
            <p>
              {targetAsg?.subjectName || targetAsg?.subject || "Subject"} ({targetAsg?.courseCode || ""}) · Feedback for {studentName} · {submission.roll || submission.rollNumber}
            </p>
          </div>
          <div className="student-score">
            <strong>{evaluation.score} <small>/ {maxMarks}</small></strong>
            <span>{percentage}% · {evaluation.grade}</span>
          </div>
        </header>
        <div className="student-result-grid">
          <section className="student-surface">
            <div className="student-section-heading">
              <div>
                <span>RUBRIC BREAKDOWN</span>
                <h2>Your assessment outcome</h2>
              </div>
            </div>
            {isMissingFailed ? (
              <div style={{ padding: "16px 0", color: "#b91c1c", fontWeight: 600 }}>
                Assignment was not submitted before the deadline.
              </div>
            ) : rubricItems ? (
              rubricItems.map((item) => (
                <div className="student-rubric" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.reason}</p>
                  </div>
                  <b>{item.score} / {item.max}</b>
                </div>
              ))
            ) : (
              <div style={{ padding: "16px 0", color: "#64748b", fontSize: "13.5px" }}>
                Question-wise breakdown is not available for this evaluation.
              </div>
            )}
          </section>
          <aside className="student-side">
            <section className="student-surface student-feedback-full">
              <span>ASSESSMENT STATUS</span>
              <h2>{isMissingFailed ? "Missing / Failed" : "Assessment feedback"}</h2>
              <p>
                {isMissingFailed
                  ? "Assignment was not submitted before the deadline."
                  : `${evaluation.feedback?.strengths || ""} ${evaluation.feedback?.improvements || ""}`}
              </p>
            </section>
            <section className="student-surface">
              <span>LEARNING RECOMMENDATIONS</span>
              <ul>
                <li>{evaluation.feedback?.missing || "Assignment was not submitted before the deadline."}</li>
                <li>Review core concepts and problem solving techniques.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </StudentShell>
  );
}

// ===== IN-SEM EXAMINATION STUDENT RESULT (Phase 3B) =====
// Students can ONLY view their In-Sem result after the teacher publishes it.
// Strict data isolation — the result is fetched only for the logged-in student.
export function StudentInSemResult() {
  const currentStudent = getCurrentStudent();

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  const exam = getInSemExam();
  const submission = getInSemStudentResult(currentStudent);
  const status = getInSemStudentStatus(currentStudent);

  // If the result is not published, show the status only — never the marks.
  if (!submission || !submission.evaluation) {
    return <StudentShell student={currentStudent} submission={null}><div className="student-page"><Link className="student-back-result" to="/student/dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link><header className="student-result-header"><div><span>IN-SEM EXAMINATION</span><h1>{exam.title}</h1><p>{exam.course} ({exam.courseCode}) · {exam.division}</p></div><div className="student-score"><StatusBadge status={status.label} /></div></header><div className="student-result-grid"><section className="student-surface"><div className="student-section-heading"><div><span>EXAMINATION STATUS</span><h2>Result not yet published</h2></div></div><p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.7", marginTop: "14px" }}>Your In-Sem Examination result will appear here after the teacher publishes it. You will receive a notification when your result is available.</p><div className="student-status-pill" style={{ marginTop: "16px" }}><StatusBadge status={status.label} /></div></section><aside className="student-side"><section className="student-surface"><span>EXAMINATION DETAILS</span><h2 className="student-side-title">{exam.title}</h2><p className="student-side-copy">{exam.description}</p><div className="student-detail-grid" style={{ marginTop: "14px" }}><div><span>Total Marks</span><strong>{exam.totalMarks}</strong></div><div><span>Duration</span><strong>{exam.duration}</strong></div><div><span>Exam Date</span><strong>{exam.examDate}</strong></div></div></section></aside></div></div></StudentShell>;
  }

  const evaluation = submission.evaluation;
  const percentage = Math.round((evaluation.score / evaluation.totalMarks) * 100);

  return <StudentShell student={currentStudent} submission={null}><div className="student-page"><Link className="student-back-result" to="/student/dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link><header className="student-result-header"><div><span>IN-SEM EXAMINATION RESULT</span><h1>{exam.title}</h1><p>Published result for {currentStudent.name} · {currentStudent.roll}</p></div><div className="student-score"><strong>{evaluation.score} <small>/ {evaluation.totalMarks}</small></strong><span>{percentage}% · {evaluation.grade}</span></div></header><div className="student-result-grid"><section className="student-surface"><div className="student-section-heading"><div><span>RUBRIC BREAKDOWN</span><h2>Your examination outcome</h2></div></div>{evaluation.rubric.map((item)=><div className="student-rubric" key={item.name}><div><strong>{item.name}</strong><p>{item.reason}</p></div><b>{item.score} / {item.max}</b></div>)}</section><aside className="student-side"><section className="student-surface student-feedback-full"><span>AI FEEDBACK</span><h2>Examination feedback</h2><p>{evaluation.feedback.strengths} {evaluation.feedback.improvements}</p></section><section className="student-surface"><span>LEARNING RECOMMENDATIONS</span><ul><li>{evaluation.feedback.missing}</li><li>Review the sampling theorem derivation.</li><li>Practice identifying aliasing in frequency-domain plots.</li></ul></section></aside></div></div></StudentShell>;
}


// ===== END-SEM EXAMINATION STUDENT RESULT (Phase 3C) =====
// Students can ONLY view their End-Sem result after the teacher publishes it.
// Strict data isolation — the result is fetched only for the logged-in student.
export function StudentEndSemResult() {
  const currentStudent = getCurrentStudent();

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  const exam = getEndSemExam();
  const submission = getEndSemStudentResult(currentStudent);
  const status = getEndSemStudentStatus(currentStudent);

  // If the result is not published, show the status only — never the marks.
  if (!submission || !submission.evaluation) {
    return <StudentShell student={currentStudent} submission={null}><div className="student-page"><Link className="student-back-result" to="/student/dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link><header className="student-result-header"><div><span>END-SEM EXAMINATION</span><h1>{exam.title}</h1><p>{exam.course} ({exam.courseCode}) · {exam.division}</p></div><div className="student-score"><StatusBadge status={status.label} /></div></header><div className="student-result-grid"><section className="student-surface"><div className="student-section-heading"><div><span>EXAMINATION STATUS</span><h2>Result not yet published</h2></div></div><p style={{ color: "#64748b", fontSize: "13px", lineHeight: "1.7", marginTop: "14px" }}>Your End-Sem Examination result will appear here after the teacher publishes it. You will receive a notification when your result is available.</p><div className="student-status-pill" style={{ marginTop: "16px" }}><StatusBadge status={status.label} /></div></section><aside className="student-side"><section className="student-surface"><span>EXAMINATION DETAILS</span><h2 className="student-side-title">{exam.title}</h2><p className="student-side-copy">{exam.description}</p><div className="student-detail-grid" style={{ marginTop: "14px" }}><div><span>Total Marks</span><strong>{exam.totalMarks}</strong></div><div><span>Duration</span><strong>{exam.duration}</strong></div><div><span>Exam Date</span><strong>{exam.examDate}</strong></div></div></section></aside></div></div></StudentShell>;
  }

  const evaluation = submission.evaluation;
  const percentage = Math.round((evaluation.score / evaluation.totalMarks) * 100);

  return <StudentShell student={currentStudent} submission={null}><div className="student-page"><Link className="student-back-result" to="/student/dashboard"><ArrowLeft size={15}/> Back to Dashboard</Link><header className="student-result-header"><div><span>END-SEM EXAMINATION RESULT</span><h1>{exam.title}</h1><p>Published result for {currentStudent.name} · {currentStudent.roll}</p></div><div className="student-score"><strong>{evaluation.score} <small>/ {evaluation.totalMarks}</small></strong><span>{percentage}% · {evaluation.grade}</span></div></header><div className="student-result-grid"><section className="student-surface"><div className="student-section-heading"><div><span>RUBRIC BREAKDOWN</span><h2>Your examination outcome</h2></div></div>{evaluation.rubric.map((item)=><div className="student-rubric" key={item.name}><div><strong>{item.name}</strong><p>{item.reason}</p></div><b>{item.score} / {item.max}</b></div>)}</section><aside className="student-side"><section className="student-surface student-feedback-full"><span>AI FEEDBACK</span><h2>Examination feedback</h2><p>{evaluation.feedback.strengths} {evaluation.feedback.improvements}</p></section><section className="student-surface"><span>LEARNING RECOMMENDATIONS</span><ul><li>{evaluation.feedback.missing}</li><li>Review the sampling theorem derivation.</li><li>Practice identifying aliasing in frequency-domain plots.</li></ul></section></aside></div></div></StudentShell>;
}

// ===== STUDENT RESULTS CENTER (Phase 7C) =====
// Aggregates published results across Assignments (/20), In-Sem (/30), and End-Sem (/60).
// Enforces publication check: Approved ≠ Published.
// Strict data isolation — results are fetched strictly for the logged-in student.
export function StudentResultsCenter() {
  const navigate = useNavigate();
  const currentStudent = getCurrentStudent();
  const [filter, setFilter] = useState("all");

  if (!currentStudent) {
    return <Navigate to="/student/login" replace />;
  }

  const inSemResult = getInSemStudentResult(currentStudent);
  const endSemResult = getEndSemStudentResult(currentStudent);
  const inSemExam = getInSemExam();
  const endSemExam = getEndSemExam();

  const publishedResults = [];

  const targetedPublished = (createdAssessments || []).filter(
    (a) => a && a.status === "Published" && a.id !== demoAssignment.id && isStudentTargeted(currentStudent, a)
  );

  targetedPublished.forEach((asg) => {
    const sub = getStudentSubmission(currentStudent, asg.id);
    const published = isResultsPublished(asg.id);
    const isPastDue = isAssignmentPastDueDate(asg);
    const isMissingFailed = sub?.status === "Missing / Failed" || sub?.evaluation?.evaluationStatus === "Missing / Failed" || sub?.isNonSubmissionZero;
    if (sub && sub.evaluation && (published || isPastDue || isMissingFailed)) {
      const scoreNum = typeof sub.evaluation.obtainedMarks === "number"
        ? sub.evaluation.obtainedMarks
        : (typeof sub.evaluation.score === "number" ? sub.evaluation.score : parseFloat(String(sub.evaluation.score || 0).split("/")[0].trim()) || 0);
      const totalMarks = sub.evaluation.totalMarks || asg.totalMarks || 20;
      const pct = Math.round((scoreNum / totalMarks) * 100);
      publishedResults.push({
        id: sub.evaluationId || `eval-${asg.id}-${currentStudent.id}`,
        assignmentId: asg.id,
        title: asg.title || "Assignment",
        subject: `${asg.courseCode || ""} · ${asg.subjectName || asg.course || asg.subject || "Subject"}`.trim(),
        type: "Assignment",
        rawType: "assignment",
        score: scoreNum,
        totalMarks,
        percentage: pct,
        grade: isMissingFailed ? "F" : sub.evaluation.grade,
        passStatus: isMissingFailed ? "Missing / Failed" : (pct >= 60 ? "Pass" : "Needs Improvement"),
        route: `/student/results/${sub.evaluationId || asg.id}`,
        evaluation: sub.evaluation,
        isMissingFailed,
      });
    }
  });

  if (inSemResult && inSemResult.evaluation) {
    const score = inSemResult.evaluation.score;
    const totalMarks = inSemResult.evaluation.totalMarks || inSemExam.totalMarks;
    const pct = Math.round((score / totalMarks) * 100);
    publishedResults.push({
      id: inSemExam.id,
      title: inSemExam.title,
      subject: `${inSemExam.courseCode} · ${inSemExam.course}`,
      type: "In-Sem Examination",
      rawType: "in-sem",
      score,
      totalMarks,
      percentage: pct,
      grade: inSemResult.evaluation.grade,
      passStatus: pct >= 60 ? "Pass" : "Needs Improvement",
      route: "/student/insem",
      evaluation: inSemResult.evaluation,
    });
  }

  if (endSemResult && endSemResult.evaluation) {
    const score = endSemResult.evaluation.score;
    const totalMarks = endSemResult.evaluation.totalMarks || endSemExam.totalMarks;
    const pct = Math.round((score / totalMarks) * 100);
    publishedResults.push({
      id: endSemExam.id,
      title: endSemExam.title,
      subject: `${endSemExam.courseCode} · ${endSemExam.course}`,
      type: "End-Sem Examination",
      rawType: "end-sem",
      score,
      totalMarks,
      percentage: pct,
      grade: endSemResult.evaluation.grade,
      passStatus: pct >= 60 ? "Pass" : "Needs Improvement",
      route: "/student/endsem",
      evaluation: endSemResult.evaluation,
    });
  }

  const filteredResults = filter === "all"
    ? publishedResults
    : publishedResults.filter((r) => r.rawType === filter);

  const totalPublished = publishedResults.length;
  const avgPercentage = totalPublished > 0
    ? Math.round(publishedResults.reduce((sum, item) => sum + item.percentage, 0) / totalPublished)
    : null;
  const bestResult = totalPublished > 0
    ? [...publishedResults].sort((a, b) => b.percentage - a.percentage)[0]
    : null;

  return (
    <StudentShell student={currentStudent} submission={null}>
      <div className="student-page">
        <header className="student-welcome">
          <div>
            <span>PERFORMANCE CENTER</span>
            <h1>Published Academic Results</h1>
            <p>Track your published grades, evaluation outcomes, and academic progress for {currentStudent.name}.</p>
          </div>
          <div className="student-performance">
            <TrendingUp size={18} />
            <span>Average performance</span>
            <strong>{avgPercentage !== null ? `${avgPercentage}%` : "—"}</strong>
          </div>
        </header>

        {/* KPI Summary Row */}
        <div className="student-stat-grid student-stat-grid-five">
          <div>
            <span>Published Results</span>
            <strong>{totalPublished}</strong>
            <small>Available to view</small>
          </div>
          <div>
            <span>Average Score</span>
            <strong>{avgPercentage !== null ? `${avgPercentage}%` : "—"}</strong>
            <small>Across published work</small>
          </div>
          <div>
            <span>Best Performance</span>
            <strong>{bestResult ? `${bestResult.percentage}%` : "—"}</strong>
            <small>{bestResult ? bestResult.title.split(" — ")[0] : "No results yet"}</small>
          </div>
          <div>
            <span>Pass Threshold</span>
            <strong>60%</strong>
            <small>Academic standard</small>
          </div>
          <div>
            <span>Status</span>
            <strong>{avgPercentage !== null && avgPercentage >= 60 ? "Good Standing" : "Enrolled"}</strong>
            <small>Current term status</small>
          </div>
        </div>

        {/* Filters & Results List */}
        <section className="student-surface student-assignment-list" style={{ marginTop: "24px" }}>
          <div className="student-section-heading">
            <div>
              <span>RESULTS & EVALUATION</span>
              <h2>Published Grade Cards</h2>
            </div>
            <div className="student-qp-meta" style={{ margin: 0 }}>
              {["all", "assignment", "in-sem", "end-sem"].map((f) => (
                <button
                  type="button"
                  key={f}
                  className={`student-nav-item ${filter === f ? "active" : ""}`}
                  style={{ textTransform: "capitalize", padding: "5px 12px", cursor: "pointer" }}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "All Results" : f === "assignment" ? "Assignments" : f === "in-sem" ? "In-Sem (/30)" : "End-Sem (/60)"}
                </button>
              ))}
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <p className="student-empty" style={{ padding: "36px 0" }}>
              {totalPublished === 0
                ? "No published results available yet. Results will appear here immediately after your teacher publishes them."
                : "No results match the selected category filter."}
            </p>
          ) : (
            filteredResults.map((item) => (
              <article key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.subject} · Maximum Marks: {item.totalMarks}</p>
                  <p className="student-eval-status">
                    Obtained: <strong>{item.score} / {item.totalMarks}</strong> ({item.percentage}%) · Academic Status: <span style={{ color: item.percentage >= 60 ? "#166534" : "#b91c1c", fontWeight: 700 }}>{item.passStatus}</span>
                  </p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="student-result-score">{item.score} / {item.totalMarks}</span>
                    <span className="student-result-grade">{item.grade}</span>
                  </div>
                  <button type="button" onClick={() => navigate(item.route)}>
                    View Details <ChevronRight size={14} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {/* Performance Trend Surface */}
        {totalPublished > 0 && (
          <section className="student-surface student-trend">
            <div className="student-section-heading">
              <div>
                <span>PERFORMANCE TREND</span>
                <h2>Comparative Assessment Scores</h2>
              </div>
              <TrendingUp size={19} />
            </div>
            <div className="trend-bars">
              {publishedResults.map((res) => (
                <div key={res.id}>
                  <i style={{ height: `${res.percentage}%` }} title={`${res.title}: ${res.percentage}%`} />
                  <span>{res.type.split(" ")[0]} ({res.percentage}%)</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </StudentShell>
  );
}