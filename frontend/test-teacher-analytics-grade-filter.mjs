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
  persistWorkflowEvaluations,
  hydrateAllWorkflowData,
} from "./src/data/workflowData.js";
import { loginTeacher, logoutTeacher, getCurrentTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("=== PHASE 7C - PART 7: DYNAMIC GRADE FILTER & ASSIGNMENT-SCOPED ANALYTICS TESTS ===\n");

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

// 1 & 2: Log in Teacher A and create Assignment A & Assignment B
console.log("Test 1 & 2: Teacher A creates Assignment A (30 marks) & Assignment B (25 marks)...");
loginTeacher("teacherA@college.edu", "teacher123");
const teacherA = getCurrentTeacher();
assert(teacherA !== null, "Teacher A logged in.");
const teacherAId = teacherA.id || teacherA.teacherId || "teacher-123";

const asgAId = `asg-test-A-${Date.now()}`;
const asgBId = `asg-test-B-${Date.now()}`;

publishAssignmentAndNotifyStudents({
  id: asgAId,
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
});

publishAssignmentAndNotifyStudents({
  id: asgBId,
  title: "Data Structures Assignment 01",
  subjectName: "Data Structures",
  courseCode: "ET202",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 25,
  description: "Data structures tree assignment.",
  dueDate: "2026-10-15",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  status: "Published",
});

// 3: Add distinct evaluation results for Assignment A and Assignment B
console.log("Test 3: Adding evaluated submissions to Assignment A and Assignment B...");

// Assignment A submissions (DL 01)
const subA1 = {
  id: `sub-A1-${Date.now()}`,
  studentId: "stu-rahul",
  studentName: "Rahul Patil",
  rollNumber: "ET202-041",
  assignmentId: asgAId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 27,
    obtainedMarks: 27,
    totalMarks: 30,
    grade: "Grade A",
    evaluationDifficulty: "moderate",
  },
  evaluationResults: {
    easy: { score: 29, obtainedMarks: 29, totalMarks: 30, grade: "Grade A+", evaluationDifficulty: "easy" },
    moderate: { score: 27, obtainedMarks: 27, totalMarks: 30, grade: "Grade A", evaluationDifficulty: "moderate" },
    hard: { score: 24, obtainedMarks: 24, totalMarks: 30, grade: "Grade B", evaluationDifficulty: "hard" },
  },
};

const subA2 = {
  id: `sub-A2-${Date.now()}`,
  studentId: "stu-sneha",
  studentName: "Sneha Kulkarni",
  rollNumber: "ET202-089",
  assignmentId: asgAId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 22,
    obtainedMarks: 22,
    totalMarks: 30,
    grade: "Grade B",
    evaluationDifficulty: "moderate",
  },
  evaluationResults: {
    easy: { score: 24, obtainedMarks: 24, totalMarks: 30, grade: "Grade B", evaluationDifficulty: "easy" },
    moderate: { score: 22, obtainedMarks: 22, totalMarks: 30, grade: "Grade B", evaluationDifficulty: "moderate" },
    hard: { score: 18, obtainedMarks: 18, totalMarks: 30, grade: "Grade C", evaluationDifficulty: "hard" },
  },
};

const subA3 = {
  id: `sub-A3-${Date.now()}`,
  studentId: "stu-aarav",
  studentName: "Aarav Sharma",
  rollNumber: "ET202-012",
  assignmentId: asgAId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 28,
    obtainedMarks: 28,
    totalMarks: 30,
    grade: "Grade A",
    evaluationDifficulty: "moderate",
  },
  evaluationResults: {
    easy: { score: 30, obtainedMarks: 30, totalMarks: 30, grade: "Grade A+", evaluationDifficulty: "easy" },
    moderate: { score: 28, obtainedMarks: 28, totalMarks: 30, grade: "Grade A", evaluationDifficulty: "moderate" },
    hard: { score: 25, obtainedMarks: 25, totalMarks: 30, grade: "Grade A", evaluationDifficulty: "hard" },
  },
};

// Assignment B submissions (DS 01)
const subB1 = {
  id: `sub-B1-${Date.now()}`,
  studentId: "stu-priya",
  studentName: "Priya Deshmukh",
  rollNumber: "ET202-056",
  assignmentId: asgBId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 16,
    obtainedMarks: 16,
    totalMarks: 25,
    grade: "Grade C",
    evaluationDifficulty: "moderate",
  },
  evaluationResults: {
    easy: { score: 18, obtainedMarks: 18, totalMarks: 25, grade: "Grade B", evaluationDifficulty: "easy" },
    moderate: { score: 16, obtainedMarks: 16, totalMarks: 25, grade: "Grade C", evaluationDifficulty: "moderate" },
    hard: { score: 13, obtainedMarks: 13, totalMarks: 25, grade: "Grade D", evaluationDifficulty: "hard" },
  },
};

const subB2 = {
  id: `sub-B2-${Date.now()}`,
  studentId: "stu-rohan",
  studentName: "Rohan Jadhav",
  rollNumber: "ET202-102",
  assignmentId: asgBId,
  status: "Evaluated",
  evaluationStatus: "Approved",
  evaluation: {
    score: 12,
    obtainedMarks: 12,
    totalMarks: 25,
    grade: "Grade D",
    evaluationDifficulty: "moderate",
  },
  evaluationResults: {
    easy: { score: 14, obtainedMarks: 14, totalMarks: 25, grade: "Grade D", evaluationDifficulty: "easy" },
    moderate: { score: 12, obtainedMarks: 12, totalMarks: 25, grade: "Grade D", evaluationDifficulty: "moderate" },
    hard: { score: 9, obtainedMarks: 9, totalMarks: 25, grade: "Grade F", evaluationDifficulty: "hard" },
  },
};

workflowSubmissions.push(subA1, subA2, subA3, subB1, subB2);
persistWorkflowEvaluations();

// Helper to filter submissions for an assignment & difficulty & grade
const getAssignmentEvaluatedSubs = (assignmentId, difficulty = "moderate", gradeFilter = "All Grades") => {
  const asg = getAssignmentById(assignmentId);
  const subs = workflowSubmissions.filter((s) => s.assignmentId === assignmentId);
  return subs
    .map((sub) => {
      const activeEval = sub.evaluationResults?.[difficulty] || sub.evaluation;
      const obtained = activeEval?.obtainedMarks ?? activeEval?.score;
      const total = asg.totalMarks;
      const percentage = (obtained / total) * 100;
      const grade = activeEval?.grade;
      return { sub, activeEval, obtained, total, percentage, grade };
    })
    .filter((item) => gradeFilter === "All Grades" || item.grade === gradeFilter);
};

// 4 & 5: Test Available Grades Extraction
console.log("Test 4 & 5 & 8: Verifying assignment-scoped dynamic grade options...");
const evalA = getAssignmentEvaluatedSubs(asgAId, "moderate");
const gradesA = new Set(evalA.map((i) => i.grade));
assert(gradesA.has("Grade A"), "Assignment A contains Grade A.");
assert(gradesA.has("Grade B"), "Assignment A contains Grade B.");
assert.strictEqual(gradesA.has("Grade C"), false, "Test 8: Assignment A does NOT contain Grade C (absent grades omitted).");
assert.strictEqual(gradesA.has("Grade D"), false, "Assignment A does NOT contain Grade D.");

const evalB = getAssignmentEvaluatedSubs(asgBId, "moderate");
const gradesB = new Set(evalB.map((i) => i.grade));
assert(gradesB.has("Grade C"), "Assignment B contains Grade C.");
assert(gradesB.has("Grade D"), "Assignment B contains Grade D.");
assert.strictEqual(gradesB.has("Grade A"), false, "Test 6: Assignment B does NOT contain Grade A (no hardcoded fallback).");
assert.strictEqual(gradesB.has("Grade B"), false, "Test 6: Assignment B does NOT contain Grade B.");

// 6 & 7: Test Zero Cross-Assignment Contamination
console.log("Test 6 & 7 & 10 & 11 & 12 & 13 & 14: Filtering by grade on Assignment A and B...");
const aGradeA = getAssignmentEvaluatedSubs(asgAId, "moderate", "Grade A");
assert.strictEqual(aGradeA.length, 2, "Test 9 & 11: Assignment A Grade A filter returns exactly 2 students (Rahul & Aarav).");
assert(aGradeA.every((i) => i.sub.studentName === "Rahul Patil" || i.sub.studentName === "Aarav Sharma"));

const aGradeB = getAssignmentEvaluatedSubs(asgAId, "moderate", "Grade B");
assert.strictEqual(aGradeB.length, 1, "Test 10 & 12: Assignment A Grade B filter returns exactly 1 student (Sneha).");
assert.strictEqual(aGradeB[0].sub.studentName, "Sneha Kulkarni");

const bGradeC = getAssignmentEvaluatedSubs(asgBId, "moderate", "Grade C");
assert.strictEqual(bGradeC.length, 1, "Test 13: Assignment B Grade C filter returns exactly 1 student (Priya).");
assert.strictEqual(bGradeC[0].sub.studentName, "Priya Deshmukh");

const bGradeD = getAssignmentEvaluatedSubs(asgBId, "moderate", "Grade D");
assert.strictEqual(bGradeD.length, 1, "Test 14: Assignment B Grade D filter returns exactly 1 student (Rohan).");

// 15: Test Total Marks Scaling (/ 30 vs / 25)
console.log("Test 15: Total marks scaling (/ 30 vs / 25)...");
assert.strictEqual(aGradeA[0].total, 30, "Assignment A scores out of 30.");
assert.strictEqual(bGradeC[0].total, 25, "Assignment B scores out of 25.");

// 16: Test Difficulty Awareness (Hard difficulty yields Grade F for Rohan)
console.log("Test 16: Difficulty-specific evaluation resolution...");
const bHardGradeF = getAssignmentEvaluatedSubs(asgBId, "hard", "Grade F");
assert.strictEqual(bHardGradeF.length, 1, "Hard difficulty evaluation yields Grade F for Rohan Jadhav.");
assert.strictEqual(bHardGradeF[0].sub.studentName, "Rohan Jadhav");

// 17: Test Teacher Ownership Isolation
console.log("Test 17: Teacher ownership isolation...");
loginTeacher("teacherB@college.edu", "teacher123");
const teacherB = getCurrentTeacher();
teacherB.id = "teacher-B-789";
teacherB.teacherId = "teacher-B-789";

const teacherBAssignments = getTeacherAssignments(teacherB.id);
assert.strictEqual(teacherBAssignments.length, 0, "Teacher B has 0 assignments and cannot see Teacher A's data.");

// 18: Refresh & Re-login Persistence
console.log("Test 18: Refresh & re-login persistence...");
loginTeacher("teacherA@college.edu", "teacher123");
persistCreatedAssessments();
persistWorkflowEvaluations();

createdAssessments.length = 0; // Clear memory array
hydrateAllWorkflowData(); // Re-hydrate

const rehydratedAAssgs = getTeacherAssignments(teacherAId);
assert(rehydratedAAssgs.some((a) => a.id === asgAId), "Assignment A persisted across reload.");
assert(rehydratedAAssgs.some((a) => a.id === asgBId), "Assignment B persisted across reload.");

// 19: Demo Data Isolation
console.log("Test 19: Demo assignment data isolation...");
const hasDemo = rehydratedAAssgs.some((a) => a.id === demoAssignment.id);
assert.strictEqual(hasDemo, false, "demoAssignment is isolated and not listed in Teacher A's assignments.");

console.log("\nALL PHASE 7C PART 7 TESTS PASSED SUCCESSFULLY! ✅\n");
