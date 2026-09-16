import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getStudentSubmission,
  getQuestionPaperPdf,
  isAssignmentPastDueDate,
  isResultsPublished,
  isStudentTargeted,
  publishResults,
  workflowSubmissions,
  hydrateAllWorkflowData,
} from "./src/data/workflowData.js";
import { getCurrentStudent, loginStudent, logoutStudent, DEMO_STUDENT_PASSWORD } from "./src/auth/studentAuth.js";

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
  const qpPdf = getQuestionPaperPdf(dlAsg.id);
  assert.strictEqual(qpPdf.name, "DeepLearning2_QP.pdf");
  console.log("✔ Test 8 PASS: getQuestionPaperPdf with string ID executed without ReferenceError.");
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
// Test 13: Dynamic due date
// --------------------------------------------------
assert.strictEqual(dlResolved.dueDate, "2026-09-25");
console.log("✔ Test 13 PASS: Dynamic due date verified.");

// --------------------------------------------------
// Test 14: Dynamic due time
// --------------------------------------------------
assert.strictEqual(dlResolved.dueTime, "23:59");
console.log("✔ Test 14 PASS: Dynamic due time verified.");

// --------------------------------------------------
// Test 15: Submission status
// --------------------------------------------------
assert.ok(subRahul.status === "Result Published" || subRahul.status === "Evaluated", `Status must be Result Published or Evaluated, got: ${subRahul.status}`);
const subRahulML = getStudentSubmission(currentStudent, mlAsg.id);
assert.strictEqual(subRahulML.status, "Pending");
console.log("✔ Test 15 PASS: Submission status correctly derived per assignment.");

// --------------------------------------------------
// Test 16: Evaluation status
// --------------------------------------------------
assert.ok(subRahul.evaluation, "Evaluated submission contains evaluation payload.");
assert.strictEqual(subRahulML.evaluation, null, "Unsubmitted assignment evaluation is null.");
console.log("✔ Test 16 PASS: Evaluation status correctly derived.");

// --------------------------------------------------
// Test 17: Published result access link
// --------------------------------------------------
assert.strictEqual(isResultsPublished(dlAsg.id), true, "Deep Learning 2 results are published.");
console.log("✔ Test 17 PASS: Published result access validated.");

// --------------------------------------------------
// Test 18: Unpublished result protection
// --------------------------------------------------
assert.strictEqual(isResultsPublished(mlAsg.id), false, "Machine Learning results are not published.");
console.log("✔ Test 18 PASS: Unpublished result protection validated.");

// --------------------------------------------------
// Test 19: Multi-assignment isolation
// --------------------------------------------------
assert.notStrictEqual(dlResolved.id, mlResolved.id);
assert.notStrictEqual(dlResolved.totalMarks, mlResolved.totalMarks);
assert.notStrictEqual(subRahul.file, subRahulML.file);
console.log("✔ Test 19 PASS: Multi-assignment isolation verified.");

// --------------------------------------------------
// Test 20: PDF / submission payload isolation
// --------------------------------------------------
assert.strictEqual(subRahul.answerPdf.name, "Rahul_DeepLearning2.pdf");
assert.strictEqual(subRahulML.answerPdf, undefined);
console.log("✔ Test 20 PASS: Student answer PDF payload isolated to correct assignment.");

// --------------------------------------------------
// Test 21: Past due deadline behavior
// --------------------------------------------------
const pastDueAsg = {
  id: "asg-pastdue-10f",
  title: "Past Due Test Assignment",
  dueDate: "2026-08-01",
  dueTime: "12:00",
  totalMarks: 20,
  branch: "ENTC",
  division: "TE ENTC – A",
  status: "Published",
};
if (!createdAssessments.some((a) => a.id === pastDueAsg.id)) createdAssessments.push(pastDueAsg);
assert.strictEqual(isAssignmentPastDueDate(pastDueAsg), true);
const nonSubRecord = getStudentSubmission(currentStudent, pastDueAsg.id);
assert.strictEqual(nonSubRecord.status, "Missing / Failed");
assert.strictEqual(nonSubRecord.score, "0 / 20");
console.log("✔ Test 21 PASS: Past due deadline behavior returns non-submission zero.");

// --------------------------------------------------
// Test 22: Refresh persistence
// --------------------------------------------------
const refreshedDl = getAssignmentById(dlAsg.id);
assert.strictEqual(refreshedDl.title, "Deep Learning 2");
console.log("✔ Test 22 PASS: Assignment lookup persists across calls.");

// --------------------------------------------------
// Test 23: Logout / Login session persistence
// --------------------------------------------------
logoutStudent();
assert.strictEqual(getCurrentStudent(), null);
loginStudent("ET202-041", DEMO_STUDENT_PASSWORD);
const relogged = getCurrentStudent();
assert.strictEqual(relogged.id, currentStudent.id);
console.log("✔ Test 23 PASS: Logout / Login session persistence verified.");

// --------------------------------------------------
// Test 24: DSP demo isolation
// --------------------------------------------------
assert.strictEqual(isStudentTargeted(currentStudent, demoAssignment), false, "demoAssignment must be untargeted.");
assert.notStrictEqual(dlResolved.id, demoAssignment.id);
console.log("✔ Test 24 PASS: DSP demo assignment isolated from active student queue.");

// --------------------------------------------------
// Test 25: Absence of hardcoded 20 marks
// --------------------------------------------------
assert.strictEqual(dlResolved.totalMarks, 30, "Deep Learning 2 total marks must be 30, not hardcoded 20.");
assert.strictEqual(mlResolved.totalMarks, 40, "Machine Learning total marks must be 40, not hardcoded 20.");
console.log("✔ Test 25 PASS: No hardcoded 20 marks present.");

// Cleanup
logoutStudent();

console.log("==================================================");
console.log("ALL 25 SPECIFICATION TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
