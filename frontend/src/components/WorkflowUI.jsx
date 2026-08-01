import { Check, FileText, X } from "lucide-react";
import "./WorkflowUI.css";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return <header className="workflow-header"><div><span className="workflow-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{actions && <div className="workflow-actions">{actions}</div>}</header>;
}

export function StatusBadge({ status }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`workflow-status status-${normalized}`}><i />{status}</span>;
}

export function PaperPreview({ compact = false }) {
  return <div className={`paper-preview ${compact ? "paper-compact" : ""}`}><div className="paper-top"><span>EvalAI · Answer Script</span><span>Page 1 of 4</span></div><div className="paper-student"><strong>Rahul Patil</strong><span>ET202-041 · Digital Signal Processing</span></div><div className="paper-question"><b>Q1.</b> Explain sampling theorem and the effect of aliasing in digital signal processing.</div><div className="handwritten-text">Sampling is a process in which continuous time signal is converted into discrete time signal. According to Nyquist theorem, sampling frequency should be at least twice the maximum frequency of input signal.<br /><br />If sampling frequency is less than Nyquist rate then aliasing occurs. It creates overlap in spectrum and original signal cannot be recovered properly.</div><div className="paper-annotation">AI note: Answer includes the core theorem and aliasing explanation.</div></div>;
}

export function Toast({ message, onClose }) { return message ? <div className="workflow-toast" role="status"><Check size={16} />{message}<button type="button" onClick={onClose} aria-label="Close notification"><X size={15} /></button></div> : null; }

export function FilePill({ name, pages }) { return <span className="file-pill"><FileText size={14} /><span>{name}</span>{pages && <small>{pages} pages</small>}</span>; }
