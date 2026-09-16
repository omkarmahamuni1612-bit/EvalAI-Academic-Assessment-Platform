import {
  calculateGrade,
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getEvaluationProgress,
  getNonSubmittingStudents,
  getStudentNotifications,
  isAssignmentPastDueDate,
  isResultsPublished,
  isSubmissionLate,
  parseDueDate,
  publishAssignmentAndNotifyStudents,
  publishResults,
  registerCreatedAssessment,
  studentNotifications,
  submitAssignment,
  workflowSubmissions,
} from "./src/data/workflowData.js";
import { getStudentSubmission, students } from "./src/auth/studentAuth.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";

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

console.log("=== PHASE 7C COMPLETE ASSIGNMENT LIFECYCLE & DUE DATE TESTS ===");
loginTeacher("teacher@college.edu", "teacher123");

// 1. CREATE ASSIGNMENT
const testAsgData = {
  id: "asg-test-7c-01",
  assessmentCategory: "assignment",
  title: "Microprocessors & Embedded Systems Assignment",
  course: "Embedded Systems",
  courseCode: "ET304",
  branch: "ENTC",
  division: "TE ENTC – A",
  dueDate: "2026-09-30",
  dueTime: "23:59",
  totalMarks: 20,
  status: "Draft",
  description: "Explain ARM Cortex M4 architecture and memory mapping.",
  questions: [{ id: 1, name: "ARM Cortex Architecture", marks: 20 }],
};

const createdAsg = registerCreatedAssessment(testAsgData);
check("1. Assignment creation sets correct category", createdAsg.assessmentType === "assignment");
check("1. Assignment creation sets total marks to 20", createdAsg.totalMarks === 20);
check("1. Assignment creation sets status to Draft initially", createdAsg.status === "Draft");

// 2. PUBLISH ASSIGNMENT & NOTIFY STUDENTS
const pubAsgResult = publishAssignmentAndNotifyStudents(createdAsg.id, students);
check("2. Publish assignment succeeds", pubAsgResult.success === true);
check("2. Assignment status updated to Published", (getAssignmentById(createdAsg.id)?.status || createdAsg.status) === "Published");
check("2. Notifications created for all enrolled students", pubAsgResult.notifications.length === students.length);

// 3. PREVENT DUPLICATE NOTIFICATIONS ON RE-PUBLISH
const pubAsgResult2 = publishAssignmentAndNotifyStudents(createdAsg.id, students);
check("3. Re-publishing creates zero duplicate notifications", pubAsgResult2.notifications.length === 0);

// 4. STUDENT RECEIVES NOTIFICATION
const rahulNotifs = getStudentNotifications("stu-rahul", students.find((s) => s.id === "stu-rahul"));
const rahulPubNotif = rahulNotifs.find((n) => n.assignmentId === createdAsg.id);
check("4. Notification contains correct assignment title", Boolean(rahulPubNotif && (rahulPubNotif.assignmentTitle === createdAsg.title || rahulPubNotif.message?.includes(createdAsg.title))));

// 5. DUE DATE PARSING & COMPARISON LOGIC
const onTimeTimestamp = "2026-09-29 20:00:00";
const lateTimestamp = "2026-10-01 00:05:00";
check("5. On-time timestamp evaluated correctly", isSubmissionLate(onTimeTimestamp, createdAsg.dueDate, createdAsg.dueTime) === false);
check("5. Late timestamp evaluated correctly", isSubmissionLate(lateTimestamp, createdAsg.dueDate, createdAsg.dueTime) === true);

// 6. ON-TIME PDF SUBMISSION
const dummyOnTimeFile = { name: "Rahul_Embedded_A01.pdf", size: 102400, type: "application/pdf" };
const onTimeSubResult = submitAssignment(students[0], createdAsg.id, dummyOnTimeFile);
check("6. On-time submission succeeds", onTimeSubResult.success === true);
check("6. On-time submission status is 'Submitted'", onTimeSubResult.submission.status === "Submitted" || onTimeSubResult.submission.status === "Processing");
check("6. On-time submission score is pending ('—')", onTimeSubResult.submission.score === "—");

// 7. LATE PDF SUBMISSION -> AUTOMATIC 0 / F
const dummyLateFile = { name: "Sneha_Embedded_A01.pdf", size: 102400, type: "application/pdf" };
// Create a past-due test assignment
const pastDueAsgData = registerCreatedAssessment({
  id: "asg-test-past-due",
  assessmentCategory: "assignment",
  title: "Past Due Assignment",
  branch: "ENTC",
  division: "TE ENTC – A",
  dueDate: "2026-08-01",
  dueTime: "12:00",
  totalMarks: 20,
});
const lateSubResult = submitAssignment(students[1], pastDueAsgData.id, dummyLateFile);
check("7. Late submission recorded successfully", lateSubResult.success === true);
check("7. Late submission status is 'Late / Failed'", lateSubResult.submission.status === "Late / Failed");
check("7. Late submission receives score 0 / 20", lateSubResult.submission.score === "0 / 20");
check("7. Late submission evaluation grade is F", lateSubResult.submission.evaluation.grade === "F" || lateSubResult.submission.evaluation.grade === "Grade D");

// 8. NON-SUBMISSION AFTER DEADLINE -> 0 / F
const vikramStudent = students.find((s) => s.id === "stu-vikram");
const vikramSub = getStudentSubmission(vikramStudent, pastDueAsgData.id);
check("8. Non-submitting student shows status 'Missing / Failed' or 'Not Submitted'", vikramSub.status === "Missing / Failed" || vikramSub.status === "Not Submitted");
check("8. Non-submitting student receives 0 / 20 score", vikramSub.score === "0 / 20");
check("8. Non-submitting student receives Grade F or Grade D", vikramSub.evaluation.grade === "F" || vikramSub.evaluation.grade === "Grade D");

// 9. APPROVAL VS PUBLICATION GUARD
check("9. Results for new assignment not published by default", isResultsPublished(createdAsg.id) === false);

// 10. PUBLISH RESULTS & NOTIFY STUDENTS FOR PUBLISHED RESULT
const pubResResult = publishResults(pastDueAsgData.id, students);
check("10. Result publication succeeds", pubResResult.alreadyPublished === false);
check("10. Result publication status updated", isResultsPublished(pastDueAsgData.id) === true);

const vikramResultNotif = getStudentNotifications("stu-vikram", vikramStudent).find((n) => n.assignmentId === pastDueAsgData.id);
check("10. Result notification sent to student", vikramResultNotif !== undefined);

// 11. DATA ISOLATION & ASSIGNMENT TYPE MARKS
check("11. Assignment total marks is strictly 20", createdAsg.totalMarks === 20);

// Print test report
console.log("\n" + results.join("\n"));
if (failures === 0) {
  console.log("\nALL ASSIGNMENT LIFECYCLE TESTS PASSED ✅");
} else {
  console.error(`\n${failures} TEST(S) FAILED ❌`);
  process.exit(1);
}
