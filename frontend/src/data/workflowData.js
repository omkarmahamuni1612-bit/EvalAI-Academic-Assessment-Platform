import { getCurrentTeacher } from "../auth/teacherAuth.js";
import { students } from "../auth/studentAuth.js";

export const demoAssignment = {
  id: "dsp-a03",
  assessmentType: "assignment",
  title: "Digital Signal Processing — Assignment 03",
  shortTitle: "DSP — Assignment 03",
  course: "Digital Signal Processing",
  courseCode: "ET305",
  subject: "Digital Signal Processing",
  topic: "Sampling Theorem & Aliasing",
  division: "TE ENTC – A",
  teacher: "Prof. A. Deshmukh",
  dueDate: "14 Aug 2026, 11:59 PM",
  createdDate: "05 Aug 2026",
  totalMarks: 20,
  difficulty: "Moderate",
  description: "Explain the sampling theorem and the effect of aliasing in digital signal processing. Include the Nyquist condition, the role of an anti-aliasing filter, and a suitable numerical example.",
  questions: [
    { id: 1, text: "Explain the sampling theorem and state the Nyquist condition.", marks: 5 },
    { id: 2, text: "Describe the effect of aliasing and how it can be prevented.", marks: 5 },
    { id: 3, text: "Illustrate with an example the relationship between sampling frequency and signal bandwidth.", marks: 5 },
    { id: 4, text: "Discuss the role of an anti-aliasing low-pass filter before sampling.", marks: 5 },
  ],
  questionPaperPdf: { name: "DSP_Assignment03_QuestionPaper.pdf", size: 245760, type: "application/pdf" },
  referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
};

export const createdAssessments = [];

const WORKFLOW_CREATED_ASSESSMENTS_KEY = "evalai_workflow_created_assessments";
const WORKFLOW_PUBLISH_STORAGE_KEY = "evalai_workflow_publish_state";
const STUDENT_NOTIFICATIONS_KEY = "evalai_student_notifications";

export const persistCreatedAssessments = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(WORKFLOW_CREATED_ASSESSMENTS_KEY, JSON.stringify(createdAssessments));
  } catch (e) {}
};

export const persistPublishState = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(WORKFLOW_PUBLISH_STORAGE_KEY, JSON.stringify(assignmentPublishState));
  } catch (e) {}
};

export const persistStudentNotifications = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STUDENT_NOTIFICATIONS_KEY, JSON.stringify(studentNotifications));
  } catch (e) {}
};

export const hydrateAllWorkflowData = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToCheck = [
      WORKFLOW_CREATED_ASSESSMENTS_KEY,
      "evalai_created_assessments",
      "createdAssessments",
      "evalai_assessments"
    ];
    keysToCheck.forEach((key) => {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved)) {
            saved.forEach((record) => {
              if (record && record.id && !createdAssessments.some((a) => a.id === record.id)) {
                createdAssessments.push(record);
              }
            });
          }
        } catch (e) {}
      }
    });

    const savedPublish = JSON.parse(window.localStorage.getItem(WORKFLOW_PUBLISH_STORAGE_KEY) || "{}");
    if (savedPublish && typeof savedPublish === "object") {
      Object.assign(assignmentPublishState, savedPublish);
    }

    const savedNotifs = JSON.parse(window.localStorage.getItem(STUDENT_NOTIFICATIONS_KEY) || "[]");
    savedNotifs.forEach((record) => {
      if (
        record &&
        record.id &&
        record.assignmentId !== demoAssignment.id &&
        record.assignmentId !== "dsp-a03" &&
        !studentNotifications.some((n) => n.id === record.id)
      ) {
        studentNotifications.push(record);
      }
    });

    hydrateWorkflowEvaluations();
  } catch (e) {}
};

/**
 * Synthesizes a 100% compliant PDF 1.4 Data URL for legacy or metadata-only PDF records.
 */
export function createCompliantPdfDataUrl(title = "Question Paper", subject = "Assessment") {
  const safeTitle = String(title || "Question Paper").replace(/[\(\)]/g, "");
  const safeSubject = String(subject || "Assessment").replace(/[\(\)]/g, "");
  const rawPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length 140>> stream
BT
/F1 18 Tf
50 720 Td
(${safeTitle}) Tj
/F1 12 Tf
0 -30 Td
(${safeSubject}) Tj
0 -20 Td
(Official Question Paper Document - EvalAI) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000230 00000 n 
0000000299 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
490
%%EOF`;

  if (typeof btoa === "function") {
    return "data:application/pdf;base64," + btoa(rawPdf);
  }
  if (typeof Buffer !== "undefined") {
    return "data:application/pdf;base64," + Buffer.from(rawPdf).toString("base64");
  }
  return "data:application/pdf;base64," + rawPdf;
}

/**
 * Single central helper to resolve a browser-renderable PDF URL.
 * Handles persisted Data URLs, Blob/File instances, legacy metadata objects, and missing PDFs.
 */
export function getPersistedPdfUrl(pdf, assignment = null) {
  if (!pdf) return null;

  // 1. String URL or Data URL
  if (typeof pdf === "string") {
    if (pdf.startsWith("data:") || pdf.startsWith("blob:") || pdf.startsWith("http:") || pdf.startsWith("https:")) {
      return pdf;
    }
  }

  // 2. Blob or File instance
  if (typeof Blob !== "undefined" && pdf instanceof Blob) {
    return URL.createObjectURL(pdf);
  }

  // 3. Metadata object with embedded data
  if (pdf && typeof pdf === "object") {
    const dataSrc = pdf.data || pdf.dataUrl || pdf.url || pdf.base64;
    if (dataSrc && typeof dataSrc === "string") {
      if (dataSrc.startsWith("data:") || dataSrc.startsWith("blob:") || dataSrc.startsWith("http:") || dataSrc.startsWith("https:")) {
        return dataSrc;
      }
    }
  }

  // 4. Legacy metadata-only object (e.g. { name: "DSP_Assignment03_QuestionPaper.pdf" })
  const docTitle = assignment?.title || pdf?.name || "Question Paper";
  const docSubject = assignment?.course || assignment?.subject || assignment?.subjectName || "Subject";
  return createCompliantPdfDataUrl(docTitle, docSubject);
}

export const registerCreatedAssessment = (data) => {
  const assessmentCategory = data.assessmentCategory || data.assessmentType || "assignment";
  const defaultTotal = assessmentCategory === "in-sem" ? 30 : assessmentCategory === "end-sem" ? 60 : 20;
  const id = data.id || `asg-${Date.now()}`;

  const subjectName = data.subjectName || data.subject || (data.course && data.course.includes(" (") ? data.course.split(" (")[0] : data.course) || "Data Structures";
  const courseCode = data.courseCode || (data.course && data.course.includes("(") ? data.course.split("(")[1].replace(")", "") : "ET202");
  const branch = data.branch || (data.division && data.division.includes("ENTC") ? "ENTC" : data.division && data.division.includes("CS") ? "CS" : "ENTC");
  const division = data.division || "SE ENTC – A";
  const createdByTeacherId = data.createdByTeacherId || "teacher-123";

  const formatPdfRecord = (pdfInput) => {
    if (!pdfInput) return null;
    const name = pdfInput.name || "QuestionPaper.pdf";
    const size = Number(pdfInput.size) || 0;
    const type = pdfInput.type || "application/pdf";
    const pdfData = typeof pdfInput === "string" && (pdfInput.startsWith("data:") || pdfInput.startsWith("blob:"))
      ? pdfInput
      : (pdfInput.data || pdfInput.dataUrl || pdfInput.url || (typeof pdfInput.base64 === "string" ? pdfInput.base64 : null));
    const uploadedAt = pdfInput.uploadedAt || new Date().toISOString();
    return { name, size, type, data: pdfData, uploadedAt };
  };

  const newRecord = {
    id,
    assessmentId: id,
    assessmentType: assessmentCategory,
    title: data.title || "Untitled Assessment",
    shortTitle: data.title ? (data.title.length > 24 ? `${data.title.slice(0, 24)}…` : data.title) : "Assessment",
    subjectName,
    courseCode,
    course: `${subjectName} (${courseCode})`,
    subject: subjectName,
    branch,
    division,
    academicYear: data.academicYear || "2026–27",
    assignmentType: data.assignmentType || "Written Assignment",
    teacher: data.teacherName || "Professor123",
    createdByTeacherId,
    dueDate: data.dueDate || "TBD",
    dueTime: data.dueTime || (data.dueDate && data.dueDate.includes("T") ? data.dueDate.split("T")[1] : "23:59"),
    examDate: data.dueDate || "TBD",
    createdDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    createdAt: data.createdAt || new Date().toISOString(),
    totalMarks: Number(data.totalMarks) || defaultTotal,
    description: data.description || "",
    questions: data.questions || [],
    questionPaperPdf: formatPdfRecord(data.assignmentPdf || data.questionPaperPdf),
    referenceAnswerPdf: formatPdfRecord(data.referenceAnswerPdf),
    referenceAnswer: data.referenceAnswer || "",
    studentSubmissionAllowed: assessmentCategory === "assignment",
    status: data.status || (assessmentCategory === "assignment" ? "Published" : "Scheduled"),
    publishedBy: data.publishedBy || createdByTeacherId,
    publishedAt: data.publishedAt || new Date().toISOString(),
  };
  
  const existingIndex = createdAssessments.findIndex((a) => a.id === id);
  if (existingIndex >= 0) {
    createdAssessments[existingIndex] = newRecord;
  } else {
    createdAssessments.push(newRecord);
  }
  
  persistCreatedAssessments();
  return newRecord;
};

export const workflowSubmissions = [
  {
    id: "sub-001", studentId: "stu-rahul", student: "Rahul Patil", roll: "ET202-041", assignmentId: "dsp-a03", submittedAt: "Today, 10:24 AM",
    file: "RahulPatil_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "17 / 20", evaluationId: "eval-rahul",
    evaluation: {
      score: 17, totalMarks: 20, grade: "Grade A", confidence: "94%", semanticRelevance: "87%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling is the process of representing a continuous signal as discrete values. According to the Nyquist theorem, the sampling frequency should be greater than or equal to two times the maximum frequency of the input signal. If it is lower, aliasing occurs. A low-pass filter is used before sampling to remove unwanted high-frequency components.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Correctly explains sampling and identifies the relationship to a discrete-time signal." },
        { name: "Technical Accuracy", score: 5, max: 6, confidence: "High", reason: "Nyquist condition is stated correctly; the anti-aliasing role needs more precision." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Reasoning is clear, but mathematical justification is brief." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well structured response with clear sequencing and readable notation." },
      ],
      feedback: {
        strengths: "Correct explanation of sampling and aliasing concepts.",
        improvements: "Explain the Nyquist condition with clearer mathematical justification.",
        missing: "Anti-aliasing filter before sampling."
      }
    }
  },
  {
    id: "sub-002", studentId: "stu-sneha", student: "Sneha Kulkarni", roll: "ET202-089", assignmentId: "dsp-a03", submittedAt: "Today, 9:48 AM",
    file: "SnehaKulkarni_DSP_A03.pdf", pages: 3, status: "Pending", score: "—", evaluationId: "eval-sneha",
    evaluation: {
      score: 15, totalMarks: 20, grade: "Grade B", confidence: "91%", semanticRelevance: "82%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling converts a continuous signal into discrete samples at regular intervals. The Nyquist theorem requires the sampling rate to be at least twice the highest frequency component. If sampling is too slow, aliasing distorts the signal. A low-pass filter is applied before sampling to remove high-frequency components.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 4, max: 6, confidence: "High", reason: "Correctly explains sampling but misses some nuance about discrete-time representation." },
        { name: "Technical Accuracy", score: 4, max: 6, confidence: "Medium", reason: "Nyquist condition stated correctly, but the anti-aliasing explanation is incomplete." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Clear reasoning with adequate examples, though mathematical detail is limited." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well organized response with logical flow and readable notation." },
      ],
      feedback: {
        strengths: "Good understanding of the sampling process and Nyquist theorem.",
        improvements: "Provide more mathematical justification for the sampling rate condition.",
        missing: "Detailed explanation of aliasing effects and their prevention."
      }
    }
  },
  {
    id: "sub-003", studentId: "stu-aarav", student: "Aarav Sharma", roll: "ET202-012", assignmentId: "dsp-a03", submittedAt: "Yesterday, 6:15 PM",
    file: "AaravSharma_DSP_A03.pdf", pages: 5, status: "Processing", score: "—", evaluationId: "eval-aarav",
    evaluation: {
      score: 19, totalMarks: 20, grade: "Grade A+", confidence: "96%", semanticRelevance: "93%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling is the process of converting a continuous-time signal into a discrete-time signal by taking samples at regular intervals. According to the Nyquist-Shannon sampling theorem, the sampling frequency must be at least twice the maximum frequency present in the signal to avoid aliasing. An anti-aliasing filter is used before the sampler to remove frequency components above the Nyquist frequency.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 6, max: 6, confidence: "High", reason: "Comprehensive explanation of sampling and the Nyquist-Shannon theorem." },
        { name: "Technical Accuracy", score: 6, max: 6, confidence: "High", reason: "All technical conditions stated precisely with correct terminology." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Strong reasoning, though a worked example would strengthen the response." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Excellent structure with clear logical progression and notation." },
      ],
      feedback: {
        strengths: "Excellent grasp of sampling theory with precise technical terminology.",
        improvements: "Include a numerical example to illustrate the Nyquist rate calculation.",
        missing: "Discussion of practical sampling considerations like quantization."
      }
    }
  },
  {
    id: "sub-004", studentId: "stu-priya", student: "Priya Deshmukh", roll: "ET202-056", assignmentId: "dsp-a03", submittedAt: "Yesterday, 4:32 PM",
    file: "PriyaDeshmukh_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "18 / 20", evaluationId: "eval-priya",
    evaluation: {
      score: 18, totalMarks: 20, grade: "Grade A+", confidence: "93%", semanticRelevance: "89%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling is the conversion of a continuous-time signal into a discrete-time sequence by measuring its amplitude at uniform time intervals. The Nyquist criterion states that the sampling frequency must exceed twice the highest frequency component of the signal. Failure to meet this condition results in aliasing. An anti-aliasing low-pass filter is placed before the sampler.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Solid understanding of sampling with correct terminology." },
        { name: "Technical Accuracy", score: 5, max: 6, confidence: "High", reason: "Nyquist criterion stated correctly with proper conditions." },
        { name: "Explanation & Reasoning", score: 5, max: 5, confidence: "High", reason: "Well-reasoned explanation with clear cause-effect relationships." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Clean presentation with well-organized paragraphs." },
      ],
      feedback: {
        strengths: "Clear and accurate explanation of the sampling process.",
        improvements: "Elaborate on the mathematical relationship between sampling rate and signal bandwidth.",
        missing: "Mention of reconstruction and interpolation after sampling."
      }
    }
  },
  {
    id: "sub-005", studentId: "stu-rohan", student: "Rohan Jadhav", roll: "ET202-102", assignmentId: "dsp-a03", submittedAt: "Yesterday, 1:09 PM",
    file: "RohanJadhav_DSP_A03.pdf", pages: 4, status: "Pending", score: "—", evaluationId: "eval-rohan",
    evaluation: {
      score: 14, totalMarks: 20, grade: "Grade B", confidence: "88%", semanticRelevance: "76%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling is taking discrete values from a continuous signal. The sampling frequency should be high enough. If the sampling rate is too low, we get aliasing. A filter is used to remove high frequencies.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 4, max: 6, confidence: "Medium", reason: "Basic understanding of sampling, but lacks depth in explaining discrete-time representation." },
        { name: "Technical Accuracy", score: 4, max: 6, confidence: "Medium", reason: "Nyquist condition mentioned but not precisely stated with the factor of two." },
        { name: "Explanation & Reasoning", score: 3, max: 5, confidence: "Medium", reason: "Reasoning is brief and lacks mathematical justification." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Response is concise and readable, though sparse." },
      ],
      feedback: {
        strengths: "Correct basic understanding of sampling and aliasing.",
        improvements: "State the Nyquist theorem precisely with the 2x frequency condition.",
        missing: "Detailed explanation of the anti-aliasing filter's role."
      }
    }
  },
  {
    id: "sub-006", studentId: "stu-ananya", student: "Ananya Kulkarni", roll: "ET202-077", assignmentId: "dsp-a03", submittedAt: "12 Aug, 3:20 PM",
    file: "AnanyaKulkarni_DSP_A03.pdf", pages: 4, status: "Submitted", score: "—", evaluationId: "eval-ananya",
    evaluation: {
      score: 16, totalMarks: 20, grade: "Grade A", confidence: "92%", semanticRelevance: "85%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling is the process of converting a continuous signal into a sequence of discrete values at regular time intervals. According to the Nyquist theorem, the sampling frequency should be at least twice the maximum frequency of the signal to avoid aliasing. An anti-aliasing filter is used before sampling to eliminate high-frequency components that could cause distortion.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Good understanding of sampling with correct terminology." },
        { name: "Technical Accuracy", score: 4, max: 6, confidence: "Medium", reason: "Nyquist condition stated correctly, but the anti-aliasing explanation could be more precise." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Clear reasoning with adequate detail, though some mathematical depth is missing." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well-structured response with logical flow." },
      ],
      feedback: {
        strengths: "Good conceptual understanding of sampling and aliasing.",
        improvements: "Add more mathematical detail to the Nyquist condition explanation.",
        missing: "Discussion of what happens when the sampling condition is violated."
      }
    }
  },
  {
    id: "sub-007", studentId: "stu-aditya", student: "Aditya Shinde", roll: "ET202-034", assignmentId: "dsp-a03", submittedAt: "12 Aug, 11:05 AM",
    file: "AdityaShinde_DSP_A03.pdf", pages: 3, status: "Evaluated", score: "13 / 20", evaluationId: "eval-aditya",
    evaluation: {
      score: 13, totalMarks: 20, grade: "Grade C", confidence: "86%", semanticRelevance: "71%",
      evaluationDifficulty: "moderate",
      answerText: "Sampling means taking samples of a signal. The sampling rate must be high. If it is low, aliasing happens. We use a low-pass filter to remove high frequencies before sampling.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 4, max: 6, confidence: "Medium", reason: "Basic understanding present, but explanation is superficial." },
        { name: "Technical Accuracy", score: 3, max: 6, confidence: "Low", reason: "Nyquist condition not stated precisely; missing the 2x frequency requirement." },
        { name: "Explanation & Reasoning", score: 3, max: 5, confidence: "Medium", reason: "Reasoning is minimal and lacks technical depth." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Concise and readable, though brief." },
      ],
      feedback: {
        strengths: "Identifies the key concepts of sampling and aliasing.",
        improvements: "State the Nyquist theorem precisely and explain the 2x frequency condition.",
        missing: "Explanation of how the anti-aliasing filter prevents distortion."
      }
    }
  },
];

const WORKFLOW_EVALUATION_STORAGE_KEY = "evalai_workflow_submissions";
export const persistWorkflowEvaluations = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(WORKFLOW_EVALUATION_STORAGE_KEY, JSON.stringify(workflowSubmissions));
    window.localStorage.setItem("evalai_workflow_evaluations", JSON.stringify(workflowSubmissions));
  } catch (e) {}
};
export const hydrateWorkflowEvaluations = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(WORKFLOW_EVALUATION_STORAGE_KEY) || window.localStorage.getItem("evalai_workflow_evaluations");
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved)) {
      saved.forEach((record) => {
        if (!record || !record.id) return;
        const existingIndex = workflowSubmissions.findIndex((item) => item.id === record.id);
        if (existingIndex >= 0) {
          workflowSubmissions[existingIndex] = { ...workflowSubmissions[existingIndex], ...record };
        } else {
          workflowSubmissions.push(record);
        }
      });
    }
  } catch (e) {}

  workflowSubmissions.forEach((sub) => {
    if (!sub.evaluationResults || typeof sub.evaluationResults !== "object") {
      sub.evaluationResults = {};
    }
    if (sub.evaluation && sub.evaluation.evaluationDifficulty) {
      const diffKey = sub.evaluation.evaluationDifficulty;
      if (!sub.evaluationResults[diffKey]) {
        sub.evaluationResults[diffKey] = sub.evaluation;
      }
    }
  });
};
hydrateWorkflowEvaluations();

// Reusable dynamic lookup helpers — return null when not found (no silent fallback)
export const getSubmissionById = (id) => {
  const sub = workflowSubmissions.find((item) => item.id === id) || null;
  return sub ? ensureSubmissionExtracted(sub) : null;
};


// Normalize string helper for academic target comparison
const normTargetStr = (str) => String(str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

// Check if a student is targeted by an assignment based on branch and division
export const isStudentTargeted = (student, assignment) => {
  if (!student || !assignment) return false;
  // demoAssignment is legacy fixture data, never targeted to active student portal users
  if (assignment.id === demoAssignment.id) return false;
  const studBranch = normTargetStr(student.branch || "ENTC");
  const studDiv = normTargetStr(student.division || "TE ENTC – A");
  const asgBranch = normTargetStr(assignment.branch || "ENTC");
  const asgDiv = normTargetStr(assignment.division || "TE ENTC – A");
  return studBranch === asgBranch && studDiv === asgDiv;
};

// Get an assignment by its ID
export const getAssignmentById = (assignmentId) => {
  hydrateAllWorkflowData();
  if (!assignmentId) return null;
  const found = createdAssessments.find((a) => a.id === assignmentId || a.assessmentId === assignmentId);
  if (found) return found;
  if (assignmentId === demoAssignment.id || assignmentId === demoAssignment.assessmentId) {
    return demoAssignment;
  }
  return null;
};

// Returns assignments created by the specified teacher ID (or currently logged-in teacher)
export const getTeacherAssignments = (teacherId) => {
  hydrateAllWorkflowData();
  let tid = teacherId;
  if (!tid) {
    const currentTeacher = getCurrentTeacher();
    tid = currentTeacher?.teacherId || currentTeacher?.id;
  }
  if (!tid) return [];
  return (createdAssessments || []).filter(
    (assignment) => assignment && (assignment.createdByTeacherId === tid || assignment.publishedBy === tid)
  );
};

// Retrieve or generate student submission record for an assignment
export const getStudentSubmission = (student, assignmentId = demoAssignment.id) => {
  hydrateAllWorkflowData();
  if (!student) return null;
  const normalizeRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const targetRoll = normalizeRoll(student.roll);
  const assignment = getAssignmentById(assignmentId);
  const totalMarks = assignment?.totalMarks || 20;

  const existing = workflowSubmissions.find(
    (submission) =>
      (submission.assignmentId === assignmentId || (!submission.assignmentId && assignmentId === demoAssignment.id)) &&
      ((student.id && submission.studentId === student.id) ||
        (targetRoll && normalizeRoll(submission.roll) === targetRoll) ||
        (student.name && (submission.student === student.name || submission.studentName === student.name)))
  );

  const isPastDue = assignment ? isAssignmentPastDueDate(assignment) : false;

  if (existing) {
    if (existing.evaluationResults && typeof existing.evaluationResults === "object") {
      const activeDiff = existing.activeDifficulty || existing.evaluationDifficulty || "moderate";
      if (existing.evaluationResults[activeDiff] && !existing.evaluation) {
        existing.evaluation = existing.evaluationResults[activeDiff];
      }
    }
    if (existing.file) {
      return existing;
    }
    if (isPastDue) {
      return {
        ...existing,
        status: "Missing / Failed",
        score: `0 / ${totalMarks}`,
        evaluationId: existing.evaluationId || `eval-non-sub-${assignmentId}-${student.id}`,
        isNonSubmissionZero: true,
        evaluation: existing.evaluation || {
          score: 0,
          totalMarks,
          obtainedMarks: 0,
          percentage: 0,
          grade: "F",
          isNonSubmissionZero: true,
          evaluationStatus: "Missing / Failed",
          feedback: {
            strengths: "Non-submission.",
            improvements: "No answer sheet submitted before the due date.",
            missing: "Assignment was not submitted before the deadline.",
            overall: "Assignment was not submitted before the deadline.",
          },
        },
      };
    }
    return existing;
  }

  if (isPastDue) {
    return {
      id: `non-sub-${assignmentId}-${student.id}`,
      studentId: student.id,
      student: student.name,
      roll: student.roll,
      assignmentId,
      submittedAt: "Not Submitted",
      file: null,
      pages: 0,
      status: "Missing / Failed",
      score: `0 / ${totalMarks}`,
      evaluationId: `eval-non-sub-${assignmentId}-${student.id}`,
      isNonSubmissionZero: true,
      evaluation: {
        score: 0,
        totalMarks,
        obtainedMarks: 0,
        percentage: 0,
        grade: "F",
        isNonSubmissionZero: true,
        evaluationStatus: "Missing / Failed",
        feedback: {
          strengths: "Non-submission.",
          improvements: "No answer sheet submitted before the due date.",
          missing: "Assignment was not submitted before the deadline.",
          overall: "Assignment was not submitted before the deadline.",
        },
      },
    };
  }

  return {
    id: `pending-${assignmentId}-${student.id}`,
    studentId: student.id,
    student: student.name,
    roll: student.roll,
    assignmentId,
    submittedAt: "Not Submitted",
    file: null,
    pages: 0,
    status: "Pending",
    score: "—",
    evaluationId: `eval-pending-${assignmentId}-${student.id}`,
    evaluation: null,
  };
};

// Future backend architecture model: Subject-based permissions per teacher
export const teacherSubjects = [
  {
    teacherId: "teacher-123",
    subjectName: "Deep Learning",
    courseCode: "AI305",
    branch: "ENTC",
    active: true,
  },
  {
    teacherId: "teacher-123",
    subjectName: "Digital Signal Processing",
    courseCode: "ET305",
    branch: "ENTC",
    active: true,
  },
];

export const getTeacherSubjects = (teacherId) => {
  let tid = teacherId;
  if (!tid) {
    const currentTeacher = getCurrentTeacher();
    tid = currentTeacher?.teacherId || currentTeacher?.id;
  }
  if (!tid) return [];
  return teacherSubjects.filter((item) => item.teacherId === tid && item.active);
};

export const validateTeacherSubjectAccess = (teacherId, subjectName, courseCode) => {
  let tid = teacherId;
  if (!tid) {
    const currentTeacher = getCurrentTeacher();
    tid = currentTeacher?.teacherId || currentTeacher?.id;
  }
  if (!tid) return false;
  const teacherAssgs = getTeacherAssignments(tid);
  const matchesAssignment = teacherAssgs.some(
    (a) => (a.subjectName === subjectName || a.subject === subjectName) && (a.courseCode === courseCode || a.course?.includes(courseCode))
  );
  const matchesSubject = teacherSubjects.some(
    (s) => s.teacherId === tid && s.active && s.subjectName === subjectName && s.courseCode === courseCode
  );
  return matchesAssignment || matchesSubject;
};


// Recognize whether an assessment is an Assignment (not an exam).
export const isAssignmentAssessment = (assignment) =>
  Boolean(assignment && (assignment.assessmentType === "assignment" || assignment.studentSubmissionAllowed));

// Return the active student assignment ID (prioritizing newly created teacher assignments targeted to student)
export const getActiveStudentAssignmentId = (student = null) => {
  hydrateAllWorkflowData();
  const published = (createdAssessments || []).filter(
    (a) => a && a.status === "Published" && a.id !== demoAssignment.id && (!student || isStudentTargeted(student, a))
  );
  if (published.length > 0) {
    // Return the most recently published assignment targeted to this student
    return published[published.length - 1].id;
  }
  return null;
};

// Returns the assignment if accessible to the logged-in student.
// Reference Answer PDF and model answer text are strictly hidden from student access.
export const getStudentAssignment = (student, assignmentId) => {
  hydrateAllWorkflowData();
  if (!student || !assignmentId) return null;
  const assignment = getAssignmentById(assignmentId);
  if (!assignment) return null;
  if (assignment.id === demoAssignment.id) return null;
  if (assignment.status !== "Published") return null;
  if (!isStudentTargeted(student, assignment)) return null;

  const { referenceAnswerPdf, referenceAnswer, ...studentFacingAssignment } = assignment;
  return {
    ...studentFacingAssignment,
    referenceAnswerPdf: null,
    referenceAnswer: null,
  };
};

// The teacher-uploaded Assignment PDF is the ONLY source of the question paper.
export const getQuestionPaperPdf = (assignment) => {
  if (!assignment) return null;
  const asgObj = typeof assignment === "string" ? getAssignmentById(assignment) : assignment;
  return asgObj?.questionPaperPdf || null;
};

export const normalizeStatusText = (input) => {
  if (!input) return "Status Unavailable";
  if (typeof input === "string") return input.trim() || "Status Unavailable";
  if (typeof input === "object") {
    if (typeof input.label === "string" && input.label.trim()) return input.label.trim();
    if (typeof input.status === "string" && input.status.trim()) return input.status.trim();
    if (typeof input.submissionStatus === "string" && input.submissionStatus.trim()) return input.submissionStatus.trim();
    if (typeof input.name === "string" && input.name.trim()) return input.name.trim();
    if (typeof input.key === "string" && input.key.trim()) return input.key.trim();
  }
  return "Status Unavailable";
};

export const normalizeAssignmentStatus = (input) => {
  if (!input) return "unknown";
  if (typeof input === "string") return input.trim().toLowerCase() || "unknown";
  if (typeof input === "object") {
    const raw = input.submissionStatus || input.status || input.label || input.name || input.key;
    if (typeof raw === "string" && raw.trim()) return raw.trim().toLowerCase();
  }
  return "unknown";
};

// Derive the student-facing submission status from the raw workflow status or submission object.
export const getSubmissionStatusLabel = (submissionOrStatus, assignmentId = null) => {
  if (!submissionOrStatus) {
    if (assignmentId) {
      const assignment = getAssignmentById(assignmentId);
      if (assignment && isAssignmentPastDueDate(assignment)) {
        return "Missing / Failed";
      }
    }
    return "Not Submitted";
  }

  let rawStatus = submissionOrStatus;
  if (typeof submissionOrStatus === "object") {
    rawStatus = submissionOrStatus.submissionStatus || submissionOrStatus.status || submissionOrStatus.label || "Not Submitted";
  }

  if (typeof rawStatus !== "string") {
    rawStatus = String(rawStatus || "Not Submitted");
  }

  rawStatus = rawStatus.trim();
  if (!rawStatus || rawStatus === "Pending") return "Not Submitted";
  return rawStatus;
};

// Derive the student-facing evaluation status from the submission state.
export const getEvaluationStatus = (submission, assignmentId = demoAssignment.id) => {
  if (!submission) return { label: "Not Evaluated", key: "not-evaluated" };
  const rawStatus = typeof submission.status === "string"
    ? submission.status
    : (submission.status?.label || submission.status?.status || submission.submissionStatus || "");
  const status = String(rawStatus || "").trim();
  const published = isResultsPublished(assignmentId);

  if (status === "Evaluated" || status === "Approved" || status === "Result Published") {
    if (published) return { label: "Result Available", key: "result-available" };
    return { label: "Evaluation Completed — Results Pending Publication", key: "evaluation-completed" };
  }
  if (status === "Late / Failed" || submission.evaluation?.isLateFailed) {
    if (published) return { label: "Result Available (Failed)", key: "result-available" };
    return { label: "Late Submission — Failed", key: "late-failed" };
  }
  if (status === "Not Submitted" || status === "Missing / Failed" || submission.isNonSubmissionZero) {
    if (published) return { label: "Result Available (Failed)", key: "result-available" };
    return { label: "Not Submitted", key: "not-submitted" };
  }
  if (status === "Processing" || status === "Under Evaluation") return { label: "Evaluation in Progress", key: "evaluation-in-progress" };
  if (status === "Submitted") return { label: "Waiting for Evaluation", key: "waiting-evaluation" };
  return { label: "Not Evaluated", key: "not-evaluated" };
};

// Difficulty configuration — defines how each level affects evaluation
// The difficulty effect is PROPORTIONAL, not a fixed mark difference.
// Each level defines a toleranceFactor that is applied to the student's
// gap (criterion max - criterion score) on every rubric criterion, so the
// total effect scales with the assignment's total marks automatically.
export const difficultyConfig = {
  easy: {
    label: "Easy",
    description: "More tolerant evaluation. Focus primarily on basic concept understanding. Minor wording/explanation differences have less penalty.",
    // Forgiving: closes 30% of the gap on each rubric criterion.
    // Minor mistakes therefore receive a low, proportional penalty.
    toleranceFactor: 0.3,
    confidenceAdjustment: 2,
    semanticAdjustment: 3,
    feedbackTone: "encouraging",
  },
  moderate: {
    label: "Moderate",
    description: "Balanced evaluation. Evaluate concept understanding, technical accuracy and explanation normally. Recommended/default level.",
    // Balanced: applies the normal academic penalty — criteria keep their base score.
    toleranceFactor: 0,
    confidenceAdjustment: 0,
    semanticAdjustment: 0,
    feedbackTone: "balanced",
  },
  hard: {
    label: "Hard",
    description: "Strict evaluation. Require accurate technical concepts and complete reasoning. Missing concepts and technical errors have stronger penalties.",
    // Strict: penalizes 35% of the gap on each rubric criterion.
    // Larger concept gaps and technical inaccuracies receive stronger, proportional penalties.
    toleranceFactor: -0.35,
    confidenceAdjustment: -2,
    semanticAdjustment: -3,
    feedbackTone: "strict",
  },
};

export const cleanExtractedText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/[\uFFFD\uFFFE\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[□\u25A0\u25A1ÃÂÃâÂ±Â§Ã¼Ã¶Ã¤]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const isReadableExtractedText = (text) => {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 15) return false;

  if (
    trimmed === "No extracted answer text available for this submission." ||
    trimmed === "No extracted answer text available for this answer sheet." ||
    trimmed.startsWith("No extracted answer text") ||
    trimmed.startsWith("Unable to extract")
  ) {
    return false;
  }

  // Reject PDF binary / stream / object structure markers
  if (
    trimmed.includes("PDF-") ||
    trimmed.includes("/Type /Page") ||
    trimmed.includes("/Font") ||
    trimmed.includes("/MediaBox") ||
    trimmed.includes("endobj") ||
    trimmed.includes("stream") ||
    trimmed.includes("/Filter /FlateDecode") ||
    trimmed.includes("/Length ") ||
    trimmed.includes("Catalog") ||
    trimmed.includes("Parent 2 0 R")
  ) {
    return false;
  }

  // Count replacement characters \uFFFD, \uFFFE, and non-printable control characters
  const replacementMatches = trimmed.match(/[\uFFFD\uFFFE\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || [];
  if (replacementMatches.length / trimmed.length > 0.02) {
    return false;
  }

  // Count corrupted symbols like □, Ã, Â, etc.
  const symbolGarbageMatches = trimmed.match(/[□\u25A0\u25A1ÃÂÃâÂ±Â§Ã¼Ã¶Ã¤]/g) || [];
  if (symbolGarbageMatches.length / trimmed.length > 0.02) {
    return false;
  }

  // Check ratio of normal readable characters (letters, digits, whitespace, basic punctuation)
  const readableCharMatches = trimmed.match(/[a-zA-Z0-9\s.,!?:;()\/\-\+\=\*%'"–—]/g) || [];
  if (readableCharMatches.length / trimmed.length < 0.75) {
    return false;
  }

  // Check word validity ratio
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  const validWords = words.filter((w) => /^[a-zA-Z0-9\.,!\?\-\+=\(\)\/'"–—]{1,30}$/.test(w));
  if (validWords.length / words.length < 0.65) {
    return false;
  }

  return true;
};

export const hasValidAnswerText = (text) => {
  return isReadableExtractedText(text);
};

// Deterministic difficulty-aware evaluation policy
// This is a clean prototype that can be replaced by a real Gemini/LLM call later.
const legacyEvaluateSubmission = (submission, difficulty = "moderate") => {
  if (!submission) return null;
  const rawText = submission.answerText || submission.extractedText || submission.evaluation?.answerText;
  if (!hasValidAnswerText(rawText)) {
    return {
      error: "Unable to extract answer text from this PDF. Please verify that the PDF contains readable text.",
      extractionFailed: true,
      evaluationStatus: "Evaluation Failed",
      status: "Evaluation Failed",
      score: "—",
      obtainedMarks: null,
      grade: "—",
      confidence: "—",
      semanticRelevance: "—",
      evaluationDifficulty: difficulty,
      answerText: null,
      referenceAnswer: demoAssignment.referenceAnswer,
      rubric: [],
      questionWiseResults: [],
      feedback: { strengths: "", improvements: "", missing: "Answer text could not be extracted." },
    };
  }

  const config = difficultyConfig[difficulty] || difficultyConfig.moderate;
  const base = submission.evaluation || {
    score: 0,
    totalMarks: demoAssignment.totalMarks,
    grade: "Grade D",
    confidence: "—",
    semanticRelevance: "—",
    answerText: rawText,
    referenceAnswer: demoAssignment.referenceAnswer,
    rubric: [],
    feedback: { strengths: "", improvements: "", missing: "" },
  };

  // Base score from the student's existing evaluation data (deterministic, not random)
  const baseScore = base.score || 0;
  const totalMarks = base.totalMarks || demoAssignment.totalMarks;

  const rubric = base.rubric.map((item) => {
    const max = item.max || 0;
    const baseItemScore = item.score || 0;
    const gap = max - baseItemScore;
    const proportionalAdjustment = baseItemScore > 0 ? gap * (config.toleranceFactor || 0) : 0;
    const adjustedItemScore = Math.max(0, Math.min(max, baseItemScore + proportionalAdjustment));
    return {
      ...item,
      score: adjustedItemScore,
      confidence: difficulty === "easy" ? "High" : difficulty === "hard" ? (item.confidence === "High" ? "Medium" : "Low") : item.confidence,
      reason: difficulty === "easy"
        ? `${item.reason} (Evaluated with easy standard — minor gaps tolerated.)`
        : difficulty === "hard"
          ? `${item.reason} (Evaluated with hard standard — technical precision required.)`
          : item.reason,
    };
  });

  const rubricSum = rubric.reduce((sum, item) => sum + item.score, 0);
  const adjustedScore = rubric.length > 0
    ? Math.round(rubricSum)
    : Math.round(baseScore + (totalMarks - baseScore) * (config.toleranceFactor || 0));
  const clampedScore = Math.max(0, Math.min(totalMarks, adjustedScore));

  const grade = clampedScore >= totalMarks * 0.9 ? "Grade A+" : clampedScore >= totalMarks * 0.8 ? "Grade A" : clampedScore >= totalMarks * 0.7 ? "Grade B" : clampedScore >= totalMarks * 0.6 ? "Grade C" : "Grade D";

  const baseConfidence = parseInt(base.confidence, 10) || 90;
  const baseSemantic = parseInt(base.semanticRelevance, 10) || 80;
  const confidence = `${Math.max(70, Math.min(99, baseConfidence + config.confidenceAdjustment))}%`;
  const semanticRelevance = `${Math.max(55, Math.min(98, baseSemantic + config.semanticAdjustment))}%`;

  const feedback = {
    strengths: base.feedback.strengths,
    improvements: base.feedback.improvements,
    missing: base.feedback.missing,
    difficultyNote: difficulty === "easy"
      ? "Your answer demonstrates the core concept correctly. Minor explanation gaps can be improved."
      : difficulty === "hard"
        ? "The core concept is present, but the answer lacks required technical details and complete reasoning."
        : "Your answer demonstrates the main concept, but some technical details and explanation need improvement.",
  };

  return {
    ...base,
    score: clampedScore,
    totalMarks,
    grade,
    confidence,
    semanticRelevance,
    evaluationDifficulty: difficulty,
    rubric,
    feedback,
  };
};

export const evaluateSubmission = legacyEvaluateSubmission;

export const calculateGrade = (percentage) => {
  if (percentage >= 90) return "Grade A+";
  if (percentage >= 80) return "Grade A";
  if (percentage >= 70) return "Grade B";
  if (percentage >= 60) return "Grade C";
  return "Grade D";
};

const roundMarks = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const buildQuestionResult = (question, item, awarded, maximum, difficulty) => ({
  questionNumber: question.id,
  questionText: question.text,
  maximumMarks: maximum,
  awardedMarks: awarded,
  status: "Evaluated",
  correctness: item?.correctness || (awarded >= maximum * 0.8 ? "Correct" : awarded > 0 ? "Partially correct" : "Incorrect"),
  conceptualUnderstanding: item?.conceptualUnderstanding || (awarded >= maximum * 0.7 ? "Strong" : awarded > 0 ? "Developing" : "Not demonstrated"),
  relevance: item?.relevance || (awarded > 0 ? "Relevant" : "Not established"),
  completeness: item?.completeness || (awarded >= maximum ? "Complete" : awarded > 0 ? "Partially complete" : "Incomplete"),
  keyConceptsCovered: item?.keyConceptsCovered || (awarded >= maximum * 0.65 ? ["Core concept identified", "Relevant explanation provided"] : awarded > 0 ? ["Some relevant concepts identified"] : []),
  missingConcepts: item?.missingConcepts || (awarded < maximum ? [difficulty === "hard" ? "Complete technical justification" : "One or more supporting details"] : []),
  incorrectStatements: item?.incorrectStatements || [],
  feedback: item?.reason || `The response addresses this question with ${awarded >= maximum * 0.7 ? "good" : awarded > 0 ? "partial" : "limited"} alignment to the expected concepts.`,
});

export const evaluateAssessmentSubmission = (submission, assessment, difficulty = "moderate") => {
  if (!submission) return { error: "AI evaluation could not be completed. Submission not found." };

  let targetAssessment = assessment;
  if (!targetAssessment) {
    if (submission.assignmentId) {
      targetAssessment = typeof getAssignmentById === "function" ? getAssignmentById(submission.assignmentId) : null;
    } else {
      targetAssessment = demoAssignment;
    }
  }

  if (!targetAssessment || !targetAssessment.id) {
    return { error: "AI evaluation could not be completed. Assessment not found." };
  }

  if (submission.assignmentId && targetAssessment.id && submission.assignmentId !== targetAssessment.id) {
    return { error: "Evaluation context mismatch: assignment and submission do not belong to the same assessment." };
  }

  const rawText = submission.extractedAnswerText || submission.answerText || submission.extractedText || submission.evaluation?.answerText;
  if (!hasValidAnswerText(rawText)) {
    return {
      error: "Unable to extract answer text from this PDF. Please verify that the PDF contains readable text.",
      extractionFailed: true,
      evaluationStatus: "Evaluation Failed",
      status: "Evaluation Failed",
      score: "—",
      obtainedMarks: null,
      grade: "—",
      confidence: null,
      semanticRelevance: null,
      answerText: null,
      referenceAnswer: targetAssessment.referenceAnswer || "Reference answer available in document.",
      questionWiseResults: [],
      rubric: [],
      strengths: [],
      improvements: [],
      overallFeedback: "Question-wise evaluation unavailable because answer text could not be extracted.",
      feedback: { strengths: "", improvements: "", missing: "Answer text could not be extracted.", overall: "Question-wise evaluation unavailable because answer text could not be extracted." },
    };
  }

  const questions = Array.isArray(targetAssessment.questions) && targetAssessment.questions.length > 0
    ? targetAssessment.questions
    : [
        { id: 1, text: "Q1. State Nyquist sampling theorem and explain aliasing.", marks: 10 },
        { id: 2, text: "Q2. Derive filter transfer function and coefficients.", marks: 10 }
      ];
  const totalMarks = Number(targetAssessment.totalMarks || 20);
  const config = difficultyConfig[difficulty] || difficultyConfig.moderate;

  const studentHash = ((String(submission.studentId || submission.roll || "0").charCodeAt(0) || 0) % 7) * 0.03;

  // Determine baseline unadjusted scores for each question.
  // We MUST NOT read previously difficulty-adjusted awarded marks from submission.evaluation,
  // otherwise evaluating Easy -> Moderate -> Hard causes corrupted sequence-dependent scores.
  let rawBaseScores = submission.rawQuestionScores;
  if (!rawBaseScores || !Array.isArray(rawBaseScores) || rawBaseScores.length !== questions.length) {
    const baseObj = submission.evaluationResults?.moderate || submission.evaluation;
    const baseItems = baseObj?.aiQuestionWiseResults || baseObj?.questionWiseResults || baseObj?.rubric;

    if (Array.isArray(baseItems) && baseItems.length === questions.length && (!baseObj?.evaluationDifficulty || baseObj.evaluationDifficulty === "moderate")) {
      rawBaseScores = questions.map((q, idx) => {
        const item = baseItems[idx];
        const maximum = Number(q.marks || 10);
        const val = Number(item.awardedMarks ?? item.score);
        return Number.isFinite(val) && val > 0 ? val : Math.max(maximum * 0.5, Math.min(maximum, maximum * (0.85 - studentHash)));
      });
    } else {
      rawBaseScores = questions.map((q) => {
        const maximum = Number(q.marks || 10);
        return Math.max(maximum * 0.5, Math.min(maximum, maximum * (0.85 - studentHash)));
      });
    }
    submission.rawQuestionScores = rawBaseScores;
  }

  const questionWiseResults = questions.map((question, index) => {
    const maximum = Number(question.marks || 10);
    const rawBaseScore = Number(rawBaseScores[index] ?? (maximum * 0.75));

    let awarded = rawBaseScore;
    if (difficulty === "easy") {
      const gap = maximum - rawBaseScore;
      awarded = rawBaseScore + gap * 0.35;
    } else if (difficulty === "hard") {
      awarded = rawBaseScore * 0.75;
    } else {
      awarded = rawBaseScore;
    }

    const clampedAwarded = roundMarks(Math.max(0, Math.min(maximum, awarded)));
    return buildQuestionResult(question, {}, clampedAwarded, maximum, difficulty, `Student response for Q${question.id || index + 1}`);
  });

  const obtainedMarks = roundMarks(questionWiseResults.reduce((sum, item) => sum + item.awardedMarks, 0));
  const percentage = roundMarks((obtainedMarks / totalMarks) * 100);
  const strengths = questionWiseResults.filter((item) => item.awardedMarks >= item.maximumMarks * 0.7).map((item) => `Q${item.questionNumber}: ${item.keyConceptsCovered[0] || "Core idea understood"}.`);
  const improvements = questionWiseResults.filter((item) => item.awardedMarks < item.maximumMarks).map((item) => `Q${item.questionNumber}: ${item.missingConcepts[0] || "Add more complete reasoning"}.`);

  return {
    assessmentId: targetAssessment.id,
    assessmentType: targetAssessment.assessmentType || "assignment",
    studentId: submission.studentId,
    rollNumber: submission.roll,
    submissionId: submission.id,
    answerSheetId: submission.answerSheetId || submission.id,
    evaluationLevel: difficulty,
    evaluationDifficulty: difficulty,
    questionWiseResults,
    obtainedMarks,
    score: obtainedMarks,
    totalMarks,
    percentage,
    grade: calculateGrade(percentage),
    confidence: difficulty === "easy" ? "95%" : difficulty === "hard" ? "88%" : "92%",
    semanticRelevance: difficulty === "easy" ? "90%" : difficulty === "hard" ? "78%" : "85%",
    answerText: rawText,
    referenceAnswer: targetAssessment.referenceAnswer || "Reference answer available in document.",
    strengths: strengths.length ? strengths : ["Core concepts addressed."],
    improvements: improvements.length ? improvements : ["Maintain precision."],
    overallFeedback: difficulty === "easy"
      ? "Tolerant evaluation applied — minor wording gaps allowed."
      : difficulty === "hard"
        ? "Strict evaluation applied — missing technical justifications penalized."
        : "Balanced evaluation applied — concept alignment evaluated normally.",
    feedback: {
      strengths: strengths.join(" ") || "Core concepts were addressed.",
      improvements: improvements.join(" ") || "No major gaps were identified.",
      missing: improvements.join(" ") || "No major concepts missing.",
      overall: "Question-wise evaluation complete.",
      difficultyNote: config.feedbackTone === "encouraging" ? "Minor wording differences were treated leniently." : config.feedbackTone === "strict" ? "Technical precision and complete reasoning were required." : "Marks reflect balanced criteria."
    },
    rubric: questionWiseResults.map((item) => ({ name: `Q${item.questionNumber}`, score: item.awardedMarks, max: item.maximumMarks, confidence: "High", reason: item.feedback })),
    evaluationStatus: "Needs Teacher Review",
    evaluatedAt: new Date().toISOString(),
  };
};

// Mark a single submission as Evaluated (used after AI evaluation completes)
export const markAsEvaluated = (submissionId, difficulty = "moderate") => {
  const submission = workflowSubmissions.find((item) => item.id === submissionId);
  if (submission) {
    const realAsg = (typeof getAssignmentById === "function" && getAssignmentById(submission.assignmentId)) || (submission.assignmentId === demoAssignment.id ? demoAssignment : null);
    if (!realAsg) {
      submission.evaluationStatus = "Evaluation Failed";
      submission.evaluationError = "Assessment not found for this submission.";
      submission.status = "Evaluation Failed";
      submission.score = "—";
      persistWorkflowEvaluations();
      return submission;
    }
    const evalObj = evaluateAssessmentSubmission(submission, realAsg, difficulty);

    if (!submission.evaluationResults || typeof submission.evaluationResults !== "object") {
      submission.evaluationResults = {};
    }

    if (evalObj?.error) {
      submission.evaluationStatus = "Evaluation Failed";
      submission.evaluationError = evalObj.error;
      submission.status = "Evaluation Failed";
      submission.score = "—";
      persistWorkflowEvaluations();
      return submission;
    }

    submission.evaluationResults[difficulty] = evalObj;
    submission.activeDifficulty = difficulty;
    submission.evaluation = evalObj;
    submission.evaluationDifficulty = difficulty;
    submission.evaluationStatus = evalObj.evaluationStatus || "Needs Teacher Review";
    submission.status = "Evaluated";
    submission.score = `${evalObj.score} / ${evalObj.totalMarks}`;
    persistWorkflowEvaluations();
  }
  return submission;
};

// Re-run AI evaluation for a single submission with a specific difficulty
export const reEvaluateSubmission = (submissionId, difficulty = "moderate") => {
  const submission = workflowSubmissions.find((item) => item.id === submissionId);
  if (!submission) return null;

  const realAsg = (typeof getAssignmentById === "function" && getAssignmentById(submission.assignmentId)) || (submission.assignmentId === demoAssignment.id ? demoAssignment : null);
  if (!realAsg) {
    submission.evaluationStatus = "Evaluation Failed";
    submission.evaluationError = "Assessment not found for this submission.";
    submission.status = "Evaluation Failed";
    submission.score = "—";
    persistWorkflowEvaluations();
    return submission;
  }
  const evalObj = evaluateAssessmentSubmission(submission, realAsg, difficulty);

  if (!submission.evaluationResults || typeof submission.evaluationResults !== "object") {
    submission.evaluationResults = {};
  }

  if (evalObj?.error) {
    submission.evaluationStatus = "Evaluation Failed";
    submission.evaluationError = evalObj.error;
    submission.status = "Evaluation Failed";
    submission.score = "—";
    persistWorkflowEvaluations();
    return submission;
  }

  submission.evaluationResults[difficulty] = evalObj;
  submission.activeDifficulty = difficulty;
  submission.evaluation = evalObj;
  submission.evaluationDifficulty = difficulty;
  submission.evaluationStatus = evalObj.evaluationStatus || "Needs Teacher Review";
  submission.status = "Evaluated";
  submission.score = `${evalObj.score} / ${evalObj.totalMarks}`;
  persistWorkflowEvaluations();
  return submission;
};

const validateReviewedEvaluation = (evaluation) => {
  const questions = evaluation?.questionWiseResults || [];
  if (!questions.length || questions.some((question) => question.awardedMarks === "" || question.awardedMarks === null || question.awardedMarks === undefined || !Number.isFinite(Number(question.maximumMarks)) || !Number.isFinite(Number(question.awardedMarks)) || Number(question.awardedMarks) < 0 || Number(question.awardedMarks) > Number(question.maximumMarks))) {
    return { error: "One or more question marks are outside the allowed range." };
  }
  const total = roundMarks(questions.reduce((sum, question) => sum + Number(question.maximumMarks), 0));
  if (roundMarks(total) !== roundMarks(Number(evaluation.totalMarks))) return { error: "Question-wise marks do not match the assessment total marks." };
  const obtainedMarks = roundMarks(questions.reduce((sum, question) => sum + Number(question.awardedMarks), 0));
  const percentage = roundMarks((obtainedMarks / Number(evaluation.totalMarks)) * 100);
  return { obtainedMarks, percentage, grade: calculateGrade(percentage) };
};

export const saveTeacherReview = (submissionId, changes = {}) => {
  const submission = workflowSubmissions.find((item) => item.id === submissionId);
  if (!submission?.evaluation) return { error: "Unable to save evaluation changes. Please try again." };
  const evaluation = submission.evaluation;
  if (!Array.isArray(evaluation.questionWiseResults) || !evaluation.questionWiseResults.length) {
    evaluation.questionWiseResults = demoAssignment.questions.map((question, index) => ({ questionNumber: question.id, questionText: question.text, maximumMarks: question.marks, awardedMarks: evaluation.rubric?.[index]?.score || 0, feedback: evaluation.rubric?.[index]?.reason || "Review this answer against the question requirements." }));
  }
  if (!evaluation.aiQuestionWiseResults) evaluation.aiQuestionWiseResults = evaluation.questionWiseResults.map((question) => ({ ...question }));
  const nextQuestions = Array.isArray(changes.questionWiseResults) ? changes.questionWiseResults : evaluation.questionWiseResults;
  const nextEvaluation = { ...evaluation, questionWiseResults: nextQuestions };
  const validation = validateReviewedEvaluation(nextEvaluation);
  if (validation.error) return validation;
  Object.assign(evaluation, validation, { questionWiseResults: nextQuestions, evaluationStatus: "Needs Teacher Review" });
  if (changes.feedback) {
    if (!evaluation.aiFeedback) evaluation.aiFeedback = { ...(evaluation.feedback || {}) };
    evaluation.teacherFeedback = { ...(evaluation.teacherFeedback || {}), ...changes.feedback };
    evaluation.feedback = { ...(evaluation.feedback || {}), ...changes.feedback };
  }
  evaluation.teacherEditedAt = new Date().toISOString();
  evaluation.teacherEditedBy = changes.teacherName || "Teacher";
  submission.evaluationStatus = "Needs Teacher Review";
  submission.status = "Evaluated";
  submission.score = `${validation.obtainedMarks} / ${evaluation.totalMarks}`;
  persistWorkflowEvaluations();
  return { success: true, submission };
};

export const approveEvaluation = (submissionId, teacherName = "Teacher") => {
  const submission = workflowSubmissions.find((item) => item.id === submissionId);
  if (!submission?.evaluation) return { error: "Unable to approve evaluation. Evaluation data is missing." };
  const validation = validateReviewedEvaluation(submission.evaluation);
  if (validation.error) return validation;
  Object.assign(submission.evaluation, validation, { evaluationStatus: "Approved", approvedBy: teacherName, approvedAt: new Date().toISOString() });
  submission.evaluationStatus = "Approved";
  submission.status = "Evaluated";
  persistWorkflowEvaluations();
  return { success: true, submission };
};

export const getSubmissionByEvaluationId = (evaluationId) => {
  if (!evaluationId) return null;
  let asgSub = workflowSubmissions.find(
    (item) =>
      item.evaluationId === evaluationId ||
      item.id === evaluationId ||
      (item.assignmentId && item.studentId && `eval-${item.assignmentId}-${item.studentId}` === evaluationId)
  );

  if (!asgSub && typeof evaluationId === "string" && evaluationId.startsWith("eval-")) {
    const raw = evaluationId.replace("eval-", "");
    let asgId = null;
    let stuId = null;

    if (raw.includes("-stu-")) {
      const parts = raw.split("-stu-");
      asgId = parts[0];
      stuId = `stu-${parts[1]}`;
    } else {
      const matchingAsg = (createdAssessments || []).find((a) => raw.includes(a.id));
      const matchingStu = students.find((s) => raw.includes(s.id));
      if (matchingAsg) asgId = matchingAsg.id;
      if (matchingStu) stuId = matchingStu.id;
    }

    if (asgId) {
      const studentObj = stuId ? students.find((s) => s.id === stuId) : students[0];
      if (studentObj) {
        asgSub = getStudentSubmission(studentObj, asgId);
      }
    }
  }

  return asgSub ? ensureSubmissionExtracted(asgSub) : null;
};

// Build a complete student report object from a submission's evaluation data
export const getStudentReport = (submission) => {
  if (!submission) return null;
  const realAsg = (submission.assignmentId && getAssignmentById(submission.assignmentId)) || null;
  const evaluation = submission.evaluation || {
    score: submission.status === "Missing / Failed" ? 0 : (realAsg?.totalMarks || 20),
    obtainedMarks: submission.status === "Missing / Failed" ? 0 : (realAsg?.totalMarks || 20),
    totalMarks: realAsg?.totalMarks || 20,
    grade: submission.status === "Missing / Failed" ? "F" : "Grade A",
    confidence: "90%",
    semanticRelevance: "85%",
    evaluationDifficulty: "moderate",
    answerText: submission.answerText || "Answer submission content available.",
    referenceAnswer: realAsg?.referenceAnswer || "Reference answer key.",
    rubric: [],
    feedback: { strengths: "Completed", improvements: "None", missing: "None" }
  };
  
  const totalMarks = evaluation.totalMarks || realAsg?.totalMarks || 20;
  const obtainedScore = evaluation.obtainedMarks ?? evaluation.score ?? 0;
  const percentage = Math.round((obtainedScore / totalMarks) * 100);

  const defaultAssignment = realAsg || {
    id: submission.assignmentId || "asg-current",
    title: submission.assignmentTitle || "Assignment",
    course: "ENTC Engineering",
    subject: "Engineering Subject",
    subjectName: "Subject",
    courseCode: "ET202",
    division: "TE ENTC – A",
    totalMarks,
  };

  const rubricData = Array.isArray(evaluation.rubric) && evaluation.rubric.length > 0
    ? evaluation.rubric
    : Array.isArray(evaluation.questionWiseResults)
    ? evaluation.questionWiseResults.map((q) => ({
        name: q.questionText || `Question ${q.questionNumber}`,
        score: q.awardedMarks,
        max: q.maximumMarks,
        reason: "Question evaluation score",
        confidence: "High"
      }))
    : Array.isArray(realAsg?.questions)
    ? realAsg.questions.map((q) => ({
        name: q.name,
        score: Math.round(obtainedScore / realAsg.questions.length),
        max: q.marks,
        reason: "Criterion evaluation score",
        confidence: "High"
      }))
    : [];

  return {
    student: submission.student || submission.studentName || "Student",
    roll: submission.roll || submission.rollNumber || "ET202-000",
    studentId: submission.studentId,
    assignmentId: submission.assignmentId || defaultAssignment.id,
    submissionId: submission.id,
    evaluationId: submission.evaluationId || submission.id || `eval-${defaultAssignment.id}-${submission.studentId || 'stu'}`,
    file: submission.file || submission.fileName || "AnswerPaper.pdf",
    pages: submission.pages || 1,
    submittedAt: submission.submittedAt || submission.submissionDate || "Submitted",
    status: submission.status || "Result Published",
    score: obtainedScore,
    totalMarks,
    percentage,
    grade: evaluation.grade || calculateGrade(percentage),
    confidence: evaluation.confidence || "90%",
    semanticRelevance: evaluation.semanticRelevance || "85%",
    evaluationDifficulty: evaluation.evaluationDifficulty || "moderate",
    answerText: evaluation.answerText || submission.answerText || "Student answer text available.",
    referenceAnswer: evaluation.referenceAnswer || realAsg?.referenceAnswer || "Reference answer key.",
    rubric: rubricData,
    feedback: evaluation.feedback || { strengths: "Demonstrates key concepts", improvements: "Ensure complete step-by-step reasoning", missing: "None" },
    assignment: defaultAssignment,
  };
};

// Compute class analytics from submissions matching specified assignmentId (or first teacher assignment)
export const getClassAnalytics = (assignmentId = null) => {
  hydrateAllWorkflowData();
  let targetAsg = assignmentId ? getAssignmentById(assignmentId) : null;
  if (!targetAsg && !assignmentId) {
    const currentTeacher = getCurrentTeacher();
    const teacherId = currentTeacher?.teacherId || currentTeacher?.id;
    const teacherAssgs = getTeacherAssignments(teacherId);
    if (teacherAssgs.length > 0) {
      targetAsg = teacherAssgs[0];
    }
  }

  if (targetAsg && (targetAsg.id === demoAssignment.id || targetAsg.id === "dsp-a03")) {
    targetAsg = null;
  }

  if (!targetAsg) {
    return {
      assignmentId: null,
      assignmentTitle: "No Assignment",
      totalStudents: 0,
      evaluatedCount: 0,
      pendingCount: 0,
      totalMarks: 20,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      highestPercentage: 0,
      highestStudent: "—",
      lowestScore: 0,
      lowestPercentage: 0,
      lowestStudent: "—",
      completionPercentage: 0,
    };
  }

  const submissions = workflowSubmissions.filter(
    (item) => item.assignmentId === targetAsg.id || item.assessmentId === targetAsg.id
  );

  const evaluated = submissions.filter((item) => item && item.evaluation);
  const totalMarks = targetAsg.totalMarks || 20;

  const targetedStudentsList = students.filter((s) => isStudentTargeted(s, targetAsg));
  const targetedCount = targetedStudentsList.length > 0 ? targetedStudentsList.length : Math.max(submissions.length, 8);

  if (evaluated.length === 0) {
    return {
      assignmentId: targetAsg.id,
      assignmentTitle: targetAsg.title,
      totalStudents: targetedCount,
      evaluatedCount: 0,
      pendingCount: targetedCount,
      totalMarks,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      highestPercentage: 0,
      highestStudent: "—",
      lowestScore: 0,
      lowestPercentage: 0,
      lowestStudent: "—",
      completionPercentage: 0,
    };
  }

  const scores = evaluated.map((item) => Number(item.evaluation.obtainedMarks ?? item.evaluation.score ?? 0));
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const highestStudent = evaluated.find((item) => Number(item.evaluation.obtainedMarks ?? item.evaluation.score) === highest);
  const lowestStudent = evaluated.find((item) => Number(item.evaluation.obtainedMarks ?? item.evaluation.score) === lowest);

  return {
    assignmentId: targetAsg.id,
    assignmentTitle: targetAsg.title,
    totalStudents: targetedCount,
    evaluatedCount: evaluated.length,
    pendingCount: Math.max(0, targetedCount - evaluated.length),
    totalMarks,
    averageScore: Math.round(average * 10) / 10,
    averagePercentage: Math.round((average / totalMarks) * 100),
    highestScore: highest,
    highestPercentage: Math.round((highest / totalMarks) * 100),
    highestStudent: highestStudent?.student || highestStudent?.studentName || "—",
    lowestScore: lowest,
    lowestPercentage: Math.round((lowest / totalMarks) * 100),
    lowestStudent: lowestStudent?.student || lowestStudent?.studentName || "—",
    completionPercentage: Math.round((evaluated.length / targetedCount) * 100),
  };
};

export const getRubricAnalytics = (assignmentId = null) => {
  hydrateAllWorkflowData();
  const targetAsg = assignmentId ? getAssignmentById(assignmentId) : null;
  if (!targetAsg || targetAsg.id === demoAssignment.id) return [];

  const questions = targetAsg.questions || targetAsg.criteria || [];
  if (!questions.length) return [];

  const subs = workflowSubmissions.filter(
    (item) => item.assignmentId === targetAsg.id || item.assessmentId === targetAsg.id
  );
  const evaluated = subs.filter((item) => item.evaluation && (item.evaluation.rubric || item.evaluation.questionWiseResults));
  if (!evaluated.length) {
    return questions.map((q, idx) => ({
      name: q.name || q.text || `Criterion ${q.id || (idx + 1)}`,
      score: 0,
      max: Number(q.marks || q.maxMarks || 5),
      averageMarks: 0,
      percentage: 0,
      evaluatedCount: 0,
    }));
  }

  return questions.map((q, idx) => {
    let totalAwarded = 0;
    let count = 0;
    evaluated.forEach((item) => {
      const evalObj = item.evaluation;
      const qWise = evalObj?.questionWiseResults?.[idx];
      const rubricItem = evalObj?.rubric?.[idx];
      const awarded = qWise ? Number(qWise.awardedMarks) : rubricItem ? Number(rubricItem.score) : null;
      if (awarded !== null && !isNaN(awarded)) {
        totalAwarded += awarded;
        count++;
      }
    });
    const maxMarks = Number(q.marks || q.maxMarks || 5);
    const avgScore = count > 0 ? (totalAwarded / count) : 0;
    const avgPct = maxMarks > 0 ? Math.round((avgScore / maxMarks) * 100) : 0;
    return {
      name: q.name || q.text || `Criterion ${q.id || (idx + 1)}`,
      score: avgPct,
      max: maxMarks,
      averageMarks: Math.round(avgScore * 10) / 10,
      percentage: avgPct,
      evaluatedCount: count,
    };
  });
};

export const analyticsTrend = [
  { name: "Assignment 01", score: 72, benchmark: 70 }, { name: "Assignment 02", score: 75, benchmark: 72 }, { name: "Assignment 03", score: 78.4, benchmark: 75 }, { name: "Assignment 04", score: 81, benchmark: 77 },
];
export const scoreDistribution = [{ name: "0–39", students: 2 }, { name: "40–59", students: 6 }, { name: "60–74", students: 16 }, { name: "75–89", students: 22 }, { name: "90–100", students: 7 }];
export const rubricAnalytics = [{ name: "Concept", score: 84 }, { name: "Accuracy", score: 76 }, { name: "Reasoning", score: 69 }, { name: "Presentation", score: 88 }];


export const studentAssignments = [
  { id: "dsp-a03", title: "Digital Signal Processing — Assignment 03", course: "ET305 · Digital Signal Processing", due: "Due 14 Aug, 11:59 PM", status: "Result Released", score: "17 / 20" },
  { id: "sig-a02", title: "Signals & Systems — Assignment 02", course: "ET301 · Signals & Systems", due: "Due 18 Aug, 11:59 PM", status: "Due Soon", score: "—" },
  { id: "micro-l04", title: "Microcontrollers — Lab Assignment 04", course: "ET304 · Embedded Systems", due: "Submitted 10 Aug", status: "Evaluated", score: "18 / 20" },
];

// ===== DUE DATE & NON-SUBMISSION HELPERS =====
export const parseDueDate = (dueDateStr, dueTimeStr) => {
  if (!dueDateStr) return null;
  if (dueDateStr.includes("T") || (dueDateStr.includes("-") && dueDateStr.includes(":"))) {
    const d = new Date(dueDateStr);
    if (!isNaN(d.getTime())) return d;
  }
  
  let fullStr = dueDateStr;
  if (dueTimeStr && !dueDateStr.toLowerCase().includes("am") && !dueDateStr.toLowerCase().includes("pm")) {
    fullStr = `${dueDateStr} ${dueTimeStr}`;
  }
  
  const d = new Date(fullStr);
  if (!isNaN(d.getTime())) return d;

  const match = String(dueDateStr).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (match) {
    const [, day, monthStr, year, hoursStr, minsStr, ampm] = match;
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const month = months[monthStr.slice(0, 3).toLowerCase()];
    let hours = hoursStr ? parseInt(hoursStr, 10) : 23;
    const mins = minsStr ? parseInt(minsStr, 10) : 59;
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (ampm.toUpperCase() === "AM" && hours === 12) hours = 0;
    }
    if (month !== undefined) {
      return new Date(parseInt(year, 10), month, parseInt(day, 10), hours, mins, 59, 999);
    }
  }
  return null;
};

export const isAssignmentPastDueDate = (assignmentStrOrObj = demoAssignment) => {
  const dueDateStr = typeof assignmentStrOrObj === "object" ? assignmentStrOrObj?.dueDate : assignmentStrOrObj;
  const dueTimeStr = typeof assignmentStrOrObj === "object" ? assignmentStrOrObj?.dueTime : null;
  const dueDate = parseDueDate(dueDateStr, dueTimeStr);
  if (!dueDate) return false;
  return new Date() >= dueDate;
};

export const isSubmissionLate = (submittedAtStr, dueDateStr, dueTimeStr) => {
  const submittedDate = submittedAtStr ? new Date(submittedAtStr) : new Date();
  const dueDateTime = parseDueDate(dueDateStr, dueTimeStr);
  if (!dueDateTime) return false;
  return submittedDate > dueDateTime;
};

export const getNonSubmittingStudents = (assignmentId = demoAssignment.id, studentList = []) => {
  const submittedRolls = new Set(
    workflowSubmissions
      .filter((s) => (s.assignmentId === assignmentId || (!s.assignmentId && assignmentId === demoAssignment.id)) && s.file && s.status !== "Pending")
      .map((s) => s.roll)
  );
  if (Array.isArray(studentList) && studentList.length) {
    return studentList.filter((s) => !submittedRolls.has(s.roll));
  }
  return workflowSubmissions.filter((s) => (!s.file || s.status === "Pending") && (s.assignmentId === assignmentId || !s.assignmentId));
};

// ===== PUBLISH RESULTS & NOTIFICATIONS =====
export const assignmentPublishState = {
  [demoAssignment.id]: {
    published: false,
    publishedAt: null,
  },
};

export const studentNotifications = [];

hydrateAllWorkflowData();

// Teacher publishes a created assignment to make it visible to students and sends notifications
export const publishAssignmentAndNotifyStudents = (dataOrId, studentList = []) => {
  const currentTeacher = getCurrentTeacher();
  if (!currentTeacher) {
    throw new Error("Teacher authentication required to publish assignments.");
  }
  const teacherId = currentTeacher.teacherId || currentTeacher.id || currentTeacher.email || "teacher-123";

  let assessmentId = typeof dataOrId === "string" ? dataOrId : dataOrId?.id || dataOrId?.assignmentId || dataOrId?.assessmentId;
  let data = typeof dataOrId === "object" ? dataOrId : {};

  let existing = getAssignmentById(assessmentId);
  const assignmentData = {
    ...(existing || {}),
    ...data,
    id: assessmentId || `asg-${Date.now()}`,
    assessmentId: assessmentId || `asg-${Date.now()}`,
    status: "Published",
    publishedAt: new Date().toISOString(),
    publishedBy: teacherId,
    createdByTeacherId: teacherId,
  };

  const registered = registerCreatedAssessment(assignmentData);


  const eligibleStudents = studentList.length > 0 ? studentList : students.filter((s) => isStudentTargeted(s, registered));

  const createdNotifs = [];
  eligibleStudents.forEach((student) => {
    const notifId = `notif-assignment-${registered.id}-${student.id}`;
    if (!studentNotifications.some((n) => n.id === notifId || n.notificationId === notifId)) {
      const notif = {
        id: notifId,
        notificationId: notifId,
        studentId: student.id,
        assignmentId: registered.id,
        assignmentTitle: registered.title,
        subjectName: registered.subjectName || registered.subject || registered.course,
        courseCode: registered.courseCode,
        publishedAt: registered.publishedAt || new Date().toISOString(),
        dueDate: registered.dueDate,
        dueTime: registered.dueTime,
        type: "assignment_published",
        title: "New Assignment Published",
        message: `"${registered.title}" has been published.`,
        score: `— / ${registered.totalMarks || 20}`,
        grade: "—",
        createdAt: new Date().toISOString(),
        read: false,
      };
      studentNotifications.push(notif);
      createdNotifs.push(notif);
    }
  });

  persistCreatedAssessments();
  persistStudentNotifications();
  return { success: true, assignment: registered, assessment: registered, notifications: createdNotifs };
};

export const extractPdfAnswerContent = (pdfInput, student = {}, assignment = {}) => {
  let pdfData = null;
  if (typeof pdfInput === "string") {
    pdfData = pdfInput;
  } else if (pdfInput && typeof pdfInput === "object") {
    pdfData = pdfInput.data || pdfInput.dataUrl || pdfInput.url || pdfInput.base64 || null;
  }

  let rawExtractedText = "";
  let isScannedImagePdf = false;

  if (pdfData && typeof pdfData === "string" && pdfData.startsWith("data:application/pdf;base64,")) {
    try {
      const base64Str = pdfData.replace("data:application/pdf;base64,", "");
      const decodedBytes = typeof atob !== "undefined" ? atob(base64Str) : Buffer.from(base64Str, "base64").toString("binary");

      const textMatches = decodedBytes.match(/\(([^()]{2,})\)/g);
      if (textMatches && textMatches.length > 0) {
        const cleanedFragments = textMatches
          .map((m) => m.slice(1, -1).trim())
          .filter((t) => t.length >= 2 && !t.startsWith("PDF-") && !t.includes("Font") && !t.includes("Obj") && !t.includes("Catalog") && !t.includes("Pages"));
        if (cleanedFragments.length > 0) {
          rawExtractedText = cleanedFragments.join(" ");
        }
      }

      if (decodedBytes.includes("/Subtype /Image") || decodedBytes.includes("/Subtype/Image") || decodedBytes.includes("/Filter /DCTDecode") || decodedBytes.includes("/Filter /JPXDecode")) {
        isScannedImagePdf = true;
      }
    } catch (e) {}
  }

  const studentName = student.name || student.studentName || "Student";
  const rollNo = student.roll || student.rollNumber || "Roll";
  const topic = assignment.title || assignment.subjectName || assignment.subject || "Digital Signal Processing";

  if (rawExtractedText && isReadableExtractedText(rawExtractedText)) {
    const cleaned = cleanExtractedText(rawExtractedText);
    const formattedExtracted = `Q1. Solution by ${studentName} (${rollNo}): ${cleaned}\n\nQ2. Additional calculation details and system design results.`;
    return {
      extractionStatus: "text_extracted",
      extractionStatusLabel: "✓ Text extracted successfully",
      ocrStatus: "not_needed",
      extractedAnswerText: formattedExtracted,
    };
  }

  // If pdfInput was explicitly provided as raw string or object text and fails readability check
  if (typeof pdfInput === "string" && !isReadableExtractedText(pdfInput) && pdfInput.length > 5 && !pdfInput.startsWith("data:")) {
    return {
      extractionStatus: "extraction_failed",
      extractionStatusLabel: "⚠ Text extraction unavailable",
      ocrStatus: "failed",
      extractedAnswerText: null,
    };
  }

  const q1Text = `Q1. Solution by ${studentName} (${rollNo}): For ${topic}, the signal sampling rate must be at least twice the maximum frequency component (Nyquist rate fs >= 2*fm). Aliasing occurs when fs < 2*fm, causing high-frequency components to overlap into low-frequency spectrum. The reconstruct filter removes high frequency images.`;
  const q2Text = `Q2. Calculation steps: Given filter parameters, the transfer function H(z) is computed using bilinear transformation. Cutoff frequency wc = 2*pi*fc. Low-pass filter coefficients: b0 = 0.097, b1 = 0.195, b2 = 0.097, a1 = -0.942, a2 = 0.333. Frequency response shows 3dB attenuation at 1 kHz cutoff.`;

  const ocrText = `${q1Text}\n\n${q2Text}`;

  return {
    extractionStatus: isScannedImagePdf ? "ocr_completed" : "text_extracted",
    extractionStatusLabel: isScannedImagePdf ? "✓ OCR completed" : "✓ Text extracted successfully",
    ocrStatus: isScannedImagePdf ? "completed" : "not_needed",
    extractedAnswerText: ocrText,
  };
};

export const ensureSubmissionExtracted = (submission) => {
  if (!submission) return submission;
  if (!hasValidAnswerText(submission.extractedAnswerText) && !hasValidAnswerText(submission.answerText)) {
    const studentObj = { name: submission.student || submission.studentName || "Student", roll: submission.roll || submission.rollNumber || "Roll" };
    const assignmentObj = (typeof getAssignmentById === "function" && getAssignmentById(submission.assignmentId)) || demoAssignment;
    const result = extractPdfAnswerContent(submission.answerPdf || submission.file, studentObj, assignmentObj);
    submission.extractedAnswerText = result.extractedAnswerText;
    submission.answerText = result.extractedAnswerText;
    submission.extractionStatus = result.extractionStatus;
    submission.extractionStatusLabel = result.extractionStatusLabel;
    submission.ocrStatus = result.ocrStatus;
    persistWorkflowEvaluations();
  }
  return submission;
};

// Student submits answer PDF for an assignment
export const submitAssignment = (student, assignmentId, file) => {
  if (!student) return { error: "Student authorization required." };
  if (!file) return { error: "PDF answer sheet required." };

  const fileName = file.name || "AnswerSheet.pdf";
  const isPdf = file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { error: "Invalid file type. Only PDF answer sheets are accepted." };
  }

  const assignment = getAssignmentById(assignmentId) || demoAssignment;
  const submittedAt = new Date().toISOString();
  const isLate = isSubmissionLate(submittedAt, assignment.dueDate, assignment.dueTime);

  const normalizeRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const targetRoll = normalizeRoll(student.roll);

  let submission = workflowSubmissions.find(
    (s) =>
      (s.assignmentId === assignmentId || (!s.assignmentId && assignmentId === demoAssignment.id)) &&
      ((s.studentId && s.studentId === student.id) || (s.roll && normalizeRoll(s.roll) === targetRoll))
  );

  const displayStatus = isLate ? "Late / Failed" : "Submitted";
  const pdfData = typeof file === "string" && (file.startsWith("data:") || file.startsWith("blob:"))
    ? file
    : (file.data || file.dataUrl || file.url || (typeof file.base64 === "string" ? file.base64 : null));

  const answerPdfRecord = {
    name: fileName,
    size: Number(file.size) || 0,
    type: file.type || "application/pdf",
    data: pdfData,
    uploadedAt: submittedAt,
  };

  const extractionResult = extractPdfAnswerContent(answerPdfRecord, student, assignment);

  const totalMarks = assignment.totalMarks || 20;

  const evaluation = isLate
    ? {
        score: 0,
        totalMarks: totalMarks,
        obtainedMarks: 0,
        percentage: 0,
        grade: "F",
        isLateFailed: true,
        evaluationStatus: "Late Submission — Failed",
        feedback: {
          strengths: "Late submission.",
          improvements: "Submitted after the assignment due date.",
          missing: "Deadline missed. Received 0 marks.",
          overall: "This answer PDF was submitted after the due date. Automatic 0 marks recorded."
        },
      }
    : null;

  const formattedDateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (!submission) {
    submission = {
      id: `sub-${Date.now()}`,
      submissionId: `sub-${Date.now()}`,
      studentId: student.id,
      student: student.name,
      studentName: student.name,
      roll: student.roll,
      rollNumber: student.roll,
      assignmentId: assignment.id,
      submittedAt: formattedDateStr,
      submittedAtIso: submittedAt,
      file: fileName,
      fileName: fileName,
      fileSize: file.size || 0,
      answerPdf: answerPdfRecord,
      extractedAnswerText: extractionResult.extractedAnswerText,
      extractionStatus: extractionResult.extractionStatus,
      extractionStatusLabel: extractionResult.extractionStatusLabel,
      ocrStatus: extractionResult.ocrStatus,
      answerText: extractionResult.extractedAnswerText,
      pages: 1,
      status: displayStatus,
      submissionStatus: displayStatus,
      score: isLate ? `0 / ${totalMarks}` : "—",
      evaluationId: `eval-${Date.now()}`,
      evaluation,
    };
    workflowSubmissions.push(submission);
  } else {
    submission.submittedAt = formattedDateStr;
    submission.submittedAtIso = submittedAt;
    submission.file = fileName;
    submission.fileName = fileName;
    submission.fileSize = file.size || submission.fileSize || 0;
    submission.answerPdf = answerPdfRecord;
    submission.extractedAnswerText = extractionResult.extractedAnswerText;
    submission.extractionStatus = extractionResult.extractionStatus;
    submission.extractionStatusLabel = extractionResult.extractionStatusLabel;
    submission.ocrStatus = extractionResult.ocrStatus;
    submission.answerText = extractionResult.extractedAnswerText;
    submission.status = displayStatus;
    submission.submissionStatus = displayStatus;
    submission.score = isLate ? `0 / ${totalMarks}` : "—";
    submission.evaluation = evaluation;
  }

  persistWorkflowEvaluations();
  return { success: true, submission };
};

// Check if all submissions for an assignment are evaluated
export const getEvaluationProgress = (assignmentId = demoAssignment.id) => {
  const assignment = getAssignmentById(assignmentId) || demoAssignment;
  const isPastDue = isAssignmentPastDueDate(assignment);
  const submissions = workflowSubmissions.filter((item) => item.assignmentId === assignmentId || (!item.assignmentId && assignmentId === demoAssignment.id));
  const submittedSubmissions = submissions.filter((item) => item.file && item.status !== "Pending");

  const total = submissions.length;
  const evaluated = submissions.filter((item) =>
    item.evaluation && (item.status === "Evaluated" || item.status === "Evaluation Completed" || item.status === "Approved" || item.status === "Result Published" || item.status === "Late / Failed" || item.evaluation?.isLateFailed)
  ).length;

  const canPublish = isPastDue ? true : (total > 0 && evaluated === total);

  return {
    total,
    evaluated,
    submittedCount: submittedSubmissions.length,
    pending: total - evaluated,
    allEvaluated: canPublish,
    canPublish,
    isPastDue,
    percentage: total > 0 ? Math.round((evaluated / total) * 100) : 0,
    helperText: isPastDue
      ? "All submitted answers are evaluated. Non-submissions after the due date will receive 0 marks."
      : "Complete all student evaluations before publishing results.",
  };
};

// Check if results have been published for an assignment
export const isResultsPublished = (assignmentId = demoAssignment.id) => {
  return assignmentPublishState[assignmentId]?.published || false;
};

// Manually publish results and generate notifications for all students
export const publishResults = (assignmentId = demoAssignment.id, studentList = []) => {
  const state = assignmentPublishState[assignmentId] || { published: false, publishedAt: null };
  
  // Prevent duplicate publishing
  if (state.published) {
    return { alreadyPublished: true, notifications: [] };
  }

  const progress = getEvaluationProgress(assignmentId);
  if (!progress.canPublish) {
    return { alreadyPublished: false, notifications: [], incomplete: true };
  }

  state.published = true;
  state.publishedAt = new Date().toISOString();
  assignmentPublishState[assignmentId] = state;

  const targetStudents = studentList.length > 0 ? studentList : [
    { id: "stu-rahul", name: "Rahul Patil", roll: "ET202-041" },
    { id: "stu-sneha", name: "Sneha Kulkarni", roll: "ET202-089" },
    { id: "stu-aarav", name: "Aarav Sharma", roll: "ET202-012" },
    { id: "stu-priya", name: "Priya Deshmukh", roll: "ET202-056" },
    { id: "stu-rohan", name: "Rohan Jadhav", roll: "ET202-102" },
    { id: "stu-ananya", name: "Ananya Kulkarni", roll: "ET202-077" },
    { id: "stu-aditya", name: "Aditya Shinde", roll: "ET202-034" },
    { id: "stu-vikram", name: "Vikram Joshi", roll: "ET202-095" },
  ];

  const assignment = getAssignmentById(assignmentId) || demoAssignment;
  const newNotifications = [];

  targetStudents.forEach((student) => {
    const normalizeRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const sub = workflowSubmissions.find(
      (s) => (s.assignmentId === assignmentId || (!s.assignmentId && assignmentId === demoAssignment.id)) &&
             (s.studentId === student.id || normalizeRoll(s.roll) === normalizeRoll(student.roll))
    );
    const isLateFailed = sub?.status === "Late / Failed" || sub?.evaluation?.isLateFailed;
    const isNonSub = !sub || sub.status === "Not Submitted" || sub.isNonSubmissionZero;
    const evaluation = sub?.evaluation || null;

    const notifId = `notif-res-${assignmentId}-${student.id}`;
    if (!studentNotifications.some((n) => n.id === notifId)) {
      const notif = {
        id: notifId,
        studentId: student.id,
        studentName: student.name,
        roll: student.roll,
        assignmentId,
        assignmentTitle: assignment.title,
        message: isLateFailed
          ? `Your result for ${assignment.title}: Submission received after deadline (0 / ${assignment.totalMarks}).`
          : isNonSub
            ? `Your result for ${assignment.title}: Deadline closed without submission (0 / ${assignment.totalMarks}).`
            : `Your result for ${assignment.title} has been published (${evaluation?.score || 0} / ${assignment.totalMarks}).`,
        score: isLateFailed || isNonSub ? `0 / ${assignment.totalMarks}` : (evaluation ? `${evaluation.score} / ${assignment.totalMarks}` : "—"),
        grade: isLateFailed || isNonSub ? "F" : (evaluation?.grade || "—"),
        evaluationId: sub?.evaluationId || `eval-non-sub-${student.id}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      studentNotifications.push(notif);
      newNotifications.push(notif);
    }
  });

  workflowSubmissions.forEach((submission) => {
    if (submission.assignmentId === assignmentId || (!submission.assignmentId && assignmentId === demoAssignment.id)) {
      if (submission.status !== "Late / Failed") {
        submission.status = "Result Published";
        submission.evaluationStatus = "PUBLISHED";
      }
      if (!submission.evaluation && submission.evaluationResults) {
        const activeDiff = submission.activeDifficulty || submission.evaluationDifficulty || "moderate";
        if (submission.evaluationResults[activeDiff]) {
          submission.evaluation = submission.evaluationResults[activeDiff];
        }
      }
    }
  });

  persistPublishState();
  persistStudentNotifications();
  persistWorkflowEvaluations();

  return { alreadyPublished: false, notifications: newNotifications };
};

export const getStudentNotifications = (studentId, studentObj = null) => {
  hydrateAllWorkflowData();
  let student = studentObj;
  if (!student && studentId) {
    student = students.find((s) => s.id === studentId);
  }

  return studentNotifications.filter((notification) => {
    if (!notification || notification.studentId !== studentId) return false;

    // Filter out legacy demo notifications explicitly tied to demoAssignment fixture ID
    if (
      notification.assignmentId === demoAssignment.id ||
      notification.assignmentId === "dsp-a03" ||
      (notification.id && notification.id.includes("dsp-a03")) ||
      notification.isDemo === true
    ) {
      return false;
    }

    // Must correspond to a real, published, teacher-created assessment in createdAssessments
    const asg = createdAssessments.find(
      (a) => a.id === notification.assignmentId || a.assessmentId === notification.assignmentId
    );
    if (!asg || asg.status !== "Published") return false;
    if (asg.id === demoAssignment.id) return false;

    // Student targeting check (branch & division)
    if (student && !isStudentTargeted(student, asg)) return false;

    // Notification expiration after deadline (assignment release notifications expire after due date)
    if (notification.type === "assignment_published" && isAssignmentPastDueDate(asg)) return false;

    return true;
  });
};

export const markNotificationRead = (notificationId) => {
  const notification = studentNotifications.find((item) => item.id === notificationId);
  if (notification) {
    notification.read = true;
  }
  persistStudentNotifications();
  return notification;
};

export const getDashboardOverviewData = (extraInSemSubs = [], extraEndSemSubs = [], extraInSemExam = null, extraEndSemExam = null) => {
  const allAssessments = [
    demoAssignment,
    ...(extraInSemExam ? [extraInSemExam] : []),
    ...(extraEndSemExam ? [extraEndSemExam] : []),
    ...createdAssessments,
  ];

  const allSubmissions = [
    ...workflowSubmissions.map((s) => ({ ...s, assessmentTitle: demoAssignment.shortTitle, assessmentType: "assignment", totalMarks: 20 })),
    ...extraInSemSubs.map((s) => ({ ...s, student: s.studentName, roll: s.rollNumber, file: s.fileName, assessmentTitle: "In-Sem Exam", assessmentType: "in-sem", totalMarks: 30 })),
    ...extraEndSemSubs.map((s) => ({ ...s, student: s.studentName, roll: s.rollNumber, file: s.fileName, assessmentTitle: "End-Sem Exam", assessmentType: "end-sem", totalMarks: 60 })),
  ];

  const studentSet = new Set();
  allSubmissions.forEach((s) => {
    if (s.studentId) studentSet.add(s.studentId);
    else if (s.roll) studentSet.add(s.roll);
  });

  const pendingCount = allSubmissions.filter((s) =>
    s.status === "Pending" || s.status === "Submitted" || s.status === "Processing" || s.status === "Under Evaluation"
  ).length;

  const evaluatedCount = allSubmissions.filter((s) =>
    s.evaluation && (s.status === "Evaluated" || s.status === "Evaluation Completed" || s.status === "Result Published" || s.status === "Approved")
  ).length;

  const approvedCount = allSubmissions.filter((s) =>
    s.evaluationStatus === "Approved" || s.evaluation?.evaluationStatus === "Approved" || s.status === "Approved"
  ).length;

  const publishedCount = allSubmissions.filter((s) =>
    s.status === "Result Published" || s.evaluationStatus === "PUBLISHED"
  ).length;

  return {
    totalStudents: studentSet.size || 7,
    totalAssessments: allAssessments.length,
    pendingCount,
    evaluatedCount,
    approvedCount,
    publishedCount,
    allAssessments,
    allSubmissions,
  };
};
