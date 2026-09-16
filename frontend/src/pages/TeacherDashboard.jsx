import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  PlusCircle,
  FileCheck2,
  Cpu,
  FileSpreadsheet,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Calendar,
  BarChart2,
  Loader2
} from "lucide-react";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  teacherProfile,
  performanceOverviewData,
  submissionStatusData,
  upcomingAssignments,
  recentActivity
} from "../data/mockData";
import { demoAssignment, getClassAnalytics, workflowSubmissions, getDashboardOverviewData, createdAssessments } from "../data/workflowData";
import { getInSemExam, getInSemSubmissions } from "../data/inSemData";
import { getEndSemExam, getEndSemSubmissions } from "../data/endSemData";
import "./TeacherDashboard.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function AnimatedMetric({ value }) {
  const isPercentage = value.includes("%");
  const target = parseFloat(value) || 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 800; // ms
    const steps = 40;
    const stepTime = duration / steps;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  if (isPercentage) {
    return <>{current.toFixed(1)}%</>;
  }
  return <>{Math.round(current).toLocaleString()}</>;
}

function TeacherDashboard() {
  const navigate = useNavigate();
  const inSemSubs = getInSemSubmissions();
  const endSemSubs = getEndSemSubmissions();
  const inSemExamData = getInSemExam();
  const endSemExamData = getEndSemExam();

  const overview = getDashboardOverviewData(inSemSubs, endSemSubs, inSemExamData, endSemExamData);

  const dynamicKpiCards = [
    { id: "total-students", title: "Total Students", value: String(overview.totalStudents), change: "Across active courses", changeType: "positive", icon: Users, tone: "stat-total-students" },
    { id: "total-assessments", title: "Total Assessments", value: String(overview.totalAssessments), change: "Assignment, In-Sem & End-Sem", changeType: "neutral", icon: BookOpen, tone: "stat-active-assignments" },
    { id: "pending-evaluations", title: "Pending Evaluations", value: String(overview.pendingCount), change: "Awaiting evaluation/review", changeType: overview.pendingCount > 0 ? "warning" : "positive", icon: Clock, tone: "stat-pending-evaluations" },
    { id: "evaluated", title: "Evaluated Papers", value: String(overview.evaluatedCount), change: "AI & teacher evaluated", changeType: "positive", icon: CheckCircle2, tone: "stat-total-students" },
    { id: "approved", title: "Approved Evaluations", value: String(overview.approvedCount), change: "Teacher approved", changeType: "positive", icon: FileCheck2, tone: "stat-average-score" },
    { id: "published", title: "Published Results", value: String(overview.publishedCount), change: "Released to students", changeType: "positive", icon: TrendingUp, tone: "stat-average-score" },
  ];

  const getStatusBadge = (status, statusType) => {
    let badgeClass = "badge-success";
    let icon = <CheckCircle2 size={13} />;

    if (statusType === "warning") {
      badgeClass = "badge-warning";
      icon = <Clock size={13} />;
    } else if (statusType === "processing") {
      badgeClass = "badge-processing";
      icon = <Loader2 size={13} className="spin-icon" />;
    }

    return (
      <span className={`status-pill ${badgeClass}`}>
        {icon}
        {status}
      </span>
    );
  };

  return (
    <div className="teacher-dashboard">
      {/* DASHBOARD HEADER */}
      <div className="dashboard-header">
        <div className="header-text">
          <h1>{getGreeting()}, {teacherProfile.name}</h1>
          <p>Here's your assessment overview for today.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="primary-btn dashboard-cta-btn"
            onClick={() => navigate("/teacher/create-assignment")}
          >
            <PlusCircle size={17} style={{ marginRight: "6px" }} /> Create Assessment
          </button>
        </div>
      </div>

      {/* DYNAMIC KPI CARDS */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {dynamicKpiCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className="stat-card">
              <div className="stat-card-top">
                <span className="stat-title">{stat.title}</span>
                <div className={`stat-icon-wrapper ${stat.tone}`}>
                  <Icon size={19} />
                </div>
              </div>

              <div className="stat-value">
                <AnimatedMetric value={stat.value} />
              </div>

              <div className="stat-card-bottom">
                <span className={`stat-badge ${stat.changeType}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="section-card quick-actions-card">
        <div className="card-header">
          <h2>Quick Actions</h2>
          <span className="subtitle">Execute common teacher workflows</span>
        </div>

        <div className="quick-actions-grid">
          <button
            type="button"
            className="action-card"
            onClick={() => navigate("/teacher/create-assignment")}
          >
            <div className="action-icon action-blue">
              <PlusCircle size={18} />
            </div>
            <div className="action-info">
              <h3>Create Assessment</h3>
              <p>Assignment, In-Sem, or End-Sem</p>
            </div>
            <ArrowUpRight size={16} className="action-arrow" />
          </button>

          <button
            type="button"
            className="action-card"
            onClick={() => navigate("/teacher/submissions")}
          >
            <div className="action-icon action-amber">
              <FileCheck2 size={18} />
            </div>
            <div className="action-info">
              <h3>Review Submissions</h3>
              <p>{overview.pendingCount} papers pending review</p>
            </div>
            <ArrowUpRight size={16} className="action-arrow" />
          </button>

          <button
            type="button"
            className="action-card"
            onClick={() => navigate("/teacher/evaluate")}
          >
            <div className="action-icon action-purple">
              <Cpu size={18} />
            </div>
            <div className="action-info">
              <h3>Run AI Evaluation</h3>
              <p>Batch OCR & semantic grading</p>
            </div>
            <ArrowUpRight size={16} className="action-arrow" />
          </button>

          <button
            type="button"
            className="action-card"
            onClick={() => navigate("/teacher/reports")}
          >
            <div className="action-icon action-green">
              <FileSpreadsheet size={18} />
            </div>
            <div className="action-info">
              <h3>Generate Report</h3>
              <p>Export PDF / Excel marksheets</p>
            </div>
            <ArrowUpRight size={16} className="action-arrow" />
          </button>
        </div>
      </div>

      {/* ASSESSMENT SUMMARY TABLE */}
      <div className="section-card assessment-summary-card" style={{ marginBottom: "24px" }}>
        <div className="card-header flex-header">
          <div>
            <h2>Assessment Summary</h2>
            <span className="subtitle">Overview of configured academic assessments</span>
          </div>
          <button
            type="button"
            className="primary-btn dashboard-cta-btn"
            onClick={() => navigate("/teacher/create-assignment")}
          >
            <PlusCircle size={15} style={{ marginRight: "4px" }} /> Create Assessment
          </button>
        </div>

        <div className="table-responsive">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>Assessment Title</th>
                <th>Type</th>
                <th>Total Marks</th>
                <th>Division</th>
                <th>Evaluated / Submissions</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {overview.allAssessments.map((asg) => {
                const isAssignment = asg.assessmentType === "assignment";
                const isInSem = asg.assessmentType === "in-sem";
                const typeLabel = isInSem ? "In-Sem Exam" : asg.assessmentType === "end-sem" ? "End-Sem Exam" : "Assignment";
                const typeBadge = isInSem ? "badge-warning" : asg.assessmentType === "end-sem" ? "badge-processing" : "badge-success";
                const asgSubs = overview.allSubmissions.filter((s) => s.assessmentType === asg.assessmentType);
                const evalCount = asgSubs.filter((s) => s.evaluation && (s.status === "Evaluated" || s.status === "Evaluation Completed" || s.status === "Result Published" || s.status === "Approved")).length;

                return (
                  <tr key={asg.id}>
                    <td><strong>{asg.title}</strong></td>
                    <td><span className={`status-pill ${typeBadge}`}>{typeLabel}</span></td>
                    <td><strong>{asg.totalMarks} Marks</strong></td>
                    <td>{asg.division || "SE ENTC – A"}</td>
                    <td>{evalCount} / {asgSubs.length}</td>
                    <td><span className="status-pill badge-success">{asg.status || "Active"}</span></td>
                    <td>
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => navigate(isInSem ? "/teacher/insem" : asg.assessmentType === "end-sem" ? "/teacher/endsem" : "/teacher/submissions")}
                      >
                        Workspace <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHARTS GRID: PERFORMANCE OVERVIEW + SUBMISSION STATUS */}
      <div className="charts-grid">
        {/* PERFORMANCE OVERVIEW CHART */}
        <div className="section-card chart-card">
          <div className="card-header">
            <div>
              <h2>Performance Overview</h2>
              <span className="subtitle">Average class score across recent assessments</span>
            </div>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={performanceOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[60, 100]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                  }}
                  formatter={(value) => [`${value}%`, "Class Average"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUBMISSION STATUS DONUT CHART */}
        <div className="section-card chart-card status-chart-card">
          <div className="card-header">
            <div>
              <h2>Submission Status</h2>
              <span className="subtitle">128 Total Papers</span>
            </div>
          </div>

          <div className="chart-wrapper donut-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={submissionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {submissionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span style={{ color: "#334155", fontSize: "12px", fontWeight: 600 }}>
                      {value} ({entry.payload.count})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-center-label">
              <span className="center-value">68%</span>
              <span className="center-text">Evaluated</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM GRID: RECENT SUBMISSIONS TABLE + UPCOMING / ACTIVITY */}
      <div className="bottom-grid">
        {/* RECENT SUBMISSIONS TABLE */}
        <div className="section-card table-card">
          <div className="card-header flex-header">
            <div>
              <h2>Recent Submissions</h2>
              <span className="subtitle">Student uploaded answer scripts and scores</span>
            </div>

            <Link to="/teacher/submissions" className="view-all-link">
              View All Submissions <ChevronRight size={15} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workflowSubmissions.slice(0, 5).map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar-sm">
                          {sub.student.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="student-name">{sub.student}</div>
                          <div className="student-roll">{sub.roll}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-medium">{demoAssignment.shortTitle}</td>
                    <td className="text-muted">{sub.submittedAt}</td>
                    <td>{getStatusBadge(sub.status, sub.status === "Evaluated" ? "success" : "warning")}</td>
                    <td>
                      <span className="score-badge font-bold">{sub.score}</span>
                    </td>
                    <td>
                      {sub.status === "Evaluated" ? (
                        <div className="dashboard-action-group">
                          <button
                            type="button"
                            className="table-action-btn"
                            onClick={() => navigate(`/teacher/evaluations/${sub.evaluationId}`)}
                          >
                            View Result
                          </button>
                          <button
                            type="button"
                            className="table-action-btn re-evaluate-btn"
                            onClick={() => navigate(`/teacher/evaluate/${sub.id}`)}
                          >
                            Re-evaluate
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="table-action-btn"
                          onClick={() => navigate(`/teacher/evaluate/${sub.id}`)}
                        >
                          Evaluate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDE PANELS: UPCOMING ASSIGNMENTS & RECENT ACTIVITY */}
        <div className="side-panels">
          {/* UPCOMING ASSIGNMENTS */}
          <div className="section-card upcoming-card">
            <div className="card-header">
              <h2>Upcoming Deadlines</h2>
              <span className="subtitle">Active course assignments</span>
            </div>

            <div className="upcoming-list">
              {upcomingAssignments.map((asg) => (
                <div key={asg.id} className="upcoming-item">
                  <div className="upcoming-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="upcoming-details">
                    <h4>{asg.title}</h4>
                    <p className="upcoming-course">{asg.course}</p>
                    <div className="upcoming-meta">
                      <span className="due-date">Due: {asg.dueDate}</span>
                      <span className="submissions-count">{asg.totalSubmissions}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="section-card activity-card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>

            <div className="activity-timeline">
              {recentActivity.map((act) => (
                <div key={act.id} className="activity-item">
                  <div className={`activity-dot dot-${act.type}`} />
                  <div className="activity-content">
                    <p className="activity-message">{act.message}</p>
                    <span className="activity-time">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ANALYTICS OVERVIEW SECTION */}
      <div className="section-card analytics-preview-card">
        <div className="card-header flex-header">
          <div>
            <h2>Analytics Overview</h2>
            <span className="subtitle">Class performance and evaluation progress overview</span>
          </div>
          <button
            type="button"
            className="analytics-view-btn"
            onClick={() => navigate("/teacher/analytics")}
          >
            View Full Analytics <ChevronRight size={15} />
          </button>
        </div>

        <div className="analytics-preview-grid">
          <div className="analytics-preview-metrics">
            <div className="analytics-metric-card">
              <span>Class Average</span>
              <strong>{getClassAnalytics()?.averagePercentage || "—"}%</strong>
              <small>Across evaluated submissions</small>
            </div>
            <div className="analytics-metric-card">
              <span>Evaluated</span>
              <strong>{getClassAnalytics()?.evaluatedCount || 0}</strong>
              <small>Submissions reviewed</small>
            </div>
            <div className="analytics-metric-card">
              <span>Pending</span>
              <strong>{getClassAnalytics()?.pendingCount || 0}</strong>
              <small>Awaiting review</small>
            </div>
            <div className="analytics-metric-card">
              <span>Completion</span>
              <strong>{getClassAnalytics()?.completionPercentage || "—"}%</strong>
              <small>Evaluation progress</small>
            </div>
          </div>

          <div className="analytics-preview-charts">
            <div className="analytics-preview-chart">
              <div className="analytics-chart-heading">
                <span>PERFORMANCE TREND</span>
                <strong>Class Average Score</strong>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={performanceOverviewData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsPreviewFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[60, 100]} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                    }}
                    formatter={(value) => [`${value}%`, "Class Average"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#analyticsPreviewFill)"
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="analytics-preview-chart">
              <div className="analytics-chart-heading">
                <span>SCORE DISTRIBUTION</span>
                <strong>Students by Score Band</strong>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { name: "0-39", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 40).length },
                  { name: "40-59", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 40 && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 60).length },
                  { name: "60-74", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 60 && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 75).length },
                  { name: "75-89", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 75 && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 90).length },
                  { name: "90-100", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 90).length }
                ]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                    }}
                  />
                  <Bar dataKey="students" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
