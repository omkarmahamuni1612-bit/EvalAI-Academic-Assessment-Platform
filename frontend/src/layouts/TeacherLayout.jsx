import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  Cpu,
  BarChart3,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Sparkles,
  GraduationCap,
  Menu,
  X
} from "lucide-react";
import { teacherProfile } from "../data/mockData";
import "./TeacherLayout.css";

function TeacherLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      label: "Overview",
      path: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Assignments",
      path: "/teacher/create-assignment",
      icon: BookOpen,
    },
    {
      label: "Submissions",
      path: "/teacher/submissions",
      icon: FileCheck2,
      badge: "24",
    },
    {
      label: "AI Evaluation",
      path: "/teacher/evaluate",
      icon: Cpu,
    },
    {
      label: "Analytics",
      path: "/teacher/analytics",
      icon: BarChart3,
    },
    {
      label: "Reports",
      path: "/teacher/reports",
      icon: FileSpreadsheet,
    },
    {
      label: "Settings",
      path: "/teacher/settings",
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    navigate("/teacher/login");
  };

  return (
    <div className={`teacher-layout ${collapsed ? "collapsed" : ""}`}>
      {/* MOBILE MENU BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        {/* BRANDING HEADER */}
        <div className="sidebar-brand">
          <Link to="/teacher/dashboard" className="brand-logo">
            <div className="brand-icon">
              <Sparkles size={20} />
            </div>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-title">EvalAI</span>
                <span className="brand-tag">TEACHER PORTAL</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className="collapse-toggle desktop-only"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            type="button"
            className="mobile-close mobile-only"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">{!collapsed && "NAVIGATION"}</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="nav-icon" />
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER / PROFILE */}
        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar">{teacherProfile.avatar}</div>
            {!collapsed && (
              <div className="profile-info">
                <span className="profile-name">{teacherProfile.name}</span>
                <span className="profile-role">{teacherProfile.department}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Log Out"
          >
            <LogOut size={18} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        {/* TOP HEADER */}
        <header className="top-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-trigger mobile-only"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search assignments, students, or reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <div className="portal-badge">
              <GraduationCap size={15} style={{ marginRight: "6px" }} /> Teacher Portal
            </div>

            <button
              type="button"
              className="icon-button notification-btn"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="notification-indicator" />
            </button>

            <div className="header-profile">
              <div className="header-avatar">{teacherProfile.avatar}</div>
              <div className="header-user-info desktop-only">
                <div className="user-name">{teacherProfile.name}</div>
                <div className="user-role">Teacher</div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default TeacherLayout;
