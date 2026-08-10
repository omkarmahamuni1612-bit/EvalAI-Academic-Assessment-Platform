import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { StudentDashboard, StudentLogin, StudentResult } from "./pages/StudentPortal";
import TeacherAnalyticsPage from "./pages/TeacherAnalyticsPage";
import TeacherReportsPage from "./pages/TeacherReportsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/results/:assignmentId" element={<StudentResult />} />

        {/* TEACHER PORTAL (NESTED UNDER TEACHER LAYOUT) */}
        <Route path="/teacher" element={<TeacherLayout />}>
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
  );
}

export default App;
