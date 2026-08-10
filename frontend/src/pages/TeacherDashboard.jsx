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
  dashboardStats,
  performanceOverviewData,
  submissionStatusData,
  upcomingAssignments,
  recentActivity
} from "../data/mockData";
import { demoAssignment, workflowSubmissions } from "../data/workflowData";
import "./TeacherDashboard.css";

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

  const getStatIcon = (iconName) => {
    switch (iconName) {
      case "Users":
        return <Users size={20} />;
      case "BookOpen":
        return <BookOpen size={20} />;
      case "Clock":
        return <Clock size={20} />;
      case "TrendingUp":
        return <TrendingUp size={20} />;
      default:
        return <BarChart2 size={20} />;
    }
  };

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
          <h1>Good morning, {teacherProfile.name}</h1>
          <p>Here's your assessment overview for today.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="primary-btn dashboard-cta-btn"
            onClick={() => navigate("/teacher/create-assignment")}
          >
            <PlusCircle size={17} style={{ marginRight: "6px" }} /> Create Assignment
          </button>
        </div>
      </div>

      {/* 4 STATS CARDS */}
      <div className="stats-grid">
        {dashboardStats.map((stat) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-card-top">
              <span className="stat-title">{stat.title}</span>
              <div className={`stat-icon-wrapper stat-${stat.id}`}>
                {getStatIcon(stat.iconName)}
              </div>
            </div>

            <div className="stat-value">
              <AnimatedMetric value={stat.value} />
            </div>

            <div className="stat-card-bottom">
              <span className={`stat-badge ${stat.changeType}`}>
                {stat.change}
              </span>
              <span className="stat-description">{stat.description}</span>
            </div>
          </div>
        ))}
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
              <h3>Create Assignment</h3>
              <p>Set rubrics & model keys</p>
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
              <p>24 Papers pending review</p>
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
                      <button
                        type="button"
                        className="table-action-btn"
                        onClick={() => navigate(sub.status === "Evaluated" ? `/teacher/evaluations/${sub.evaluationId}` : `/teacher/submissions/${sub.id}`)}
                      >
                        {sub.status === "Evaluated" ? "View Result" : "Evaluate"}
                      </button>
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
    </div>
  );
}

export default TeacherDashboard;
