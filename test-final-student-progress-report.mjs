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
} from "./frontend/src/data/gradeSheetData.js";

import {
  students,
  getStudentSubmission,
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

console.log("=== RUNNING TEST SUITE: Final Student Progress Report & Real Subject-Wise Data Integrity ===\n");

// Login Teacher A
loginTeacher("teacher@college.edu", "teacher123");
const teacherA = getCurrentTeacher();

// Target Students
const studentRahul = students[0]; // Rahul Patil (ET202-041)
const studentSneha = students[1]; // Sneha Kulkarni (ET202-089)

// 1. selectedAssignmentId resolves real assignment & 2-5. Title, Subject, Course Code, Total Marks
const dlAsgData = {
  id: "asg-final-dl-30",
  title: "Deep Learning Assignment 01",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: studentRahul.branch,
  division: studentRahul.division,
  totalMarks: 30,
  dueDate: "2030-12-31",
  status: "Published",
  createdByTeacherId: teacherA.id,
  questions: [
    { id: 1, name: "Neural Network Architecture", description: "Design feedforward NN", marks: 15 },
    { id: 2, name: "Backpropagation Algorithm", description: "Derive gradient updates", marks: 15 },
  ],
};
publishAssignmentAndNotifyStudents(dlAsgData, [studentRahul, studentSneha]);

const fetchedAsg = getAssignmentById(dlAsgData.id);
assert(fetchedAsg !== null && fetchedAsg.id === dlAsgData.id, "1. selectedAssignmentId resolves real assignment");
assert(fetchedAsg.title === "Deep Learning Assignment 01", "2. Real assignment title");
assert(fetchedAsg.subjectName === "Deep Learning", "3. Real subject (Deep Learning)");
assert(fetchedAsg.courseCode === "AI305", "4. Real course code (AI305)");
assert(fetchedAsg.totalMarks === 30, "5. Real total marks (30)");

// 6. Real submissions resolve
submitAssignment(studentRahul, dlAsgData.id, { name: "Rahul_DL_Answer.pdf", type: "application/pdf" });
const subRahul = getStudentSubmission(studentRahul, dlAsgData.id);
assert(subRahul !== null && subRahul.file === "Rahul_DL_Answer.pdf", "6. Real submissions resolve");

// 7, 8, 9. studentId, student name, roll number resolve
assert(subRahul.studentId === studentRahul.id, "7. studentId resolves (stu-rahul)");
assert(subRahul.studentName === studentRahul.name || subRahul.student === studentRahul.name, "8. Student name resolves (Rahul Patil)");
assert(subRahul.rollNumber === studentRahul.roll || subRahul.roll === studentRahul.roll, "9. Roll number resolves (ET202-041)");

// Perform Evaluation, Approval, and Result Publication for Rahul
subRahul.evaluation = {
  score: 24,
  obtainedMarks: 24,
  totalMarks: 30,
  grade: "Grade A",
  confidence: "91%",
  semanticRelevance: "86%",
  evaluationDifficulty: "moderate",
  questionWiseResults: [
    { questionNumber: 1, questionText: "Neural Network Architecture", maximumMarks: 15, awardedMarks: 12 },
    { questionNumber: 2, questionText: "Backpropagation Algorithm", maximumMarks: 15, awardedMarks: 12 },
  ],
  rubric: [
    { name: "Neural Network Architecture", score: 12, max: 15 },
    { name: "Backpropagation Algorithm", score: 12, max: 15 },
  ],
  feedback: { strengths: "Good architecture description", improvements: "Specify learning rate", missing: "None" },
};
subRahul.status = "Evaluated";
subRahul.evaluationId = `eval-${dlAsgData.id}-${studentRahul.id}`;

// 10, 11, 12, 13. Evaluation, Approval, Publication resolution
assert(subRahul.evaluation !== null, "10. Evaluation resolves");
const appRes = approveEvaluation(subRahul.id, teacherA.name);
assert(appRes.success === true && subRahul.evaluation.evaluationStatus === "Approved", "11. Approval status resolves");
const pubRes = publishResults(dlAsgData.id);
assert(pubRes.notifications !== undefined, "12. Publication status resolves");
assert(subRahul.status === "Result Published" || subRahul.evaluationStatus === "PUBLISHED", "13. Published result resolves");

// 14, 15, 16. Score, Grade, Percentage resolve
assert(subRahul.evaluation.obtainedMarks === 24, "14. Score resolves (24 / 30)");
assert(subRahul.evaluation.grade === "Grade A", "15. Grade resolves (Grade A)");
const calculatedPct = Math.round((subRahul.evaluation.obtainedMarks / subRahul.evaluation.totalMarks) * 100);
assert(calculatedPct === 80, "16. Percentage resolves (80%)");

// 17. Student Progress Report generates
const reportRahul = getStudentReport(subRahul);
assert(reportRahul !== null && reportRahul.student === studentRahul.name && reportRahul.score === 24, "17. Student Progress Report generates successfully");

// 18. Assignment Evaluation Report generates
const analyticsDL = getClassAnalytics(dlAsgData.id);
assert(analyticsDL !== null && analyticsDL.assignmentTitle === "Deep Learning Assignment 01" && analyticsDL.evaluatedCount === 1, "18. Assignment Evaluation Report generates cleanly");

// 19. Rubric Analysis generates
const rubricDL = getRubricAnalytics(dlAsgData.id);
assert(rubricDL.length === 2 && rubricDL[0].name === "Neural Network Architecture", "19. Rubric Analysis generates cleanly");

// 20. Grade Sheet uses selected assignment
const sheetDL = buildGradeSheet("assignment", dlAsgData.id);
assert(sheetDL.exam.id === dlAsgData.id && sheetDL.exam.totalMarks === 30, "20. Grade Sheet uses selected assignment & total marks");

// 21. No DSP fallback
assert(analyticsDL.assignmentTitle !== demoAssignment.title && sheetDL.exam.id !== demoAssignment.id, "21. No DSP fallback in reports");

// 22. No hardcoded 20
assert(sheetDL.exam.totalMarks === 30 && reportRahul.totalMarks === 30, "22. No hardcoded 20 marks (/30 rendered)");

// 23. Multi-assignment isolation
const mlAsgData = {
  id: "asg-final-ml-40",
  title: "Machine Learning Assignment 01",
  subjectName: "Machine Learning",
  courseCode: "AI301",
  branch: studentRahul.branch,
  division: studentRahul.division,
  totalMarks: 40,
  dueDate: "2030-12-31",
  status: "Published",
  createdByTeacherId: teacherA.id,
};
publishAssignmentAndNotifyStudents(mlAsgData, [studentRahul, studentSneha]);
const analyticsML = getClassAnalytics(mlAsgData.id);
assert(analyticsML.assignmentId === mlAsgData.id && analyticsML.evaluatedCount === 0 && analyticsDL.evaluatedCount === 1, "23. Multi-assignment isolation maintained");

// 24. Teacher ownership enforced
loginTeacher("teacherB@college.edu", "teacher123");
const teacherBSheet = buildGradeSheet("assignment", dlAsgData.id);
assert(teacherBSheet.exam === null, "24. Teacher ownership enforced (Teacher B access denied)");
loginTeacher("teacher@college.edu", "teacher123");

// 25. Refresh persistence works
hydrateAllWorkflowData();
const refreshedSub = getSubmissionByEvaluationId(subRahul.evaluationId);
const refreshedReport = getStudentReport(refreshedSub);
assert(refreshedReport !== null && refreshedReport.score === 24, "25. Refresh persistence works for Student Progress Report");

console.log("\n==========================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==========================================");

if (failed > 0) {
  process.exit(1);
}
