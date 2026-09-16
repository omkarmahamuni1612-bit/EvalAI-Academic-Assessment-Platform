import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getStudentSubmission,
  getSubmissionStatusLabel,
  getQuestionPaperPdf,
  isAssignmentPastDueDate,
  isResultsPublished,
  isStudentTargeted,
  normalizeAssignmentStatus,
  normalizeStatusText,
  publishResults,
  workflowSubmissions,
  hydrateAllWorkflowData,
} from "./frontend/src/data/workflowData.js";
import { getCurrentStudent, loginStudent, logoutStudent, DEMO_STUDENT_PASSWORD } from "./frontend/src/auth/studentAuth.js";

console.log("==================================================");
console.log("RUNNING TEST: test-student-my-assignments-dynamic.mjs");
console.log("==================================================");

// Hydrate data first
hydrateAllWorkflowData();

// --------------------------------------------------
// Test 1: Current student resolves correctly
// --------------------------------------------------
const loginRes = loginStudent("ET202-041", DEMO_STUDENT_PASSWORD);
assert.ok(loginRes, "Student A (Rahul Patil) login must succeed.");
const currentStudent = getCurrentStudent();
assert.ok(currentStudent, "Current student session must be active.");
assert.strictEqual(currentStudent.roll, "ET202-041");
assert.strictEqual(currentStudent.branch, "ENTC");
assert.strictEqual(currentStudent.division, "TE ENTC – A");
console.log("✔ Test 1 PASS: Current student resolves correctly.");

// Create real Teacher Assignment 1: Deep Learning 2 (30 marks) for TE ENTC – A
const dlAsg = {
  id: "asg-dl2-10f",
  assessmentId: "asg-dl2-10f",
  title: "Deep Learning 2",
  subjectName: "Deep Learning",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  dueDate: "2026-09-25",
  dueTime: "23:59",
  status: "Published",
  questionPaperPdf: { name: "DeepLearning2_QP.pdf", size: 512000, data: "data:application/pdf;base64,DL2" },
};

// Create real Teacher Assignment 2: Machine Learning 01 (40 marks) for TE ENTC – A
const mlAsg = {
  id: "asg-ml1-10f",
  assessmentId: "asg-ml1-10f",
  title: "Machine Learning Assignment 01",
  subjectName: "Machine Learning",
  courseCode: "ML305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 40,
  dueDate: "2026-09-30",
  dueTime: "23:59",
  status: "Published",
  questionPaperPdf: { name: "MachineLearning1_QP.pdf", size: 612000, data: "data:application/pdf;base64,ML1" },
};

// Create real Teacher Assignment 3: Computer Networks (50 marks) for SE COMP – B (Untargeted for Rahul)
const compAsg = {
  id: "asg-comp-10f",
  assessmentId: "asg-comp-10f",
  title: "Computer Networks Assignment 01",
  subjectName: "Computer Networks",
  courseCode: "CS301",
  branch: "COMP",
  division: "SE COMP – B",
  totalMarks: 50,
  dueDate: "2026-10-05",
  dueTime: "23:59",
  status: "Published",
};

if (!createdAssessments.some((a) => a.id === dlAsg.id)) createdAssessments.push(dlAsg);
if (!createdAssessments.some((a) => a.id === mlAsg.id)) createdAssessments.push(mlAsg);
if (!createdAssessments.some((a) => a.id === compAsg.id)) createdAssessments.push(compAsg);

// Add Submissions for Student A
const subRahulDL = {
  id: "sub-rahul-dl2-10f",
  studentId: currentStudent.id,
  student: currentStudent.name,
  roll: currentStudent.roll,
  assignmentId: dlAsg.id,
  submittedAt: "Yesterday, 4:30 PM",
  file: "Rahul_DeepLearning2.pdf",
  fileName: "Rahul_DeepLearning2.pdf",
  answerPdf: { name: "Rahul_DeepLearning2.pdf", size: 204800, data: "data:application/pdf;base64,RahulDL2" },
  status: "Evaluated",
  evaluationId: `eval-${dlAsg.id}-${currentStudent.id}`,
  evaluation: {
    score: 25,
    totalMarks: 30,
    obtainedMarks: 25,
    percentage: 83,
    grade: "Grade A",
  },
};

if (!workflowSubmissions.some((s) => s.id === subRahulDL.id)) workflowSubmissions.push(subRahulDL);
publishResults(dlAsg.id);

// --------------------------------------------------
// Test 2: Teacher-created assignments load
// --------------------------------------------------
const targetedAssignments = createdAssessments.filter(
  (a) => a.status === "Published" && isStudentTargeted(currentStudent, a)
);
assert.ok(targetedAssignments.length >= 2, "Targeted published assignments must be loaded.");
console.log("✔ Test 2 PASS: Teacher-created assignments load.");

// --------------------------------------------------
// Test 3: Correct branch filtering
// --------------------------------------------------
const branchMatches = targetedAssignments.every((a) => a.branch === "ENTC");
assert.strictEqual(branchMatches, true, "All targeted assignments must match student branch ENTC.");
console.log("✔ Test 3 PASS: Correct branch filtering.");

// --------------------------------------------------
// Test 4: Correct division filtering
// --------------------------------------------------
const divMatches = targetedAssignments.every((a) => a.division === "TE ENTC – A");
assert.strictEqual(divMatches, true, "All targeted assignments must match student division TE ENTC – A.");
assert.strictEqual(targetedAssignments.some((a) => a.id === compAsg.id), false, "Untargeted COMP assignment must be excluded.");
console.log("✔ Test 4 PASS: Correct division filtering.");

// --------------------------------------------------
// Test 5: assignmentId is used as primary key
// --------------------------------------------------
const dlResolved = getAssignmentById(dlAsg.id);
assert.strictEqual(dlResolved.id, dlAsg.id);
console.log("✔ Test 5 PASS: assignmentId primary key resolution.");

// --------------------------------------------------
// Test 6: studentId is used for submission matching
// --------------------------------------------------
const subRahul = getStudentSubmission(currentStudent, dlAsg.id);
assert.strictEqual(subRahul.studentId, currentStudent.id);
console.log("✔ Test 6 PASS: studentId submission identity matching.");

// --------------------------------------------------
// Test 7: getStudentSubmission resolves submission
// --------------------------------------------------
assert.ok(subRahul, "getStudentSubmission must resolve student submission.");
assert.strictEqual(subRahul.file, "Rahul_DeepLearning2.pdf");
console.log("✔ Test 7 PASS: getStudentSubmission resolves submission record.");

// --------------------------------------------------
// Test 8: Absence of ReferenceError
// --------------------------------------------------
try {
  const qpPdf = getQuestionPaperPdf(dlAsg);
  assert.strictEqual(qpPdf.name, "DeepLearning2_QP.pdf");
  console.log("✔ Test 8 PASS: getQuestionPaperPdf executed without ReferenceError.");
} catch (err) {
  assert.fail(`Threw ReferenceError: ${err.message}`);
}

// --------------------------------------------------
// Test 9: Dynamic assignment title
// --------------------------------------------------
assert.strictEqual(dlResolved.title, "Deep Learning 2");
console.log("✔ Test 9 PASS: Dynamic assignment title verified.");

// --------------------------------------------------
// Test 10: Dynamic subject
// --------------------------------------------------
assert.strictEqual(dlResolved.subjectName, "Deep Learning");
console.log("✔ Test 10 PASS: Dynamic subject name verified.");

// --------------------------------------------------
// Test 11: Dynamic course code
// --------------------------------------------------
assert.strictEqual(dlResolved.courseCode, "ET305");
console.log("✔ Test 11 PASS: Dynamic course code verified.");

// --------------------------------------------------
// Test 12: Dynamic total marks
// --------------------------------------------------
assert.strictEqual(dlResolved.totalMarks, 30, "Deep Learning 2 total marks must be 30.");
const mlResolved = getAssignmentById(mlAsg.id);
assert.strictEqual(mlResolved.totalMarks, 40, "Machine Learning total marks must be 40.");
console.log("✔ Test 12 PASS: Dynamic total marks verified (30 and 40).");

// --------------------------------------------------
// Test 13: Dynamic due date & time
// --------------------------------------------------
assert.strictEqual(dlResolved.dueDate, "2026-09-25");
assert.strictEqual(dlResolved.dueTime, "23:59");
console.log("✔ Test 13 PASS: Dynamic due date & time verified.");

// --------------------------------------------------
// Test 14: Submission status derivation per assignment
// --------------------------------------------------
assert.ok(subRahul.status === "Result Published" || subRahul.status === "Evaluated");
const subRahulML = getStudentSubmission(currentStudent, mlAsg.id);
assert.strictEqual(subRahulML.status, "Pending");
console.log("✔ Test 14 PASS: Submission status correctly derived per assignment.");

// --------------------------------------------------
// Test 15: Evaluation status derivation
// --------------------------------------------------
assert.ok(subRahul.evaluation, "Evaluated submission contains evaluation payload.");
assert.strictEqual(subRahulML.evaluation, null, "Unsubmitted assignment evaluation is null.");
console.log("✔ Test 15 PASS: Evaluation status correctly derived.");

// --------------------------------------------------
// Test 16: Status Normalization Type Safety (Phase 7C - 10F.1)
// --------------------------------------------------
// String status
assert.strictEqual(normalizeAssignmentStatus("Submitted"), "submitted");
assert.strictEqual(normalizeAssignmentStatus("Under Evaluation"), "under evaluation");
assert.strictEqual(normalizeAssignmentStatus("Evaluated"), "evaluated");
assert.strictEqual(normalizeAssignmentStatus("Published"), "published");
assert.strictEqual(normalizeAssignmentStatus("Not Submitted"), "not submitted");
assert.strictEqual(normalizeAssignmentStatus("Failed"), "failed");

// Object status
assert.strictEqual(normalizeAssignmentStatus({ status: "Submitted" }), "submitted");
assert.strictEqual(normalizeAssignmentStatus({ label: "Evaluated" }), "evaluated");
assert.strictEqual(normalizeAssignmentStatus({ submissionStatus: "Processing" }), "processing");
assert.strictEqual(normalizeAssignmentStatus({ name: "Published" }), "published");
assert.strictEqual(normalizeAssignmentStatus({ key: "under-evaluation" }), "under-evaluation");

// Null / Undefined / Empty status
assert.strictEqual(normalizeAssignmentStatus(null), "unknown");
assert.strictEqual(normalizeAssignmentStatus(undefined), "unknown");
assert.strictEqual(normalizeAssignmentStatus({}), "unknown");

// Status text display normalizer
assert.strictEqual(normalizeStatusText(null), "Status Unavailable");
assert.strictEqual(normalizeStatusText(undefined), "Status Unavailable");
assert.strictEqual(normalizeStatusText({}), "Status Unavailable");
assert.strictEqual(normalizeStatusText("Submitted"), "Submitted");

// getSubmissionStatusLabel safe handling of submission objects and string inputs
const labelRahulDL = getSubmissionStatusLabel(subRahulDL);
assert.ok(labelRahulDL === "Result Published" || labelRahulDL === "Evaluated");
assert.strictEqual(getSubmissionStatusLabel(subRahulML), "Not Submitted");
assert.strictEqual(getSubmissionStatusLabel(null), "Not Submitted");
assert.strictEqual(getSubmissionStatusLabel("Submitted"), "Submitted");

console.log("✔ Test 16 PASS: Type-safe status normalization verified for string, object, null, and undefined.");

// --------------------------------------------------
// Test 17: Assignment opening route data integrity
// --------------------------------------------------
const openAsg = getAssignmentById(dlAsg.id);
const openSub = getStudentSubmission(currentStudent, dlAsg.id);
assert.strictEqual(openAsg.id, dlAsg.id, "Opened assignment matches requested assignmentId.");
assert.strictEqual(openSub.studentId, currentStudent.id, "Opened submission matches current studentId.");
assert.strictEqual(openSub.assignmentId, dlAsg.id, "Opened submission matches requested assignmentId.");
console.log("✔ Test 17 PASS: Assignment opening data integrity verified.");

// --------------------------------------------------
// Test 18: DSP demo isolation
// --------------------------------------------------
assert.strictEqual(isStudentTargeted(currentStudent, demoAssignment), false, "demoAssignment must be untargeted.");
assert.notStrictEqual(dlResolved.id, demoAssignment.id);
console.log("✔ Test 18 PASS: DSP demo assignment isolated from active student queue.");

// Cleanup
logoutStudent();

console.log("==================================================");
console.log("ALL TYPE-SAFETY AND SPECIFICATION TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
