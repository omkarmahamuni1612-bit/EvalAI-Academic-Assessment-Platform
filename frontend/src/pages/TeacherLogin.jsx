import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Award,
  BarChart3
} from "lucide-react";
import "./TeacherLogin.css";

function TeacherLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("teacher@college.edu");
  const [password, setPassword] = useState("••••••••••••");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Navigate directly to Teacher Dashboard for demo
    navigate("/teacher/dashboard");
  };

  return (
    <div className="teacher-login-page">
      {/* LEFT BRAND SIDE */}
      <div className="login-brand">
        <Link to="/" className="back-home">
          <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Back to Home
        </Link>

        <div className="brand-content">
          <span className="brand-badge">
            <Sparkles size={12} style={{ marginRight: "6px" }} /> EVALAI TEACHER PORTAL
          </span>

          <h1>
            Intelligent Assessment. <br />
            <span>Better Academic Decisions.</span>
          </h1>

          <p>
            Automate assignment evaluation using intelligent OCR and semantic AI analysis.
            Deliver consistent academic grading, personalized student feedback, and deep performance insights.
          </p>

          <div className="brand-features">
            <div className="brand-feature-item">
              <div className="feature-icon-badge">
                <CheckCircle2 size={16} />
              </div>
              <span>AI-Assisted Evaluation</span>
            </div>
            <div className="brand-feature-item">
              <div className="feature-icon-badge">
                <Award size={16} />
              </div>
              <span>Consistent Academic Grading</span>
            </div>
            <div className="brand-feature-item">
              <div className="feature-icon-badge">
                <BarChart3 size={16} />
              </div>
              <span>Actionable Student Insights</span>
            </div>
          </div>
        </div>

        <div className="brand-footer-text">
          EvalAI Academic Assessment Platform · Version 1.0 Demo
        </div>
      </div>

      {/* RIGHT LOGIN CARD SIDE WITH ENHANCED SaaS BACKGROUND */}
      <div className="login-section">
        {/* SUBTLE BACKGROUND ELEMENTS */}
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />

        <div className="login-card">
          <div className="login-icon">
            <GraduationCap size={24} />
          </div>

          <h2>Teacher Login</h2>
          <p className="login-subtitle">
            Sign in to access your EvalAI teacher dashboard.
          </p>

          <div className="demo-access-banner">
            <ShieldCheck size={16} className="demo-shield-icon" />
            <span><strong>Demo Access Enabled</strong></span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="teacher@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => alert("Password reset requested for teacher email.")}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button">
              Sign In to Dashboard
            </button>
          </form>

          <p className="login-note">
            <Lock size={13} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
            Authorized access for department teachers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
