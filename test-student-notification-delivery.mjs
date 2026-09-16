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
  markNotificationRead,
} from "./frontend/src/data/workflowData.js";

import {
  students,
  getStudentSubmission,
  loginStudent,
  getCurrentStudent,
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

console.log("=== RUNNING TEST SUITE: Real-Time Teacher Publish -> Student Notification Delivery ===\n");

// Login teacher
loginTeacher("teacher@college.edu", "teacher123");

// Student identities
const studentA = students.find((s) => s.branch === "ENTC" && s.division === "TE ENTC – A") || students[0];
const studentDivB = { id: "stu-divb-101", name: "Div B Student", roll: "ET203-01", branch: "ENTC", division: "TE ENTC – B" };
const studentBranchCS = { id: "stu-cs-101", name: "CS Student", roll: "CS101-01", branch: "CS", division: "SE CS – A" };

// 1. Teacher can publish assignment
const newAsgData = {
  id: "asg-new-delivery-01",
  title: "Binary Trees & Heap Operations",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 30,
  dueDate: "2030-12-31",
  dueTime: "23:59",
  status: "Published",
};

const pubRes = publishAssignmentAndNotifyStudents(newAsgData, [studentA]);
assert(pubRes.success === true, "1. Teacher can publish assignment successfully");

// 2. Published assignment is persisted
const persistedAsg = getAssignmentById(newAsgData.id);
assert(persistedAsg !== null && persistedAsg.id === newAsgData.id, "2. Published assignment is persisted in storage");

// 3. Eligible student is correctly detected
assert(pubRes.notifications.some((n) => n.studentId === studentA.id), "3. Eligible student is correctly detected based on branch & division");

// 4. Notification is created
assert(pubRes.notifications.length > 0, "4. Notification is created upon publishing");

// 5 & 6. Notification contains exact assignmentId and studentId
const createdNotif = pubRes.notifications[0];
assert(createdNotif.assignmentId === newAsgData.id, "5. Notification contains exact newly created assignmentId");
assert(createdNotif.studentId === studentA.id, "6. Notification contains exact studentId");

// 7. Notification is unread initially
assert(createdNotif.read === false, "7. Notification is unread initially");

// 8. Wrong division does not receive notification
const notifDivB = getStudentNotifications(studentDivB.id, studentDivB);
assert(!notifDivB.some((n) => n.assignmentId === newAsgData.id), "8. Wrong division does not receive notification");

// 9. Wrong branch does not receive notification
const notifBranchCS = getStudentNotifications(studentBranchCS.id, studentBranchCS);
assert(!notifBranchCS.some((n) => n.assignmentId === newAsgData.id), "9. Wrong branch does not receive notification");

// 10. Duplicate notification is prevented
const dupRes = publishAssignmentAndNotifyStudents(newAsgData, [studentA]);
assert(dupRes.notifications.length === 0, "10. Duplicate notification creation is prevented");

// 11. Notification survives refresh/hydration
hydrateAllWorkflowData();
const refreshedNotifs = getStudentNotifications(studentA.id, studentA);
assert(refreshedNotifs.some((n) => n.assignmentId === newAsgData.id), "11. Notification survives refresh/hydration");

// 12. Notification survives logout/login
loginStudent(studentA.roll, "student123");
const currentLoggedStudent = getCurrentStudent();
const loggedNotifs = getStudentNotifications(currentLoggedStudent.id, currentLoggedStudent);
assert(loggedNotifs.some((n) => n.assignmentId === newAsgData.id), "12. Notification survives student logout/login");

// 13. Multiple assignments do not overwrite each other
const secondAsgData = {
  id: "asg-new-delivery-02",
  title: "Neural Networks Assignment 02",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 40,
  dueDate: "2030-12-31",
  status: "Published",
};
publishAssignmentAndNotifyStudents(secondAsgData, [studentA]);
const multiNotifs = getStudentNotifications(studentA.id, studentA);
assert(multiNotifs.some((n) => n.assignmentId === newAsgData.id) && multiNotifs.some((n) => n.assignmentId === secondAsgData.id), "13. Multiple assignments do not overwrite each other");

// 14. Demo notifications do not replace real notification
studentNotifications.push({
  id: "notif-demo-xyz",
  studentId: studentA.id,
  assignmentId: demoAssignment.id,
  assignmentTitle: demoAssignment.title,
  read: false,
});
const activeNotifs = getStudentNotifications(studentA.id, studentA);
assert(!activeNotifs.some((n) => n.assignmentId === demoAssignment.id), "14. Demo notifications do not replace or show alongside real notifications");

// 15. New notification appears on Student Dashboard list
assert(activeNotifs.some((n) => n.assignmentTitle === newAsgData.title), "15. New notification appears with real assignment title");

// 16. Unread badge count is correct
const unreadCount = activeNotifs.filter((n) => !n.read).length;
assert(unreadCount >= 2, "16. Unread badge count accurately reflects valid unread notifications");

// 17. Clicking notification opens exact assignment (markNotificationRead + reference check)
markNotificationRead(createdNotif.id);
assert(createdNotif.read === true && createdNotif.assignmentId === newAsgData.id, "17. Clicking notification updates read status and references exact assignmentId");

// 18. Notification expires after dueDate + dueTime
const expiredAsgData = {
  id: "asg-new-delivery-expired",
  title: "Expired Deep Learning Quiz",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 20,
  dueDate: "2020-01-01",
  dueTime: "23:59",
  status: "Published",
};
publishAssignmentAndNotifyStudents(expiredAsgData, [studentA]);
const activeAfterExpired = getStudentNotifications(studentA.id, studentA);
assert(!activeAfterExpired.some((n) => n.assignmentId === expiredAsgData.id), "18. Notification automatically expires after dueDate + dueTime");

// 19. Expired notification does not return after refresh
hydrateAllWorkflowData();
const refreshedAfterExpired = getStudentNotifications(studentA.id, studentA);
assert(!refreshedAfterExpired.some((n) => n.assignmentId === expiredAsgData.id), "19. Expired notification does not return after refresh");

// 20. Assignment itself remains available after notification expiration
const expiredAsgInStore = getAssignmentById(expiredAsgData.id);
assert(expiredAsgInStore !== null && expiredAsgInStore.id === expiredAsgData.id, "20. Assignment itself remains stored and available after notification expiration");

console.log("\n==========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
