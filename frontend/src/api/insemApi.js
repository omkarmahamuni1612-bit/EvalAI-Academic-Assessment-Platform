const API_BASE = "http://localhost:8000/api/insem";

export async function fetchExams() {
  try {
    const res = await fetch(`${API_BASE}/exams`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend API offline:", err);
    return null;
  }
}

export async function fetchExamDetails(examId = "insem-001") {
  try {
    const res = await fetch(`${API_BASE}/exams/${examId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend API offline:", err);
    return null;
  }
}

export async function enrollStudentApi(examId, { name, roll, branch, division }) {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("roll", roll);
    formData.append("branch", branch || "ENTC");
    formData.append("division", division || "TE ENTC – A");
    const res = await fetch(`${API_BASE}/exams/${examId}/students`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Student enrollment failed");
    return await res.json();
  } catch (err) {
    console.error("API enrollStudent error:", err);
    return null;
  }
}

export async function uploadQuestionPaperApi(examId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/exams/${examId}/question-paper`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Question paper upload failed");
    return await res.json();
  } catch (err) {
    console.error("API uploadQuestionPaper error:", err);
    return null;
  }
}

export async function uploadReferenceAnswerApi(examId, file, referenceText) {
  try {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (referenceText) formData.append("reference_text", referenceText);
    const res = await fetch(`${API_BASE}/exams/${examId}/reference-answer`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Reference answer upload failed");
    return await res.json();
  } catch (err) {
    console.error("API uploadReferenceAnswer error:", err);
    return null;
  }
}

export async function uploadStudentAnswerSheetApi(examId, studentId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/exams/${examId}/students/${studentId}/answer-sheet`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Student answer sheet upload failed");
    return await res.json();
  } catch (err) {
    console.error("API uploadStudentAnswerSheet error:", err);
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

export async function publishResultsApi(examId = "insem-001") {
  try {
    const formData = new FormData();
    formData.append("examId", examId);
    const res = await fetch(`${API_BASE}/publish`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Publishing failed");
    return await res.json();
  } catch (err) {
    console.error("API publishResults error:", err);
    return null;
  }
}

export function getQuestionPaperPdfUrl(examId = "insem-001") {
  return `${API_BASE}/exams/${examId}/question-paper/pdf`;
}

export function getReferenceAnswerPdfUrl(examId = "insem-001") {
  return `${API_BASE}/exams/${examId}/reference-answer/pdf`;
}

export function getStudentAnswerSheetPdfUrl(submissionId) {
  return `${API_BASE}/submissions/${submissionId}/pdf`;
}

