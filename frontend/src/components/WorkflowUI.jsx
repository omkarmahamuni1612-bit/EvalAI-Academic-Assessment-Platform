import { Check, FileText, X } from "lucide-react";
import "./WorkflowUI.css";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return <header className="workflow-header"><div><span className="workflow-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{actions && <div className="workflow-actions">{actions}</div>}</header>;
}

export function StatusBadge({ status }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`workflow-status status-${normalized}`}><i />{status}</span>;
}

export function PaperPreview({ compact = false, student = "Student", roll = "", course = "", answerText = "", pages = 1 }) {
  return <div className={`paper-preview ${compact ? "paper-compact" : ""}`}><div className="paper-top"><span>EvalAI · Answer Script</span><span>Page 1 of {pages}</span></div><div className="paper-student"><strong>{student}</strong><span>{roll}{roll && course ? " · " : ""}{course}</span></div><div className="paper-question"><b>Q1.</b> Explain sampling theorem and the effect of aliasing in digital signal processing.</div><div className="handwritten-text">{answerText || "No extracted answer text available for this submission."}</div><div className="paper-annotation">AI note: Answer includes the core theorem and aliasing explanation.</div></div>;
}

export function Toast({ message, onClose }) { return message ? <div className="workflow-toast" role="status"><Check size={16} />{message}<button type="button" onClick={onClose} aria-label="Close notification"><X size={15} /></button></div> : null; }

export function FilePill({ name, pages }) { return <span className="file-pill"><FileText size={14} /><span>{name}</span>{pages && <small>{pages} pages</small>}</span>; }