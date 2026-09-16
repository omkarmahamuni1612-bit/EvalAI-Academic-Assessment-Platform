import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getStudentSubmission,
  getSubmissionByEvaluationId,
  getSubmissionById,
  isResultsPublished,
  publishResults,
  workflowSubmissions,
  hydrateAllWorkflowData,
} from "./src/data/workflowData.js";
import { getCurrentStudent, loginStudent, logoutStudent, DEMO_STUDENT_PASSWORD } from "./src/auth/studentAuth.js";

console.log("==================================================");
console.log("RUNNING TEST: test-student-results-dynamic.mjs");
console.log("==================================================");

// Hydrate data first
hydrateAllWorkflowData();

// --------------------------------------------------
// Test 1: getStudentSubmission dependency resolves correctly
// --------------------------------------------------
assert.strictEqual(typeof getStudentSubmission, "function", "getStudentSubmission must be a valid function.");
console.log("✔ Test 1 PASS: getStudentSubmission function is defined and exported correctly.");

// --------------------------------------------------
// Setup Student A (Rahul Patil) and Student B (Sneha Kulkarni)
// --------------------------------------------------
const loginRes = loginStudent("ET202-041", DEMO_STUDENT_PASSWORD);
assert.ok(loginRes, "Student A login must succeed.");
const studentA = getCurrentStudent();
assert.ok(studentA, "Current student session must be active.");

const studentB = {
  id: "stu-sneha-10e",
  name: "Sneha Kulkarni",
  roll: "ET202-089",
  branch: "ENTC",
  division: "TE ENTC – A",
};

// Create real Teacher Assignment 1: Deep Learning 2 (30 marks)
const dlAsg = {
  id: "asg-dl2-10e",
  assessmentId: "asg-dl2-10e",
  title: "Deep Learning 2",
  subjectName: "Deep Learning",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  dueDate: "2026-09-25",
  dueTime: "23:59",
  status: "Published",
  questions: [
    { id: 1, text: "Q1. Convolutional Layer Mechanics", marks: 15 },
    { id: 2, text: "Q2. Backpropagation Derivation", marks: 15 },
  ],
};

// Create real Teacher Assignment 2: Machine Learning Assignment 01 (40 marks)
const mlAsg = {
  id: "asg-ml1-10e",
  assessmentId: "asg-ml1-10e",
  title: "Machine Learning Assignment 01",
  subjectName: "Machine Learning",
  courseCode: "ML305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 40,
  dueDate: "2026-09-30",
  dueTime: "23:59",
  status: "Published",
  questions: [
    { id: 1, text: "Q1. Decision Tree Entropy", marks: 20 },
    { id: 2, text: "Q2. SVM Margin Optimization", marks: 20 },
  ],
};

if (!createdAssessments.some((a) => a.id === dlAsg.id)) createdAssessments.push(dlAsg);
if (!createdAssessments.some((a) => a.id === mlAsg.id)) createdAssessments.push(mlAsg);

// Create Submissions and Evaluations for Student A
const subRahulDL = {
  id: "sub-rahul-dl2-10e",
  studentId: studentA.id,
  student: studentA.name,
  roll: studentA.roll,
  assignmentId: dlAsg.id,
  submittedAt: "Yesterday, 4:30 PM",
  file: "Rahul_DL2.pdf",
  status: "Evaluated",
  evaluationId: `eval-${dlAsg.id}-${studentA.id}`,
  evaluation: {
    score: 24,
    totalMarks: 30,
    obtainedMarks: 24,
    percentage: 80,
    grade: "Grade A",
    evaluationDifficulty: "moderate",
    questionWiseResults: [
      { questionNumber: 1, questionText: "Convolutional Layer Mechanics", awardedMarks: 12, maximumMarks: 15, feedback: "Excellent explanation." },
      { questionNumber: 2, questionText: "Backpropagation Derivation", awardedMarks: 12, maximumMarks: 15, feedback: "Minor step missing." },
    ],
    rubric: [
      { name: "Q1 Mechanics", score: 12, max: 15, reason: "Excellent explanation." },
      { name: "Q2 Derivation", score: 12, max: 15, reason: "Minor step missing." },
    ],
    feedback: {
      strengths: "Clear CNN layer architecture description.",
      improvements: "Include step-by-step chain rule derivation.",
      missing: "Detail the gradient calculation for bias terms.",
    },
  },
};

const subRahulML = {
  id: "sub-rahul-ml1-10e",
  studentId: studentA.id,
  student: studentA.name,
  roll: studentA.roll,
  assignmentId: mlAsg.id,
  submittedAt: "Today, 10:00 AM",
  file: "Rahul_ML1.pdf",
  status: "Evaluated",
  evaluationId: `eval-${mlAsg.id}-${studentA.id}`,
  evaluation: {
    score: 34,
    totalMarks: 40,
    obtainedMarks: 34,
    percentage: 85,
    grade: "Grade A+",
    evaluationDifficulty: "moderate",
    questionWiseResults: [
      { questionNumber: 1, questionText: "Decision Tree Entropy", awardedMarks: 17, maximumMarks: 20, feedback: "Great mathematical proof." },
      { questionNumber: 2, questionText: "SVM Margin Optimization", awardedMarks: 17, maximumMarks: 20, feedback: "Well structured." },
    ],
    rubric: [
      { name: "Q1 Entropy", score: 17, max: 20, reason: "Great mathematical proof." },
      { name: "Q2 SVM", score: 17, max: 20, reason: "Well structured." },
    ],
    feedback: {
      strengths: "Comprehensive entropy derivation.",
      improvements: "Specify kernel trick application.",
    },
  },
};

// Create Submission for Student B (Sneha) on Deep Learning 2
const subSnehaDL = {
  id: "sub-sneha-dl2-10e",
  studentId: studentB.id,
  student: studentB.name,
  roll: studentB.roll,
  assignmentId: dlAsg.id,
  submittedAt: "Yesterday, 5:00 PM",
  file: "Sneha_DL2.pdf",
  status: "Evaluated",
  evaluationId: `eval-${dlAsg.id}-${studentB.id}`,
  evaluation: {
    score: 28,
    totalMarks: 30,
    obtainedMarks: 28,
    percentage: 93,
    grade: "Grade O",
    evaluationDifficulty: "moderate",
  },
};

if (!workflowSubmissions.some((s) => s.id === subRahulDL.id)) workflowSubmissions.push(subRahulDL);
if (!workflowSubmissions.some((s) => s.id === subRahulML.id)) workflowSubmissions.push(subRahulML);
if (!workflowSubmissions.some((s) => s.id === subSnehaDL.id)) workflowSubmissions.push(subSnehaDL);

// Publish results for Deep Learning 2 & Machine Learning
publishResults(dlAsg.id);
publishResults(mlAsg.id);

// --------------------------------------------------
// Test 2: No undefined function / reference error during lookup
// --------------------------------------------------
const resolvedByEvalId = getSubmissionByEvaluationId(subRahulDL.evaluationId);
assert.ok(resolvedByEvalId, "getSubmissionByEvaluationId must resolve subRahulDL cleanly.");
assert.strictEqual(resolvedByEvalId.id, subRahulDL.id);
console.log("✔ Test 2 PASS: No undefined reference error during evaluation lookup.");

// --------------------------------------------------
// Test 3: Student Results route loads / resolves
// --------------------------------------------------
const fetchedSub = getSubmissionById(subRahulDL.id) || getSubmissionByEvaluationId(subRahulDL.evaluationId) || getStudentSubmission(studentA, dlAsg.id);
assert.ok(fetchedSub, "Submission resolution chain must find submission.");
console.log("✔ Test 3 PASS: Student results route data resolves properly.");

// --------------------------------------------------
// Test 4: Current student isolation
// --------------------------------------------------
assert.strictEqual(fetchedSub.studentId, studentA.id, "Result must belong strictly to Student A.");
assert.notStrictEqual(fetchedSub.studentId, studentB.id, "Result must NOT belong to Student B.");
console.log("✔ Test 4 PASS: Current student isolation enforced.");

// --------------------------------------------------
// Test 5: Correct submission resolution
// --------------------------------------------------
assert.strictEqual(fetchedSub.id, subRahulDL.id);
console.log("✔ Test 5 PASS: Submission resolved cleanly.");

// --------------------------------------------------
// Test 6: Correct assignment resolution
// --------------------------------------------------
const resolvedAsg = getAssignmentById(fetchedSub.assignmentId);
assert.strictEqual(resolvedAsg.id, dlAsg.id);
console.log("✔ Test 6 PASS: Assignment resolved cleanly.");

// --------------------------------------------------
// Test 7: Correct evaluation resolution
// --------------------------------------------------
assert.strictEqual(fetchedSub.evaluation.score, 24);
console.log("✔ Test 7 PASS: Evaluation resolved cleanly.");

// --------------------------------------------------
// Test 8: Published-result validation
// --------------------------------------------------
assert.strictEqual(isResultsPublished(dlAsg.id), true, "Deep Learning 2 results are published.");
console.log("✔ Test 8 PASS: Published result validation passes.");

// --------------------------------------------------
// Test 9: Unpublished result protection
// --------------------------------------------------
const unpubAsg = {
  id: "asg-unpub-10e",
  title: "Unpublished Test Assignment",
  status: "Draft",
};
assert.strictEqual(isResultsPublished(unpubAsg.id), false, "Unpublished assignment must return false.");
console.log("✔ Test 9 PASS: Unpublished result protection verified.");

// --------------------------------------------------
// Test 10: Dynamic assignment title
// --------------------------------------------------
assert.strictEqual(resolvedAsg.title, "Deep Learning 2");
console.log("✔ Test 10 PASS: Dynamic assignment title verified.");

// --------------------------------------------------
// Test 11: Dynamic subject
// --------------------------------------------------
assert.strictEqual(resolvedAsg.subjectName, "Deep Learning");
console.log("✔ Test 11 PASS: Dynamic subject name verified.");

// --------------------------------------------------
// Test 12: Dynamic course code
// --------------------------------------------------
assert.strictEqual(resolvedAsg.courseCode, "ET305");
console.log("✔ Test 12 PASS: Dynamic course code verified.");

// --------------------------------------------------
// Test 13: Dynamic total marks
// --------------------------------------------------
assert.strictEqual(resolvedAsg.totalMarks, 30, "Deep Learning 2 total marks must be 30.");
console.log("✔ Test 13 PASS: Dynamic total marks verified (30).");

// --------------------------------------------------
// Test 14: Dynamic awarded marks
// --------------------------------------------------
assert.strictEqual(fetchedSub.evaluation.score, 24);
console.log("✔ Test 14 PASS: Dynamic awarded marks verified (24).");

// --------------------------------------------------
// Test 15: Dynamic percentage
// --------------------------------------------------
const pct = Math.round((fetchedSub.evaluation.score / resolvedAsg.totalMarks) * 100);
assert.strictEqual(pct, 80);
console.log("✔ Test 15 PASS: Dynamic percentage verified (80%).");

// --------------------------------------------------
// Test 16: Dynamic grade
// --------------------------------------------------
assert.strictEqual(fetchedSub.evaluation.grade, "Grade A");
console.log("✔ Test 16 PASS: Dynamic grade verified.");

// --------------------------------------------------
// Test 17: Question-wise result isolation
// --------------------------------------------------
assert.strictEqual(fetchedSub.evaluation.questionWiseResults.length, 2);
assert.strictEqual(fetchedSub.evaluation.questionWiseResults[0].awardedMarks, 12);
console.log("✔ Test 17 PASS: Question-wise breakdown verified.");

// --------------------------------------------------
// Test 18: Student-safe rubric feedback
// --------------------------------------------------
assert.ok(fetchedSub.evaluation.feedback.strengths.includes("CNN layer architecture"));
assert.strictEqual(fetchedSub.evaluation.referenceAnswerPdf, undefined, "Reference answer PDF must not be in student evaluation payload.");
console.log("✔ Test 18 PASS: Student-safe rubric feedback verified.");

// --------------------------------------------------
// Test 19: Multiple assignments isolation
// --------------------------------------------------
const mlSubFetched = getSubmissionByEvaluationId(subRahulML.evaluationId);
const mlAsgFetched = getAssignmentById(mlSubFetched.assignmentId);
assert.strictEqual(mlAsgFetched.totalMarks, 40);
assert.strictEqual(mlSubFetched.evaluation.score, 34);
assert.notStrictEqual(mlSubFetched.evaluation.score, fetchedSub.evaluation.score);
console.log("✔ Test 19 PASS: Multiple assignments maintain isolated marks and scores.");

// --------------------------------------------------
// Test 20: DSP demo isolation
// --------------------------------------------------
assert.notStrictEqual(resolvedAsg.id, demoAssignment.id);
assert.notStrictEqual(resolvedAsg.title, demoAssignment.title);
console.log("✔ Test 20 PASS: Active student results do not fall back to DSP demo data.");

// --------------------------------------------------
// Test 21: Refresh persistence
// --------------------------------------------------
const refreshedAsg = getAssignmentById(dlAsg.id);
assert.strictEqual(refreshedAsg.title, "Deep Learning 2");
console.log("✔ Test 21 PASS: Hydrated assignment persists across lookups.");

// --------------------------------------------------
// Test 22: Logout / Login persistence
// --------------------------------------------------
logoutStudent();
assert.strictEqual(getCurrentStudent(), null);
loginStudent("ET202-041", DEMO_STUDENT_PASSWORD);
const reloggedStudent = getCurrentStudent();
assert.strictEqual(reloggedStudent.id, studentA.id);
console.log("✔ Test 22 PASS: Student login session persists.");

// --------------------------------------------------
// Test 23: Missing submission handling
// --------------------------------------------------
const missingSub = getSubmissionByEvaluationId("eval-nonexistent-123");
assert.strictEqual(missingSub, null, "Missing submission lookup must return null without throwing error.");
console.log("✔ Test 23 PASS: Missing submission returns controlled null.");

// --------------------------------------------------
// Test 24: Missing assignment handling
// --------------------------------------------------
const missingAsg = getAssignmentById("asg-nonexistent-999");
assert.strictEqual(missingAsg, null, "Missing assignment lookup must return null without throwing error.");
console.log("✔ Test 24 PASS: Missing assignment returns controlled null.");

// --------------------------------------------------
// Test 25: Missing evaluation handling
// --------------------------------------------------
const pendingSub = getStudentSubmission(studentA, "asg-unpub-10e");
assert.strictEqual(pendingSub.evaluation, null, "Pending assignment evaluation must be null.");
console.log("✔ Test 25 PASS: Missing evaluation returns controlled null.");

// --------------------------------------------------
// Test 26: Absence of raw ReferenceError
// --------------------------------------------------
try {
  const evalLookup = getSubmissionByEvaluationId(`eval-non-sub-${dlAsg.id}-${studentA.id}`);
  assert.ok(true, "Lookup executed without throwing ReferenceError.");
} catch (err) {
  assert.fail(`Lookup threw ReferenceError: ${err.message}`);
}
console.log("✔ Test 26 PASS: Zero ReferenceError in non-submission evaluation lookup.");

// Cleanup
logoutStudent();

console.log("==================================================");
console.log("ALL 26 SPECIFICATION TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
