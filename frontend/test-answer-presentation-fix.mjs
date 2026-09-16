import assert from "assert";
import {
  cleanExtractedText,
  evaluateAssessmentSubmission,
  extractPdfAnswerContent,
  getAssignmentById,
  hasValidAnswerText,
  hydrateWorkflowEvaluations,
  isReadableExtractedText,
  registerCreatedAssessment,
  submitAssignment,
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("=== REGRESSION & FEATURE TEST: AI EVALUATION UI & ANSWER TEXT PRESENTATION FIX ===");

loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const rahul = students.find((s) => s.id === "stu-rahul");
assert(rahul !== undefined, "Rahul student account exists.");

// TEST 1: isReadableExtractedText quality filter validation
console.log("TEST 1: Validating isReadableExtractedText quality filter...");

const garbageText1 = "%PDF-1.4 1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj 2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj 3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj stream BT /F1 12 Tf 72 712 Td ( □ Ã Â) Tj ET endstream endobj";
assert(isReadableExtractedText(garbageText1) === false, "Reject PDF stream & obj structure markers.");

const garbageText2 = " □ Ã Â  □ Ã Â  □ Ã Â  □ Ã Â  □ Ã Â";
assert(isReadableExtractedText(garbageText2) === false, "Reject replacement characters and symbol noise.");

const validCleanText = "Q1. Sampling theorem states that a continuous signal can be reconstructed if the sampling frequency is greater than twice the maximum signal frequency. Aliasing causes high frequency overlap.";
assert(isReadableExtractedText(validCleanText) === true, "Accept clean academic text.");

// TEST 2: cleanExtractedText formatting
console.log("TEST 2: Validating cleanExtractedText helper...");
const rawDirty = "Q1.  Sampling   theorem  statement.  \uFFFD □  Details on aliasing. ";
const cleaned = cleanExtractedText(rawDirty);
assert(!cleaned.includes("\uFFFD") && !cleaned.includes("□"), "cleanExtractedText strips invalid characters.");
assert(cleaned.includes("Sampling theorem statement"), "cleanExtractedText preserves readable text.");

// TEST 3: Status Labels in extractPdfAnswerContent
console.log("TEST 3: Validating status labels in PDF extraction pipeline...");
const mockCleanPdf = {
  name: "CleanAnswer.pdf",
  size: 3072,
  type: "application/pdf",
  data: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag=="
};
const asgDummy = { id: "asg-test-presentation", title: "DSP Test", totalMarks: 30 };

const extResClean = extractPdfAnswerContent(mockCleanPdf, rahul, asgDummy);
assert(extResClean.extractionStatusLabel.includes("✓"), "Status label contains professional checkmark.");
assert(extResClean.extractionStatusLabel.includes("Text extracted") || extResClean.extractionStatusLabel.includes("OCR"), "Status label reflects extraction or OCR.");

const unreadableStringInput = "%PDF-1.4 1 0 obj stream /Font /F1 /MediaBox [0 0 612 792] endstream endobj";
const extResCorrupt = extractPdfAnswerContent(unreadableStringInput, rahul, asgDummy);
assert.strictEqual(extResCorrupt.extractionStatusLabel, "⚠ Text extraction unavailable", "Corrupted PDF string sets ⚠ Text extraction unavailable.");
assert.strictEqual(extResCorrupt.extractedAnswerText, null, "Extracted text is set to null for unreadable input.");

// TEST 4: AI Evaluation Blocked when extraction is unreliable
console.log("TEST 4: Validating AI evaluation blocked on unreadable text...");
const corruptSubmission = {
  id: "sub-corrupt-test",
  studentId: rahul.id,
  student: rahul.name,
  roll: rahul.roll,
  assignmentId: asgDummy.id,
  extractedAnswerText: garbageText1,
  answerText: garbageText1,
};

const evalCorruptRes = evaluateAssessmentSubmission(corruptSubmission, asgDummy, "moderate");
assert(evalCorruptRes.extractionFailed === true, "AI evaluation flags extractionFailed: true.");
assert.strictEqual(evalCorruptRes.score, "—", "Score is set to '—' when extraction is unavailable.");
assert.strictEqual(evalCorruptRes.evaluationStatus, "Evaluation Failed", "Evaluation status reflects failure.");
assert(evalCorruptRes.overallFeedback.includes("could not be extracted") || evalCorruptRes.overallFeedback.includes("unavailable"), "Feedback states text extraction unavailable.");

// TEST 5: Easy / Moderate / Hard isolation on clean submission
console.log("TEST 5: Validating Easy / Moderate / Hard isolation on clean text submission...");
const cleanAsgId = `asg-clean-test-${Date.now()}`;
const cleanAsgData = {
  id: cleanAsgId,
  title: "Clean Academic Test",
  subjectName: "DSP",
  totalMarks: 30,
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: mockCleanPdf,
  referenceAnswerPdf: mockCleanPdf,
  questions: [{ id: 1, text: "Q1", marks: 30 }]
};
registerCreatedAssessment(cleanAsgData);
const subCleanRes = submitAssignment(rahul, cleanAsgId, mockCleanPdf);
assert(subCleanRes.success === true, "Clean PDF submission succeeds.");
const cleanSub = subCleanRes.submission;

const evalCleanEasy = evaluateAssessmentSubmission(cleanSub, cleanAsgData, "easy");
const evalCleanMod = evaluateAssessmentSubmission(cleanSub, cleanAsgData, "moderate");
const evalCleanHard = evaluateAssessmentSubmission(cleanSub, cleanAsgData, "hard");

assert(evalCleanEasy.score <= 30 && evalCleanEasy.score >= 0, "Easy score in 0-30 bounds.");
assert(evalCleanMod.score <= 30 && evalCleanMod.score >= 0, "Moderate score in 0-30 bounds.");
assert(evalCleanHard.score <= 30 && evalCleanHard.score >= 0, "Hard score in 0-30 bounds.");
assert(evalCleanEasy.score >= evalCleanMod.score, "Easy score >= Moderate score.");
assert(evalCleanMod.score >= evalCleanHard.score, "Moderate score >= Hard score.");

console.log("\nALL AI EVALUATION UI & PRESENTATION FIX TESTS PASSED ✅\n");
