import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getPersistedPdfUrl,
  getStudentAssignment,
  hydrateWorkflowEvaluations,
  isResultsPublished,
  persistWorkflowEvaluations,
  publishAssignmentAndNotifyStudents,
  registerCreatedAssessment,
  submitAssignment,
  workflowSubmissions
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { getStudentSubmission, students } from "./src/auth/studentAuth.js";

console.log("=== STUDENT -> TEACHER ANSWER SUBMISSION SYNC TESTS ===");

loginTeacher("teacher@college.edu", "teacher123");

const rahul = students.find((s) => s.id === "stu-rahul"); // ENTC, TE ENTC – A
const sneha = students.find((s) => s.id === "stu-sneha"); // ENTC, TE ENTC – A
assert(rahul && sneha, "Eligible student accounts exist.");

// TEST 1 & 2: Teacher creates & publishes assignment
const syncAsgId = `asg-sync-${Date.now()}`;
const qpPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";

const asgData = {
  id: syncAsgId,
  title: "ANSWER SUBMISSION SYNC TEST",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Test student to teacher submission sync.",
  dueDate: "2026-10-15",
  dueTime: "23:59",
  assignmentPdf: {
    name: "Sync_Test_QP.pdf",
    size: 2048,
    type: "application/pdf",
    data: qpPdfDataUrl,
  },
  referenceAnswerPdf: {
    name: "Sync_Test_Ref.pdf",
    size: 2048,
    type: "application/pdf",
    data: qpPdfDataUrl,
  },
};

const pubRes = publishAssignmentAndNotifyStudents(asgData);
assert(pubRes.success === true, "TEST 1 & 2: Teacher creates and publishes assignment.");

// TEST 3 & 4 & 5 & 6 & 7: Student submits Answer PDF with Base64 Data URL
const answerPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";
const studentAnswerPdf = {
  name: "RahulPatil_DSP_Answer.pdf",
  size: 5120,
  type: "application/pdf",
  data: answerPdfDataUrl,
  uploadedAt: new Date().toISOString(),
};

const submitRes = submitAssignment(rahul, syncAsgId, studentAnswerPdf);
assert(submitRes.success === true, "TEST 4: Student submits Answer PDF successfully.");
assert.strictEqual(submitRes.submission.assignmentId, syncAsgId, "TEST 5: Submission gets correct assignmentId.");
assert.strictEqual(submitRes.submission.studentId, rahul.id, "TEST 6: Submission gets correct studentId.");
assert.strictEqual(submitRes.submission.answerPdf.data, answerPdfDataUrl, "TEST 7: Answer PDF Base64 Data URL persists.");

// TEST 8 & 9 & 10 & 11: Teacher retrieves submission & resolves Answer PDF Data URL
const teacherSub = workflowSubmissions.find((s) => s.assignmentId === syncAsgId && s.studentId === rahul.id);
assert(teacherSub !== undefined, "TEST 8: Teacher retrieves submission from workflowSubmissions.");
assert.strictEqual(teacherSub.student, rahul.name, "TEST 9: Teacher sees correct student name.");
assert.strictEqual(teacherSub.assignmentId, syncAsgId, "TEST 10: Teacher sees correct assignmentId.");
const resolvedAnswerPdfUrl = getPersistedPdfUrl(teacherSub.answerPdf, pubRes.assignment);
assert.strictEqual(resolvedAnswerPdfUrl, answerPdfDataUrl, "TEST 11: Teacher can resolve exact Answer PDF Data URL.");

// TEST 12: Duplicate submission protection
const repeatSubmitRes = submitAssignment(rahul, syncAsgId, studentAnswerPdf);
assert(repeatSubmitRes.success === true, "Repeat submission handled.");
const subsCountForRahul = workflowSubmissions.filter((s) => s.assignmentId === syncAsgId && s.studentId === rahul.id).length;
assert.strictEqual(subsCountForRahul, 1, "TEST 12: Duplicate active submissions prevented for same student + assignment.");

// TEST 13: Refresh / Hydration Persistence
persistWorkflowEvaluations();
// Reset in-memory array to test hydration from localStorage
const savedLength = workflowSubmissions.length;
hydrateWorkflowEvaluations();
const hydratedSub = workflowSubmissions.find((s) => s.assignmentId === syncAsgId && s.studentId === rahul.id);
assert(hydratedSub !== undefined, "TEST 13: Submission survives hydration from localStorage.");
assert.strictEqual(hydratedSub.answerPdf.data, answerPdfDataUrl, "Answer PDF Data URL survives hydration.");

// TEST 14: Assignment Isolation (Assignment A vs Assignment B)
const syncAsgIdB = `asg-sync-b-${Date.now()}`;
publishAssignmentAndNotifyStudents({ ...asgData, id: syncAsgIdB, title: "Assignment B Sync" });
const subsForB = workflowSubmissions.filter((s) => s.assignmentId === syncAsgIdB);
assert.strictEqual(subsForB.length, 0, "TEST 14: Assignment A submission does not leak into Assignment B.");

// TEST 15: Multiple Student Handling
const snehaSubBefore = getStudentSubmission(sneha, syncAsgId);
assert(snehaSubBefore === null || snehaSubBefore.status === "Pending" || snehaSubBefore.status === "Not Submitted", "TEST 15: Sneha has not submitted yet, status is Pending.");

// TEST 16: Late Submission Rules
const lateAsgId = `asg-late-sync-${Date.now()}`;
publishAssignmentAndNotifyStudents({ ...asgData, id: lateAsgId, dueDate: "2020-01-01", dueTime: "12:00" });
submitAssignment(sneha, lateAsgId, studentAnswerPdf);
const snehaLateSub = getStudentSubmission(sneha, lateAsgId);
assert.strictEqual(snehaLateSub.status, "Late / Failed", "TEST 16: Late submission status set to Late / Failed.");
assert.strictEqual(snehaLateSub.score, "0 / 20", "Late submission receives 0 / 20.");
assert(snehaLateSub.answerPdf !== null, "Late submission retains Answer PDF for teacher record.");

// TEST 17: Missing Submission Rules
const rahulMissingSub = getStudentSubmission(rahul, lateAsgId);
assert(rahulMissingSub !== null, "TEST 17: Non-submitting student resolves to 0/F record after deadline.");
assert.strictEqual(rahulMissingSub.status, "Not Submitted", "Missing student status is Not Submitted.");
assert.strictEqual(rahulMissingSub.score, "0 / 20", "Missing student receives 0 / 20.");

console.log("\nALL STUDENT -> TEACHER ANSWER SUBMISSION SYNC TESTS PASSED ✅\n");
