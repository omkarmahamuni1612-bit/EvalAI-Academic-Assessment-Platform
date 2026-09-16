import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getActiveStudentAssignmentId,
  getStudentAssignment,
  getStudentNotifications,
  isStudentTargeted,
  publishAssignmentAndNotifyStudents,
  registerCreatedAssessment,
  studentNotifications,
} from "./src/data/workflowData.js";
import { loginTeacher, logoutTeacher, getCurrentTeacher } from "./src/auth/teacherAuth.js";
import { getStudentByRoll, students } from "./src/auth/studentAuth.js";

console.log("=== PHASE 7C — PART 2: PUBLISHED ASSIGNMENT DELIVERY & STUDENT NOTIFICATION TESTS ===");

// 1. Teacher Authentication Requirement
logoutTeacher();
assert.throws(() => {
  publishAssignmentAndNotifyStudents({ title: "Unauthorized Assignment" });
}, /Teacher authentication required/, "Publishing without teacher authentication must throw error.");
console.log("PASS  1. Teacher Authentication enforcement verified");

// Login as Teacher
const loginResult = loginTeacher("teacher@college.edu", "teacher123");
assert(loginResult.success === true, "Teacher login must succeed.");
const currentTeacher = getCurrentTeacher();
assert(currentTeacher !== null, "Teacher session exists.");

// 2. Publish Assignment A for TE ENTC – A
const asgAData = {
  id: "asg-dsp-te-01",
  title: "Phase 7C Integration Assignment A",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  academicYear: "2026–27",
  assignmentType: "Written Assignment",
  totalMarks: 20,
  description: "Explain discrete Fourier transform algorithms and properties.",
  dueDate: "2026-09-10",
  dueTime: "23:59",
  assignmentPdf: { name: "DSP_TE_Paper.pdf", size: 45000, type: "application/pdf" },
  referenceAnswerPdf: { name: "DSP_TE_Ref.pdf", size: 55000, type: "application/pdf" },
  questions: [{ id: 1, name: "DFT Concept", marks: 20 }],
};

const publishA = publishAssignmentAndNotifyStudents(asgAData);
const asgA = publishA.assignment;

// Verify Assignment A details & ID Integrity
assert.strictEqual(asgA.id, "asg-dsp-te-01", "Original assignment ID must be preserved.");
assert.strictEqual(asgA.status, "Published", "Status set to Published.");
assert.strictEqual(asgA.createdByTeacherId, "teacher-123", "Teacher ownership recorded.");
assert.strictEqual(asgA.publishedBy, "teacher-123", "PublishedBy recorded.");

console.log("PASS  2. Assignment Publishing & ID Integrity verified");

// 3. Student Targeting & Notification Delivery
const ananya = students.find((s) => s.id === "stu-ananya"); // TE ENTC – A
const rahul = students.find((s) => s.id === "stu-rahul");   // TE ENTC – A
const aditya = students.find((s) => s.id === "stu-aditya"); // TE ENTC – A

assert(ananya !== undefined, "Ananya exists in student directory.");
assert(rahul !== undefined, "Rahul exists in student directory.");
assert(aditya !== undefined, "Aditya exists in student directory.");

assert.strictEqual(isStudentTargeted(ananya, asgA), true, "Ananya (TE ENTC – A) is targeted by Assignment A.");
assert.strictEqual(isStudentTargeted(rahul, asgA), true, "Rahul (TE ENTC – A) is targeted by Assignment A.");
assert.strictEqual(isStudentTargeted(aditya, asgA), true, "Aditya (TE ENTC – A) is targeted by Assignment A.");

// Verify Ananya and Rahul received notification
const ananyaNotifs = getStudentNotifications(ananya.id);
const notifA = ananyaNotifs.find((n) => n.assignmentId === asgA.id);
assert(notifA !== undefined, "Ananya must receive notification for Assignment A.");
assert.strictEqual(notifA.id, `notif-assignment-${asgA.id}-${ananya.id}`, "Notification ID is deterministic.");
assert.strictEqual(notifA.type, "assignment_published", "Notification type is assignment_published.");
assert.strictEqual(notifA.title, "New Assignment Published", "Notification title matches requirements.");
assert.strictEqual(notifA.read, false, "Notification initial state is unread.");

console.log("PASS  3. Student Targeting & Notification Delivery verified");

// 4. Duplicate Notification Prevention
const initialNotifCount = studentNotifications.length;
publishAssignmentAndNotifyStudents(asgAData); // Re-publish same assignment
const newNotifCount = studentNotifications.length;
assert.strictEqual(initialNotifCount, newNotifCount, "Re-publishing assignment MUST NOT create duplicate notifications.");

console.log("PASS  4. Duplicate Notification Prevention verified");

// 5. Student Access & URL Protection
const ananyaView = getStudentAssignment(ananya, asgA.id);
assert(ananyaView !== null, "Ananya can view targeted Assignment A.");
assert.strictEqual(ananyaView.title, "Phase 7C Integration Assignment A");

const rahulView = getStudentAssignment(rahul, asgA.id);
assert(rahulView !== null, "Rahul can view targeted Assignment A.");

console.log("PASS  5. Student Visibility & URL Access Control verified");

// 6. Multiple Assignments & Targeted Division Exclusion
const asgBData = {
  id: "asg-ds-be-02",
  title: "Phase 7C Integration Assignment B",
  subjectName: "Data Structures",
  courseCode: "ET202",
  branch: "ENTC",
  division: "BE ENTC – A",
  academicYear: "2026–27",
  assignmentType: "Written Assignment",
  totalMarks: 20,
  description: "Explain tree traversals.",
  dueDate: "2026-09-12",
  dueTime: "23:59",
  assignmentPdf: { name: "DS_BE_Paper.pdf", size: 40000, type: "application/pdf" },
  referenceAnswerPdf: { name: "DS_BE_Ref.pdf", size: 50000, type: "application/pdf" },
  questions: [{ id: 1, name: "Trees", marks: 20 }],
};

const publishB = publishAssignmentAndNotifyStudents(asgBData);
const asgB = publishB.assignment;

assert.strictEqual(createdAssessments.length >= 2, true, "Both Assignment A and B exist simultaneously.");

// Ananya and Rahul (TE ENTC – A) should NOT get Assignment B (BE ENTC – A)
assert.strictEqual(isStudentTargeted(rahul, asgB), false, "Rahul (TE ENTC – A) is NOT targeted by BE ENTC – A Assignment B.");
assert.strictEqual(isStudentTargeted(ananya, asgB), false, "Ananya (TE ENTC – A) is NOT targeted by BE ENTC – A Assignment B.");

assert.strictEqual(getStudentAssignment(rahul, asgB.id), null, "Rahul access to untargeted Assignment B is DENIED.");
assert.strictEqual(getStudentAssignment(ananya, asgB.id), null, "Ananya access to untargeted Assignment B is DENIED.");

console.log("PASS  6. Multiple Assignment Support & Independent Delivery verified");

// 7. Demo Assignment Isolation & Empty State
// Student with no published assignments for their division returns null (not demoAssignment.id)
const untargetedStudent = { id: "stu-other", branch: "CS", division: "SE CS – A" };
const untargetedActiveId = getActiveStudentAssignmentId(untargetedStudent);
assert.strictEqual(untargetedActiveId, null, "Student with no published assignments returns null (not demoAssignment.id).");

console.log("PASS  7. Demo Assignment Isolation & Empty State verified");

console.log("\nALL PHASE 7C — PART 2 TESTS PASSED ✅\n");
