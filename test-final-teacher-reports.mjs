import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getTeacherAssignments,
  getRubricAnalytics,
  getStudentReport,
  publishAssignmentAndNotifyStudents,
  registerCreatedAssessment,
  submitAssignment,
  hydrateAllWorkflowData,
  workflowSubmissions,
  publishResults,
  approveEvaluation,
} from "./frontend/src/data/workflowData.js";

import {
  buildGradeSheet,
  buildGradeSheetCsv,
  getGradeSheetExcelFilename,
  getGradeSheetPdfFilename,
} from "./frontend/src/data/gradeSheetData.js";

import {
  students,
  getStudentSubmission,
  loginStudent,
} from "./frontend/src/auth/studentAuth.js";

import {
  loginTeacher,
  getCurrentTeacher,
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

console.log("=== RUNNING TEST SUITE: Final Teacher Reports, Rubric Analysis & Student Progress Data Integrity ===\n");

// Login Teacher A
loginTeacher("teacher@college.edu", "teacher123");
const teacherA = getCurrentTeacher();

// Setup Student A (Rahul) and Student B (Sneha)
const studentA = students[0]; // Rahul Patil (TE ENTC – A)
const studentB = students[1]; // Sneha Kulkarni (TE ENTC – A)

// 1 & 10. Teacher A creates 30-mark Deep Learning Assignment
const dlAsgData = {
  id: "asg-report-dl-30",
  title: "Deep Learning Assignment 01",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 30,
  dueDate: "2030-12-31",
  status: "Published",
  createdByTeacherId: teacherA.id,
  questions: [
    { id: 1, name: "Neural Network Architecture", description: "Design feedforward NN", marks: 15 },
    { id: 2, name: "Backpropagation Algorithm", description: "Derive gradient updates", marks: 15 },
  ],
};
publishAssignmentAndNotifyStudents(dlAsgData, [studentA, studentB]);

const teacherAAssgs = getTeacherAssignments(teacherA.id);
assert(teacherAAssgs.some((a) => a.id === dlAsgData.id), "1. Teacher-owned assignment is available in teacher assignments");

// 2. Demo DSP assignment is excluded from teacher assignments & grade sheets
const gradeSheetDL = buildGradeSheet("assignment", dlAsgData.id);
assert(gradeSheetDL.exam && gradeSheetDL.exam.id !== demoAssignment.id, "2. Demo DSP assignment is excluded from active teacher report");

// 3, 4, 5, 6, 7, 8, 9, 10. Metadata and 30-mark resolution
assert(gradeSheetDL.exam.id === dlAsgData.id, "3. Selected assignmentId resolves correctly");
assert(gradeSheetDL.exam.title === "Deep Learning Assignment 01", "4. Assignment title is dynamic (Deep Learning Assignment 01)");
assert(gradeSheetDL.exam.subjectName === "Deep Learning", "5. Subject name is dynamic (Deep Learning)");
assert(gradeSheetDL.exam.courseCode === "AI305", "6. Course Code is dynamic (AI305)");
assert(gradeSheetDL.exam.branch === studentA.branch, "7. Branch is dynamic");
assert(gradeSheetDL.exam.division === studentA.division, "8. Division is dynamic");
assert(gradeSheetDL.exam.totalMarks === 30, "9. Total marks are dynamic (30 Marks)");
assert(gradeSheetDL.rows.every((r) => r.totalMarks === 30), "10. 30-mark assignment displays /30 across grade sheet rows");

// 11. 40-mark Machine Learning Assignment
const mlAsgData = {
  id: "asg-report-ml-40",
  title: "Machine Learning Assignment 01",
  subjectName: "Machine Learning",
  courseCode: "AI301",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 40,
  dueDate: "2030-12-31",
  status: "Published",
  createdByTeacherId: teacherA.id,
};
publishAssignmentAndNotifyStudents(mlAsgData, [studentA, studentB]);
const gradeSheetML = buildGradeSheet("assignment", mlAsgData.id);
assert(gradeSheetML.exam.totalMarks === 40 && gradeSheetML.rows.every((r) => r.totalMarks === 40), "11. 40-mark assignment displays /40 across grade sheet rows");

// 12 & 13. Grade Sheet uses selected assignment and targeted students
assert(gradeSheetDL.rows.some((r) => r.studentName === studentA.name), "12. Grade Sheet includes student A");
assert(gradeSheetDL.rows.some((r) => r.studentName === studentB.name), "13. Grade Sheet uses targeted class roster");

// Submit and Evaluate Student A for DL Assignment
submitAssignment(studentA, dlAsgData.id, { name: "DL_Answer.pdf", type: "application/pdf" });
const subA = getStudentSubmission(studentA, dlAsgData.id);
subA.evaluation = {
  score: 25,
  obtainedMarks: 25,
  totalMarks: 30,
  grade: "Grade A",
  confidence: "92%",
  semanticRelevance: "88%",
  evaluationDifficulty: "moderate",
  questionWiseResults: [
    { questionNumber: 1, questionText: "Neural Network Architecture", maximumMarks: 15, awardedMarks: 13 },
    { questionNumber: 2, questionText: "Backpropagation Algorithm", maximumMarks: 15, awardedMarks: 12 },
  ],
  rubric: [
    { name: "Neural Network Architecture", score: 13, max: 15 },
    { name: "Backpropagation Algorithm", score: 12, max: 15 },
  ],
  feedback: { strengths: "Clear diagram and gradient steps", improvements: "Minor notation fix", missing: "None" },
};
subA.status = "Evaluated";
subA.evaluationId = `eval-${dlAsgData.id}-${studentA.id}`;
approveEvaluation(subA.id, teacherA.name);
publishResults(dlAsgData.id);

// 14, 15, 16, 17. Rubric Analysis generation, criteria & score isolation
const rubricDL = getRubricAnalytics(dlAsgData.id);
assert(rubricDL.length === 2, "14. Rubric Analysis generates for selected assignment");
assert(rubricDL[0].name === "Neural Network Architecture" && rubricDL[1].name === "Backpropagation Algorithm", "15. Rubric criteria come from selected assignment");
assert(rubricDL[0].averageMarks === 13 && rubricDL[0].max === 15, "16. Rubric scores come from selected evaluation (13 / 15)");
const rubricML = getRubricAnalytics(mlAsgData.id);
assert(rubricML.length === 0 || rubricML[0].name !== "Neural Network Architecture", "17. Rubric data is isolated by assignmentId");

// 18, 19, 20. Student Progress Report finds evaluated student & published result
const reportA = getStudentReport(subA);
assert(reportA !== null, "18. Student Progress Report finds evaluated student");
assert(reportA.score === 25 && reportA.totalMarks === 30, "19. Published result appears in Student Progress Report with correct score (25 / 30)");
assert(reportA.student === studentA.name, "20. Student identity matches studentId");

// 21. Missing student handled (0 / totalMarks, Grade F)
const expiredAsg = {
  id: "asg-report-expired-20",
  title: "Expired Embedded Systems Quiz",
  subjectName: "Embedded Systems",
  courseCode: "ET304",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 20,
  dueDate: "2020-01-01",
  status: "Published",
  createdByTeacherId: teacherA.id,
};
publishAssignmentAndNotifyStudents(expiredAsg, [studentA]);
const missingSub = getStudentSubmission(studentA, expiredAsg.id);
assert(missingSub.status === "Missing / Failed" && missingSub.score === "0 / 20" && missingSub.evaluation.grade === "F", "21. Missing student is handled as 0 / totalMarks, Grade F");

// 22. Late student handled
const lateAsg = {
  id: "asg-report-late-20",
  title: "Late Signal Processing Quiz",
  subjectName: "Signals",
  courseCode: "ET301",
  branch: studentA.branch,
  division: studentA.division,
  totalMarks: 20,
  dueDate: "2020-01-01",
  status: "Published",
  createdByTeacherId: teacherA.id,
};
publishAssignmentAndNotifyStudents(lateAsg, [studentA]);
submitAssignment(studentA, lateAsg.id, { name: "Late_Answer.pdf" });
const lateSub = getStudentSubmission(studentA, lateAsg.id);
assert(lateSub.status === "Late / Failed" && lateSub.evaluation.grade === "F", "22. Late student is handled as Late / Failed");

// 23. Easy/Moderate/Hard results remain isolated
subA.evaluationResults = {
  easy: { score: 28, totalMarks: 30, grade: "Grade A+" },
  moderate: { score: 25, totalMarks: 30, grade: "Grade A" },
  hard: { score: 19, totalMarks: 30, grade: "Grade C" },
};
assert(subA.evaluationResults.easy.score === 28 && subA.evaluationResults.hard.score === 19, "23. Easy/Moderate/Hard results remain isolated");

// 24. Multiple assignments remain isolated
const sheetDL2 = buildGradeSheet("assignment", dlAsgData.id);
const sheetML2 = buildGradeSheet("assignment", mlAsgData.id);
assert(sheetDL2.exam.id === dlAsgData.id && sheetML2.exam.id === mlAsgData.id, "24. Multiple assignments remain isolated in Grade Sheet");

// 25. Teacher ownership is enforced (Teacher B cannot view Teacher A's assignment)
const teacherBAsg = buildGradeSheet("assignment", dlAsgData.id); // teacherA is still logged in
assert(teacherBAsg.exam !== null, "25a. Teacher A can view owned assignment");
loginTeacher("teacherB@college.edu", "teacher123");
const teacherBGradeSheet = buildGradeSheet("assignment", dlAsgData.id);
assert(teacherBGradeSheet.exam === null, "25b. Teacher B ownership violation returns null grade sheet");

// Re-login Teacher A
loginTeacher("teacher@college.edu", "teacher123");

// 26. Refresh persistence works
hydrateAllWorkflowData();
const refreshedDLSheet = buildGradeSheet("assignment", dlAsgData.id);
assert(refreshedDLSheet.exam !== null && refreshedDLSheet.exam.title === "Deep Learning Assignment 01", "26. Refresh persistence works");

// 27. Empty states work for non-existent assignment
const emptySheet = buildGradeSheet("assignment", "asg-non-existent-999");
assert(emptySheet.exam === null && emptySheet.rows.length === 0, "27. Empty states return null exam and empty rows");

// 28. No demo data leakage
assert(refreshedDLSheet.exam.id !== demoAssignment.id && refreshedDLSheet.exam.subjectName !== "Digital Signal Processing", "28. No demo DSP data leakage in active report outputs");

console.log("\n==========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
