import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getTeacherAssignments,
  getClassAnalytics,
  getRubricAnalytics,
  getStudentReport,
  getSubmissionByEvaluationId,
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

console.log("=== RUNNING TEST SUITE: Final Reports Data Integrity & Dynamic Delivery ===\n");

// Login Teacher A
loginTeacher("teacher@college.edu", "teacher123");
const teacherA = getCurrentTeacher();

// Setup Student A (Rahul) and Student B (Sneha)
const studentA = students[0]; // Rahul Patil (TE ENTC – A)
const studentB = students[1]; // Sneha Kulkarni (TE ENTC – A)

// 1. Real assignment resolves by assignmentId & 2. No DSP fallback
const dlAsgData = {
  id: "asg-integrity-dl-30",
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

const fetchedAsg = getAssignmentById(dlAsgData.id);
assert(fetchedAsg !== null && fetchedAsg.id === dlAsgData.id, "1. Real assignment resolves by assignmentId");
assert(fetchedAsg.id !== demoAssignment.id && fetchedAsg.subjectName !== "Digital Signal Processing", "2. No DSP fallback for active teacher assignment");

// 3, 4, 5, 6, 7, 8, 9. Dynamic metadata fields
assert(fetchedAsg.title === "Deep Learning Assignment 01", "3. Dynamic assignment title");
assert(fetchedAsg.subjectName === "Deep Learning", "4. Dynamic subject (Deep Learning)");
assert(fetchedAsg.courseCode === "AI305", "5. Dynamic course code (AI305)");
assert(fetchedAsg.branch === studentA.branch, "6. Dynamic branch");
assert(fetchedAsg.division === studentA.division, "7. Dynamic division");
assert(fetchedAsg.totalMarks === 30, "8. Dynamic total marks");
const sheet30 = buildGradeSheet("assignment", dlAsgData.id);
assert(sheet30.exam.totalMarks === 30 && sheet30.rows.every((r) => r.totalMarks === 30), "9. 30-mark assignment displays /30 across grade sheet");

// 10. 40 marks displays correctly
const mlAsgData = {
  id: "asg-integrity-ml-40",
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
const sheet40 = buildGradeSheet("assignment", mlAsgData.id);
assert(sheet40.exam.totalMarks === 40 && sheet40.rows.every((r) => r.totalMarks === 40), "10. 40-mark assignment displays /40 across grade sheet");

// Submit and Evaluate Student A for DL Assignment
submitAssignment(studentA, dlAsgData.id, { name: "DL_Answer.pdf", type: "application/pdf" });
const subA = getStudentSubmission(studentA, dlAsgData.id);
subA.evaluation = {
  score: 24,
  obtainedMarks: 24,
  totalMarks: 30,
  grade: "Grade A",
  confidence: "90%",
  semanticRelevance: "85%",
  evaluationDifficulty: "moderate",
  questionWiseResults: [
    { questionNumber: 1, questionText: "Neural Network Architecture", maximumMarks: 15, awardedMarks: 12 },
    { questionNumber: 2, questionText: "Backpropagation Algorithm", maximumMarks: 15, awardedMarks: 12 },
  ],
  rubric: [
    { name: "Neural Network Architecture", score: 12, max: 15 },
    { name: "Backpropagation Algorithm", score: 12, max: 15 },
  ],
  feedback: { strengths: "Good network topology", improvements: "Add explicit derivative formula", missing: "None" },
};
subA.status = "Evaluated";
subA.evaluationId = `eval-${dlAsgData.id}-${studentA.id}`;
approveEvaluation(subA.id, teacherA.name);
publishResults(dlAsgData.id);

// 11 & 12. Evaluation Report resolves real assignment and real submissions
const classAnalyticsDL = getClassAnalytics(dlAsgData.id);
assert(classAnalyticsDL !== null && classAnalyticsDL.assignmentId === dlAsgData.id, "11. Evaluation Report resolves real assignment analytics");
assert(classAnalyticsDL.evaluatedCount === 1, "12. Evaluation Report resolves real submissions");

// 13 & 14. Evaluation completion and class average calculation
assert(classAnalyticsDL.completionPercentage > 0, "13. Evaluation completion percentage is calculated dynamically");
assert(classAnalyticsDL.averageScore === 24, "14. Class average is calculated dynamically (24 / 30)");

// 15 & 16. Rubric Analysis resolves selected assignment rubric & uses real evaluations
const rubricDL = getRubricAnalytics(dlAsgData.id);
assert(rubricDL.length === 2 && rubricDL[0].name === "Neural Network Architecture", "15. Rubric Analysis resolves selected assignment rubric");
assert(rubricDL[0].averageMarks === 12 && rubricDL[0].max === 15, "16. Rubric Analysis uses real evaluations (12 / 15)");

// 17, 18, 19, 20. Student Progress Report resolves studentId & published result
const subResolved = getSubmissionByEvaluationId(subA.evaluationId);
assert(subResolved !== null && subResolved.studentId === studentA.id, "17. Student Progress Report resolves studentId");
const reportA = getStudentReport(subResolved);
assert(reportA !== null && reportA.score === 24, "18. Published result appears in Student Progress Report");
assert(reportA.grade === "Grade A", "19. Grade is correct (Grade A)");
assert(reportA.percentage === 80, "20. Percentage is correct (80%)");

// 21. Missing submission handling works
const expiredAsg = {
  id: "asg-integrity-expired-20",
  title: "Expired Quiz",
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
assert(missingSub.status === "Missing / Failed" && missingSub.evaluation.grade === "F", "21. Missing submission handling works (0 / 20, Grade F)");

// 22. Late submission handling works
const lateAsg = {
  id: "asg-integrity-late-20",
  title: "Late Quiz",
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
submitAssignment(studentA, lateAsg.id, { name: "Late_File.pdf" });
const lateSub = getStudentSubmission(studentA, lateAsg.id);
assert(lateSub.status === "Late / Failed" && lateSub.evaluation.grade === "F", "22. Late submission handling works (Late / Failed)");

// 23. Multiple assignments remain isolated
const analyticsML = getClassAnalytics(mlAsgData.id);
assert(analyticsML.evaluatedCount === 0 && classAnalyticsDL.evaluatedCount === 1, "23. Multiple assignments remain isolated");

// 24. Teacher ownership is enforced
loginTeacher("teacherB@college.edu", "teacher123");
const teacherBSheet = buildGradeSheet("assignment", dlAsgData.id);
assert(teacherBSheet.exam === null, "24. Teacher ownership is enforced (Teacher B receives null for Teacher A assignment)");
loginTeacher("teacher@college.edu", "teacher123");

// 25. Refresh persistence works
hydrateAllWorkflowData();
const refreshedAnalytics = getClassAnalytics(dlAsgData.id);
assert(refreshedAnalytics.assignmentId === dlAsgData.id && refreshedAnalytics.evaluatedCount === 1, "25. Refresh persistence works");

// 26. Empty states work
const emptyAnalytics = getClassAnalytics("asg-non-existent-888");
assert(emptyAnalytics.assignmentId === null && emptyAnalytics.totalStudents === 0, "26. Empty states work cleanly");

// 27. Demo data never appears as fallback
assert(refreshedAnalytics.assignmentTitle !== demoAssignment.title, "27. Demo data never appears as fallback");

console.log("\n==========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
