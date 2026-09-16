const API_BASE = "http://localhost:8000/api/insem";

export async function fetchQuestionPaper() {
  try {
    const res = await fetch(`${API_BASE}/question-paper`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend API offline, using local question paper state:", err);
    return null;
  }
}

export async function fetchSubmissions() {
  try {
    const res = await fetch(`${API_BASE}/submissions`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend API offline, using local submission state:", err);
    return null;
  }
}

export async function processAllSubmissions(difficulty = "moderate") {
  try {
    const formData = new FormData();
    formData.append("difficulty", difficulty);
    const res = await fetch(`${API_BASE}/process-all`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Bulk processing request failed");
    return await res.json();
  } catch (err) {
    console.error("API processAllSubmissions error:", err);
    return null;
  }
}

export async function extractSubmission(submissionId) {
  try {
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/extract`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Extraction failed");
    return await res.json();
  } catch (err) {
    console.error("API extractSubmission error:", err);
    return null;
  }
}

export async function evaluateSubmissionApi(submissionId, difficulty = "moderate") {
  try {
    const formData = new FormData();
    formData.append("difficulty", difficulty);
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/evaluate`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Evaluation failed");
    return await res.json();
  } catch (err) {
    console.error("API evaluateSubmission error:", err);
    return null;
  }
}

export async function reevaluateSubmissionApi(submissionId, difficulty = "moderate") {
  try {
    const formData = new FormData();
    formData.append("difficulty", difficulty);
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/reevaluate`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Re-evaluation failed");
    return await res.json();
  } catch (err) {
    console.error("API reevaluateSubmission error:", err);
    return null;
  }
}

export async function approveSubmissionApi(submissionId) {
  try {
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/approve`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Approval failed");
    return await res.json();
  } catch (err) {
    console.error("API approveSubmission error:", err);
    return null;
  }
}

export async function publishResultsApi() {
  try {
    const res = await fetch(`${API_BASE}/publish`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Publishing failed");
    return await res.json();
  } catch (err) {
    console.error("API publishResults error:", err);
    return null;
  }
}
