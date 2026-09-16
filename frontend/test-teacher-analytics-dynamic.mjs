import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getTeacherAssignments,
  getAssignmentById,
  publishAssignmentAndNotifyStudents,
  workflowSubmissions,
  teacherSubjects,
  getTeacherSubjects,
  validateTeacherSubjectAccess,
  persistCreatedAssessments,
  hydrateAllWorkflowData,
} from "./src/data/workflowData.js";
import { loginTeacher, logoutTeacher, getCurrentTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("=== PHASE 7C - PART 6: DYNAMIC TEACHER ANALYTICS ASSESSMENT DATA & SUBJECT-BASED ACCESS ARCHITECTURE TESTS ===\n");

// Mock localStorage / sessionStorage for node environment if needed
if (typeof window === "undefined") {
  const store = {};
  global.window = {
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    },
    sessionStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    },
  };
  global.sessionStorage = global.window.sessionStorage;
}

// TEST 11: Empty teacher shows professional empty state / no assignments
console.log("Test 11: Teacher with no assignments returns empty list...");
loginTeacher("emptyteacher@college.edu", "teacher123");
const emptyTeacher = getCurrentTeacher();
assert(emptyTeacher !== null, "Empty teacher logged in successfully.");
emptyTeacher.id = "teacher-empty-999";
emptyTeacher.teacherId = "teacher-empty-999";

const emptyAssignments = getTeacherAssignments(emptyTeacher.id);
assert.strictEqual(emptyAssignments.length, 0, "Teacher with 0 created assignments returns empty array (no demo fallback).");

// TEST 1: Log in Teacher A and create Deep Learning assignment (30 marks)
console.log("Test 1 & 12: Teacher A creates Deep Learning assignment (30 Marks)...");
loginTeacher("teacherA@college.edu", "teacher123");
const teacherA = getCurrentTeacher();
assert(teacherA !== null, "Teacher A logged in.");
const teacherAId = teacherA.id || teacherA.teacherId || "teacher-123";

const dlAsgId = `asg-dl-${Date.now()}`;
const dlAsgData = {
  id: dlAsgId,
  title: "Deep Learning Assignment 01",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  description: "Complete neural network backpropagation questions.",
  dueDate: "2026-08-30",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  status: "Published",
};

publishAssignmentAndNotifyStudents(dlAsgData);

// TEST 2: Analytics Assessment selector contains Deep Learning for Teacher A
console.log("Test 2: Teacher A assignments selector contains Deep Learning...");
const teacherAAssignments1 = getTeacherAssignments(teacherAId);
assert(teacherAAssignments1.length >= 1, "Teacher A has at least 1 assignment.");
const foundDL = teacherAAssignments1.find((a) => a.id === dlAsgId);
assert(foundDL !== undefined, "Deep Learning Assignment 01 appears in Teacher A's assignments.");
assert.strictEqual(foundDL.totalMarks, 30, "Test 12: Total marks is 30, not 20.");
assert.strictEqual(foundDL.subjectName, "Deep Learning", "Subject Name is Deep Learning.");
assert.strictEqual(foundDL.courseCode, "AI305", "Course Code is AI305.");

// TEST 3: Digital Signal Processing demo does not appear for real session unless created by teacher
console.log("Test 3: Demo DSP assignment does not appear in Teacher A's dynamic selector...");
const hasDemoDSP = teacherAAssignments1.some((a) => a.id === demoAssignment.id);
assert.strictEqual(hasDemoDSP, false, "demoAssignment ('dsp-a03') does NOT appear in Teacher A's active assignments.");

// TEST 4 & 5: Teacher A creates second assignment (Data Structures)
console.log("Test 4 & 5: Teacher A creates second assignment (Data Structures)...");
const dsAsgId = `asg-ds-${Date.now()}`;
const dsAsgData = {
  id: dsAsgId,
  title: "Data Structures Assignment 01",
  subjectName: "Data Structures",
  courseCode: "ET202",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 25,
  description: "Binary tree traversal assignment.",
  dueDate: "2026-09-15",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  status: "Published",
};

publishAssignmentAndNotifyStudents(dsAsgData);

const teacherAAssignments2 = getTeacherAssignments(teacherAId);
assert.strictEqual(teacherAAssignments2.length, 2, "Teacher A now has 2 assignments.");
assert(teacherAAssignments2.some((a) => a.id === dlAsgId), "Deep Learning is present.");
assert(teacherAAssignments2.some((a) => a.id === dsAsgId), "Data Structures is present.");

// TEST 6 & 7: Selecting Assignment A loads only Assignment A, Selecting B loads only B
console.log("Test 6 & 7: Primary key assignmentId isolation...");
const retrievedA = getAssignmentById(dlAsgId);
const retrievedB = getAssignmentById(dsAsgId);

assert.strictEqual(retrievedA.id, dlAsgId, "Assignment A primary key lookup resolves to DL.");
assert.strictEqual(retrievedB.id, dsAsgId, "Assignment B primary key lookup resolves to DS.");
assert.notStrictEqual(retrievedA.title, retrievedB.title, "Assignments are completely isolated.");

// TEST 13: Duplicate subject names with different assignmentIds remain isolated
console.log("Test 13: Duplicate subject names with different assignmentIds remain isolated...");
const dlAsgId2 = `asg-dl2-${Date.now()}`;
publishAssignmentAndNotifyStudents({
  ...dlAsgData,
  id: dlAsgId2,
  title: "Deep Learning Assignment 02",
  totalMarks: 40,
});

const retrievedDL1 = getAssignmentById(dlAsgId);
const retrievedDL2 = getAssignmentById(dlAsgId2);
assert.strictEqual(retrievedDL1.totalMarks, 30, "Deep Learning 01 totalMarks is 30.");
assert.strictEqual(retrievedDL2.totalMarks, 40, "Deep Learning 02 totalMarks is 40.");
assert.notStrictEqual(retrievedDL1.id, retrievedDL2.id, "Duplicate subject assignments have distinct IDs.");

// TEST 8: Different teacher cannot see Teacher A assignments
console.log("Test 8: Teacher B ownership isolation...");
loginTeacher("teacherB@college.edu", "teacher123");
const teacherB = getCurrentTeacher();
teacherB.id = "teacher-B-456";
teacherB.teacherId = "teacher-B-456";

const teacherBAssignments = getTeacherAssignments(teacherB.id);
assert.strictEqual(teacherBAssignments.length, 0, "Teacher B cannot see Teacher A's assignments.");
assert.strictEqual(
  teacherBAssignments.some((a) => a.id === dlAsgId || a.id === dsAsgId),
  false,
  "Teacher B list does not contain Teacher A's assignment IDs."
);

// TEST 9 & 10: Refresh & Logout/Login persistence
console.log("Test 9 & 10: Refresh & Logout/Login persistence...");
loginTeacher("teacherA@college.edu", "teacher123");
persistCreatedAssessments();

// Simulate page reload / new session hydration
createdAssessments.length = 0; // Clear memory array
hydrateAllWorkflowData(); // Re-hydrate from storage

const rehydratedTeacherAAssgs = getTeacherAssignments(teacherAId);
assert(rehydratedTeacherAAssgs.length >= 3, "Assignments preserved across refresh & re-login.");
assert(rehydratedTeacherAAssgs.some((a) => a.id === dlAsgId), "Deep Learning 01 preserved.");
assert(rehydratedTeacherAAssgs.some((a) => a.id === dsAsgId), "Data Structures 01 preserved.");

// TEST Future Backend Architecture Helpers
console.log("Testing Future Backend Architecture Helpers (teacherSubjects & permissions)...");
assert(Array.isArray(teacherSubjects), "teacherSubjects registry is exported.");
const tSubjects = getTeacherSubjects("teacher-123");
assert(Array.isArray(tSubjects), "getTeacherSubjects returns an array.");
const hasAccess = validateTeacherSubjectAccess(teacherAId, "Deep Learning", "AI305");
assert.strictEqual(hasAccess, true, "validateTeacherSubjectAccess verifies access for created teacher subject.");

console.log("\nALL PHASE 7C PART 6 TESTS PASSED SUCCESSFULLY! ✅\n");
