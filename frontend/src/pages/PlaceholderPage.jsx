import { Sparkles, ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";
import "./PlaceholderPage.css";

function PlaceholderPage({ title, description }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-badge">
          <Sparkles size={14} style={{ marginRight: "6px" }} /> DEMO MODULE PREVIEW
        </div>

        <div className="placeholder-icon">
          <Construction size={32} />
        </div>

        <h2>{title || "Module Under Preparation"}</h2>
        <p>
          {description ||
            `The ${title || "requested"} module is scheduled for the next phase of the EvalAI platform demonstration.`}
        </p>

        <div className="placeholder-actions">
          <Link to="/teacher/dashboard" className="primary-btn">
            <ArrowLeft size={16} style={{ marginRight: "8px" }} /> Back to Teacher Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
