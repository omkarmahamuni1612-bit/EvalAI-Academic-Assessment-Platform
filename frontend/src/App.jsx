import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getCurrentStudent } from "./auth/studentAuth";
import { getCurrentTeacher } from "./auth/teacherAuth";
import LandingPage from "./pages/LandingPage";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import CreateAssignmentPage from "./pages/CreateAssignmentPage";
import {
  EvaluationPage,
  EvaluationResultPage,
  SelectSubmissionPage,
  StudentReportPage,
  SubmissionDetailPage,
  SubmissionsPage,
} from "./pages/WorkflowPages";
import { StudentAssignmentDetail, StudentAssignmentsRedirect, StudentDashboard, StudentEndSemResult, StudentInSemResult, StudentLogin, StudentResult, StudentResultsCenter } from "./pages/StudentPortal";
import TeacherAnalyticsPage from "./pages/TeacherAnalyticsPage";
import TeacherReportsPage from "./pages/TeacherReportsPage";
import { InSemEvaluationResultPage, InSemExaminationPage } from "./pages/InSemExaminationPage";
import { EndSemEvaluationResultPage, EndSemExaminationPage } from "./pages/EndSemExaminationPage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("EvalAI ErrorBoundary caught an exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h2 style={{ fontSize: "20px", color: "#1e293b", marginBottom: "12px" }}>Application Error Detected</h2>
          <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "20px", maxWidth: "600px" }}>{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", cursor: "pointer", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600 }}>Reload Application</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protect the Student Portal: unauthenticated visitors are redirected to Student Login.
function RequireStudentAuth({ children }) {
  if (!getCurrentStudent()) {
    return <Navigate to="/student/login" replace />;
  }
  return children;
}

// Protect the Teacher Portal: unauthenticated visitors are redirected to Teacher Login.
function RequireTeacherAuth({ children }) {
  if (!getCurrentTeacher()) {
    return <Navigate to="/teacher/login" replace />;
  }
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route
          path="/student/dashboard"
          element={
            <RequireStudentAuth>
              <StudentDashboard />
            </RequireStudentAuth>
          }
        />
        <Route
          path="/student/results"
          element={
            <RequireStudentAuth>
              <StudentResultsCenter />
            </RequireStudentAuth>
          }
        />
        <Route
          path="/student/results/:assignmentId"
          element={
            <RequireStudentAuth>
              <StudentResult />
            </RequireStudentAuth>
          }
        />
        <Route
          path="/student/assignments"
          element={
            <RequireStudentAuth>
              <StudentAssignmentsRedirect />
            </RequireStudentAuth>
          }
        />
        <Route
          path="/student/assignments/:assignmentId"
          element={
            <RequireStudentAuth>
              <StudentAssignmentDetail />
            </RequireStudentAuth>
          }
        />
        <Route
          path="/student/insem"
          element={
            <RequireStudentAuth>
              <StudentInSemResult />
            </RequireStudentAuth>
          }
        />
        <Route
          path="/student/endsem"
          element={
            <RequireStudentAuth>
              <StudentEndSemResult />
            </RequireStudentAuth>
          }
        />

        {/* TEACHER PORTAL (NESTED UNDER TEACHER LAYOUT) */}
        <Route
          path="/teacher"
          element={
            <RequireTeacherAuth>
              <TeacherLayout />
            </RequireTeacherAuth>
          }
        >
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="create-assignment" element={<CreateAssignmentPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="submissions/:submissionId" element={<SubmissionDetailPage />} />
          <Route path="evaluate" element={<SelectSubmissionPage />} />
          <Route path="evaluate/:submissionId" element={<EvaluationPage />} />
          <Route path="evaluations/:evaluationId" element={<EvaluationResultPage />} />
          <Route path="reports/:evaluationId" element={<StudentReportPage />} />
          <Route path="analytics" element={<TeacherAnalyticsPage />} />
          <Route path="reports" element={<TeacherReportsPage />} />
          <Route path="insem" element={<InSemExaminationPage />} />
          <Route path="insem/evaluations/:evaluationId" element={<InSemEvaluationResultPage />} />
          <Route path="endsem" element={<EndSemExaminationPage />} />
          <Route path="endsem/evaluations/:evaluationId" element={<EndSemEvaluationResultPage />} />
          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="Teacher Portal Settings"
                description="Manage course preferences, evaluation thresholds, and account details."
              />
            }
          />
        </Route>

        {/* FALLBACK REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
 }

export default App;
