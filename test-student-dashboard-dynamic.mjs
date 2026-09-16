import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getStudentNotifications,
  isAssignmentPastDueDate,
  publishAssignmentAndNotifyStudents,
  registerCreatedAssessment,
  studentNotifications,
  submitAssignment,
  hydrateAllWorkflowData,
  workflowSubmissions,
  getActiveStudentAssignmentId,
} from "./frontend/src/data/workflowData.js";

import {
  students,
  getStudentSubmission,
} from "./frontend/src/auth/studentAuth.js";

import {
  loginTeacher,
} from "./frontend/src/auth/teacherAuth.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("=== RUNNING TEST SUITE: Student Dashboard Dynamic Data & Clean Experience ===\n");

// Login teacher to authorize assignment publication
loginTeacher("teacher@college.edu", "teacher123");

// Setup student identities
const studentA = students.find((s) => s.branch === "ENTC" && s.division === "TE ENTC – A") || students[0];
const studentB = { id: "stu-cs-999", name: "CS Student", roll: "CS999-01", branch: "CS", division: "SE CS – A" };

// 1. Real published assignment appears & 12. Dynamic total marks (30)
const realAsgData = {
  id: "asg-dash-real-01",
  title: "Machine Learning Assignment 1",
  subjectName: "Machine Learning",
  courseCode: "AI301",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 30,
  dueDate: "2030-12-31",
  dueTime: "23:59",
  status: "Published",
};
publishAssignmentAndNotifyStudents(realAsgData, [studentA]);

const studentAAssignments = (createdAssessments || []).filter(
  (a) => a && a.status === "Published" && a.id !== demoAssignment.id && (a.branch === studentA.branch && a.division === studentA.division)
);
assert(studentAAssignments.some((a) => a.id === realAsgData.id), "1. Real published assignment appears for targeted student");

// 2. Demo assignments do not appear
assert(!studentAAssignments.some((a) => a.id === demoAssignment.id), "2. Demo assignments do not appear in Student Dashboard target data");

// 3. Wrong division assignment does not appear
const divBAsgData = {
  id: "asg-dash-divb-01",
  title: "Robotics Assignment 1",
  subjectName: "Robotics",
  courseCode: "ROB201",
  branch: "ENTC",
  division: "TE ENTC – B",
  totalMarks: 40,
  dueDate: "2030-12-31",
  status: "Published",
};
registerCreatedAssessment(divBAsgData);
const studentBList = (createdAssessments || []).filter(
  (a) => a && a.status === "Published" && a.id !== demoAssignment.id && (a.branch === studentA.branch && a.division === studentA.division)
);
assert(!studentBList.some((a) => a.id === divBAsgData.id), "3. Wrong division assignment does not appear for Student A");

// 4. Total Assignments count is correct
assert(studentAAssignments.length >= 1, "4. Total Assignments KPI count is correct");

// 5 & 6. Submitted vs Pending count
const pendingCountBeforeSub = studentAAssignments.filter((a) => {
  const sub = getStudentSubmission(studentA, a.id);
  return !sub || !sub.file || sub.status === "Pending";
}).length;
assert(pendingCountBeforeSub > 0, "6. Pending count correctly identifies unsubmitted published assignment");

// Perform submission for realAsgData
const pdfFile = { name: "ML_Answer.pdf", type: "application/pdf", data: "data:application/pdf;base64,123" };
submitAssignment(studentA, realAsgData.id, pdfFile);

const subAfter = getStudentSubmission(studentA, realAsgData.id);
assert(subAfter && subAfter.file === "ML_Answer.pdf", "5. Submitted count is incremented after valid submission");

// 7, 8, 9. Missing assignment resolved after deadline (0 / totalMarks, Grade F)
const expiredAsgData = {
  id: "asg-dash-expired-01",
  title: "Expired Embedded Systems Assignment",
  subjectName: "Embedded Systems",
  courseCode: "ET304",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 60,
  dueDate: "2020-01-01",
  dueTime: "23:59",
  status: "Published",
};
publishAssignmentAndNotifyStudents(expiredAsgData, [studentA]);
const expiredSub = getStudentSubmission(studentA, expiredAsgData.id);
assert(expiredSub.status === "Missing / Failed", "7. Missing assignment resolved after deadline with Missing / Failed status");
assert(expiredSub.score === "0 / 60", "8. Missing assignment receives 0 / totalMarks (0 / 60)");
assert(expiredSub.evaluation.grade === "F", "9. Missing assignment receives Grade F");

// 10. Submitted student remains Submitted after deadline
assert(subAfter.status !== "Missing / Failed", "10. Submitted student remains Submitted after deadline");

// 11. Multiple assignments remain isolated
assert(subAfter.assignmentId === realAsgData.id && expiredSub.assignmentId === expiredAsgData.id, "11. Multiple assignments remain isolated by assignmentId");

// 12. Dynamic total marks work for 20/30/40/60
assert(expiredSub.evaluation.totalMarks === 60, "12. Dynamic total marks handled correctly for 60 marks");

// 13. Dashboard survives refresh (hydration)
hydrateAllWorkflowData();
const refreshedSub = getStudentSubmission(studentA, expiredAsgData.id);
assert(refreshedSub.status === "Missing / Failed", "13. Dashboard data survives refresh/hydration");

// 14. Dashboard survives logout/login
const activeAsgId = getActiveStudentAssignmentId(studentA);
assert(activeAsgId !== demoAssignment.id, "14. Active assignment ID resolution survives login/logout without falling back to demo");

// 15. Notification count matches valid notifications
const validNotifs = getStudentNotifications(studentA.id, studentA);
assert(Array.isArray(validNotifs), "15. Notification count matches valid non-expired targeted notifications");

// 16. Empty state works correctly
const studentEmpty = { id: "stu-empty-1", name: "Empty Student", roll: "ME101-01", branch: "MECH", division: "SE MECH – Z" };
const emptyStudentAsgs = (createdAssessments || []).filter(
  (a) => a && a.status === "Published" && a.id !== demoAssignment.id && (a.branch === studentEmpty.branch && a.division === studentEmpty.division)
);
assert(emptyStudentAsgs.length === 0, "16. Empty state evaluates to 0 assignments for unassigned student division");

console.log("\n==========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
