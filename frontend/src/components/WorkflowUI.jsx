import { Check, Download, Eye, FileText, RotateCcw, X } from "lucide-react";
import "./WorkflowUI.css";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return <header className="workflow-header"><div><span className="workflow-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{actions && <div className="workflow-actions">{actions}</div>}</header>;
}

export function normalizeStatusText(status) {
  if (!status) return "Status Unavailable";
  if (typeof status === "string") return status.trim() || "Status Unavailable";
  if (typeof status === "object") {
    if (typeof status.label === "string" && status.label.trim()) return status.label.trim();
    if (typeof status.status === "string" && status.status.trim()) return status.status.trim();
    if (typeof status.submissionStatus === "string" && status.submissionStatus.trim()) return status.submissionStatus.trim();
    if (typeof status.name === "string" && status.name.trim()) return status.name.trim();
    if (typeof status.key === "string" && status.key.trim()) return status.key.trim();
  }
  return "Status Unavailable";
}

export function normalizeAssignmentStatus(status) {
  const text = normalizeStatusText(status);
  if (text === "Status Unavailable") return "unknown";
  return text.toLowerCase();
}

export function StatusBadge({ status }) {
  const text = normalizeStatusText(status);
  const normalized = normalizeAssignmentStatus(text).replaceAll(" ", "-");
  return <span className={`workflow-status status-${normalized}`}><i />{text}</span>;
}

export function PaperPreview({
  compact = false,
  student = "Student",
  roll = "",
  course = "",
  answerText = "",
  pages = 1,
  aiNote = null,
  pdfUrl = null,
  fileName = "AnswerSheet.pdf",
  fileSize = null,
  submittedAt = null,
  extractionStatus = "Text extracted successfully",
  onRetryExtraction = null,
}) {
  const isValidText = Boolean(
    answerText &&
    typeof answerText === "string" &&
    answerText.trim() &&
    !answerText.startsWith("No extracted answer text") &&
    !answerText.startsWith("Unable to extract") &&
    !answerText.includes("PDF-") &&
    !answerText.includes("endobj") &&
    !answerText.includes("stream") &&
    !(answerText.match(/[\uFFFD\uFFFE\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length
  );

  const charCount = isValidText ? answerText.trim().length : 0;

  const handleOpenPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`paper-preview ${compact ? "paper-compact" : ""}`}>
      <div className="paper-top">
        <span>EvalAI · Student Answer Sheet PDF</span>
        <span>Page 1 of {pages}</span>
      </div>

      <div className="paper-student">
        <strong>{student}</strong>
        <span>{roll}{roll && course ? " · " : ""}{course}</span>
      </div>

      {pdfUrl && (
        <div className="paper-pdf-controls" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", margin: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#334155" }}>
            <FileText size={16} style={{ color: "#3b82f6" }} />
            <strong>{fileName}</strong>
            {fileSize && <span style={{ color: "#64748b", fontSize: "12px" }}>({fileSize})</span>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" onClick={handleOpenPdf} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", fontSize: "12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", color: "#0f172a" }}>
              <Eye size={13} /> Open PDF
            </button>
            <button type="button" onClick={handleDownloadPdf} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", fontSize: "12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", color: "#0f172a" }}>
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      )}

      {pdfUrl && !compact && (
        <div className="paper-pdf-frame-wrap" style={{ width: "100%", height: "260px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: "14px", background: "#f1f5f9" }}>
          <iframe src={pdfUrl} title={fileName} style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      )}

      {isValidText ? (
        <>
          <div className="paper-extraction-badge" style={{ fontSize: "12px", color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 10px", borderRadius: "6px", marginBottom: "10px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>✓ {extractionStatus} ({charCount.toLocaleString()} chars)</span>
            <small style={{ color: "#166534", fontSize: "11px" }}>AI Evaluation Ready</small>
          </div>
          <div className="handwritten-text" style={{ whiteSpace: "pre-wrap", background: "#ffffff", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", lineHeight: "1.6", color: "#1e293b" }}>
            {answerText}
          </div>
          {aiNote && <div className="paper-annotation">AI note: {aiNote}</div>}
        </>
      ) : (
        <div className="paper-extraction-error" style={{ padding: "16px", borderRadius: "8px", background: "#fffbebf5", border: "1px solid #fde68a", color: "#92400e", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <strong style={{ fontSize: "13px", color: "#78350f" }}>⚠ Text extraction quality is insufficient</strong>
            <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", background: "#fef3c7", borderRadius: "4px", color: "#92400e" }}>Manual Review Required</span>
          </div>
          <p style={{ margin: 0, fontSize: "12px", color: "#92400e", marginBottom: "12px", lineHeight: "1.5" }}>
            Some content in this PDF could not be converted into reliable text. The original answer sheet is available above for visual review.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {pdfUrl && (
              <button type="button" onClick={handleOpenPdf} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "#ffffff", border: "1px solid #d97706", color: "#92400e", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <Eye size={13} /> Open PDF
              </button>
            )}
            {pdfUrl && (
              <button type="button" onClick={handleDownloadPdf} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "#ffffff", border: "1px solid #d97706", color: "#92400e", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                <Download size={13} /> Download PDF
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Toast({ message, onClose }) { return message ? <div className="workflow-toast" role="status"><Check size={16} />{message}<button type="button" onClick={onClose} aria-label="Close notification"><X size={15} /></button></div> : null; }

export function FilePill({ name, pages }) { return <span className="file-pill"><FileText size={14} /><span>{name}</span>{pages && <small>{pages} pages</small>}</span>; }