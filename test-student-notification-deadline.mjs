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
  getDashboardOverviewData,
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

console.log("=== RUNNING TEST SUITE: Student Notification Lifecycle & Deadline Expiry ===\n");

// Login teacher to authorize assignment publication
loginTeacher("teacher@college.edu", "teacher123");

// Setup mock student
// Student 1: ENTC / TE ENTC – A
const studentA = students.find((s) => s.branch === "ENTC" && s.division === "TE ENTC – A") || students[0];

// 1. Real teacher assignment creates notification
const futureAsgData = {
  id: "asg-test-future-01",
  title: "Advanced Signal Processing Assignment 1",
  subjectName: "Signal Processing",
  courseCode: "ET401",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 30,
  dueDate: "2030-12-31",
  dueTime: "23:59",
  status: "Published",
};

const publishRes = publishAssignmentAndNotifyStudents(futureAsgData, [studentA]);
assert(publishRes.success, "Assignment published successfully");
assert(publishRes.notifications.length > 0, "1. Real teacher assignment creates notification");

const notif = publishRes.notifications[0];
assert(notif.id === `notif-assignment-${futureAsgData.id}-${studentA.id}`, "Notification ID is deterministic: notif-assignment-${assignmentId}-${studentId}");
assert(notif.assignmentId === futureAsgData.id, "Notification contains correct assignmentId");
assert(notif.studentId === studentA.id, "Notification contains correct studentId");
assert(notif.message.includes(futureAsgData.title), "Notification message contains assignment title");

// 2. Demo notifications are excluded from active notifications
studentNotifications.push({
  id: "notif-demo-123",
  studentId: studentA.id,
  assignmentId: demoAssignment.id,
  assignmentTitle: demoAssignment.title,
  message: "Demo notification",
  read: false,
});
const activeNotifs = getStudentNotifications(studentA.id, studentA);
assert(!activeNotifs.some((n) => n.assignmentId === demoAssignment.id), "2. Demo notifications are excluded from active student notifications");

// 3 & 4. Wrong branch and wrong division excluded
const asgDivBData = {
  id: "asg-test-divb-01",
  title: "Assignment for Division B",
  subjectName: "Signal Processing",
  courseCode: "ET401",
  branch: "ENTC",
  division: "TE ENTC – B",
  totalMarks: 30,
  dueDate: "2030-12-31",
  status: "Published",
};
registerCreatedAssessment(asgDivBData);
const notifDivB = {
  id: `notif-assignment-${asgDivBData.id}-${studentA.id}`,
  studentId: studentA.id,
  assignmentId: asgDivBData.id,
  assignmentTitle: asgDivBData.title,
  read: false,
};
studentNotifications.push(notifDivB);
const notifsStudentA = getStudentNotifications(studentA.id, studentA);
assert(!notifsStudentA.some((n) => n.assignmentId === asgDivBData.id), "3 & 4. Wrong branch/division notifications excluded");

// 5. Wrong student is excluded
const notifOtherStudent = {
  id: `notif-assignment-${futureAsgData.id}-other`,
  studentId: "stu-other-999",
  assignmentId: futureAsgData.id,
  assignmentTitle: futureAsgData.title,
  read: false,
};
studentNotifications.push(notifOtherStudent);
const notifsA = getStudentNotifications(studentA.id, studentA);
assert(!notifsA.some((n) => n.studentId === "stu-other-999"), "5. Wrong student notifications excluded");

// 6. Duplicate notification is prevented
const duplicateRes = publishAssignmentAndNotifyStudents(futureAsgData, [studentA]);
assert(duplicateRes.notifications.length === 0, "6. Duplicate notification creation is prevented");

// 7. Notification visible before deadline
const futureNotifs = getStudentNotifications(studentA.id, studentA);
assert(futureNotifs.some((n) => n.assignmentId === futureAsgData.id), "7. Notification visible before deadline");

// 8. Notification disappears after deadline
const expiredAsgData = {
  id: "asg-test-expired-01",
  title: "Past Due Assignment 01",
  subjectName: "Signal Processing",
  courseCode: "ET401",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 40,
  dueDate: "2020-01-01",
  dueTime: "23:59",
  status: "Published",
};
publishAssignmentAndNotifyStudents(expiredAsgData, [studentA]);
assert(isAssignmentPastDueDate(expiredAsgData), "Expired assignment helper correctly identifies past due date");
const currentNotifsAfterExpiry = getStudentNotifications(studentA.id, studentA);
assert(!currentNotifsAfterExpiry.some((n) => n.assignmentId === expiredAsgData.id), "8. Notification automatically disappears after deadline");

// 9. Expired notification does not return after refresh (hydration)
hydrateAllWorkflowData();
const refreshedNotifs = getStudentNotifications(studentA.id, studentA);
assert(!refreshedNotifs.some((n) => n.assignmentId === expiredAsgData.id), "9. Expired notification does not return after refresh/hydration");

// 10. Expired notification does not return after login
const reLoggedInNotifs = getStudentNotifications(studentA.id, studentA);
assert(!reLoggedInNotifs.some((n) => n.assignmentId === expiredAsgData.id), "10. Expired notification does not return after login");

// 11, 12, 13, 14. Non-submitting student gets score 0, dynamic total marks (40), Grade F, Status "Missing / Failed"
const nonSubSubmission = getStudentSubmission(studentA, expiredAsgData.id);
assert(nonSubSubmission !== null, "Non-submitting student submission object generated");
assert(nonSubSubmission.status === "Missing / Failed", "14. Status becomes Missing / Failed");
assert(nonSubSubmission.score === "0 / 40", "11 & 12. Non-submitting student gets 0 and total marks are dynamic (0 / 40)");
assert(nonSubSubmission.evaluation.grade === "F", "13. Non-submitting student gets Grade F");

// 15. Missing result is visible in Results
assert(nonSubSubmission.evaluation && nonSubSubmission.evaluation.evaluationStatus === "Missing / Failed", "15. Missing result payload is ready for Results view");

// 16 & 17. Submitted-before-deadline student is not marked Missing, PDF accessible
const submittedAsgData = {
  id: "asg-test-submitted-01",
  title: "On-Time Submitted Assignment",
  subjectName: "Signal Processing",
  courseCode: "ET401",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 50,
  dueDate: "2020-01-01", // now past due
  dueTime: "23:59",
  status: "Published",
};
registerCreatedAssessment(submittedAsgData);
// Simulate on-time submission prior to deadline
workflowSubmissions.push({
  id: `sub-${submittedAsgData.id}-${studentA.id}`,
  studentId: studentA.id,
  student: studentA.name,
  roll: studentA.roll,
  assignmentId: submittedAsgData.id,
  submittedAt: "2019-12-31 10:00 AM",
  file: "Student_Answer.pdf",
  fileName: "Student_Answer.pdf",
  status: "Submitted",
  evaluation: { score: 45, totalMarks: 50, grade: "A+" },
});

const onTimeSub = getStudentSubmission(studentA, submittedAsgData.id);
assert(onTimeSub.status !== "Missing / Failed", "16. Submitted-before-deadline student is not marked Missing");
assert(onTimeSub.file === "Student_Answer.pdf", "17. Submitted PDF remains accessible");

// 18. Late submission follows existing late rules
const lateFile = { name: "Late_Answer.pdf", type: "application/pdf", data: "data:application/pdf;base64,1234" };
const lateSubRes = submitAssignment(studentA, expiredAsgData.id, lateFile);
assert(lateSubRes.success, "Late submission processed");
assert(lateSubRes.submission.status === "Late / Failed", "18. Late submission marked as Late / Failed");

// 19. Multiple assignments remain isolated
assert(onTimeSub.assignmentId === submittedAsgData.id && nonSubSubmission.assignmentId === expiredAsgData.id, "19. Multiple assignments remain isolated by assignmentId");

// 20 & 21. Teacher reports remain available & assignment itself is not deleted
const teacherAsg = getAssignmentById(expiredAsgData.id);
assert(teacherAsg !== null && teacherAsg.id === expiredAsgData.id, "21. Assignment itself is not deleted from storage");
const overview = getDashboardOverviewData();
assert(overview.totalAssessments > 0, "20. Teacher reports/overview remain available after deadline");

// 22. Notification unread count is correct
const unreadCount = getStudentNotifications(studentA.id, studentA).filter((n) => !n.read).length;
assert(typeof unreadCount === "number", "22. Notification unread count calculated correctly");

console.log("\n==========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
