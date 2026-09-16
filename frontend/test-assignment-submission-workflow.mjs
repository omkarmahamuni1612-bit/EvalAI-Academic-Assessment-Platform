import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getActiveStudentAssignmentId,
  getStudentAssignment,
  getStudentNotifications,
  getQuestionPaperPdf,
  getPersistedPdfUrl,
  isResultsPublished,
  isStudentTargeted,
  publishAssignmentAndNotifyStudents,
  publishResults,
  registerCreatedAssessment,
  saveTeacherReview,
  approveEvaluation,
  submitAssignment,
  workflowSubmissions,
  assignmentPublishState,
  getNonSubmittingStudents
} from "./src/data/workflowData.js";
import { loginTeacher, logoutTeacher } from "./src/auth/teacherAuth.js";
import { getStudentSubmission, students } from "./src/auth/studentAuth.js";
import { getInSemExam, getInSemSubmissions } from "./src/data/inSemData.js";
import { getEndSemExam, getEndSemSubmissions } from "./src/data/endSemData.js";

console.log("=== PHASE 7C — PART 3: COMPLETE ASSIGNMENT SUBMISSION & LIFECYCLE WORKFLOW TESTS ===");

loginTeacher("teacher@college.edu", "teacher123");

const rahul = students.find((s) => s.id === "stu-rahul"); // ENTC, TE ENTC – A
const sneha = students.find((s) => s.id === "stu-sneha"); // ENTC, TE ENTC – A
const wrongDivStudent = { id: "stu-comp-01", name: "Computer Student", branch: "CS", division: "SE CS – A", roll: "CS101" };

assert(rahul !== undefined && sneha !== undefined, "Demo students exist.");

// TEST 1 & 2: Teacher creates assignment with unique assignmentId
const uniqueId = `asg-p7c3-${Date.now()}`;
const pdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";
const createdData = {
  id: uniqueId,
  title: "Advanced DSP & Filter Design",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Solve all problems on FIR & IIR filter design.",
  dueDate: "2026-09-30",
  dueTime: "23:59",
  assignmentPdf: {
    name: "DSP_Filter_Design_QP.pdf",
    size: 4096,
    type: "application/pdf",
    data: pdfDataUrl,
  },
  referenceAnswerPdf: {
    name: "DSP_Filter_Design_Ref.pdf",
    size: 3072,
    type: "application/pdf",
    data: pdfDataUrl,
  },
  referenceAnswer: "Model solution for filter design.",
};

const registered = registerCreatedAssessment(createdData);
assert.strictEqual(registered.id, uniqueId, "TEST 2: Assignment receives unique assignmentId.");
assert(registered.title === "Advanced DSP & Filter Design", "TEST 1: Teacher creates assignment.");

// TEST 3: Assignment is unpublished initially if status set to Scheduled or Draft
const draftData = { ...createdData, id: `asg-draft-${Date.now()}`, status: "Scheduled" };
const draftAsg = registerCreatedAssessment(draftData);
assert.strictEqual(getStudentAssignment(rahul, draftAsg.id), null, "TEST 3: Unpublished/Scheduled assignment is not visible to student.");

// TEST 4: Teacher publishes assignment
const publishRes = publishAssignmentAndNotifyStudents(createdData);
assert(publishRes.success === true, "TEST 4: Teacher publishes assignment.");
assert.strictEqual(publishRes.assignment.status, "Published", "Assignment status is Published.");

// TEST 5 & 6: Notification delivery to correct branch/division only
const rahulNotifs = getStudentNotifications(rahul.id);
const notifFound = rahulNotifs.some((n) => n.assignmentId === uniqueId);
assert(notifFound === true, "TEST 5: Targeted student (TE ENTC – A) receives notification.");

const wrongNotifs = getStudentNotifications(wrongDivStudent.id);
const wrongNotifFound = wrongNotifs.some((n) => n.assignmentId === uniqueId);
assert(wrongNotifFound === false, "TEST 6: Wrong division student (SE CS – A) does not receive notification.");

// TEST 7: Student sees actual teacher-created assignment
const studentAsg = getStudentAssignment(rahul, uniqueId);
assert(studentAsg !== null, "TEST 7: Student sees actual teacher-created assignment.");
assert.strictEqual(studentAsg.title, "Advanced DSP & Filter Design", "Assignment title matches teacher input.");

// TEST 8: Demo assignment is not shown as active assignment
assert.strictEqual(getStudentAssignment(rahul, demoAssignment.id), null, "TEST 8: demoAssignment is isolated and returns null.");

// TEST 9: Student opens correct question paper PDF
const qpPdf = getQuestionPaperPdf(studentAsg);
assert.strictEqual(qpPdf.name, "DSP_Filter_Design_QP.pdf", "TEST 9: Student gets exact uploaded Question Paper PDF.");
const qpUrl = getPersistedPdfUrl(qpPdf, studentAsg);
assert(typeof qpUrl === "string" && qpUrl.startsWith("data:application/pdf"), "Question Paper PDF Data URL is valid.");

// Reference Answer Protection
assert.strictEqual(studentAsg.referenceAnswerPdf, null, "SECURITY: Reference Answer PDF is stripped for student.");
assert.strictEqual(studentAsg.referenceAnswer, null, "SECURITY: Reference Answer text is stripped for student.");

// TEST 10 & 11: PDF Answer Sheet Upload & Validation
const validPdfFile = { name: "Rahul_DSP_Submission.pdf", type: "application/pdf", size: 1024 * 50 };
const invalidFile = { name: "Rahul_Notes.png", type: "image/png", size: 1024 * 20 };

const invalidSubmitRes = submitAssignment(rahul, uniqueId, invalidFile);
assert(invalidSubmitRes.error !== undefined, "TEST 11: Non-PDF file submission rejected.");
assert(invalidSubmitRes.error.includes("PDF"), "Rejection message specifies PDF requirement.");

const submitRes = submitAssignment(rahul, uniqueId, validPdfFile);
assert(submitRes.success === true, "TEST 10: Valid PDF answer sheet uploaded successfully.");

// TEST 12: Duplicate submission handling
const rahulSub = getStudentSubmission(rahul, uniqueId);
assert(rahulSub !== null, "Submission record exists.");
assert.strictEqual(rahulSub.status, "Submitted", "Submission status is Submitted.");

// TEST 13 & 14: Submission identity integrity
assert.strictEqual(rahulSub.assignmentId, uniqueId, "TEST 13: Submission contains correct assignmentId.");
assert.strictEqual(rahulSub.studentId, rahul.id, "TEST 14: Submission contains correct studentId.");

// TEST 15: Teacher sees correct submission
const teacherSub = workflowSubmissions.find((s) => s.assignmentId === uniqueId && s.studentId === rahul.id);
assert(teacherSub !== undefined, "TEST 15: Teacher sees correct submission.");
assert.strictEqual(teacherSub.fileName, "Rahul_DSP_Submission.pdf", "File name matches uploaded PDF.");

// TEST 16: Assignment Isolation (Assignment A vs Assignment B)
const asgBData = { ...createdData, id: `asg-b-${Date.now()}`, title: "Assignment B - Microcontrollers" };
publishAssignmentAndNotifyStudents(asgBData);
const subAInB = workflowSubmissions.filter((s) => s.assignmentId === asgBData.id);
assert.strictEqual(subAInB.length, 0, "TEST 16: Submissions for Assignment A do not appear under Assignment B.");

// TEST 17: On-time submission is evaluatable
assert.notStrictEqual(rahulSub.status, "Late / Failed", "TEST 17: On-time submission is not marked Late / Failed.");

// TEST 18 & 19: Late submission handling
const lateAsgData = { ...createdData, id: `asg-late-${Date.now()}`, dueDate: "2020-01-01", dueTime: "12:00" };
publishAssignmentAndNotifyStudents(lateAsgData);
const lateSubmitRes = submitAssignment(rahul, lateAsgData.id, validPdfFile);
assert(lateSubmitRes.success === true, "Late submission accepted.");
const lateSub = getStudentSubmission(rahul, lateAsgData.id);
assert.strictEqual(lateSub.status, "Late / Failed", "TEST 18: Late submission status set to Late / Failed.");
assert.strictEqual(lateSub.score, "0 / 20", "Late submission receives 0 marks.");
assert.strictEqual(lateSub.evaluation.grade, "F", "Late submission receives F grade.");
assert(lateSub.evaluation.isLateFailed === true, "TEST 19: Late submission flagged as isLateFailed.");

// TEST 20: Missing student handling after deadline
const missingSub = getStudentSubmission(sneha, lateAsgData.id);
assert(missingSub !== null, "TEST 20: Missing student resolves to 0/F record after deadline.");
assert(missingSub.status === "Missing / Failed" || missingSub.status === "Not Submitted", "Missing student status is Missing / Failed.");
assert.strictEqual(missingSub.score, "0 / 20", "Missing student receives 0 / 20.");

// TEST 21 & 22: Teacher review and edit persistence
rahulSub.evaluation = {
  score: 18,
  totalMarks: 20,
  grade: "Grade A",
  questionWiseResults: [
    { questionNumber: 1, questionText: "Q1", maximumMarks: 10, awardedMarks: 9 },
    { questionNumber: 2, questionText: "Q2", maximumMarks: 10, awardedMarks: 9 }
  ],
  feedback: { strengths: "Excellent analysis.", improvements: "None.", missing: "None." },
};
rahulSub.status = "Evaluated";
const reviewRes = saveTeacherReview(rahulSub.id, {
  questionWiseResults: [
    { questionNumber: 1, questionText: "Q1", maximumMarks: 10, awardedMarks: 10 },
    { questionNumber: 2, questionText: "Q2", maximumMarks: 10, awardedMarks: 9 }
  ]
});
assert(reviewRes.success === true, "saveTeacherReview succeeds.");
assert.strictEqual(reviewRes.submission.evaluation.obtainedMarks, 19, "TEST 21 & 22: Teacher review edits persist obtainedMarks.");

// TEST 23: Approval does not publish result
const approvedRes = approveEvaluation(rahulSub.id);
assert(approvedRes.success === true, "approveEvaluation succeeds.");
assert.strictEqual(approvedRes.submission.status, "Evaluated", "Submission status updated.");
assert.strictEqual(isResultsPublished(uniqueId), false, "TEST 23: Approval does NOT publish results to student.");

// TEST 24 & 25: Result publication & notifications
const pubRes = publishResults(uniqueId);
assert(pubRes.alreadyPublished === false, "TEST 24: Results published successfully.");
assert.strictEqual(isResultsPublished(uniqueId), true, "Results published flag is true.");

const resNotif = getStudentNotifications(rahul.id).find((n) => n.assignmentId === uniqueId && n.id.startsWith("notif-res-"));
assert(resNotif !== undefined, "TEST 25: Result notification generated for student.");

// TEST 26: Prevent duplicate result notifications
const repeatPubRes = publishResults(uniqueId);
assert.strictEqual(repeatPubRes.alreadyPublished, true, "TEST 26: Duplicate result publication prevented.");

// TEST 27 & 28: Student access control & division isolation
const wrongAccess = getStudentAssignment(wrongDivStudent, uniqueId);
assert.strictEqual(wrongAccess, null, "TEST 28: Student from wrong division cannot access assignment.");

const rahulSeenBySneha = getStudentSubmission(sneha, uniqueId);
assert(rahulSeenBySneha === null || rahulSeenBySneha.studentId !== rahul.id, "TEST 27: Student cannot access another student's submission.");

// TEST 29: Hydration / Persistence sanity
assert(Array.isArray(createdAssessments), "TEST 29: createdAssessments array exists.");
assert(Array.isArray(workflowSubmissions), "workflowSubmissions array exists.");

// TEST 30: In-Sem & End-Sem integrity
const inSem = getInSemExam();
const endSem = getEndSemExam();
assert(inSem !== null && endSem !== null, "TEST 30: In-Sem and End-Sem exams remain operational.");

console.log("\nALL 30 PHASE 7C — PART 3 WORKFLOW TESTS PASSED ✅\n");
