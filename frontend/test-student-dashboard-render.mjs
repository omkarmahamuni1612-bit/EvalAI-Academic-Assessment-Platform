import {
  createdAssessments,
  demoAssignment,
  getEvaluationStatus,
  getQuestionPaperPdf,
  getStudentAssignment,
  getStudentNotifications,
  getSubmissionByEvaluationId,
  getSubmissionById,
  getSubmissionStatusLabel,
  isAssignmentAssessment,
  isResultsPublished,
  markNotificationRead,
  submitAssignment,
} from "./src/data/workflowData.js";
import {
  getInSemExam,
  getInSemStudentNotifications,
  getInSemStudentResult,
  getInSemStudentStatus,
  getInSemSubmissionByEvaluationId,
  getInSemSubmissionById,
  getInSemSubmissionByStudent,
  isInSemResultsPublished,
  markInSemNotificationRead,
} from "./src/data/inSemData.js";
import {
  getEndSemExam,
  getEndSemStudentNotifications,
  getEndSemStudentResult,
  getEndSemStudentStatus,
  getEndSemSubmissionByEvaluationId,
  getEndSemSubmissionById,
  getEndSemSubmissionByStudent,
  isEndSemResultsPublished,
  markEndSemNotificationRead,
} from "./src/data/endSemData.js";
import { getCurrentStudent, getStudentSubmission, students } from "./src/auth/studentAuth.js";

let failures = 0;
const results = [];

function check(name, condition, detail = "") {
  if (condition) {
    results.push(`PASS  ${name}`);
  } else {
    failures += 1;
    results.push(`FAIL  ${name} ${detail}`);
  }
}

console.log("=== VERIFYING STUDENT DASHBOARD DATA CONTRACT & IMPORTS ===");

// 1. Verify createdAssessments is defined
check("1. createdAssessments is an Array", Array.isArray(createdAssessments));

// 2. Verify all helper functions exported and callable
check("2. getInSemSubmissionByEvaluationId is a function", typeof getInSemSubmissionByEvaluationId === "function");
check("3. getInSemSubmissionById is a function", typeof getInSemSubmissionById === "function");
check("4. isInSemResultsPublished is a function", typeof isInSemResultsPublished === "function");
check("5. getEndSemSubmissionByEvaluationId is a function", typeof getEndSemSubmissionByEvaluationId === "function");
check("6. getEndSemSubmissionById is a function", typeof getEndSemSubmissionById === "function");
check("7. isEndSemResultsPublished is a function", typeof isEndSemResultsPublished === "function");

// 3. Test Student Dashboard Data Processing for all enrolled students
for (const student of students) {
  try {
    const sub = getStudentSubmission(student, demoAssignment.id);
    const notifs = getStudentNotifications(student.id) || [];
    const inSemNotifs = getInSemStudentNotifications(student.id) || [];
    const endSemNotifs = getEndSemStudentNotifications(student.id) || [];
    const allNotifs = [...notifs, ...inSemNotifs, ...endSemNotifs];

    const inSemExam = getInSemExam();
    const inSemStatus = getInSemStudentStatus(student);
    const endSemExam = getEndSemExam();
    const endSemStatus = getEndSemStudentStatus(student);

    const createdPublished = (createdAssessments || []).filter((a) => a && (a.status === "Published" || a.studentSubmissionAllowed));
    const allAssessments = [demoAssignment, ...createdPublished].filter(Boolean);

    const assignmentItems = allAssessments.map((asg) => {
      const s = getStudentSubmission(student, asg.id);
      const pub = isResultsPublished(asg.id);
      return {
        id: asg.id,
        evaluationId: s?.evaluationId || `eval-${asg.id}-${student.id}`,
        title: asg.title || "Assignment",
        subject: `${asg.courseCode || "ET305"} · ${asg.course || asg.subject || "Digital Signal Processing"}`,
        due: asg.dueDate ? `Due ${asg.dueDate}` : "Due TBD",
        totalMarks: asg.totalMarks || 20,
        status: s?.status === "Processing" ? "Under Evaluation" : (s?.status || "Pending"),
        evaluation: s?.evaluation || null,
        published: pub,
      };
    });

    const evaluatedItems = assignmentItems.filter((item) => item.published && item.evaluation);
    const averageScore = evaluatedItems.length > 0
      ? Math.round(evaluatedItems.reduce((acc, item) => acc + ((item.evaluation?.score || 0) / (item.totalMarks || 20)) * 100, 0) / evaluatedItems.length)
      : null;

    check(`Dashboard data for student ${student.name} (${student.roll})`, assignmentItems.length >= 1 && Array.isArray(allNotifs));
  } catch (err) {
    check(`Dashboard data for student ${student.name}`, false, err.message);
  }
}

// 4. Test missing/null student data handling
try {
  const nullSub = getStudentSubmission(null);
  const nullNotifs = getStudentNotifications(null) || [];
  const nullInSemNotifs = getInSemStudentNotifications(null) || [];
  const nullEndSemNotifs = getEndSemStudentNotifications(null) || [];
  check("4. Defensive handling for null student", nullSub === null && Array.isArray(nullNotifs) && Array.isArray(nullInSemNotifs) && Array.isArray(nullEndSemNotifs));
} catch (err) {
  check("4. Defensive handling for null student", false, err.message);
}

console.log("\n" + results.join("\n"));
if (failures === 0) {
  console.log("\nALL STUDENT DASHBOARD DATA CONTRACT TESTS PASSED ✅");
} else {
  console.error(`\n${failures} TEST(S) FAILED ❌`);
  process.exit(1);
}
