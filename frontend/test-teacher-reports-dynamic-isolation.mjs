import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getTeacherAssignments,
  getAssignmentById,
  publishAssignmentAndNotifyStudents,
  workflowSubmissions,
  persistCreatedAssessments,
  persistWorkflowEvaluations,
  hydrateAllWorkflowData,
  getClassAnalytics,
  getRubricAnalytics,
  getStudentReport,
} from "./src/data/workflowData.js";
import { buildGradeSheet, buildGradeSheetCsv, getGradeSheetExcelFilename, getGradeSheetPdfFilename } from "./src/data/gradeSheetData.js";
import { loginTeacher, logoutTeacher, getCurrentTeacher } from "./src/auth/teacherAuth.js";
import { inSemExam, inSemSubmissions } from "./src/data/inSemData.js";
import { endSemExam, endSemSubmissions } from "./src/data/endSemData.js";

console.log("=== PHASE 7C - PART 8: COMPLETE TEACHER REPORTS & GRADE SHEETS DYNAMIC DATA ISOLATION TESTS ===\n");

// Mock window/localStorage if running in pure node environment
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

// 1. Teacher A Login & Assignment Creation
console.log("Test 1: Teacher A creates Deep Learning Assignment (30 marks) and Data Structures Assignment (40 marks)...");
loginTeacher("teacherA@college.edu", "teacher123");
const teacherA = getCurrentTeacher();
assert(teacherA !== null, "Teacher A logged in.");
const teacherAId = teacherA.id || teacherA.teacherId || "teacher-123";

const asgDLId = `asg-dl-30-${Date.now()}`;
const asgDSId = `asg-ds-40-${Date.now()}`;

publishAssignmentAndNotifyStudents({
  id: asgDLId,
  title: "Deep Learning Assignment 01",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  description: "Deep learning backprop assignment.",
  dueDate: "2026-09-30",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  status: "Published",
  questions: [
    { id: 1, text: "Explain Backpropagation.", marks: 10 },
    { id: 2, text: "Derive Convolutional Layer output size.", marks: 10 },
    { id: 3, text: "Compare Adam and SGD optimizers.", marks: 10 },
  ],
});

publishAssignmentAndNotifyStudents({
  id: asgDSId,
  title: "Data Structures Assignment 01",
  subjectName: "Data Structures",
  courseCode: "ET202",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 40,
  description: "Advanced binary tree assignment.",
  dueDate: "2026-10-15",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  status: "Published",
  questions: [
    { id: 1, text: "AVL Tree rotations.", marks: 20 },
    { id: 2, text: "Dijkstra algorithm complexity.", marks: 20 },
  ],
});

// Verify Teacher A selector list
const teacherAAssgs = getTeacherAssignments(teacherAId);
assert(teacherAAssgs.some((a) => a.id === asgDLId), "Deep Learning assignment appears in Teacher A's assignments.");
assert(teacherAAssgs.some((a) => a.id === asgDSId), "Data Structures assignment appears in Teacher A's assignments.");

// 2. Demo DSP Isolation for Active Teacher
console.log("Test 2: Verifying demo DSP assignment is isolated from active teacher selectors...");
const containsDemoDSP = teacherAAssgs.some((a) => a.id === demoAssignment.id);
assert.strictEqual(containsDemoDSP, false, "DSP Demo assignment is omitted from active teacher report selectors.");

// 3. Add Evaluated Submissions to Deep Learning (30 Marks) & Data Structures (40 Marks)
console.log("Test 3: Adding evaluated submissions for DL (30 marks) and DS (40 marks)...");
const subDL1 = {
  id: `sub-dl-1-${Date.now()}`,
  studentId: "stu-rahul",
  studentName: "Rahul Patil",
  rollNumber: "ET202-041",
  assignmentId: asgDLId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 27,
    obtainedMarks: 27,
    totalMarks: 30,
    grade: "Grade A",
    evaluationDifficulty: "moderate",
    rubric: [
      { id: 1, score: 9, max: 10, reason: "Good backprop" },
      { id: 2, score: 9, max: 10, reason: "Correct conv size" },
      { id: 3, score: 9, max: 10, reason: "Clear Adam vs SGD comparison" },
    ],
  },
};

const subDS1 = {
  id: `sub-ds-1-${Date.now()}`,
  studentId: "stu-sneha",
  studentName: "Sneha Kulkarni",
  rollNumber: "ET202-089",
  assignmentId: asgDSId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 36,
    obtainedMarks: 36,
    totalMarks: 40,
    grade: "Grade A",
    evaluationDifficulty: "moderate",
    rubric: [
      { id: 1, score: 18, max: 20, reason: "Clear AVL rotations" },
      { id: 2, score: 18, max: 20, reason: "Accurate complexity analysis" },
    ],
  },
};

workflowSubmissions.push(subDL1, subDS1);
persistWorkflowEvaluations();

// 4. Test Assignment Grade Sheet dynamically built by primary key selectedId
console.log("Test 4: Verifying buildGradeSheet for Deep Learning Assignment...");
const dlGradeSheet = buildGradeSheet("assignment", asgDLId);
assert(dlGradeSheet !== null, "Grade sheet created.");
assert.strictEqual(dlGradeSheet.exam.id, asgDLId, "Grade sheet bound to Deep Learning primary key.");
assert.strictEqual(dlGradeSheet.exam.totalMarks, 30, "Dynamic total marks is 30 for Deep Learning.");

const rahulDLRow = dlGradeSheet.rows.find((r) => r.rollNumber === "ET202-041");
assert(rahulDLRow !== undefined, "Rahul Patil found in DL grade sheet.");
assert.strictEqual(rahulDLRow.obtainedMarks, 27, "Rahul obtained 27 marks.");
assert.strictEqual(rahulDLRow.totalMarks, 30, "Rahul total marks is 30.");

// 5. Test Data Structures Grade Sheet (40 Marks)
console.log("Test 5: Verifying buildGradeSheet for Data Structures Assignment (40 Marks)...");
const dsGradeSheet = buildGradeSheet("assignment", asgDSId);
assert.strictEqual(dsGradeSheet.exam.id, asgDSId, "Grade sheet bound to Data Structures primary key.");
assert.strictEqual(dsGradeSheet.exam.totalMarks, 40, "Dynamic total marks is 40 for Data Structures.");

const snehaDSRow = dsGradeSheet.rows.find((r) => r.rollNumber === "ET202-089");
assert(snehaDSRow !== undefined, "Sneha Kulkarni found in DS grade sheet.");
assert.strictEqual(snehaDSRow.obtainedMarks, 36, "Sneha obtained 36 marks.");
assert.strictEqual(snehaDSRow.totalMarks, 40, "Sneha total marks is 40.");

// 6 & 7. Rubric Analysis per Assignment
console.log("Test 6 & 7: Verifying Rubric Analysis criterion isolation...");
const dlRubric = getRubricAnalytics(asgDLId);
assert.strictEqual(dlRubric.length, 3, "Deep Learning has 3 rubric criteria.");
assert.strictEqual(dlRubric[0].name, "Explain Backpropagation.");

const dsRubric = getRubricAnalytics(asgDSId);
assert.strictEqual(dsRubric.length, 2, "Data Structures has 2 rubric criteria.");
assert.strictEqual(dsRubric[0].name, "AVL Tree rotations.");

// 8 & 9. Teacher B Ownership Isolation & Access Control
console.log("Test 8 & 9 & 19: Verifying Teacher B ownership isolation & unauthorized access rejection...");
loginTeacher("teacherB@college.edu", "teacher123");
const teacherB = getCurrentTeacher();
teacherB.id = "teacher-B-456";
teacherB.teacherId = "teacher-B-456";

const teacherBAssgs = getTeacherAssignments(teacherB.id);
assert.strictEqual(teacherBAssgs.length, 0, "Teacher B has zero created assignments.");

// Teacher B attempts to generate grade sheet for Teacher A's DL assignment
const unauthorizedSheet = buildGradeSheet("assignment", asgDLId);
assert.strictEqual(unauthorizedSheet.exam, null, "Teacher B is denied access to Teacher A's assignment grade sheet.");
assert.strictEqual(unauthorizedSheet.rows.length, 0, "Zero rows returned for unauthorized assignment grade sheet.");

// 10 & 11. Refresh & Re-login Persistence
console.log("Test 10 & 11: Verifying refresh & logout/login persistence...");
loginTeacher("teacherA@college.edu", "teacher123");
persistCreatedAssessments();
persistWorkflowEvaluations();

createdAssessments.length = 0;
hydrateAllWorkflowData();

const rehydratedAssgs = getTeacherAssignments(teacherAId);
assert(rehydratedAssgs.some((a) => a.id === asgDLId), "DL assignment persisted.");
assert(rehydratedAssgs.some((a) => a.id === asgDSId), "DS assignment persisted.");

// 12 - 15. In-Sem & End-Sem Assessment Type Isolation
console.log("Test 12 - 15: Verifying In-Sem and End-Sem assessment type isolation...");
const inSemSheet = buildGradeSheet("in-sem");
assert.strictEqual(inSemSheet.type, "in-sem", "In-Sem grade sheet type isolated.");
assert.strictEqual(inSemSheet.exam.totalMarks, 30, "In-Sem total marks is 30.");

const endSemSheet = buildGradeSheet("end-sem");
assert.strictEqual(endSemSheet.type, "end-sem", "End-Sem grade sheet type isolated.");
assert.strictEqual(endSemSheet.exam.totalMarks, 60, "End-Sem total marks is 60.");

// 16. Dynamic Filenames
console.log("Test 16: Dynamic Excel and PDF filename generation...");
const excelName = getGradeSheetExcelFilename("assignment", dlGradeSheet.exam);
assert(excelName.includes("Deep_Learning"), `Excel filename includes assignment title (${excelName}).`);

const pdfName = getGradeSheetPdfFilename("assignment", dsGradeSheet.exam);
assert(pdfName.includes("Data_Structures"), `PDF filename includes assignment title (${pdfName}).`);

// 20. Empty state handling
console.log("Test 20: Empty states return clean results without demo fallback...");
const nonExistentSheet = buildGradeSheet("assignment", "non-existent-id");
assert.strictEqual(nonExistentSheet.exam, null, "Invalid assignmentId returns null exam without DSP fallback.");

console.log("\nALL PHASE 7C PART 8 TESTS PASSED SUCCESSFULLY! ✅\n");
