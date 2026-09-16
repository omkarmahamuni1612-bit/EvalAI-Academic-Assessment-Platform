// ===== END-SEM EXAMINATION DATA (Phase 3C) =====
// This module contains all End-Sem Examination data and business logic.
// It reuses the In-Sem Examination architecture (Phase 3B) but uses
// assessmentType = "end-sem". The Assignment workflow (Phase 3A) is
// never modified.
import { evaluateAssessmentSubmission, hasValidAnswerText } from "./workflowData.js";

export const endSemExam = {
  id: "endsem-01",
  assessmentType: "end-sem",
  title: "End-Sem Examination — Digital Signal Processing",
  shortTitle: "End-Sem Exam — DSP",
  course: "Digital Signal Processing",
  courseCode: "ET305",
  subject: "Digital Signal Processing",
  topic: "Complete DSP Syllabus — Sampling, Filters, Transforms & Applications",
  division: "TE ENTC – A",
  teacher: "Prof. A. Deshmukh",
  examDate: "28 Aug 2026, 10:00 AM",
  totalMarks: 60,
  duration: "2 Hours",
  description:
    "End-Semester examination covering the complete DSP syllabus. Answer all questions. This is a comprehensive evaluation of the full course.",
  questions: [
    { id: 1, text: "State and prove the sampling theorem. Explain the Nyquist condition with a diagram.", marks: 12 },
    { id: 2, text: "Explain aliasing in detail and describe how an anti-aliasing filter prevents it.", marks: 10 },
    { id: 3, text: "Design a low-pass FIR filter using the windowing method and explain its frequency response.", marks: 12 },
    { id: 4, text: "Compare analog and digital filters with suitable examples and applications.", marks: 10 },
    { id: 5, text: "Explain the Discrete Fourier Transform (DFT) and its role in spectral analysis.", marks: 8 },
    { id: 6, text: "Describe the applications of DSP in real-world communication systems.", marks: 8 },
  ],
  questionPaperPdf: { name: "DSP_EndSem_QuestionPaper.pdf", size: 312000, type: "application/pdf" },
  referenceAnswerPdf: { name: "DSP_EndSem_ReferenceAnswer.pdf", size: 256000, type: "application/pdf" },
  referenceAnswer:
    "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling. A low-pass FIR filter has a finite impulse response and a linear phase response, making it suitable for applications requiring phase preservation. The DFT transforms a finite sequence of samples into a frequency-domain representation, enabling spectral analysis. DSP finds applications in digital communication, audio processing, image processing, and radar systems.",
};

// Answer sheets uploaded by the teacher, each mapped to a specific student.
// Every answer sheet is tied to exactly one student — never shared.
export const endSemSubmissions = [
  {
    id: "endsem-sub-001",
    assessmentId: "endsem-01",
    assessmentType: "end-sem",
    studentId: "stu-rahul",
    studentName: "Rahul Patil",
    rollNumber: "ET202-041",
    questionPaperId: "endsem-01",
    referenceAnswerId: "endsem-01",
    answerSheetId: "endsem-ans-001",
    fileName: "RahulPatil_EndSem_AnswerSheet.pdf",
    evaluationId: "endsem-eval-rahul",
    status: "Under Evaluation",
    score: "—",
    evaluation: {
      score: 48,
      totalMarks: 60,
      grade: "Grade A",
      confidence: "92%",
      semanticRelevance: "87%",
      evaluationDifficulty: "moderate",
      answerText:
        "Sampling is the process of converting a continuous signal into discrete values. According to the Nyquist theorem, the sampling frequency should be at least twice the maximum frequency of the input signal. If it is lower, aliasing occurs. A low-pass filter is used before sampling to remove unwanted high-frequency components. A low-pass FIR filter has a finite impulse response and provides linear phase, which is important for preserving signal shape. The DFT converts a finite sequence of samples into frequency components for spectral analysis. DSP is widely used in digital communication, audio processing, and image processing systems.",
      referenceAnswer:
        "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling. A low-pass FIR filter has a finite impulse response and a linear phase response, making it suitable for applications requiring phase preservation. The DFT transforms a finite sequence of samples into a frequency-domain representation, enabling spectral analysis. DSP finds applications in digital communication, audio processing, image processing, and radar systems.",
      rubric: [
        { name: "Concept Understanding", score: 11, max: 12, confidence: "High", reason: "Correctly explains sampling and the Nyquist condition with good clarity." },
        { name: "Technical Accuracy", score: 9, max: 10, confidence: "High", reason: "Nyquist condition stated correctly; anti-aliasing role explained well." },
        { name: "Filter Design", score: 10, max: 12, confidence: "Medium", reason: "FIR filter concept explained, but design steps could be more detailed." },
        { name: "Comparison & Reasoning", score: 8, max: 10, confidence: "Medium", reason: "Good reasoning with clear examples, though comparison could be deeper." },
        { name: "DFT", score: 5, max: 8, confidence: "Medium", reason: "DFT and spectral analysis are covered, but the explanation could be more detailed." },
        { name: "DSP Applications", score: 5, max: 8, confidence: "Medium", reason: "Relevant applications are mentioned, but more real-world examples are needed." },
      ],
      feedback: {
        strengths: "Strong understanding of sampling theorem, FIR filter characteristics, and DFT fundamentals.",
        improvements: "Provide more mathematical detail in the FIR filter design steps and DFT derivation.",
        missing: "Detailed comparison of analog vs digital filter trade-offs and more real-world DSP applications.",
      },
    },
  },
  {
    id: "endsem-sub-002",
    assessmentId: "endsem-01",
    assessmentType: "end-sem",
    studentId: "stu-sneha",
    studentName: "Sneha Kulkarni",
    rollNumber: "ET202-089",
    questionPaperId: "endsem-01",
    referenceAnswerId: "endsem-01",
    answerSheetId: "endsem-ans-002",
    fileName: "SnehaKulkarni_EndSem_AnswerSheet.pdf",
    evaluationId: "endsem-eval-sneha",
    status: "Under Evaluation",
    score: "—",
    evaluation: {
      score: 42,
      totalMarks: 60,
      grade: "Grade B",
      confidence: "89%",
      semanticRelevance: "82%",
      evaluationDifficulty: "moderate",
      answerText:
        "Sampling converts a continuous signal into discrete samples at regular intervals. The Nyquist theorem requires the sampling rate to be at least twice the highest frequency component. If sampling is too slow, aliasing distorts the signal. A low-pass filter is applied before sampling to remove high-frequency components. FIR filters have a finite impulse response and are always stable. The DFT is used to analyze the frequency content of a signal. DSP is applied in communication and audio systems.",
      referenceAnswer:
        "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling. A low-pass FIR filter has a finite impulse response and a linear phase response, making it suitable for applications requiring phase preservation. The DFT transforms a finite sequence of samples into a frequency-domain representation, enabling spectral analysis. DSP finds applications in digital communication, audio processing, image processing, and radar systems.",
      rubric: [
        { name: "Concept Understanding", score: 10, max: 12, confidence: "High", reason: "Good understanding of sampling, but misses some nuance about discrete-time representation." },
        { name: "Technical Accuracy", score: 8, max: 10, confidence: "Medium", reason: "Nyquist condition stated correctly, but anti-aliasing explanation is incomplete." },
        { name: "Filter Design", score: 8, max: 12, confidence: "Medium", reason: "FIR filter mentioned, but design details and frequency response are missing." },
        { name: "Comparison & Reasoning", score: 8, max: 10, confidence: "Medium", reason: "Clear reasoning with adequate examples, though mathematical detail is limited." },
        { name: "DFT", score: 4, max: 8, confidence: "Medium", reason: "DFT is mentioned, but the spectral-analysis explanation is incomplete." },
        { name: "DSP Applications", score: 4, max: 8, confidence: "Medium", reason: "DSP applications are mentioned, but the examples are limited." },
      ],
      feedback: {
        strengths: "Good understanding of the sampling process, FIR filter stability, and DFT basics.",
        improvements: "Elaborate on the FIR filter design procedure, frequency response, and DFT derivation.",
        missing: "Detailed comparison of analog vs digital filters and comprehensive real-world DSP applications.",
      },
    },
  },
];

// Publish state for the End-Sem exam
export const endSemPublishState = {
  [endSemExam.id]: {
    published: false,
    publishedAt: null,
  },
};

// Student notifications for End-Sem exam results
export const endSemNotifications = [];

const normalizeRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

const ENDSEM_STORAGE_KEY = "evalai_endsem_submissions";
const ENDSEM_PUBLISH_STORAGE_KEY = "evalai_endsem_publish_state";

export const persistEndSemState = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(
      ENDSEM_STORAGE_KEY,
      JSON.stringify(
        endSemSubmissions.map((s) => ({
          id: s.id,
          status: s.status,
          score: s.score,
          evaluationStatus: s.evaluationStatus,
          evaluationError: s.evaluationError,
          evaluation: s.evaluation,
          fileName: s.fileName,
          mappingStatus: s.mappingStatus,
        }))
      )
    );
    window.localStorage.setItem(
      ENDSEM_PUBLISH_STORAGE_KEY,
      JSON.stringify(endSemPublishState)
    );
  } catch (e) {
    // Silent catch
  }
};

const hydrateEndSemState = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const savedSubs = JSON.parse(window.localStorage.getItem(ENDSEM_STORAGE_KEY) || "[]");
    savedSubs.forEach((record) => {
      const submission = endSemSubmissions.find((item) => item.id === record.id);
      if (submission) {
        Object.assign(submission, record);
      } else {
        endSemSubmissions.push(record);
      }
    });
    const savedPublish = JSON.parse(window.localStorage.getItem(ENDSEM_PUBLISH_STORAGE_KEY) || "{}");
    if (savedPublish && typeof savedPublish === "object") {
      Object.assign(endSemPublishState, savedPublish);
    }
  } catch {
    // Ignore hydration errors
  }
};
hydrateEndSemState();

// ===== LOOKUP HELPERS =====

export const getEndSemExam = () => endSemExam;

export const getEndSemSubmissions = () => endSemSubmissions;

export const getEndSemSubmissionById = (id) =>
  endSemSubmissions.find((item) => item.id === id) || null;

export const getEndSemSubmissionByEvaluationId = (evaluationId) =>
  endSemSubmissions.find((item) => item.evaluationId === evaluationId) || null;

export const getEndSemSubmissionByStudent = (student) => {
  if (!student) return null;
  const targetRoll = normalizeRoll(student.roll || student.rollNumber);
  return (
    endSemSubmissions.find(
      (item) =>
        (student.id && item.studentId === student.id) ||
        (targetRoll && normalizeRoll(item.rollNumber || item.roll) === targetRoll) ||
        (student.name && (item.studentName === student.name || item.student === student.name)),
    ) || null
  );
};

// Check if an assessment is an End-Sem Examination
export const isEndSemAssessment = (assessment) =>
  Boolean(assessment && assessment.assessmentType === "end-sem");

// ===== TEACHER: MAP ANSWER SHEET TO STUDENT =====
// Maps a teacher-uploaded answer sheet PDF to a specific student.
// Every answer sheet is tied to exactly one student — never shared.
export const mapEndSemAnswerSheetToStudent = (student, file, options = {}) => {
  if (!student) return { error: "Please select a student to map the answer sheet." };
  if (!file) return { error: "Please upload the student's answer sheet PDF first." };

  // Find or create the submission for this student
  let submission = endSemSubmissions.find(
    (item) => item.studentId === student.id || item.rollNumber === student.roll,
  );

  if (submission && options.replace === false && submission.fileName) {
    return { error: `${student.name} already has an answer sheet. Choose Replace Existing to replace it.` };
  }

  if (!submission) {
    submission = {
      id: `endsem-sub-${Date.now()}`,
      assessmentId: endSemExam.id,
      assessmentType: "end-sem",
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.roll,
      questionPaperId: endSemExam.id,
      referenceAnswerId: endSemExam.id,
      answerSheetId: `endsem-ans-${Date.now()}`,
      fileName: file.name,
      evaluationId: `endsem-eval-${student.id}`,
      uploadDate: new Date().toISOString(),
      mappingStatus: "MATCHED",
      evaluationStatus: "PENDING",
      status: "Under Evaluation",
      score: "—",
      evaluation: null,
    };
    endSemSubmissions.push(submission);
  } else {
    // Update the existing submission with the new answer sheet
    submission.fileName = file.name;
    submission.answerSheetId = `endsem-ans-${Date.now()}`;
    submission.uploadDate = new Date().toISOString();
    submission.mappingStatus = "MATCHED";
    submission.evaluationStatus = "PENDING";
    submission.status = "Under Evaluation";
    submission.score = "—";
  }

  persistEndSemState();
  return { success: true, submission };
};

// ===== TEACHER: START AI EVALUATION =====
// AI evaluation starts ONLY when the teacher clicks "Start AI Evaluation".
// It is never triggered automatically after upload.
export const startEndSemEvaluation = (submissionId, difficulty = "moderate") => {
  const submission = endSemSubmissions.find((item) => item.id === submissionId);
  if (!submission) return null;
  const rawText = submission.evaluation?.answerText || submission.answerText || submission.extractedText;
  if (!hasValidAnswerText(rawText)) {
    submission.evaluation = null;
    submission.evaluationStatus = "Evaluation Failed";
    submission.evaluationError = "Unable to extract answer text from this PDF. Please verify that the PDF contains readable text.";
    submission.status = "Evaluation Failed";
    submission.score = "—";
    persistEndSemState();
    return submission;
  }
  const questionWiseEvaluation = evaluateAssessmentSubmission(submission, endSemExam, difficulty);
  if (questionWiseEvaluation.error) {
    submission.evaluation = null;
    submission.evaluationStatus = "Evaluation Failed";
    submission.evaluationError = questionWiseEvaluation.error;
    submission.status = "Evaluation Failed";
    submission.score = "—";
    persistEndSemState();
    return submission;
  }
  if (!submission.evaluationResults || typeof submission.evaluationResults !== "object") {
    submission.evaluationResults = {};
  }
  submission.evaluationResults[difficulty] = questionWiseEvaluation;
  submission.activeDifficulty = difficulty;
  submission.evaluation = questionWiseEvaluation;
  submission.evaluationDifficulty = difficulty;
  submission.evaluationStatus = "Needs Teacher Review";
  submission.status = "Evaluation Completed";
  submission.score = `${questionWiseEvaluation.obtainedMarks} / ${questionWiseEvaluation.totalMarks}`;
  persistEndSemState();
  return submission;

  // Reuse the existing difficulty-aware evaluation logic
  const config = {
    easy: { label: "Easy", toleranceFactor: 0.3, confidenceAdjustment: 2, semanticAdjustment: 3 },
    moderate: { label: "Moderate", toleranceFactor: 0, confidenceAdjustment: 0, semanticAdjustment: 0 },
    hard: { label: "Hard", toleranceFactor: -0.35, confidenceAdjustment: -2, semanticAdjustment: -3 },
  }[difficulty] || { label: "Moderate", toleranceFactor: 0, confidenceAdjustment: 0, semanticAdjustment: 0 };

  const base = submission.evaluation || {
    score: 0,
    totalMarks: endSemExam.totalMarks,
    grade: "Grade D",
    confidence: "—",
    semanticRelevance: "—",
    answerText: "No extracted answer text available for this answer sheet.",
    referenceAnswer: endSemExam.referenceAnswer,
    rubric: [],
    feedback: { strengths: "", improvements: "", missing: "" },
  };

  // Apply difficulty at the rubric/criterion level (proportional)
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
    : Math.round(base.score + (endSemExam.totalMarks - base.score) * (config.toleranceFactor || 0));
  const clampedScore = Math.max(0, Math.min(endSemExam.totalMarks, adjustedScore));

  const grade = clampedScore >= endSemExam.totalMarks * 0.9 ? "Grade A+" : clampedScore >= endSemExam.totalMarks * 0.8 ? "Grade A" : clampedScore >= endSemExam.totalMarks * 0.7 ? "Grade B" : clampedScore >= endSemExam.totalMarks * 0.6 ? "Grade C" : "Grade D";

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

  submission.evaluation = {
    ...base,
    score: clampedScore,
    totalMarks: endSemExam.totalMarks,
    grade,
    confidence,
    semanticRelevance,
    evaluationDifficulty: difficulty,
    rubric,
    feedback,
  };
  submission.status = "Evaluation Completed";
  submission.evaluationStatus = "COMPLETED";
  submission.score = `${clampedScore} / ${endSemExam.totalMarks}`;

  persistEndSemState();
  return submission;
};

// ===== TEACHER: RE-EVALUATE =====
export const reEvaluateEndSemSubmission = (submissionId, difficulty = "moderate") => {
  const submission = endSemSubmissions.find((item) => item.id === submissionId);
  if (!submission) return null;
  return startEndSemEvaluation(submissionId, difficulty);
};

// ===== EVALUATION PROGRESS =====
export const getEndSemEvaluationProgress = () => {
  const total = endSemSubmissions.length;
  const evaluated = endSemSubmissions.filter(
    (item) =>
      Boolean(item.evaluation) ||
      item.status === "Evaluation Completed" ||
      item.status === "Approved" ||
      item.status === "Result Published" ||
      item.evaluationStatus === "Approved" ||
      item.evaluationStatus === "COMPLETED" ||
      item.evaluationStatus === "PUBLISHED",
  ).length;
  return {
    total,
    evaluated,
    pending: total - evaluated,
    allEvaluated: total > 0 && evaluated === total,
    percentage: total > 0 ? Math.round((evaluated / total) * 100) : 0,
  };
};

// ===== PUBLISH RESULTS =====
export const isEndSemResultsPublished = () => {
  return endSemPublishState[endSemExam.id]?.published || false;
};

export const publishEndSemResults = () => {
  const state = endSemPublishState[endSemExam.id] || { published: false, publishedAt: null };

  if (state.published) {
    return { alreadyPublished: true, notifications: [] };
  }

  const progress = getEndSemEvaluationProgress();
  if (!progress.allEvaluated) {
    return { alreadyPublished: false, notifications: [], incomplete: true };
  }

  state.published = true;
  state.publishedAt = new Date().toISOString();
  endSemPublishState[endSemExam.id] = state;

  // Generate one notification per student
  const newNotifications = endSemSubmissions.map((submission) => {
    const evaluation = submission.evaluation || null;
    return {
      id: `endsem-notif-${submission.id}-${Date.now()}`,
      studentId: submission.studentId,
      studentName: submission.studentName,
      roll: submission.rollNumber,
      assessmentId: endSemExam.id,
      assessmentTitle: endSemExam.title,
      message: `Your End-Sem Examination result for ${endSemExam.title} is now available.`,
      score: evaluation ? `${evaluation.score} / ${evaluation.totalMarks}` : "—",
      grade: evaluation?.grade || "—",
      evaluationId: submission.evaluationId,
      read: false,
      createdAt: new Date().toISOString(),
    };
  });

  endSemNotifications.push(...newNotifications);

  // Update submission statuses
  endSemSubmissions.forEach((submission) => {
    submission.status = "Result Published";
    submission.evaluationStatus = "PUBLISHED";
  });

  persistEndSemState();
  return { alreadyPublished: false, notifications: newNotifications };
};

// ===== STUDENT NOTIFICATIONS =====
export const getEndSemStudentNotifications = (studentId) => {
  return endSemNotifications.filter((notification) => notification.studentId === studentId);
};

export const markEndSemNotificationRead = (notificationId) => {
  const notification = endSemNotifications.find((item) => item.id === notificationId);
  if (notification) {
    notification.read = true;
  }
  return notification;
};

// ===== STUDENT RESULT =====
// Returns the student's own End-Sem result only if published.
// Strict data isolation — never returns another student's data.
export const getEndSemStudentResult = (student) => {
  if (!student) return null;
  const submission = getEndSemSubmissionByStudent(student);
  if (!submission) return null;
  if (!isEndSemResultsPublished()) return null;
  return submission;
};

// ===== STUDENT-FACING STATUS =====
export const getEndSemStudentStatus = (student) => {
  if (!student) return { label: "Not Available", key: "not-available" };
  const submission = getEndSemSubmissionByStudent(student);
  if (!submission) return { label: "Not Available", key: "not-available" };

  const published = isEndSemResultsPublished();
  if (published) return { label: "Result Published", key: "result-published" };
  if (submission.status === "Evaluation Completed") {
    return { label: "Results Pending Publication", key: "results-pending" };
  }
  if (submission.status === "Under Evaluation") {
    return { label: "Under Evaluation", key: "under-evaluation" };
  }
  const statusStr = typeof submission?.status === "string"
    ? submission.status
    : (submission?.status?.label || submission?.status?.status || "Status Unavailable");
  return { label: statusStr, key: statusStr.toLowerCase().replaceAll(" ", "-") };
};

// ===== END-SEM ANALYTICS =====
// Reuses the In-Sem evaluation data to provide class-level analytics.
export const getEndSemAnalytics = () => {
  const evaluated = endSemSubmissions.filter(
    (item) => item.status === "Evaluation Completed" || item.status === "Result Published" || item.status === "Approved" || Boolean(item.evaluation),
  );
  const scores = evaluated
    .map((item) => item.evaluation?.score)
    .filter((score) => typeof score === "number" && score > 0);

  const average = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;

  const gradeDistribution = {
    "A+": evaluated.filter((item) => item.evaluation?.grade === "Grade A+").length,
    A: evaluated.filter((item) => item.evaluation?.grade === "Grade A").length,
    B: evaluated.filter((item) => item.evaluation?.grade === "Grade B").length,
    C: evaluated.filter((item) => item.evaluation?.grade === "Grade C").length,
    D: evaluated.filter((item) => item.evaluation?.grade === "Grade D").length,
  };

  const questionWise = endSemExam.questions.map((question) => {
    const relatedRubric = evaluated
      .map((item) => item.evaluation?.rubric?.find((r) => r.name === question.text))
      .filter(Boolean);
    const avg = relatedRubric.length
      ? Math.round(relatedRubric.reduce((a, b) => a + b.score, 0) / relatedRubric.length)
      : 0;
    return { question: question.text, marks: question.marks, average: avg };
  });

  const studentWise = evaluated.map((item) => ({
    studentId: item.studentId,
    studentName: item.studentName,
    rollNumber: item.rollNumber,
    score: item.evaluation?.score || 0,
    totalMarks: item.evaluation?.totalMarks || endSemExam.totalMarks,
    grade: item.evaluation?.grade || "—",
    difficulty: item.evaluation?.evaluationDifficulty || "moderate",
  }));

  const progress = getEndSemEvaluationProgress();

  return {
    totalStudents: endSemSubmissions.length,
    evaluatedCount: progress.evaluated,
    pendingCount: progress.pending,
    completionPercentage: progress.percentage,
    average,
    highest,
    lowest,
    gradeDistribution,
    questionWise,
    studentWise,
  };
};

// ===== TEACHER: APPROVE & EDIT EVALUATION =====
export const approveEndSemEvaluation = (submissionId, teacherName = "Prof. A. Deshmukh") => {
  const submission = endSemSubmissions.find((item) => item.id === submissionId || item.submissionId === submissionId);
  if (!submission?.evaluation) return { error: "Unable to approve evaluation. Evaluation data is missing." };
  submission.evaluation.evaluationStatus = "Approved";
  submission.evaluation.approvedBy = teacherName;
  submission.evaluation.approvedAt = new Date().toISOString();
  submission.evaluationStatus = "Approved";
  submission.status = "Approved";
  persistEndSemState();
  return { success: true, submission };
};

export const saveEndSemTeacherReview = (submissionId, changes = {}) => {
  const submission = endSemSubmissions.find((item) => item.id === submissionId || item.submissionId === submissionId);
  if (!submission?.evaluation) return { error: "Unable to save evaluation changes. Evaluation data is missing." };
  const evaluation = submission.evaluation;
  if (Array.isArray(changes.questionWiseResults)) {
    evaluation.questionWiseResults = changes.questionWiseResults;
    const obtainedMarks = Math.round(changes.questionWiseResults.reduce((sum, q) => sum + Number(q.awardedMarks || 0), 0) * 100) / 100;
    evaluation.obtainedMarks = obtainedMarks;
    evaluation.score = obtainedMarks;
    evaluation.percentage = Math.round((obtainedMarks / evaluation.totalMarks) * 100);
    submission.score = `${obtainedMarks} / ${evaluation.totalMarks}`;
  }
  if (changes.feedback) {
    evaluation.teacherFeedback = changes.feedback;
    evaluation.feedback = { ...(evaluation.feedback || {}), ...changes.feedback };
  }
  evaluation.teacherEditedAt = new Date().toISOString();
  persistEndSemState();
  return { success: true, submission };
};
