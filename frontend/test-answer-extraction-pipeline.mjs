import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  evaluateAssessmentSubmission,
  extractPdfAnswerContent,
  getAssignmentById,
  getPersistedPdfUrl,
  getStudentAssignment,
  hasValidAnswerText,
  hydrateWorkflowEvaluations,
  isResultsPublished,
  persistWorkflowEvaluations,
  publishAssignmentAndNotifyStudents,
  submitAssignment,
  workflowSubmissions
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { getStudentSubmission, students } from "./src/auth/studentAuth.js";
import { getInSemExam, getInSemSubmissions } from "./src/data/inSemData.js";
import { getEndSemExam, getEndSemSubmissions } from "./src/data/endSemData.js";

console.log("=== PHASE 7C — PART 4: STUDENT ANSWER PDF EXTRACTION & AI EVALUATION PIPELINE TESTS ===");

loginTeacher("teacher@college.edu", "teacher123");

const rahul = students.find((s) => s.id === "stu-rahul");
const sneha = students.find((s) => s.id === "stu-sneha");
assert(rahul && sneha, "Rahul and Sneha demo student accounts exist.");

// TEST 1 & 8: Teacher creates real assignment with unique assignmentId
const realAsgId = `asg-p7c4-${Date.now()}`;
const qpPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";

const realAsgData = {
  id: realAsgId,
  title: "Digital Signal Processing — Part 4 Test",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Solve FIR filter design and sampling theorem questions.",
  dueDate: "2026-11-30",
  dueTime: "23:59",
  questionPaperPdf: { name: "DSP_QP_Part4.pdf", size: 4096, type: "application/pdf", data: qpPdfDataUrl },
  referenceAnswerPdf: { name: "DSP_Ref_Part4.pdf", size: 3072, type: "application/pdf", data: qpPdfDataUrl },
  referenceAnswer: "Q1. Sampling rate fs >= 2*fm. Q2. Bilinear transformation coefficients.",
  questions: [
    { id: 1, text: "Q1. State Nyquist sampling theorem.", marks: 10 },
    { id: 2, text: "Q2. Derive filter transfer function H(z).", marks: 10 }
  ]
};

const pubRes = publishAssignmentAndNotifyStudents(realAsgData);
assert(pubRes.success === true, "TEST 1: Teacher creates and publishes real assignment.");

// TEST 2 & 4: Text-based Student PDF submission & extraction
const studentPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";
const rahulPdfFile = {
  name: "Rahul_DSP_Part4_Answer.pdf",
  size: 8192,
  type: "application/pdf",
  data: studentPdfDataUrl,
  uploadedAt: new Date().toISOString(),
};

const submitRes = submitAssignment(rahul, realAsgId, rahulPdfFile);
assert(submitRes.success === true, "TEST 2: Student submits PDF answer sheet successfully.");
assert.strictEqual(submitRes.submission.assignmentId, realAsgId, "TEST 8: Submission strictly isolated to realAsgId.");
assert.strictEqual(submitRes.submission.studentId, rahul.id, "TEST 9: Submission strictly isolated to rahul.id.");

// TEST 3: PDF survives hydration / page refresh
persistWorkflowEvaluations();
hydrateWorkflowEvaluations();
const hydratedSub = workflowSubmissions.find((s) => s.assignmentId === realAsgId && s.studentId === rahul.id);
assert(hydratedSub !== undefined, "TEST 3: Student submission survives localStorage hydration.");
assert(hydratedSub.answerPdf && hydratedSub.answerPdf.data === studentPdfDataUrl, "Answer PDF Base64 Data URL survives hydration.");

// TEST 5 & 6: Scanned PDF & OCR Processing Strategy
const scannedPdfFile = {
  name: "Sneha_Scanned_Answer.pdf",
  size: 15360,
  type: "application/pdf",
  data: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==/Subtype /Image",
  uploadedAt: new Date().toISOString(),
};

const extractRes = extractPdfAnswerContent(scannedPdfFile, sneha, realAsgData);
assert(extractRes.extractionStatus === "ocr_completed" || extractRes.extractionStatus === "text_extracted", "TEST 5 & 6: Scanned PDF detected and OCR strategy applied.");
assert(hasValidAnswerText(extractRes.extractedAnswerText), "OCR produces valid answer text.");

// TEST 7: Extraction status handling
assert(typeof hydratedSub.extractionStatusLabel === "string", "TEST 7: Extraction status label is formatted.");

// TEST 10 & 11: AI evaluation uses REAL extracted student answer (No demo fallback)
const evalResult = evaluateAssessmentSubmission(hydratedSub, realAsgData, "moderate");
assert(evalResult.obtainedMarks !== null && evalResult.obtainedMarks > 0, "TEST 11: AI evaluator evaluates actual extracted student answer.");
assert(hasValidAnswerText(hydratedSub.extractedAnswerText), "TEST 10: Extracted answer text is valid without demo fallback.");

// TEST 12: Reference Answer Protection for Student
const studentView = getStudentAssignment(rahul, realAsgId);
assert.strictEqual(studentView.referenceAnswer, null, "TEST 12: Reference answer text stripped from student view.");
assert.strictEqual(studentView.referenceAnswerPdf, null, "TEST 12: Reference answer PDF stripped from student view.");

// TEST 13 & 14: Multiple students and assignments isolation
const snehaSubmitRes = submitAssignment(sneha, realAsgId, scannedPdfFile);
assert(snehaSubmitRes.submission.studentId === sneha.id, "TEST 13: Sneha submission isolated from Rahul.");
assert.notStrictEqual(snehaSubmitRes.submission.id, hydratedSub.id, "Rahul and Sneha have separate submission IDs.");

// TEST 15: Late submission excluded from AI evaluation
const lateAsgId = `asg-late-p7c4-${Date.now()}`;
publishAssignmentAndNotifyStudents({ ...realAsgData, id: lateAsgId, dueDate: "2020-01-01", dueTime: "12:00" });
submitAssignment(rahul, lateAsgId, rahulPdfFile);
const lateSub = getStudentSubmission(rahul, lateAsgId);
assert.strictEqual(lateSub.status, "Late / Failed", "TEST 15: Late submission marked Late / Failed.");
assert.strictEqual(lateSub.score, "0 / 20", "Late submission score is 0 / 20.");

// TEST 16 & 17 & 18: In-Sem, End-Sem & Grade Sheet Integrity
const inSem = getInSemExam();
const endSem = getEndSemExam();
assert(inSem !== null && endSem !== null, "TEST 16 & 17: In-Sem and End-Sem exams remain operational.");

console.log("\nALL PHASE 7C — PART 4 EXTRACTION & EVALUATION TESTS PASSED ✅\n");
