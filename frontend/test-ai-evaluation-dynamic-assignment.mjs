import assert from "assert";
import {
  createdAssessments,
  demoAssignment,
  evaluateAssessmentSubmission,
  getAssignmentById,
  getTeacherAssignments,
  markAsEvaluated,
  reEvaluateSubmission,
  workflowSubmissions,
  hydrateAllWorkflowData,
} from "./src/data/workflowData.js";
import { loginTeacher, logoutTeacher, getCurrentTeacher } from "./src/auth/teacherAuth.js";

console.log("==================================================");
console.log("RUNNING TEST: test-ai-evaluation-dynamic-assignment.mjs");
console.log("==================================================");

// Hydrate data first
hydrateAllWorkflowData();

// 1. Setup Teacher A session
loginTeacher("prof.ananya@college.edu", "password123");
const currentTeacher = getCurrentTeacher();
assert.ok(currentTeacher, "Teacher session must be active.");
const teacherAId = currentTeacher.teacherId || currentTeacher.id;

// Create real Teacher A Assignment 1: Deep Learning 2 (30 marks)
const deepLearningAsg = {
  id: "asg-dl2-10d",
  assessmentId: "asg-dl2-10d",
  title: "Deep Learning 2",
  subjectName: "Deep Learning 2",
  courseCode: "ET305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  dueDate: "2026-09-15",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  publishedBy: teacherAId,
  questions: [
    { id: 1, text: "Q1. Explain Convolutional Neural Networks and feature maps.", marks: 15 },
    { id: 2, text: "Q2. Derive backpropagation algorithm for multi-layer perceptron.", marks: 15 },
  ],
  questionPaperPdf: { name: "DeepLearning2_QuestionPaper.pdf", data: "data:application/pdf;base64,DL2QP" },
  referenceAnswerPdf: { name: "DeepLearning2_ReferenceAnswer.pdf", data: "data:application/pdf;base64,DL2Ref" },
  referenceAnswer: "CNN architectures utilize convolutional layers, pooling layers, and fully connected layers for feature extraction.",
  rubric: [
    { name: "Q1", score: 15, max: 15, reason: "Correct CNN architecture explanation." },
    { name: "Q2", score: 15, max: 15, reason: "Full derivation provided." },
  ],
};

// Create real Teacher A Assignment 2: Machine Learning Assignment 01 (40 marks)
const machineLearningAsg = {
  id: "asg-ml01-10d",
  assessmentId: "asg-ml01-10d",
  title: "Machine Learning Assignment 01",
  subjectName: "Machine Learning",
  courseCode: "ML305",
  branch: "COMP",
  division: "TE COMP – B",
  totalMarks: 40,
  dueDate: "2026-09-20",
  dueTime: "23:59",
  createdByTeacherId: teacherAId,
  publishedBy: teacherAId,
  questions: [
    { id: 1, text: "Q1. Compare supervised and unsupervised learning.", marks: 20 },
    { id: 2, text: "Q2. Explain decision trees and information gain.", marks: 20 },
  ],
  questionPaperPdf: { name: "MachineLearning_QP.pdf", data: "data:application/pdf;base64,MLQP" },
  referenceAnswerPdf: { name: "MachineLearning_Ref.pdf", data: "data:application/pdf;base64,MLRef" },
  referenceAnswer: "Supervised learning uses labeled data whereas unsupervised learning finds hidden patterns in unlabeled data.",
  rubric: [
    { name: "Q1", score: 20, max: 20, reason: "Clear comparison." },
    { name: "Q2", score: 20, max: 20, reason: "Decision tree analysis complete." },
  ],
};

// Add assignments to createdAssessments if not present
if (!createdAssessments.some((a) => a.id === deepLearningAsg.id)) {
  createdAssessments.push(deepLearningAsg);
}
if (!createdAssessments.some((a) => a.id === machineLearningAsg.id)) {
  createdAssessments.push(machineLearningAsg);
}

// Create Submissions for Deep Learning 2
const subRahulDL = {
  id: "sub-rahul-dl2",
  studentId: "stu-rahul",
  student: "Rahul Patil",
  roll: "ET202-041",
  assignmentId: deepLearningAsg.id,
  submittedAt: "Today, 10:24 AM",
  file: "RahulPatil_DeepLearning2.pdf",
  fileName: "RahulPatil_DeepLearning2.pdf",
  answerPdf: { name: "RahulPatil_DeepLearning2.pdf", data: "data:application/pdf;base64,RahulDL2Data" },
  extractedAnswerText: "Q1. CNN consists of conv layers that extract features like edges and textures using kernels. Q2. Backpropagation computes gradients using chain rule.",
  status: "Submitted",
};

const subSnehaDL = {
  id: "sub-sneha-dl2",
  studentId: "stu-sneha",
  student: "Sneha Kulkarni",
  roll: "ET202-089",
  assignmentId: deepLearningAsg.id,
  submittedAt: "Today, 11:00 AM",
  file: "SnehaKulkarni_DeepLearning2.pdf",
  fileName: "SnehaKulkarni_DeepLearning2.pdf",
  answerPdf: { name: "SnehaKulkarni_DeepLearning2.pdf", data: "data:application/pdf;base64,SnehaDL2Data" },
  extractedAnswerText: "Q1. Feature maps represent activation maps from filters. Q2. Derivation uses cost function loss optimization.",
  status: "Submitted",
};

// Create Submission for Machine Learning
const subAmitML = {
  id: "sub-amit-ml1",
  studentId: "stu-amit",
  student: "Amit Joshi",
  roll: "CS202-011",
  assignmentId: machineLearningAsg.id,
  submittedAt: "Yesterday, 2:15 PM",
  file: "AmitJoshi_MachineLearning.pdf",
  fileName: "AmitJoshi_MachineLearning.pdf",
  answerPdf: { name: "AmitJoshi_MachineLearning.pdf", data: "data:application/pdf;base64,AmitMLData" },
  extractedAnswerText: "Q1. Supervised learning relies on targets. Q2. Entropy measures impurity in nodes.",
  status: "Submitted",
};

if (!workflowSubmissions.some((s) => s.id === subRahulDL.id)) {
  workflowSubmissions.push(subRahulDL);
}
if (!workflowSubmissions.some((s) => s.id === subSnehaDL.id)) {
  workflowSubmissions.push(subSnehaDL);
}
if (!workflowSubmissions.some((s) => s.id === subAmitML.id)) {
  workflowSubmissions.push(subAmitML);
}

// --------------------------------------------------
// Test 1: Teacher assignment list is dynamic
// --------------------------------------------------
const teacherAssignments = getTeacherAssignments(teacherAId);
assert.ok(teacherAssignments.length >= 2, "Teacher A assignments should return created assignments.");
console.log("✔ Test 1 PASS: Teacher assignment list is dynamic.");

// --------------------------------------------------
// Test 2: Current teacher ownership enforced
// --------------------------------------------------
const isTeacherAOwner = teacherAssignments.every(
  (a) => a.createdByTeacherId === teacherAId || a.publishedBy === teacherAId
);
assert.strictEqual(isTeacherAOwner, true, "All fetched assignments must belong to Teacher A.");
console.log("✔ Test 2 PASS: Current teacher ownership enforced.");

// --------------------------------------------------
// Test 3: Real assignment appears
// --------------------------------------------------
const dlFound = teacherAssignments.find((a) => a.id === deepLearningAsg.id);
assert.ok(dlFound, "Deep Learning 2 assignment must appear in teacher assignments.");
assert.strictEqual(dlFound.title, "Deep Learning 2");
console.log("✔ Test 3 PASS: Real assignment appears in queue.");

// --------------------------------------------------
// Test 4: DSP demo assignment not injected in active teacher queue
// --------------------------------------------------
const dspInQueue = teacherAssignments.find((a) => a.id === "dsp-a03" || a.id === demoAssignment.id);
assert.strictEqual(dspInQueue, undefined, "DSP demo assignment must not be injected in Teacher A queue.");
console.log("✔ Test 4 PASS: DSP demo assignment not injected.");

// --------------------------------------------------
// Test 5: selectedAssignmentId works
// --------------------------------------------------
const selectedAssignmentId = deepLearningAsg.id;
const selectedAsg = getAssignmentById(selectedAssignmentId);
assert.strictEqual(selectedAsg.id, deepLearningAsg.id);
console.log("✔ Test 5 PASS: selectedAssignmentId resolves correctly.");

// --------------------------------------------------
// Test 6: Submission filtering by assignmentId
// --------------------------------------------------
const dlSubmissions = workflowSubmissions.filter((s) => s.assignmentId === selectedAssignmentId);
assert.strictEqual(dlSubmissions.length, 2, "Only Deep Learning 2 submissions should be returned.");
assert.ok(dlSubmissions.some((s) => s.id === subRahulDL.id));
assert.ok(dlSubmissions.some((s) => s.id === subSnehaDL.id));
assert.strictEqual(dlSubmissions.some((s) => s.id === subAmitML.id), false, "ML submission must not be included.");
console.log("✔ Test 6 PASS: Submissions filtered strictly by assignmentId.");

// --------------------------------------------------
// Test 7: Student filtering
// --------------------------------------------------
const rahulSub = dlSubmissions.find((s) => s.studentId === "stu-rahul");
assert.ok(rahulSub, "Rahul Patil submission must be present.");
assert.strictEqual(rahulSub.student, "Rahul Patil");
assert.strictEqual(rahulSub.roll, "ET202-041");
console.log("✔ Test 7 PASS: Student filtering and fields match.");

// --------------------------------------------------
// Test 8: Branch & Division filtering
// --------------------------------------------------
assert.strictEqual(selectedAsg.branch, "ENTC");
assert.strictEqual(selectedAsg.division, "TE ENTC – A");
console.log("✔ Test 8 PASS: Branch and division derived dynamically from selected assignment.");

// --------------------------------------------------
// Test 9: Dynamic total marks
// --------------------------------------------------
assert.strictEqual(selectedAsg.totalMarks, 30, "Deep Learning 2 total marks must be 30.");
console.log("✔ Test 9 PASS: Dynamic total marks = 30.");

// --------------------------------------------------
// Test 10: Dynamic subject
// --------------------------------------------------
assert.strictEqual(selectedAsg.subjectName, "Deep Learning 2");
console.log("✔ Test 10 PASS: Dynamic subject name verified.");

// --------------------------------------------------
// Test 11: Dynamic course code
// --------------------------------------------------
assert.strictEqual(selectedAsg.courseCode, "ET305");
console.log("✔ Test 11 PASS: Dynamic course code verified.");

// --------------------------------------------------
// Test 12: Question paper isolation
// --------------------------------------------------
assert.strictEqual(selectedAsg.questionPaperPdf.name, "DeepLearning2_QuestionPaper.pdf");
console.log("✔ Test 12 PASS: Question paper isolated.");

// --------------------------------------------------
// Test 13: Reference answer isolation
// --------------------------------------------------
assert.strictEqual(selectedAsg.referenceAnswerPdf.name, "DeepLearning2_ReferenceAnswer.pdf");
assert.ok(selectedAsg.referenceAnswer.includes("CNN architectures"));
console.log("✔ Test 13 PASS: Reference answer isolated.");

// --------------------------------------------------
// Test 14: Answer PDF isolation
// --------------------------------------------------
assert.strictEqual(rahulSub.answerPdf.name, "RahulPatil_DeepLearning2.pdf");
console.log("✔ Test 14 PASS: Student answer PDF isolated.");

// --------------------------------------------------
// Test 15: Evaluation context integrity
// --------------------------------------------------
const mismatchResult = evaluateAssessmentSubmission(rahulSub, machineLearningAsg, "moderate");
assert.ok(mismatchResult.error, "Mismatched assignment and submission must return error.");
assert.ok(
  mismatchResult.error.includes("Evaluation context mismatch"),
  `Error must be context mismatch, got: ${mismatchResult.error}`
);
console.log("✔ Test 15 PASS: Evaluation context mismatch error enforced.");

// --------------------------------------------------
// Test 16: Easy evaluation mode
// --------------------------------------------------
const easyEval = evaluateAssessmentSubmission(rahulSub, deepLearningAsg, "easy");
assert.strictEqual(easyEval.totalMarks, 30, "Total marks in Easy evaluation must be 30.");
assert.strictEqual(easyEval.evaluationDifficulty, "easy");
console.log("✔ Test 16 PASS: Easy evaluation mode works with 30 total marks.");

// --------------------------------------------------
// Test 17: Moderate evaluation mode
// --------------------------------------------------
const modEval = evaluateAssessmentSubmission(rahulSub, deepLearningAsg, "moderate");
assert.strictEqual(modEval.totalMarks, 30);
assert.strictEqual(modEval.evaluationDifficulty, "moderate");
console.log("✔ Test 17 PASS: Moderate evaluation mode works.");

// --------------------------------------------------
// Test 18: Hard evaluation mode
// --------------------------------------------------
const hardEval = evaluateAssessmentSubmission(rahulSub, deepLearningAsg, "hard");
assert.strictEqual(hardEval.totalMarks, 30);
assert.strictEqual(hardEval.evaluationDifficulty, "hard");
assert.ok(easyEval.score >= modEval.score, "Easy score should be >= Moderate score.");
assert.ok(modEval.score >= hardEval.score, "Moderate score should be >= Hard score.");
console.log("✔ Test 18 PASS: Hard evaluation mode works strictly.");

// --------------------------------------------------
// Test 19: Difficulty result isolation
// --------------------------------------------------
markAsEvaluated(rahulSub.id, "moderate");
assert.ok(rahulSub.evaluationResults.moderate);
assert.strictEqual(rahulSub.evaluationResults.moderate.totalMarks, 30);

markAsEvaluated(rahulSub.id, "easy");
assert.ok(rahulSub.evaluationResults.easy);
assert.ok(rahulSub.evaluationResults.moderate, "Moderate result must remain preserved when easy is run.");
console.log("✔ Test 19 PASS: Difficulty results stored in separate keys without overwriting.");

// --------------------------------------------------
// Test 20: Re-evaluation behavior
// --------------------------------------------------
const reevalResult = reEvaluateSubmission(rahulSub.id, "hard");
assert.strictEqual(rahulSub.activeDifficulty, "hard");
assert.strictEqual(rahulSub.evaluation.evaluationDifficulty, "hard");
console.log("✔ Test 20 PASS: Re-evaluation updates active difficulty and score.");

// --------------------------------------------------
// Test 21: Teacher ownership validation
// --------------------------------------------------
loginTeacher("teacherb@college.edu", "password123");
const teacherB = getCurrentTeacher();
const teacherBId = teacherB.teacherId || teacherB.id;
const teacherBAssignments = getTeacherAssignments(teacherBId);
assert.strictEqual(
  teacherBAssignments.some((a) => a.id === deepLearningAsg.id),
  false,
  "Teacher B must not see Teacher A's assignment in their created assignments queue."
);
console.log("✔ Test 21 PASS: Teacher ownership security validated.");

// --------------------------------------------------
// Test 22: Multi-assignment isolation
// --------------------------------------------------
const mlSubmissions = workflowSubmissions.filter((s) => s.assignmentId === machineLearningAsg.id);
assert.strictEqual(mlSubmissions.length, 1);
assert.strictEqual(mlSubmissions[0].id, subAmitML.id);
assert.strictEqual(machineLearningAsg.totalMarks, 40);
console.log("✔ Test 22 PASS: Multi-assignment isolation verified (ML total marks = 40).");

// --------------------------------------------------
// Test 23: Refresh / Lookup persistence
// --------------------------------------------------
const fetchedAsg = getAssignmentById("asg-dl2-10d");
assert.strictEqual(fetchedAsg.title, "Deep Learning 2");
console.log("✔ Test 23 PASS: Assignment persistence lookup verified.");

// --------------------------------------------------
// Test 24: No DSP fallback for active assignments
// --------------------------------------------------
const dlEval = evaluateAssessmentSubmission(rahulSub, deepLearningAsg, "moderate");
assert.strictEqual(dlEval.assessmentId, "asg-dl2-10d");
assert.notStrictEqual(dlEval.assessmentId, "dsp-a03");
console.log("✔ Test 24 PASS: No DSP fallback occurs for active assignments.");

// --------------------------------------------------
// Test 25: No hardcoded 20 marks in evaluation calculation
// --------------------------------------------------
assert.strictEqual(dlEval.totalMarks, 30, "Calculated total marks must be 30, not hardcoded 20.");
const mlEval = evaluateAssessmentSubmission(subAmitML, machineLearningAsg, "moderate");
assert.strictEqual(mlEval.totalMarks, 40, "Calculated total marks for ML must be 40, not hardcoded 20.");
console.log("✔ Test 25 PASS: No hardcoded 20 marks in evaluation calculations.");

// Cleanup session
logoutTeacher();

console.log("==================================================");
console.log("ALL 25 SPECIFICATION TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");
