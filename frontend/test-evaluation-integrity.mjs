import { evaluateAssessmentSubmission, evaluateSubmission, hasValidAnswerText } from "./src/data/workflowData.js";
import { startInSemEvaluation } from "./src/data/inSemData.js";
import { startEndSemEvaluation } from "./src/data/endSemData.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS  ${message}`);
}

console.log("=== EVALUATION INTEGRITY & ANSWER SHEET EXTRACTION TESTS ===");

// TEST 1: Valid PDF + valid extracted answer text
const validSub = {
  id: "sub-test-valid",
  studentId: "stu-001",
  roll: "ET202-001",
  file: "ValidAnswerSheet.pdf",
  answerText: "Sampling theorem requires the sampling rate to be at least twice the maximum signal frequency to avoid aliasing. Anti-aliasing filter removes unwanted frequencies.",
  evaluation: null,
};
const validEval = evaluateAssessmentSubmission(validSub);
assert(!validEval.error, "TEST 1: Valid answer text allows evaluation to proceed.");
assert(validEval.obtainedMarks > 0, "TEST 1: Valid evaluation produces non-zero score.");
assert(hasValidAnswerText(validSub.answerText) === true, "TEST 1: hasValidAnswerText returns true for valid text.");

// TEST 2: PDF exists but extracted text is empty / missing
const emptySub = {
  id: "sub-test-empty",
  studentId: "stu-002",
  roll: "ET202-002",
  file: "EmptyOrScanned.pdf",
  answerText: "No extracted answer text available for this submission.",
  evaluation: null,
};
const emptyEval = evaluateAssessmentSubmission(emptySub);
assert(emptyEval.error !== undefined, "TEST 2: Empty/missing text blocks evaluation.");
assert(emptyEval.score === "—", "TEST 2: Score is reset to '—' on missing text.");
assert(emptyEval.evaluationStatus === "Evaluation Failed", "TEST 2: Status set to Evaluation Failed.");
assert(emptyEval.questionWiseResults.length === 0, "TEST 2: No question-wise results generated for empty text.");
assert(emptyEval.strengths.length === 0, "TEST 2: No AI strengths generated for empty text.");

// TEST 3: PDF extraction fails (null text)
const nullSub = {
  id: "sub-test-null",
  studentId: "stu-003",
  roll: "ET202-003",
  file: "Corrupted.pdf",
  answerText: null,
  evaluation: null,
};
const nullEval = evaluateAssessmentSubmission(nullSub);
assert(nullEval.extractionFailed === true, "TEST 3: PDF extraction failure reported.");
assert(nullEval.error.includes("Unable to extract answer text"), "TEST 3: Professional extraction error displayed.");

// TEST 4: Reference answer exists but student answer is missing
const refOnlySub = {
  id: "sub-test-refonly",
  studentId: "stu-004",
  roll: "ET202-004",
  file: "BlankAnswer.pdf",
  answerText: "",
  evaluation: null,
};
const refOnlyEval = evaluateAssessmentSubmission(refOnlySub);
assert(refOnlyEval.error !== undefined, "TEST 4: Missing student answer blocks evaluation even if reference answer exists.");

// TEST 5: Student answer exists but reference answer is missing
const noRefAssessment = {
  id: "asg-no-ref",
  title: "Test Assignment",
  totalMarks: 20,
  referenceAnswer: "",
  questions: [{ id: 1, text: "Question 1", marks: 20 }],
};
const validSub2 = {
  id: "sub-test-noref",
  studentId: "stu-005",
  roll: "ET202-005",
  file: "StudentAnswer.pdf",
  answerText: "Sampling theorem requires fs >= 2 fm.",
  evaluation: null,
};
const noRefEval = evaluateAssessmentSubmission(validSub2, noRefAssessment);
assert(noRefEval.answerText === "Sampling theorem requires fs >= 2 fm.", "TEST 5: Does not fail over missing reference answer if student text is valid.");

// TEST 6: Aarav's submission isolation
const aaravSub = {
  id: "sub-003",
  studentId: "stu-aarav",
  student: "Aarav Sharma",
  roll: "ET202-012",
  file: "AaravSharma_DSP_A03.pdf",
  answerText: "Sampling is the process of converting a continuous-time signal into a discrete-time signal by taking samples at regular intervals. According to the Nyquist-Shannon sampling theorem, the sampling frequency must be at least twice the maximum frequency present in the signal to avoid aliasing.",
  evaluation: null,
};
const aaravEval = evaluateAssessmentSubmission(aaravSub);
assert(aaravEval.studentId === "stu-aarav", "TEST 6: Aarav's evaluation bound strictly to Aarav's studentId.");
assert(aaravEval.rollNumber === "ET202-012", "TEST 6: Aarav's evaluation bound strictly to Aarav's roll number.");
assert(aaravEval.answerText.includes("Aarav") === false, "TEST 6: Aarav's answer text is pure student response.");

// TEST 7: Re-evaluation after successful extraction
const reEvalResult = evaluateAssessmentSubmission(aaravSub, undefined, "hard");
assert(reEvalResult.evaluationDifficulty === "hard", "TEST 7: Re-evaluation applies new difficulty standard dynamically.");

// TEST 8: Replaced answer sheet invalidates stale marks
const staleSub = {
  id: "sub-stale",
  studentId: "stu-stale",
  roll: "ET202-099",
  file: "NewScannedAnswer.pdf",
  answerText: "Unable to extract text from scanned page", // Replaced with unreadable scan
  evaluation: { score: 18, totalMarks: 20, grade: "Grade A", answerText: "Old valid answer" },
};
const staleEval = evaluateAssessmentSubmission(staleSub);
assert(staleEval.score === "—", "TEST 8: Stale marks invalidated when replaced file extraction fails.");
assert(staleEval.evaluationStatus === "Evaluation Failed", "TEST 8: Status reset to Evaluation Failed.");

console.log("\nALL EVALUATION INTEGRITY TESTS PASSED ✅");
