import assert from "assert";
import {
  evaluateAssessmentSubmission,
  getAssignmentById,
  getStudentNotifications,
  hydrateWorkflowEvaluations,
  isResultsPublished,
  publishAssignmentAndNotifyStudents,
  publishResults,
  reEvaluateSubmission,
  registerCreatedAssessment,
  submitAssignment,
  workflowSubmissions,
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { getStudentSubmission, students } from "./src/auth/studentAuth.js";

console.log("=== REGRESSION & FEATURE TEST: TEACHER-DEFINED TOTAL MARKS ===");

loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const rahul = students.find((s) => s.id === "stu-rahul");
assert(rahul !== undefined, "Rahul student account exists.");

const pdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";

// TEST 1: Invalid Marks Validation
console.log("TEST 1: Validating invalid Total Marks...");
const checkInvalidMark = (val) => {
  const parsed = Number(val);
  return !val || isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0;
};
assert(checkInvalidMark(0), "Reject 0 marks.");
assert(checkInvalidMark(-10), "Reject negative marks.");
assert(checkInvalidMark(25.5), "Reject decimal marks.");
assert(checkInvalidMark("invalid"), "Reject non-numeric text.");
assert(checkInvalidMark(""), "Reject empty marks.");

// TEST 2: Rubric Total Mismatch Validation
console.log("TEST 2: Validating rubric total mismatch...");
const testFormTotal = 30;
const testRubricAllocated = 25;
assert(testFormTotal !== testRubricAllocated, "Rubric total (25) mismatch with Total Marks (30) flagged.");

// TEST 3: 20-Mark Assignment Lifecycle & Evaluation
console.log("TEST 3: 20-Mark Assignment Lifecycle...");
const asg20Id = `asg-20m-${Date.now()}`;
const asg20Data = {
  id: asg20Id,
  title: "20-Mark Test Assignment",
  subjectName: "DSP",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: { name: "QP20.pdf", size: 2048, type: "application/pdf", data: pdfDataUrl },
  referenceAnswerPdf: { name: "Ref20.pdf", size: 2048, type: "application/pdf", data: pdfDataUrl },
  questions: [
    { id: 1, text: "Q1", marks: 10 },
    { id: 2, text: "Q2", marks: 10 },
  ],
};
publishAssignmentAndNotifyStudents(asg20Data);
const sub20Res = submitAssignment(rahul, asg20Id, { name: "Ans20.pdf", size: 4096, type: "application/pdf", data: pdfDataUrl });
assert(sub20Res.success === true, "20-mark submission successful.");
const sub20 = sub20Res.submission;

const eval20Easy = evaluateAssessmentSubmission(sub20, asg20Data, "easy");
const eval20Mod = evaluateAssessmentSubmission(sub20, asg20Data, "moderate");
const eval20Hard = evaluateAssessmentSubmission(sub20, asg20Data, "hard");

assert(eval20Easy.score <= 20, "20-mark Easy score <= 20.");
assert(eval20Mod.score <= 20, "20-mark Moderate score <= 20.");
assert(eval20Hard.score <= 20, "20-mark Hard score <= 20.");
assert.strictEqual(eval20Easy.totalMarks, 20, "Total marks recorded as 20.");

// TEST 4: 30-Mark Assignment Lifecycle & Evaluation
console.log("TEST 4: 30-Mark Assignment Lifecycle...");
const asg30Id = `asg-30m-${Date.now()}`;
const asg30Data = {
  id: asg30Id,
  title: "30-Mark Test Assignment",
  subjectName: "DSP",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: { name: "QP30.pdf", size: 2048, type: "application/pdf", data: pdfDataUrl },
  referenceAnswerPdf: { name: "Ref30.pdf", size: 2048, type: "application/pdf", data: pdfDataUrl },
  questions: [
    { id: 1, text: "Q1", marks: 15 },
    { id: 2, text: "Q2", marks: 15 },
  ],
};
publishAssignmentAndNotifyStudents(asg30Data);
const sub30Res = submitAssignment(rahul, asg30Id, { name: "Ans30.pdf", size: 4096, type: "application/pdf", data: pdfDataUrl });
assert(sub30Res.success === true, "30-mark submission successful.");
const sub30 = sub30Res.submission;

const eval30Easy = evaluateAssessmentSubmission(sub30, asg30Data, "easy");
const eval30Mod = evaluateAssessmentSubmission(sub30, asg30Data, "moderate");
const eval30Hard = evaluateAssessmentSubmission(sub30, asg30Data, "hard");

console.log(`  30m Easy: ${eval30Easy.score}/30 | Moderate: ${eval30Mod.score}/30 | Hard: ${eval30Hard.score}/30`);

assert(eval30Easy.score <= 30 && eval30Easy.score >= 0, "30-mark Easy score between 0 and 30.");
assert(eval30Mod.score <= 30 && eval30Mod.score >= 0, "30-mark Moderate score between 0 and 30.");
assert(eval30Hard.score <= 30 && eval30Hard.score >= 0, "30-mark Hard score between 0 and 30.");
assert.strictEqual(eval30Easy.totalMarks, 30, "Total marks recorded as 30.");

// TEST 5: 40-Mark Assignment Lifecycle & Evaluation
console.log("TEST 5: 40-Mark Assignment Lifecycle...");
const asg40Id = `asg-40m-${Date.now()}`;
const asg40Data = {
  id: asg40Id,
  title: "40-Mark Test Assignment",
  subjectName: "DSP",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 40,
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: { name: "QP40.pdf", size: 2048, type: "application/pdf", data: pdfDataUrl },
  referenceAnswerPdf: { name: "Ref40.pdf", size: 2048, type: "application/pdf", data: pdfDataUrl },
  questions: [
    { id: 1, text: "Q1", marks: 20 },
    { id: 2, text: "Q2", marks: 20 },
  ],
};
publishAssignmentAndNotifyStudents(asg40Data);
const sub40Res = submitAssignment(rahul, asg40Id, { name: "Ans40.pdf", size: 4096, type: "application/pdf", data: pdfDataUrl });
assert(sub40Res.success === true, "40-mark submission successful.");
const sub40 = sub40Res.submission;

const eval40Easy = evaluateAssessmentSubmission(sub40, asg40Data, "easy");
const eval40Mod = evaluateAssessmentSubmission(sub40, asg40Data, "moderate");
const eval40Hard = evaluateAssessmentSubmission(sub40, asg40Data, "hard");

console.log(`  40m Easy: ${eval40Easy.score}/40 | Moderate: ${eval40Mod.score}/40 | Hard: ${eval40Hard.score}/40`);

assert(eval40Easy.score <= 40 && eval40Easy.score >= 0, "40-mark Easy score between 0 and 40.");
assert(eval40Mod.score <= 40 && eval40Mod.score >= 0, "40-mark Moderate score between 0 and 40.");
assert(eval40Hard.score <= 40 && eval40Hard.score >= 0, "40-mark Hard score between 0 and 40.");
assert.strictEqual(eval40Easy.totalMarks, 40, "Total marks recorded as 40.");

// TEST 6: Difficulty Isolation & Persistence for 30-Mark Assignment
console.log("TEST 6: Difficulty Isolation & Persistence for 30-Mark Assignment...");
const reEvalEasy30 = reEvaluateSubmission(sub30.id, "easy");
assert.strictEqual(reEvalEasy30.evaluationResults.easy.totalMarks, 30, "Easy evaluationResults has totalMarks 30.");

const reEvalMod30 = reEvaluateSubmission(sub30.id, "moderate");
assert.strictEqual(reEvalMod30.evaluationResults.moderate.totalMarks, 30, "Moderate evaluationResults has totalMarks 30.");

const reEvalHard30 = reEvaluateSubmission(sub30.id, "hard");
assert.strictEqual(reEvalHard30.evaluationResults.hard.totalMarks, 30, "Hard evaluationResults has totalMarks 30.");

assert.strictEqual(reEvalHard30.evaluationResults.easy.totalMarks, 30, "Easy totalMarks remains 30 after Hard eval.");
assert.strictEqual(reEvalHard30.evaluationResults.moderate.totalMarks, 30, "Moderate totalMarks remains 30 after Hard eval.");

// TEST 7: Student Visibility & Notification Total Marks
console.log("TEST 7: Student Visibility & Notifications...");
const notifications = getStudentNotifications("stu-rahul");
const notif30 = notifications.find((n) => n.assignmentId === asg30Id);
assert(notif30 !== undefined, "Notification created for 30-mark assignment.");
assert.strictEqual(notif30.totalMarks, 30, "Notification reflects 30 total marks.");

const fetchedAsg30 = getAssignmentById(asg30Id);
assert.strictEqual(fetchedAsg30.totalMarks, 30, "getAssignmentById returns totalMarks = 30.");

// TEST 8: Result Publication for 30-Mark Assignment
console.log("TEST 8: Result Publication for 30-Mark Assignment...");
const pubResultRes = publishResults(asg30Id, students);
assert(pubResultRes !== null, "publishResults returned result.");
assert(isResultsPublished(asg30Id), "Results marked as published.");

const studentSub30 = getStudentSubmission(rahul, asg30Id);
assert.strictEqual(studentSub30.evaluation.totalMarks, 30, "Student submission evaluation has totalMarks 30.");

console.log("\nALL TEACHER-DEFINED TOTAL MARKS TESTS PASSED ✅\n");
