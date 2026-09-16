import assert from "assert";
import {
  evaluateAssessmentSubmission,
  getAssignmentById,
  hydrateWorkflowEvaluations,
  persistWorkflowEvaluations,
  reEvaluateSubmission,
  registerCreatedAssessment,
  submitAssignment,
  workflowSubmissions,
} from "./src/data/workflowData.js";
import { loginTeacher, logoutTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("=== PHASE 7C — PART 5: RE-EVALUATION FLOW & DIFFICULTY SWITCHING TEST SUITE ===");

// Login teacher
loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const rahul = students.find((s) => s.id === "stu-rahul");
assert(rahul !== undefined, "Rahul student account exists.");

// Register custom 30-mark assignment
const asg30Id = `asg-reeval-30m-${Date.now()}`;
const asg30Data = {
  id: asg30Id,
  title: "Advanced Signal Processing Re-Eval Test",
  subjectName: "DSP 30M",
  totalMarks: 30,
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questions: [
    { id: 1, text: "Q1. Sampling theorem and Nyquist rate.", marks: 15 },
    { id: 2, text: "Q2. Bilinear transformation LPF design.", marks: 15 }
  ]
};
registerCreatedAssessment(asg30Data);

const pdfFile = { name: "Rahul_DSP_Solution.pdf", size: 4096, type: "application/pdf" };
const subRes = submitAssignment(rahul, asg30Id, pdfFile);
assert(subRes.success === true, "Submission created successfully.");
const subId = subRes.submission.id;

// ----------------------------------------------------
// TEST 1: Moderate Initial Evaluation
// ----------------------------------------------------
console.log("\nTEST 1: Initial Moderate Evaluation...");
const subMod = reEvaluateSubmission(subId, "moderate");
assert(subMod.evaluationResults?.moderate !== undefined, "Moderate result stored in evaluationResults.");
assert.strictEqual(subMod.activeDifficulty, "moderate", "activeDifficulty set to moderate.");
assert.strictEqual(subMod.evaluationDifficulty, "moderate", "evaluationDifficulty set to moderate.");
const modScore = subMod.evaluationResults.moderate.score;
console.log(`  Initial Moderate Score: ${modScore} / 30 (${subMod.evaluationResults.moderate.grade})`);

// ----------------------------------------------------
// TEST 2: Re-Evaluate Easy (Preserve Moderate)
// ----------------------------------------------------
console.log("\nTEST 2: Re-Evaluate Easy (Preserving Moderate)...");
const subEasy = reEvaluateSubmission(subId, "easy");
assert(subEasy.evaluationResults?.easy !== undefined, "Easy result stored in evaluationResults.");
assert(subEasy.evaluationResults?.moderate !== undefined, "Moderate result preserved.");
assert.strictEqual(subEasy.evaluationResults.moderate.score, modScore, "Moderate score unchanged after Easy re-eval.");
assert.strictEqual(subEasy.activeDifficulty, "easy", "activeDifficulty updated to easy.");
const easyScore = subEasy.evaluationResults.easy.score;
console.log(`  Easy Score: ${easyScore} / 30 | Moderate Score: ${subEasy.evaluationResults.moderate.score} / 30`);
assert(easyScore >= modScore, "Easy score >= Moderate score.");

// ----------------------------------------------------
// TEST 3: Re-Evaluate Hard (Preserve Easy & Moderate)
// ----------------------------------------------------
console.log("\nTEST 3: Re-Evaluate Hard (Preserving Easy & Moderate)...");
const subHard = reEvaluateSubmission(subId, "hard");
assert(subHard.evaluationResults?.hard !== undefined, "Hard result stored in evaluationResults.");
assert(subHard.evaluationResults?.easy !== undefined, "Easy result preserved.");
assert(subHard.evaluationResults?.moderate !== undefined, "Moderate result preserved.");
assert.strictEqual(subHard.evaluationResults.easy.score, easyScore, "Easy score unchanged.");
assert.strictEqual(subHard.evaluationResults.moderate.score, modScore, "Moderate score unchanged.");
assert.strictEqual(subHard.activeDifficulty, "hard", "activeDifficulty updated to hard.");
const hardScore = subHard.evaluationResults.hard.score;
console.log(`  Hard Score: ${hardScore} / 30 | Easy Score: ${easyScore} / 30 | Moderate Score: ${modScore} / 30`);
assert(modScore >= hardScore, "Moderate score >= Hard score.");

// ----------------------------------------------------
// TEST 4: Re-Evaluate Moderate Again (Recalculate Moderate)
// ----------------------------------------------------
console.log("\nTEST 4: Re-Evaluating Moderate Again...");
const subModAgain = reEvaluateSubmission(subId, "moderate");
assert(subModAgain.evaluationResults?.moderate !== undefined, "Moderate recalculated.");
assert.strictEqual(subModAgain.evaluationResults.easy.score, easyScore, "Easy score preserved.");
assert.strictEqual(subModAgain.evaluationResults.hard.score, hardScore, "Hard score preserved.");

// ----------------------------------------------------
// TEST 5: Reverse Sequence (Hard -> Easy -> Moderate)
// ----------------------------------------------------
console.log("\nTEST 5: Reverse Sequence Test (Hard -> Easy -> Moderate on new submission)...");
const sneha = students.find((s) => s.id === "stu-sneha");
const subSnehaRes = submitAssignment(sneha, asg30Id, pdfFile);
const snehaSubId = subSnehaRes.submission.id;

const sHard = reEvaluateSubmission(snehaSubId, "hard");
const snehaHardScore = sHard.evaluationResults.hard.score;

const sEasy = reEvaluateSubmission(snehaSubId, "easy");
const snehaEasyScore = sEasy.evaluationResults.easy.score;

const sMod = reEvaluateSubmission(snehaSubId, "moderate");
const snehaModScore = sMod.evaluationResults.moderate.score;

assert(sMod.evaluationResults?.easy !== undefined, "Sneha Easy preserved.");
assert(sMod.evaluationResults?.moderate !== undefined, "Sneha Moderate created.");
assert(sMod.evaluationResults?.hard !== undefined, "Sneha Hard preserved.");
assert.strictEqual(sMod.evaluationResults.easy.score, snehaEasyScore, "Sneha Easy score intact.");
assert.strictEqual(sMod.evaluationResults.hard.score, snehaHardScore, "Sneha Hard score intact.");
assert(snehaEasyScore >= snehaModScore, "Sneha Easy >= Moderate.");
assert(snehaModScore >= snehaHardScore, "Sneha Moderate >= Hard.");
console.log(`  Sneha Scores — Easy: ${snehaEasyScore} | Moderate: ${snehaModScore} | Hard: ${snehaHardScore}`);

// ----------------------------------------------------
// TEST 6: LocalStorage Hydration & Persistence Test
// ----------------------------------------------------
console.log("\nTEST 6: LocalStorage Hydration & Persistence Test...");
persistWorkflowEvaluations();
hydrateWorkflowEvaluations();

const hydratedSub = workflowSubmissions.find((s) => s.id === subId);
assert(hydratedSub !== undefined, "Submission found after hydration.");
assert(hydratedSub.evaluationResults?.easy !== undefined, "Hydrated Easy result intact.");
assert(hydratedSub.evaluationResults?.moderate !== undefined, "Hydrated Moderate result intact.");
assert(hydratedSub.evaluationResults?.hard !== undefined, "Hydrated Hard result intact.");
assert.strictEqual(hydratedSub.evaluationResults.easy.score, easyScore, "Hydrated Easy score matches.");
assert.strictEqual(hydratedSub.evaluationResults.moderate.score, modScore, "Hydrated Moderate score matches.");
assert.strictEqual(hydratedSub.evaluationResults.hard.score, hardScore, "Hydrated Hard score matches.");

// ----------------------------------------------------
// TEST 7: Teacher Logout / Login Persistence Test
// ----------------------------------------------------
console.log("\nTEST 7: Teacher Logout / Login Persistence Test...");
logoutTeacher();
loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const reloggedSub = workflowSubmissions.find((s) => s.id === subId);
assert(reloggedSub !== undefined, "Submission found after teacher re-login.");
assert(reloggedSub.evaluationResults?.easy !== undefined, "Re-logged Easy result intact.");
assert(reloggedSub.evaluationResults?.moderate !== undefined, "Re-logged Moderate result intact.");
assert(reloggedSub.evaluationResults?.hard !== undefined, "Re-logged Hard result intact.");

// ----------------------------------------------------
// TEST 8: Assignment Isolation
// ----------------------------------------------------
console.log("\nTEST 8: Assignment Isolation Test...");
const fetchedAsg = getAssignmentById(asg30Id);
assert.strictEqual(fetchedAsg.totalMarks, 30, "Fetched real assignment totalMarks is 30.");
assert.strictEqual(hydratedSub.evaluationResults.easy.totalMarks, 30, "Evaluation totalMarks matches assignment totalMarks.");

// ----------------------------------------------------
// TEST 9: 30-Mark Assignment Bounds Validation
// ----------------------------------------------------
console.log("\nTEST 9: 30-Mark Assignment Bounds Validation...");
assert(easyScore <= 30 && easyScore >= 0, "Easy score inside [0, 30].");
assert(modScore <= 30 && modScore >= 0, "Moderate score inside [0, 30].");
assert(hardScore <= 30 && hardScore >= 0, "Hard score inside [0, 30].");

// ----------------------------------------------------
// TEST 10: Double-Click / Idempotence Verification
// ----------------------------------------------------
console.log("\nTEST 10: Idempotence Verification...");
const res1 = reEvaluateSubmission(subId, "easy");
const res2 = reEvaluateSubmission(subId, "easy");
assert.strictEqual(res1.evaluationResults.easy.score, res2.evaluationResults.easy.score, "Repeated Easy re-eval is deterministic.");

console.log("\nALL RE-EVALUATION FLOW TESTS PASSED SUCCESSFULLY! ✅\n");
