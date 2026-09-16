import assert from "assert";
import {
  evaluateAssessmentSubmission,
  getAssignmentById,
  hydrateWorkflowEvaluations,
  publishAssignmentAndNotifyStudents,
  reEvaluateSubmission,
  submitAssignment,
  workflowSubmissions
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("=== REGRESSION TEST: AI EVALUATION DIFFICULTY MODE SCORING ===");

loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const rahul = students.find((s) => s.id === "stu-rahul");
assert(rahul !== undefined, "Rahul demo student account exists.");

// Setup real assignment and submission
const diffAsgId = `asg-diff-${Date.now()}`;
const qpPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";

const diffAsgData = {
  id: diffAsgId,
  title: "Evaluation Difficulty Test",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Test scoring under Easy, Moderate, and Hard difficulty modes.",
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: { name: "Diff_QP.pdf", size: 2048, type: "application/pdf", data: qpPdfDataUrl },
  referenceAnswerPdf: { name: "Diff_Ref.pdf", size: 2048, type: "application/pdf", data: qpPdfDataUrl },
  referenceAnswer: "Model solution for evaluation difficulty test.",
  questions: [
    { id: 1, text: "Q1. Explain sampling theorem and aliasing.", marks: 10 },
    { id: 2, text: "Q2. Calculate filter transfer function coefficients.", marks: 10 },
  ],
};

publishAssignmentAndNotifyStudents(diffAsgData);

const studentPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";
const submitRes = submitAssignment(rahul, diffAsgId, {
  name: "Rahul_Diff_Answer.pdf",
  size: 4096,
  type: "application/pdf",
  data: studentPdfDataUrl,
});

assert(submitRes.success === true, "Student submits answer sheet.");
const submission = submitRes.submission;

// TEST 1: Evaluate under Easy mode
const easyEval = evaluateAssessmentSubmission(submission, diffAsgData, "easy");
assert.strictEqual(easyEval.evaluationDifficulty, "easy", "TEST 1: Easy evaluation records difficulty = 'easy'.");

// TEST 2: Evaluate under Moderate mode
const moderateEval = evaluateAssessmentSubmission(submission, diffAsgData, "moderate");
assert.strictEqual(moderateEval.evaluationDifficulty, "moderate", "TEST 2: Moderate evaluation records difficulty = 'moderate'.");

// TEST 3: Evaluate under Hard mode
const hardEval = evaluateAssessmentSubmission(submission, diffAsgData, "hard");
assert.strictEqual(hardEval.evaluationDifficulty, "hard", "TEST 3: Hard evaluation records difficulty = 'hard'.");

// TEST 4 & 6 & 7 & 8: Scoring order (Easy >= Moderate >= Hard & Easy > Hard)
console.log(`  Easy Score: ${easyEval.score} / ${easyEval.totalMarks} (${easyEval.grade})`);
console.log(`  Moderate Score: ${moderateEval.score} / ${moderateEval.totalMarks} (${moderateEval.grade})`);
console.log(`  Hard Score: ${hardEval.score} / ${hardEval.totalMarks} (${hardEval.grade})`);

assert(easyEval.score >= moderateEval.score, "TEST 4: Easy score >= Moderate score.");
assert(moderateEval.score >= hardEval.score, "TEST 4: Moderate score >= Hard score.");
assert(easyEval.score > hardEval.score, "TEST 4: Easy score > Hard score (meaningful difficulty gap).");

// TEST 5: Bounds checking
assert(easyEval.score >= 0 && easyEval.score <= diffAsgData.totalMarks, "TEST 5: Easy score within bounds.");
assert(moderateEval.score >= 0 && moderateEval.score <= diffAsgData.totalMarks, "TEST 5: Moderate score within bounds.");
assert(hardEval.score >= 0 && hardEval.score <= diffAsgData.totalMarks, "TEST 5: Hard score within bounds.");

// TEST 6: Sequential evaluation creates independent results in evaluationResults map
const easySub = reEvaluateSubmission(submission.id, "easy");
assert(easySub.evaluationResults.easy !== undefined, "Easy result saved in evaluationResults.easy");
const easyResultScore = easySub.evaluationResults.easy.score;

const moderateSub = reEvaluateSubmission(submission.id, "moderate");
assert(moderateSub.evaluationResults.moderate !== undefined, "Moderate result saved in evaluationResults.moderate");
const moderateResultScore = moderateSub.evaluationResults.moderate.score;

// Ensure Easy result remained intact after Moderate evaluation
assert.strictEqual(moderateSub.evaluationResults.easy.score, easyResultScore, "TEST 6A: Easy result unchanged after Moderate evaluation.");

const hardSub = reEvaluateSubmission(submission.id, "hard");
assert(hardSub.evaluationResults.hard !== undefined, "Hard result saved in evaluationResults.hard");
const hardResultScore = hardSub.evaluationResults.hard.score;

// Ensure Easy and Moderate results remained intact after Hard evaluation
assert.strictEqual(hardSub.evaluationResults.easy.score, easyResultScore, "TEST 6B: Easy result unchanged after Hard evaluation.");
assert.strictEqual(hardSub.evaluationResults.moderate.score, moderateResultScore, "TEST 6C: Moderate result unchanged after Hard evaluation.");

// TEST 7: Question-wise marks, grades, and feedback are separate for all three
assert.notStrictEqual(hardSub.evaluationResults.easy.questionWiseResults[0].awardedMarks, hardSub.evaluationResults.hard.questionWiseResults[0].awardedMarks, "Easy and Hard question 1 marks are distinct.");
assert.notStrictEqual(hardSub.evaluationResults.easy.feedback.difficultyNote, hardSub.evaluationResults.hard.feedback.difficultyNote, "Easy and Hard feedback notes are distinct.");

// TEST 8: All three results survive hydration / persistence
hydrateWorkflowEvaluations();
const rehydratedSub = workflowSubmissions.find((s) => s.id === submission.id);
assert(rehydratedSub.evaluationResults.easy !== undefined, "Easy result present after hydration.");
assert(rehydratedSub.evaluationResults.moderate !== undefined, "Moderate result present after hydration.");
assert(rehydratedSub.evaluationResults.hard !== undefined, "Hard result present after hydration.");
assert.strictEqual(rehydratedSub.evaluationResults.easy.score, easyResultScore, "Hydrated Easy score matches.");
assert.strictEqual(rehydratedSub.evaluationResults.moderate.score, moderateResultScore, "Hydrated Moderate score matches.");
assert.strictEqual(rehydratedSub.evaluationResults.hard.score, hardResultScore, "Hydrated Hard score matches.");

console.log("\nALL AI EVALUATION DIFFICULTY MODE TESTS PASSED ✅\n");
