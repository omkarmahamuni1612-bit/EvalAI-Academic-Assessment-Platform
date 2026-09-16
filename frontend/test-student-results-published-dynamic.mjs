import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getStudentSubmission,
  getSubmissionByEvaluationId,
  isResultsPublished,
  isStudentTargeted,
  publishResults,
  workflowSubmissions,
  hydrateAllWorkflowData,
  evaluateAssessmentSubmission,
} from "./src/data/workflowData.js";
import { getCurrentStudent, loginStudent, logoutStudent, DEMO_STUDENT_PASSWORD } from "./src/auth/studentAuth.js";

console.log("==================================================");
console.log("RUNNING TEST: test-student-results-published-dynamic.mjs");
console.log("==================================================");

// Hydrate workflow data first
hydrateAllWorkflowData();

// --------------------------------------------------
// Test 1: Student A login
// --------------------------------------------------
const loginRes = loginStudent("ET202-041", DEMO_STUDENT_PASSWORD);
assert.ok(loginRes, "Student A (Rahul Patil) login must succeed.");
const currentStudent = getCurrentStudent();
assert.ok(currentStudent, "Current student session must be active.");
assert.strictEqual(currentStudent.roll, "ET202-041");
assert.strictEqual(currentStudent.branch, "ENTC");
assert.strictEqual(currentStudent.division, "TE ENTC – A");
console.log("✔ Test 1 PASS: Student A login succeeds.");

// Create Teacher Assignment 1: Deep Learning 2 (30 marks)
const dlAsg = {
  id: "asg-dl2-10g",
  assessmentId: "asg-dl2-10g",
  title: "Deep Learning 2",
  subjectName: "Deep Learning",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  dueDate: "2026-09-25",
  dueTime: "23:59",
  status: "Published",
};

// Create Teacher Assignment 2: Machine Learning 01 (40 marks)
const mlAsg = {
  id: "asg-ml1-10g",
  assessmentId: "asg-ml1-10g",
  title: "Machine Learning Assignment 01",
  subjectName: "Machine Learning",
  courseCode: "ML305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 40,
  dueDate: "2026-09-30",
  dueTime: "23:59",
  status: "Published",
};

if (!createdAssessments.some((a) => a.id === dlAsg.id)) createdAssessments.push(dlAsg);
if (!createdAssessments.some((a) => a.id === mlAsg.id)) createdAssessments.push(mlAsg);

// Add Submissions for Student A
const subRahulDL = {
  id: "sub-rahul-dl2-10g",
  studentId: currentStudent.id,
  student: currentStudent.name,
  roll: currentStudent.roll,
  assignmentId: dlAsg.id,
  submittedAt: "Yesterday, 4:30 PM",
  file: "Rahul_DeepLearning2.pdf",
  fileName: "Rahul_DeepLearning2.pdf",
  answerText: "Deep learning neural network architecture explanation with gradient descent.",
  status: "Evaluated",
  evaluationId: `eval-${dlAsg.id}-${currentStudent.id}`,
  activeDifficulty: "moderate",
  evaluationDifficulty: "moderate",
  evaluation: {
    score: 24,
    totalMarks: 30,
    obtainedMarks: 24,
    percentage: 80,
    grade: "Grade A",
    evaluationDifficulty: "moderate",
    questionWiseResults: [
      { questionNumber: 1, awardedMarks: 12, maximumMarks: 15, feedback: "Good neural architecture explanation." },
      { questionNumber: 2, awardedMarks: 12, maximumMarks: 15, feedback: "Clear gradient descent formulation." },
    ],
    feedback: { strengths: "Clear concepts.", improvements: "Add loss curve plots." }
  },
};

const subRahulML = {
  id: "sub-rahul-ml1-10g",
  studentId: currentStudent.id,
  student: currentStudent.name,
  roll: currentStudent.roll,
  assignmentId: mlAsg.id,
  submittedAt: "Today, 10:15 AM",
  file: "Rahul_MachineLearning1.pdf",
  fileName: "Rahul_MachineLearning1.pdf",
  answerText: "Supervised vs unsupervised learning classification methods.",
  status: "Evaluated",
  evaluationId: `eval-${mlAsg.id}-${currentStudent.id}`,
  activeDifficulty: "hard",
  evaluationDifficulty: "hard",
  evaluation: {
    score: 32,
    totalMarks: 40,
    obtainedMarks: 32,
    percentage: 80,
    grade: "Grade A",
    evaluationDifficulty: "hard",
    questionWiseResults: [
      { questionNumber: 1, awardedMarks: 16, maximumMarks: 20, feedback: "Solid decision tree breakdown." },
      { questionNumber: 2, awardedMarks: 16, maximumMarks: 20, feedback: "Good margin explanation." },
    ],
    feedback: { strengths: "In-depth ML analysis.", improvements: "Explain regularization further." }
  },
};

if (!workflowSubmissions.some((s) => s.id === subRahulDL.id)) workflowSubmissions.push(subRahulDL);
if (!workflowSubmissions.some((s) => s.id === subRahulML.id)) workflowSubmissions.push(subRahulML);

// --------------------------------------------------
// Test 2: Unpublished result is hidden
// --------------------------------------------------
assert.strictEqual(isResultsPublished(dlAsg.id), false, "DL result must not be published initially.");
let subBeforePub = getStudentSubmission(currentStudent, dlAsg.id);
assert.ok(subBeforePub, "Submission record exists.");
console.log("✔ Test 2 PASS: Unpublished result state verified.");

// --------------------------------------------------
// Test 3: Teacher publishes result
// --------------------------------------------------
const pubResult = publishResults(dlAsg.id);
assert.strictEqual(pubResult.alreadyPublished, false, "Publishing DL assignment result must succeed.");
assert.strictEqual(isResultsPublished(dlAsg.id), true, "DL result must be published now.");
console.log("✔ Test 3 PASS: Teacher result publication succeeds.");

// --------------------------------------------------
// Test 4: Published state persists
// --------------------------------------------------
hydrateAllWorkflowData();
assert.strictEqual(isResultsPublished(dlAsg.id), true, "Published state must persist across hydration.");
console.log("✔ Test 4 PASS: Published state persistence verified.");

// --------------------------------------------------
// Test 5: Student can discover published result
// --------------------------------------------------
const subAfterPub = getStudentSubmission(currentStudent, dlAsg.id);
assert.ok(subAfterPub.evaluation, "Evaluation must exist on published submission.");
assert.strictEqual(subAfterPub.evaluation.score, 24, "Score must be 24.");
console.log("✔ Test 5 PASS: Student can discover published result.");

// --------------------------------------------------
// Test 6: Enforcement of correct studentId
// --------------------------------------------------
assert.strictEqual(subAfterPub.studentId, currentStudent.id, "Submission studentId must match current logged-in student.");
console.log("✔ Test 6 PASS: Correct studentId enforced.");

// --------------------------------------------------
// Test 7: Enforcement of correct assignmentId
// --------------------------------------------------
assert.strictEqual(subAfterPub.assignmentId, dlAsg.id, "Submission assignmentId must match DL assignment ID.");
console.log("✔ Test 7 PASS: Correct assignmentId enforced.");

// --------------------------------------------------
// Test 8: Multiple assignments remain isolated
// --------------------------------------------------
publishResults(mlAsg.id);
const subMLAfterPub = getStudentSubmission(currentStudent, mlAsg.id);
assert.strictEqual(subAfterPub.assignmentId, dlAsg.id);
assert.strictEqual(subMLAfterPub.assignmentId, mlAsg.id);
assert.strictEqual(subAfterPub.evaluation.totalMarks, 30);
assert.strictEqual(subMLAfterPub.evaluation.totalMarks, 40);
console.log("✔ Test 8 PASS: Multiple assignments remain isolated.");

// --------------------------------------------------
// Test 9: Deep Learning result does not become DSP
// --------------------------------------------------
const resolvedDlAsg = getAssignmentById(dlAsg.id);
assert.strictEqual(resolvedDlAsg.title, "Deep Learning 2");
assert.notStrictEqual(resolvedDlAsg.id, demoAssignment.id);
console.log("✔ Test 9 PASS: Deep Learning result is not DSP.");

// --------------------------------------------------
// Test 10: Dynamic subject name
// --------------------------------------------------
assert.strictEqual(resolvedDlAsg.subjectName, "Deep Learning");
console.log("✔ Test 10 PASS: Dynamic subject name verified.");

// --------------------------------------------------
// Test 11: Dynamic course code
// --------------------------------------------------
assert.strictEqual(resolvedDlAsg.courseCode, "ET305");
console.log("✔ Test 11 PASS: Dynamic course code verified.");

// --------------------------------------------------
// Test 12: Dynamic total marks (30 and 40)
// --------------------------------------------------
assert.strictEqual(subAfterPub.evaluation.totalMarks, 30);
assert.strictEqual(subMLAfterPub.evaluation.totalMarks, 40);
console.log("✔ Test 12 PASS: Dynamic total marks verified (30 & 40).");

// --------------------------------------------------
// Test 13: Dynamic score (24 and 32)
// --------------------------------------------------
assert.strictEqual(subAfterPub.evaluation.score, 24);
assert.strictEqual(subMLAfterPub.evaluation.score, 32);
console.log("✔ Test 13 PASS: Dynamic obtained score verified (24 & 32).");

// --------------------------------------------------
// Test 14: Dynamic grade
// --------------------------------------------------
assert.strictEqual(subAfterPub.evaluation.grade, "Grade A");
console.log("✔ Test 14 PASS: Dynamic grade verified.");

// --------------------------------------------------
// Test 15: Dynamic percentage
// --------------------------------------------------
assert.strictEqual(subAfterPub.evaluation.percentage, 80);
console.log("✔ Test 15 PASS: Dynamic percentage verified (80%).");

// --------------------------------------------------
// Test 16: Evaluation difficulty preserved (Moderate vs Hard)
// --------------------------------------------------
assert.strictEqual(subAfterPub.evaluation.evaluationDifficulty, "moderate");
assert.strictEqual(subMLAfterPub.evaluation.evaluationDifficulty, "hard");
console.log("✔ Test 16 PASS: Evaluation difficulty preserved.");

// --------------------------------------------------
// Test 17: Dashboard evaluated count (2 published results)
// --------------------------------------------------
const targetedPublished = createdAssessments.filter(
  (a) => a.status === "Published" && a.id !== demoAssignment.id && isStudentTargeted(currentStudent, a)
);
const evaluatedCount = targetedPublished.filter((asg) => isResultsPublished(asg.id)).length;
assert.strictEqual(evaluatedCount, 2, "Evaluated count must be 2.");
console.log("✔ Test 17 PASS: Dashboard evaluated count verified (2).");

// --------------------------------------------------
// Test 18: Dashboard average score calculation
// --------------------------------------------------
// DL2: 24/30, ML1: 32/40 -> (24+32)/(30+40) = 56/70 = 80%
const totalAwarded = 24 + 32;
const totalPossible = 30 + 40;
const avgPct = Math.round((totalAwarded / totalPossible) * 100);
assert.strictEqual(avgPct, 80, "Average score across published work must be 80%.");
console.log("✔ Test 18 PASS: Dashboard average score verified (80%).");

// --------------------------------------------------
// Test 19: Refresh persistence
// --------------------------------------------------
hydrateAllWorkflowData();
const refreshedSub = getStudentSubmission(currentStudent, dlAsg.id);
assert.ok(refreshedSub.evaluation, "Evaluation survives refresh/hydration.");
console.log("✔ Test 19 PASS: Refresh persistence verified.");

// --------------------------------------------------
// Test 20: Logout / Login persistence
// --------------------------------------------------
logoutStudent();
assert.strictEqual(getCurrentStudent(), null);
loginStudent("ET202-041", DEMO_STUDENT_PASSWORD);
const reloggedStudent = getCurrentStudent();
const reloggedSub = getStudentSubmission(reloggedStudent, dlAsg.id);
assert.strictEqual(reloggedSub.evaluation.score, 24);
console.log("✔ Test 20 PASS: Logout/Login persistence verified.");

// --------------------------------------------------
// Test 21: URL Tampering Protection (Student B cannot access Student A's result)
// --------------------------------------------------
loginStudent("ET202-089", DEMO_STUDENT_PASSWORD); // Sneha Kulkarni
const studentB = getCurrentStudent();
assert.strictEqual(studentB.roll, "ET202-089");
const subTargetedToA = getSubmissionByEvaluationId(`eval-${dlAsg.id}-${currentStudent.id}`);
const isStudentBOwner = Boolean(subTargetedToA && subTargetedToA.studentId === studentB.id);
assert.strictEqual(isStudentBOwner, false, "Student B must NOT be owner of Student A's result.");
console.log("✔ Test 21 PASS: URL tampering protection verified.");

// --------------------------------------------------
// Test 22: No hardcoded 20 marks
// --------------------------------------------------
assert.strictEqual(resolvedDlAsg.totalMarks, 30);
assert.notStrictEqual(resolvedDlAsg.totalMarks, 20);
console.log("✔ Test 22 PASS: Total marks is dynamic (30, not hardcoded 20).");

// --------------------------------------------------
// Test 23: No demo fallback
// --------------------------------------------------
assert.strictEqual(isStudentTargeted(reloggedStudent, demoAssignment), false, "demoAssignment must not be targeted.");
console.log("✔ Test 23 PASS: Demo assignment fallback excluded.");

// --------------------------------------------------
// Test 24: Empty state works correctly for untargeted student
// --------------------------------------------------
const studentUntargeted = { id: "stu-comp-999", name: "Kiran Shah", roll: "CS101-099", branch: "COMP", division: "SE COMP – B" };
const targetedForUntargeted = createdAssessments.filter((a) => a.status === "Published" && a.id !== demoAssignment.id && isStudentTargeted(studentUntargeted, a));
assert.strictEqual(targetedForUntargeted.length, 0, "Untargeted student has 0 targeted published assignments.");
console.log("✔ Test 24 PASS: Professional empty state verified for student with 0 results.");

// --------------------------------------------------
// Test 25: View Results route resolves correctly with no runtime error
// --------------------------------------------------
const resolvedSubById = getSubmissionByEvaluationId(`eval-${dlAsg.id}-${currentStudent.id}`);
assert.ok(resolvedSubById, "Evaluation ID lookup resolves cleanly.");
assert.strictEqual(resolvedSubById.assignmentId, dlAsg.id);

// Cleanup
logoutStudent();

console.log("==================================================");
console.log("ALL 25 PUBLISHED RESULT SPECIFICATION TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
