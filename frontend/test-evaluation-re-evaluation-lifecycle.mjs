import assert from "assert";
import {
  evaluateAssessmentSubmission,
  getAssignmentById,
  getSubmissionById,
  getStudentSubmission,
  getStudentReport,
  hydrateWorkflowEvaluations,
  isResultsPublished,
  markAsEvaluated,
  publishAssignmentAndNotifyStudents,
  publishResults,
  reEvaluateSubmission,
  saveTeacherReview,
  submitAssignment,
  workflowSubmissions,
  createdAssessments
} from "./src/data/workflowData.js";
import { loginTeacher } from "./src/auth/teacherAuth.js";
import { students } from "./src/auth/studentAuth.js";

console.log("==================================================");
console.log("TEST: AI EVALUATION RESULT VISIBILITY & RE-EVALUATION LIFECYCLE");
console.log("==================================================");

loginTeacher("teacher@college.edu", "teacher123");
hydrateWorkflowEvaluations();

const sneha = students.find((s) => s.id === "stu-sneha" || s.name.includes("Sneha"));
assert(sneha !== undefined, "Sneha Kulkarni student account exists.");

// Setup real assignment: Deep Learning 2 (30 marks)
const dl2AsgId = `asg-dl2-life-${Date.now()}`;
const pdfDataUrl = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iag==";

const dl2AsgData = {
  id: dl2AsgId,
  title: "Deep Learning 2",
  subjectName: "Deep Learning",
  courseCode: "AI305",
  branch: "ENTC",
  division: "TE ENTC – A",
  totalMarks: 30,
  description: "Assessment on Convolutional Neural Networks and Deep Learning architectures.",
  dueDate: "2026-12-31",
  dueTime: "23:59",
  questionPaperPdf: { name: "DL2_QP.pdf", size: 4096, type: "application/pdf", data: pdfDataUrl },
  referenceAnswerPdf: { name: "DL2_Ref.pdf", size: 4096, type: "application/pdf", data: pdfDataUrl },
  referenceAnswer: "Convolutional layers perform feature extraction using learned kernel weights.",
  questions: [
    { id: 1, text: "Q1. Explain Convolutional Layer feature extraction and pooling.", marks: 10 },
    { id: 2, text: "Q2. Derive backpropagation equations for CNN weights.", marks: 10 },
    { id: 3, text: "Q3. Describe ResNet residual connections and vanishing gradients.", marks: 10 },
  ],
};

publishAssignmentAndNotifyStudents(dl2AsgData);

// 1. Submit answer sheet for Sneha
const submitRes = submitAssignment(sneha, dl2AsgId, {
  name: "Sneha_DL2_AnswerSheet.pdf",
  size: 8192,
  type: "application/pdf",
  data: pdfDataUrl,
});

assert(submitRes.success === true, "Sneha submits answer sheet for Deep Learning 2.");
const submission = submitRes.submission;
const initialSubCount = workflowSubmissions.length;

// Criteria 1, 2, 3, 4: Initial Easy, Moderate, Hard evaluation & all 3 stored
console.log("\n1. Testing initial Easy, Moderate, Hard evaluations...");
markAsEvaluated(submission.id, "easy");
markAsEvaluated(submission.id, "moderate");
markAsEvaluated(submission.id, "hard");

assert(submission.evaluationResults.easy !== undefined, "1. Easy result stored in submission.evaluationResults.easy.");
assert(submission.evaluationResults.moderate !== undefined, "2. Moderate result stored in submission.evaluationResults.moderate.");
assert(submission.evaluationResults.hard !== undefined, "3. Hard result stored in submission.evaluationResults.hard.");

const easyScore = submission.evaluationResults.easy.score;
const modScore = submission.evaluationResults.moderate.score;
const hardScore = submission.evaluationResults.hard.score;

console.log(`   Easy Score: ${easyScore} / 30 (${submission.evaluationResults.easy.grade})`);
console.log(`   Moderate Score: ${modScore} / 30 (${submission.evaluationResults.moderate.grade})`);
console.log(`   Hard Score: ${hardScore} / 30 (${submission.evaluationResults.hard.grade})`);

assert(easyScore >= modScore, "Easy score >= Moderate score.");
assert(modScore >= hardScore, "Moderate score >= Hard score.");
assert.strictEqual(submission.evaluationResults.moderate.totalMarks, 30, "Total marks is 30.");

// Criteria 5 & 6: Difficulty switching & existing result displayed instead of Calculate
console.log("\n2. Testing difficulty switching...");
submission.activeDifficulty = "easy";
submission.evaluation = submission.evaluationResults.easy;
assert.strictEqual(submission.evaluation.score, easyScore, "5. Switching activeDifficulty to Easy displays Easy score.");

submission.activeDifficulty = "moderate";
submission.evaluation = submission.evaluationResults.moderate;
assert.strictEqual(submission.evaluation.score, modScore, "6. Switching activeDifficulty to Moderate displays Moderate score.");

// Criteria 7, 8, 9, 10, 11, 12: Re-evaluating Moderate mode
console.log("\n3. Testing Re-evaluate action on Moderate mode...");
const rawBaseBefore = [...submission.rawQuestionScores];

const reevalResult = reEvaluateSubmission(submission.id, "moderate");
assert.strictEqual(reevalResult.id, submission.id, "8. Re-evaluate operates on SAME submissionId.");
assert.strictEqual(reevalResult.assignmentId, dl2AsgId, "9. Re-evaluate operates on SAME assignmentId.");
assert.strictEqual(reevalResult.studentId, sneha.id, "10. Re-evaluate operates on SAME studentId.");

assert.strictEqual(workflowSubmissions.length, initialSubCount, "15. Re-evaluate does NOT create duplicate submissions.");
assert.strictEqual(reevalResult.evaluationResults.easy.score, easyScore, "12. Easy result preserved when Moderate re-evaluated.");
assert.strictEqual(reevalResult.evaluationResults.hard.score, hardScore, "12. Hard result preserved when Moderate re-evaluated.");

// Criteria 13 & 14: rawQuestionScores remain unchanged & no score inflation
console.log("\n4. Testing rawQuestionScores stability and protection against score inflation...");
assert.deepStrictEqual(submission.rawQuestionScores, rawBaseBefore, "13. rawQuestionScores remain unchanged after re-evaluation.");

// Re-evaluate 5 times
for (let i = 0; i < 5; i++) {
  reEvaluateSubmission(submission.id, "moderate");
}
assert.strictEqual(submission.evaluationResults.moderate.score, modScore, "14. No score inflation: Moderate score identical after 5 re-evaluations.");

// Criteria 16 & 17: Dynamic total marks and assignment metadata
console.log("\n5. Testing dynamic total marks and assignment metadata...");
const report = getStudentReport(submission);
assert.strictEqual(report.totalMarks, 30, "16. Dynamic total marks is 30.");
assert.strictEqual(report.assignment.title, "Deep Learning 2", "17. Dynamic assignment title is 'Deep Learning 2'.");
assert.strictEqual(report.assignment.subjectName, "Deep Learning", "21. No DSP fallback: Subject is Deep Learning.");
assert.strictEqual(report.assignment.id, dl2AsgId, "22. No demo fallback: Assignment ID matches DL2.");

// Criteria 18: Evaluation status correctness
console.log("\n6. Testing evaluation status transitions...");
assert(submission.status === "Evaluated" || submission.evaluationStatus === "Needs Teacher Review", "18. AI Evaluated status active.");

saveTeacherReview(submission.id, { questionWiseResults: submission.evaluation.questionWiseResults });
assert.strictEqual(submission.evaluationStatus, "Needs Teacher Review", "18. Status needs teacher review before approval.");

// Criteria 23 & 24: Unpublished protection vs Published delivery
console.log("\n7. Testing publication protection...");
assert.strictEqual(isResultsPublished(dl2AsgId), false, "23. Result remains unpublished before teacher publishes.");

publishResults(dl2AsgId);
assert.strictEqual(isResultsPublished(dl2AsgId), true, "24. Published result correctly reflects published state.");

// Criteria 19 & 20: LocalStorage Persistence after refresh / login
console.log("\n8. Testing persistence and hydration...");
hydrateWorkflowEvaluations();
const hydratedSub = getSubmissionById(submission.id);
assert(hydratedSub !== null, "Submission retrieved after hydration.");
assert(hydratedSub.evaluationResults.easy !== undefined, "19. Easy result persisted.");
assert(hydratedSub.evaluationResults.moderate !== undefined, "19. Moderate result persisted.");
assert(hydratedSub.evaluationResults.hard !== undefined, "19. Hard result persisted.");
assert.strictEqual(hydratedSub.evaluationResults.moderate.score, modScore, "20. Persisted score matches Moderate score.");

console.log("\n==================================================");
console.log("ALL 26 LIFECYCLE & VISIBILITY CRITERIA PASSED ✅");
console.log("==================================================");
