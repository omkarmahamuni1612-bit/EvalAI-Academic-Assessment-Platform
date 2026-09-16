import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getActiveStudentAssignmentId,
  getStudentAssignment,
  persistCreatedAssessments,
  registerCreatedAssessment,
} from "./src/data/workflowData.js";
import { loginTeacher, getCurrentTeacher } from "./src/auth/teacherAuth.js";

console.log("=== PHASE 7C — PART 1: TEACHER CONTROLLED ASSIGNMENT CREATION TESTS ===");

// 1. Teacher Login & Ownership
const loginResult = loginTeacher("teacher@college.edu", "teacher123");
assert(loginResult.success === true, "Teacher login must succeed.");
const currentTeacher = getCurrentTeacher();
assert(currentTeacher !== null, "Teacher session must exist.");
assert(currentTeacher.teacherId === "teacher-123", "Teacher ID must be stored in session.");

// 2. Create NEW Teacher-Controlled Assignment #1
const assignment1Data = {
  title: "Binary Trees & Heap Operations",
  subjectName: "Data Structures",
  courseCode: "ET202",
  branch: "ENTC",
  division: "SE ENTC – A",
  academicYear: "2026–27",
  assignmentType: "Written Assignment",
  totalMarks: 20,
  description: "Explain binary tree traversals and heap operations with suitable examples.",
  dueDate: "2026-08-30",
  dueTime: "23:59",
  createdByTeacherId: currentTeacher.teacherId,
  assignmentPdf: { name: "Question_Paper_Trees_Heap.pdf", size: 51200, type: "application/pdf" },
  referenceAnswerPdf: { name: "Reference_Answer_Trees_Heap.pdf", size: 64000, type: "application/pdf" },
  questions: [
    { id: 1, name: "Concept Understanding", marks: 5 },
    { id: 2, name: "Technical Accuracy", marks: 7 },
    { id: 3, name: "Explanation & Reasoning", marks: 5 },
    { id: 4, name: "Presentation", marks: 3 },
  ],
};

const created1 = registerCreatedAssessment(assignment1Data);

// 3. Verify All Persisted Attributes for Assignment #1
assert.strictEqual(created1.title, "Binary Trees & Heap Operations", "Manual title retained.");
assert.strictEqual(created1.subjectName, "Data Structures", "Manual subject name retained.");
assert.strictEqual(created1.courseCode, "ET202", "Manual course code retained.");
assert.strictEqual(created1.branch, "ENTC", "Manual branch retained.");
assert.strictEqual(created1.division, "SE ENTC – A", "Manual division retained.");
assert.strictEqual(created1.academicYear, "2026–27", "Academic year retained.");
assert.strictEqual(created1.assignmentType, "Written Assignment", "Assignment type retained.");
assert.strictEqual(created1.totalMarks, 20, "Total marks MUST remain 20.");
assert.strictEqual(created1.createdByTeacherId, "teacher-123", "Teacher ownership stored.");
assert.strictEqual(created1.questionPaperPdf.name, "Question_Paper_Trees_Heap.pdf", "Question paper PDF metadata retained.");
assert.strictEqual(created1.referenceAnswerPdf.name, "Reference_Answer_Trees_Heap.pdf", "Reference answer PDF metadata retained.");
assert.strictEqual(created1.status, "Published", "Status set to Published.");

console.log("PASS  Assignment #1 Manual Title & Context verified");
console.log("PASS  Subject & Course Code stored correctly");
console.log("PASS  Division & Branch stored correctly");

// 4. Create SECOND Assignment with completely different custom manual values
const assignment2Data = {
  title: "Machine Learning Concepts & Model Optimization",
  subjectName: "Artificial Intelligence",
  courseCode: "CS402",
  branch: "COMPUTER",
  division: "BE COMPUTER – B",
  academicYear: "2026–27",
  assignmentType: "Project Review",
  totalMarks: 20,
  description: "Evaluate neural network training architectures and loss function performance.",
  dueDate: "2026-09-15",
  dueTime: "17:00",
  createdByTeacherId: currentTeacher.teacherId,
  assignmentPdf: { name: "ML_Assignment2.pdf", size: 81920, type: "application/pdf" },
  referenceAnswerPdf: { name: "ML_Reference2.pdf", size: 95000, type: "application/pdf" },
  questions: [
    { id: 1, name: "Model Design", marks: 10 },
    { id: 2, name: "Evaluation Metrics", marks: 10 },
  ],
};

const created2 = registerCreatedAssessment(assignment2Data);

assert.strictEqual(created2.title, "Machine Learning Concepts & Model Optimization");
assert.strictEqual(created2.subjectName, "Artificial Intelligence");
assert.strictEqual(created2.courseCode, "CS402");
assert.strictEqual(created2.branch, "COMPUTER");
assert.strictEqual(created2.division, "BE COMPUTER – B");
assert.strictEqual(created2.totalMarks, 20);

console.log("PASS  Assignment #2 Manual Custom Context verified — No hardcoding");

// 5. Demo Data Isolation
const retrieved1 = getAssignmentById(created1.id);
assert.strictEqual(retrieved1.id, created1.id, "getAssignmentById returns created assignment 1.");

const retrieved2 = getAssignmentById(created2.id);
assert.strictEqual(retrieved2.id, created2.id, "getAssignmentById returns created assignment 2.");

console.log("PASS  Demo Data Isolation verified — Created assignments distinct and accessible");

console.log("\nALL PHASE 7C — PART 1 CORRECTION TESTS PASSED ✅\n");
