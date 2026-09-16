import assert from "assert";
import {
  createCompliantPdfDataUrl,
  getPersistedPdfUrl,
  getQuestionPaperPdf,
  getStudentAssignment,
  publishAssignmentAndNotifyStudents,
  registerCreatedAssessment,
  createdAssessments
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("=== QUESTION PAPER PDF PERSISTENCE & DELIVERABILITY TESTS ===");

loginTeacher("teacher@college.edu", "teacher123");

const rahul = students.find((s) => s.id === "stu-rahul");
assert(rahul !== undefined, "Rahul student account exists.");

// TEST 1: Compliant PDF Data URL Generator
const compliantUrl = createCompliantPdfDataUrl("Digital Signal Processing", "ET305");
assert(typeof compliantUrl === "string", "Compliant PDF URL is a string.");
assert(compliantUrl.startsWith("data:application/pdf;base64,"), "Compliant PDF URL has data:application/pdf;base64 prefix.");

// TEST 2: PDF Resolution Helper (getPersistedPdfUrl)
const pdfRecordWithData = {
  name: "TestQP.pdf",
  size: 1024,
  type: "application/pdf",
  data: compliantUrl
};
const resolvedDataUrl = getPersistedPdfUrl(pdfRecordWithData);
assert.strictEqual(resolvedDataUrl, compliantUrl, "getPersistedPdfUrl returns embedded data URL.");

const legacyPdfMetadata = {
  name: "LegacyQP.pdf",
  size: 2048,
  type: "application/pdf"
};
const resolvedLegacyUrl = getPersistedPdfUrl(legacyPdfMetadata, { title: "Legacy Paper", course: "ET305" });
assert(typeof resolvedLegacyUrl === "string" && resolvedLegacyUrl.startsWith("data:application/pdf;base64,"), "getPersistedPdfUrl synthesizes valid PDF Data URL for legacy metadata.");

// TEST 3: Teacher Assignment 1 Creation & Publishing
const pdf1DataUrl = createCompliantPdfDataUrl("PDF VIEW TEST 001", "ET305");
const asg1Data = {
  id: "asg-pdf-test-001",
  title: "PDF VIEW TEST 001",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Test question paper delivery for Assignment 1.",
  dueDate: "2026-09-10",
  dueTime: "23:59",
  assignmentPdf: {
    name: "QuestionPaper_001.pdf",
    size: 5000,
    type: "application/pdf",
    data: pdf1DataUrl
  },
  referenceAnswerPdf: {
    name: "ReferenceAnswer_001.pdf",
    size: 4000,
    type: "application/pdf",
    data: createCompliantPdfDataUrl("Reference 001", "ET305")
  },
  referenceAnswer: "SECRET MODEL ANSWER FOR ASSIGNMENT 001"
};

const publishRes1 = publishAssignmentAndNotifyStudents(asg1Data);
const published1 = publishRes1.assignment;
assert.strictEqual(published1.title, "PDF VIEW TEST 001", "Assignment 1 published.");
assert(published1.questionPaperPdf !== null, "Assignment 1 has questionPaperPdf.");
assert.strictEqual(published1.questionPaperPdf.data, pdf1DataUrl, "Assignment 1 stores PDF data URL.");

// TEST 4: Student Access to Assignment 1 Question Paper
const studentAsg1 = getStudentAssignment(rahul, "asg-pdf-test-001");
assert(studentAsg1 !== null, "Rahul (TE ENTC – A) can access Assignment 1.");
const studentQp1 = getQuestionPaperPdf(studentAsg1);
assert.strictEqual(studentQp1.name, "QuestionPaper_001.pdf", "Rahul gets exact Question Paper 1.");
const studentQp1Url = getPersistedPdfUrl(studentQp1, studentAsg1);
assert.strictEqual(studentQp1Url, pdf1DataUrl, "Rahul gets exact PDF 1 Data URL.");

// TEST 5: REFERENCE ANSWER SECURITY — Reference answer PDF & text MUST be null for Student
assert.strictEqual(studentAsg1.referenceAnswerPdf, null, "SECURITY: Reference Answer PDF is stripped (null) from student assignment object.");
assert.strictEqual(studentAsg1.referenceAnswer, null, "SECURITY: Reference Answer text is stripped (null) from student assignment object.");

// TEST 6: Multiple Assignment PDF Isolation (Assignment 2)
const pdf2DataUrl = createCompliantPdfDataUrl("PDF VIEW TEST 002", "ET305");
const asg2Data = {
  id: "asg-pdf-test-002",
  title: "PDF VIEW TEST 002",
  subjectName: "Digital Signal Processing",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 20,
  description: "Test question paper delivery for Assignment 2.",
  dueDate: "2026-09-15",
  dueTime: "23:59",
  assignmentPdf: {
    name: "QuestionPaper_002.pdf",
    size: 7000,
    type: "application/pdf",
    data: pdf2DataUrl
  },
  referenceAnswerPdf: {
    name: "ReferenceAnswer_002.pdf",
    size: 6000,
    type: "application/pdf",
    data: createCompliantPdfDataUrl("Reference 002", "ET305")
  },
  referenceAnswer: "SECRET MODEL ANSWER FOR ASSIGNMENT 002"
};

const publishRes2 = publishAssignmentAndNotifyStudents(asg2Data);
const published2 = publishRes2.assignment;
assert.strictEqual(published2.title, "PDF VIEW TEST 002", "Assignment 2 published.");

const studentAsg2 = getStudentAssignment(rahul, "asg-pdf-test-002");
const studentQp2Url = getPersistedPdfUrl(getQuestionPaperPdf(studentAsg2), studentAsg2);
assert.strictEqual(studentQp2Url, pdf2DataUrl, "Rahul gets exact PDF 2 Data URL for Assignment 2.");
assert.notStrictEqual(studentQp1Url, studentQp2Url, "Assignment 1 and Assignment 2 deliver distinct PDF Data URLs.");

// TEST 7: Wrong Division Access Control
const wrongDivisionStudent = { id: "stu-wrong", name: "Wrong Student", branch: "CS", division: "SE CS – A" };
const accessAttempt = getStudentAssignment(wrongDivisionStudent, "asg-pdf-test-001");
assert.strictEqual(accessAttempt, null, "SECURITY: Student from wrong division (SE CS – A) cannot access TE ENTC – A Question Paper.");

console.log("\nALL QUESTION PAPER PERSISTENCE & SECURITY TESTS PASSED ✅\n");
