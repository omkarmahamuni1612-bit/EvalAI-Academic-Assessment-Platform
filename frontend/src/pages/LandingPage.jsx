import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Cpu,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Award
} from "lucide-react";
import { evaluationPreviewData } from "../data/mockData";
import "./LandingPage.css";

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <nav className={`landing-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/" className="brand-link">
              <div className="brand-logo-icon">
                <Sparkles size={20} />
              </div>
              <div className="brand-titles">
                <span className="brand-name">EvalAI</span>
                <span className="brand-sub">AI Assessment Platform</span>
              </div>
            </Link>
          </div>

          <div className="navbar-menu desktop-only">
            <button type="button" onClick={() => scrollToSection("features")} className="nav-menu-btn">
              Features
            </button>
            <button type="button" onClick={() => scrollToSection("how-it-works")} className="nav-menu-btn">
              How It Works
            </button>
            <button type="button" onClick={() => scrollToSection("ai-evaluation")} className="nav-menu-btn">
              AI Evaluation
            </button>
            <button type="button" onClick={() => scrollToSection("analytics")} className="nav-menu-btn">
              Analytics
            </button>
          </div>

          <div className="navbar-actions">
            <Link to="/student/login" className="btn-secondary-sm">
              <GraduationCap size={16} style={{ marginRight: "6px" }} /> Student Login
            </Link>
            <Link to="/teacher/login" className="btn-primary-sm">
              Teacher Login <ArrowRight size={16} style={{ marginLeft: "6px" }} />
            </Link>
          </div>
        </div>
      </nav>

      {/* COMPACT HERO SECTION */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>AI-Powered Academic Assessment</span>
          </div>

          <h1 className="hero-headline">
            Evaluate Smarter. <br />
            <span className="hero-highlight">Teach Better.</span>
          </h1>

          <p className="hero-subtext">
            Transform academic assessment with intelligent OCR, semantic evaluation,
            automated grading, personalized feedback, and performance analytics.
          </p>

          <div className="hero-cta-group">
            <Link to="/teacher/login" className="btn-hero-primary">
              Teacher Portal <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="btn-hero-secondary"
            >
              Explore Platform
            </button>
          </div>

          {/* HERO MINIATURE PRODUCT PREVIEW */}
          <div className="hero-preview-wrapper">
            <div className="preview-window">
              <div className="preview-window-header">
                <div className="preview-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="preview-window-title">
                  EvalAI — Semantic Evaluation Engine (Live Demo)
                </div>
                <div className="preview-window-badge">
                  <ShieldCheck size={13} style={{ marginRight: "4px" }} /> Verified Rubric
                </div>
              </div>

              <div className="preview-window-body">
                <div className="preview-card-grid">
                  <div className="preview-card preview-left">
                    <div className="preview-card-header">
                      <div className="student-info-meta">
                        <div className="preview-avatar">RP</div>
                        <div>
                          <div className="preview-student-name">Rahul Patil</div>
                          <div className="preview-student-id">ET202-041 · ENTC Engineering</div>
                        </div>
                      </div>
                      <span className="ocr-pill">
                        <FileText size={12} style={{ marginRight: "4px" }} /> OCR Extracted
                      </span>
                    </div>

                    <div className="preview-snippet">
                      <span className="snippet-label">STUDENT ANSWER SNIPPET (OCR)</span>
                      <p className="snippet-text">
                        "In-order traversal visits left subtree, root, then right subtree. Pre-order visits root first, then left and right."
                      </p>
                    </div>
                  </div>

                  <div className="preview-card preview-right">
                    <div className="score-summary-header">
                      <div>
                        <div className="score-label">AI EVALUATION SCORE</div>
                        <div className="score-number">17 <span className="score-total">/ 20</span></div>
                      </div>
                      <span className="score-status-badge">
                        <CheckCircle2 size={14} style={{ marginRight: "4px" }} /> 85% Grade A
                      </span>
                    </div>

                    <div className="ai-feedback-box">
                      <div className="feedback-title">
                        <Cpu size={14} style={{ marginRight: "6px" }} /> Gemini AI Feedback
                      </div>
                      <p className="feedback-text">
                        Strong understanding of traversal techniques with minor conceptual gaps in tree balancing algorithms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM CAPABILITIES */}
      <section id="features" className="capabilities-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-eyebrow">PLATFORM CAPABILITIES</span>
            <h2>Complete Academic Assessment Suite</h2>
            <p>Designed for faculty members to evaluate faster while delivering deeper student feedback.</p>
          </div>

          <div className="capabilities-grid">
            <div className="capability-card">
              <div className="capability-icon">
                <FileText size={24} />
              </div>
              <h3>OCR Answer Extraction</h3>
              <p>Extract handwritten or printed text from scanned answer papers with high accuracy.</p>
            </div>

            <div className="capability-card">
              <div className="capability-icon">
                <Cpu size={24} />
              </div>
              <h3>AI Semantic Evaluation</h3>
              <p>Assess answers beyond exact keywords using AI model understanding of key concepts.</p>
            </div>

            <div className="capability-card">
              <div className="capability-icon">
                <CheckCircle2 size={24} />
              </div>
              <h3>Automated Grading</h3>
              <p>Generate objective marks based on customizable multi-criteria scoring rubrics.</p>
            </div>

            <div className="capability-card">
              <div className="capability-icon">
                <MessageSquare size={24} />
              </div>
              <h3>Personalized Feedback</h3>
              <p>Provide detailed actionable feedback highlighting student strengths and improvement areas.</p>
            </div>

            <div className="capability-card">
              <div className="capability-icon">
                <BarChart3 size={24} />
              </div>
              <h3>Performance Analytics</h3>
              <p>Visualize individual student progress, question difficulty distribution, and class trends.</p>
            </div>

            <div className="capability-card">
              <div className="capability-icon">
                <FileSpreadsheet size={24} />
              </div>
              <h3>Academic Reports</h3>
              <p>Export verified marksheets, grade distributions, and compliance summaries to PDF & Excel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS WITH PROGRESSION CONNECTORS */}
      <section id="how-it-works" className="workflow-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2>Four Steps to Automated Evaluation</h2>
            <p>Streamlined workflow built for teacher efficiency and grading consistency.</p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step">
              <div className="step-badge-row">
                <div className="step-number">01</div>
                <ChevronRight size={18} className="step-connector desktop-only" />
              </div>
              <h3>Create Assignment</h3>
              <p>Define assignment rubrics, total marks, and upload reference model answers.</p>
            </div>

            <div className="workflow-step">
              <div className="step-badge-row">
                <div className="step-number">02</div>
                <ChevronRight size={18} className="step-connector desktop-only" />
              </div>
              <h3>Students Submit Answers</h3>
              <p>Students upload scanned PDF answer scripts via the student portal or batch upload.</p>
            </div>

            <div className="workflow-step">
              <div className="step-badge-row">
                <div className="step-number">03</div>
                <ChevronRight size={18} className="step-connector desktop-only" />
              </div>
              <h3>AI Evaluates Responses</h3>
              <p>EvalAI extracts OCR text and performs semantic concept matching against rubrics.</p>
            </div>

            <div className="workflow-step">
              <div className="step-badge-row">
                <div className="step-number">04</div>
              </div>
              <h3>Teacher Reviews Results</h3>
              <p>Teacher inspects AI suggestions, adjusts marks if needed, and approves final reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI EVALUATION PREVIEW SECTION */}
      <section id="ai-evaluation" className="ai-demo-section">
        <div className="section-container">
          <div className="section-header center">
            <span className="section-eyebrow">CORE INNOVATION</span>
            <h2>AI Evaluation Pipeline Demonstration</h2>
            <p>See how EvalAI processes student answer sheets from raw scan to final breakdown.</p>
          </div>

          <div className="pipeline-card">
            <div className="pipeline-steps-bar">
              <div className="pipeline-step-item active">
                <span className="p-num">1</span> Student Answer
              </div>
              <ChevronRight size={16} className="p-arrow" />
              <div className="pipeline-step-item active">
                <span className="p-num">2</span> OCR Extraction
              </div>
              <ChevronRight size={16} className="p-arrow" />
              <div className="pipeline-step-item active">
                <span className="p-num">3</span> Semantic Analysis
              </div>
              <ChevronRight size={16} className="p-arrow" />
              <div className="pipeline-step-item active">
                <span className="p-num">4</span> Score Generation
              </div>
              <ChevronRight size={16} className="p-arrow" />
              <div className="pipeline-step-item active">
                <span className="p-num">5</span> Feedback
              </div>
            </div>

            <div className="pipeline-content-grid">
              <div className="pipeline-box student-script-box">
                <div className="box-title">
                  <UserCheck size={16} style={{ marginRight: "6px" }} /> Student Submission
                </div>
                <div className="meta-row">
                  <span>Student: <strong>{evaluationPreviewData.studentName}</strong></span>
                  <span>Roll: <strong>{evaluationPreviewData.rollNo}</strong></span>
                </div>
                <div className="meta-row">
                  <span>Assignment: <strong>{evaluationPreviewData.assignment}</strong></span>
                </div>
                <div className="ocr-extracted-preview">
                  <span className="ocr-tag">OCR TEXT EXTRACTED</span>
                  <p>"{evaluationPreviewData.ocrSnippet}"</p>
                </div>
              </div>

              <div className="pipeline-box ai-results-box">
                <div className="box-title">
                  <Award size={16} style={{ marginRight: "6px" }} /> AI Evaluation Result
                </div>
                <div className="result-score-banner">
                  <span className="banner-score">{evaluationPreviewData.score}</span>
                  <span className="banner-badge">{evaluationPreviewData.percentage} · Grade A</span>
                </div>
                <div className="ai-feedback-summary">
                  <strong>AI Feedback:</strong> {evaluationPreviewData.aiEvaluation}
                </div>
                <div className="rubric-breakdown-list">
                  {evaluationPreviewData.breakdown.map((item, idx) => (
                    <div key={idx} className="rubric-item">
                      <span className="r-criteria">{item.criteria}</span>
                      <span className="r-points">{item.points}</span>
                      <span className="r-status">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="brand-logo-icon">
              <Sparkles size={18} />
            </div>
            <span className="footer-title">EvalAI</span>
            <span className="footer-sub">AI-Powered Academic Assessment Platform</span>
          </div>

          <div className="footer-links">
            <Link to="/teacher/login">Teacher Portal</Link>
            <Link to="/student/login">Student Login</Link>
            <button type="button" onClick={() => scrollToSection("features")}>Capabilities</button>
          </div>

          <div className="footer-copy">
            Academic Project Demonstration · EvalAI Platform
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
