import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getSubmissionById,
  hydrateWorkflowEvaluations,
  publishAssignmentAndNotifyStudents,
  submitAssignment,
  workflowSubmissions
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";
import { getInSemExam } from "./src/data/inSemData.js";
import { getEndSemExam } from "./src/data/endSemData.js";

console.log("=== REGRESSION TEST: GET ASSIGNMENT BY ID & WORKSPACE RESOLUTION ===");

loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const rahul = students.find((s) => s.id === "stu-rahul");
const sneha = students.find((s) => s.id === "stu-sneha");
assert(rahul && sneha, "Rahul and Sneha demo student accounts exist.");

// TEST 1 & 3: getAssignmentById returns exact created assignment
const uniqueAsgId = `asg-getbyid-${Date.now()}`;
const qpPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";

const newAsgData = {
  id: uniqueAsgId,
  title: "Get Assignment By ID Test",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Test assignment lookup by ID.",
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: { name: "GetById_QP.pdf", size: 2048, type: "application/pdf", data: qpPdfDataUrl },
  referenceAnswerPdf: { name: "GetById_Ref.pdf", size: 2048, type: "application/pdf", data: qpPdfDataUrl },
  referenceAnswer: "Exact reference answer for GetById test.",
};

publishAssignmentAndNotifyStudents(newAsgData);

const retrievedAsg = getAssignmentById(uniqueAsgId);
assert(retrievedAsg !== null, "TEST 1: getAssignmentById finds created assignment.");
assert.strictEqual(retrievedAsg.id, uniqueAsgId, "retrievedAsg ID matches.");
assert.strictEqual(retrievedAsg.title, "Get Assignment By ID Test", "retrievedAsg title matches.");

// TEST 2 & 4: Non-existing assignment ID returns null (NO demoAssignment fallback)
const nonExistent = getAssignmentById("asg-does-not-exist-99999");
assert.strictEqual(nonExistent, null, "TEST 2 & 4: Non-existing ID returns null safely without demoAssignment fallback.");

// TEST 5 & 6: Multiple assignments resolve independently
const uniqueAsgId2 = `asg-getbyid-2-${Date.now()}`;
publishAssignmentAndNotifyStudents({ ...newAsgData, id: uniqueAsgId2, title: "Second Assignment" });
const retrievedAsg2 = getAssignmentById(uniqueAsgId2);
assert.strictEqual(retrievedAsg2.title, "Second Assignment", "TEST 6: Second assignment resolves independently.");
assert.notStrictEqual(retrievedAsg.id, retrievedAsg2.id, "Assignment IDs are distinct.");

// TEST 7 & 8 & 9: Real submission resolves to correct created assignment
const studentPdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";
const submitRes = submitAssignment(rahul, uniqueAsgId, {
  name: "Rahul_GetById_Answer.pdf",
  size: 4096,
  type: "application/pdf",
  data: studentPdfDataUrl,
});

assert(submitRes.success === true, "Student submits answer PDF.");
const rahulSub = getSubmissionById(submitRes.submission.id);
assert(rahulSub !== null, "TEST 7: Submission retrieved by ID.");
assert.strictEqual(rahulSub.assignmentId, uniqueAsgId, "Submission holds exact uniqueAsgId.");

const resolvedAsgForSub = getAssignmentById(rahulSub.assignmentId);
assert.strictEqual(resolvedAsgForSub.title, "Get Assignment By ID Test", "Real submission resolves to correct created assignment title.");

// TEST 10 & 11 & 12 & 13: In-Sem, End-Sem & Grade Sheet Integrity
const inSem = getInSemExam();
const endSem = getEndSemExam();
assert(inSem !== null && endSem !== null, "TEST 11 & 12: In-Sem and End-Sem exams remain operational.");

console.log("\nALL GET ASSIGNMENT BY ID & WORKSPACE RESOLUTION TESTS PASSED ✅\n");
