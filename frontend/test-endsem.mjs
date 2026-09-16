// Verification test for End-Sem Examination (Phase 3C) data isolation.
// Run with: node frontend/test-endsem.mjs
import {
  getEndSemExam,
  getEndSemSubmissionByStudent,
  getEndSemStudentResult,
  getEndSemStudentStatus,
  isEndSemResultsPublished,
  mapEndSemAnswerSheetToStudent,
  publishEndSemResults,
  startEndSemEvaluation,
} from "./src/data/endSemData.js";

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

// Mock students matching the auth module
const rahul = { id: "stu-rahul", name: "Rahul Patil", roll: "ET202-041" };
const sneha = { id: "stu-sneha", name: "Sneha Kulkarni", roll: "ET202-089" };

// ---- 1. Exam metadata ----
const exam = getEndSemExam();
check("exam assessmentType is end-sem", exam.assessmentType === "end-sem", `(${exam.assessmentType})`);
check("exam has question paper PDF", Boolean(exam.questionPaperPdf), "(missing)");
check("exam has reference answer PDF", Boolean(exam.referenceAnswerPdf), "(missing)");

// ---- 2. Student mapping ----
const rahulSub = getEndSemSubmissionByStudent(rahul);
const snehaSub = getEndSemSubmissionByStudent(sneha);
check("Rahul has a submission", Boolean(rahulSub), "(missing)");
check("Sneha has a submission", Boolean(snehaSub), "(missing)");
check("Rahul's submission maps to Rahul", rahulSub?.studentId === "stu-rahul", `(${rahulSub?.studentId})`);
check("Sneha's submission maps to Sneha", snehaSub?.studentId === "stu-sneha", `(${snehaSub?.studentId})`);
check("Rahul's roll is correct", rahulSub?.rollNumber === "ET202-041", `(${rahulSub?.rollNumber})`);
check("Sneha's roll is correct", snehaSub?.rollNumber === "ET202-089", `(${snehaSub?.rollNumber})`);
check("Rahul's file is different from Sneha's", rahulSub?.fileName !== snehaSub?.fileName, "(same file)");
check("Rahul's evaluationId is different from Sneha's", rahulSub?.evaluationId !== snehaSub?.evaluationId, "(same eval)");

// ---- 3. Data isolation: student result ----
// Before publish, no student can see a result
const rahulResultBefore = getEndSemStudentResult(rahul);
const snehaResultBefore = getEndSemStudentResult(sneha);
check("Rahul cannot see result before publish", rahulResultBefore === null, "(result visible)");
check("Sneha cannot see result before publish", snehaResultBefore === null, "(result visible)");

// ---- 4. Student status before publish ----
const rahulStatus = getEndSemStudentStatus(rahul);
const snehaStatus = getEndSemStudentStatus(sneha);
check("Rahul status is Under Evaluation", rahulStatus.key === "under-evaluation", `(${rahulStatus.key})`);
check("Sneha status is Under Evaluation", snehaStatus.key === "under-evaluation", `(${snehaStatus.key})`);

// ---- 5. Map answer sheet to student ----
const rahulFile = { name: "RahulPatil_EndSem_AnswerSheet.pdf", size: 1024, type: "application/pdf" };
const snehaFile = { name: "SnehaKulkarni_EndSem_AnswerSheet.pdf", size: 1024, type: "application/pdf" };

const mapRahul = mapEndSemAnswerSheetToStudent(rahul, rahulFile);
const mapSneha = mapEndSemAnswerSheetToStudent(sneha, snehaFile);
check("Map Rahul succeeds", mapRahul.success === true, `(${JSON.stringify(mapRahul)})`);
check("Map Sneha succeeds", mapSneha.success === true, `(${JSON.stringify(mapSneha)})`);
check("Rahul's mapped file is correct", mapRahul.submission?.fileName === "RahulPatil_EndSem_AnswerSheet.pdf", `(${mapRahul.submission?.fileName})`);
check("Sneha's mapped file is correct", mapSneha.submission?.fileName === "SnehaKulkarni_EndSem_AnswerSheet.pdf", `(${mapSneha.submission?.fileName})`);

// ---- 6. Start AI evaluation ----
const rahulEval = startEndSemEvaluation(rahulSub.id, "moderate");
const snehaEval = startEndSemEvaluation(snehaSub.id, "moderate");
check("Rahul evaluation completed", rahulEval?.status === "Evaluation Completed", `(${rahulEval?.status})`);
check("Sneha evaluation completed", snehaEval?.status === "Evaluation Completed", `(${snehaEval?.status})`);
check("Rahul has a score", rahulEval?.evaluation?.score > 0, `(${rahulEval?.evaluation?.score})`);
check("Sneha has a score", snehaEval?.evaluation?.score > 0, `(${snehaEval?.evaluation?.score})`);
check("Rahul's score is different from Sneha's", rahulEval?.evaluation?.score !== snehaEval?.evaluation?.score, `(${rahulEval?.evaluation?.score} vs ${snehaEval?.evaluation?.score})`);

// ---- 7. After evaluation, still no result visible to students ----
const rahulResultAfterEval = getEndSemStudentResult(rahul);
const snehaResultAfterEval = getEndSemStudentResult(sneha);
check("Rahul still cannot see result after eval", rahulResultAfterEval === null, "(result visible)");
check("Sneha still cannot see result after eval", snehaResultAfterEval === null, "(result visible)");

// ---- 8. Publish results ----
const publishResult = publishEndSemResults();
check("Publish succeeds", publishResult.alreadyPublished === false && publishResult.incomplete !== true, `(${JSON.stringify(publishResult)})`);
check("Publish generates notifications", publishResult.notifications.length === 2, `(${publishResult.notifications.length})`);
check("Publish is now published", isEndSemResultsPublished() === true, "(not published)");

// ---- 9. After publish, students can see their own results ----
const rahulResultAfter = getEndSemStudentResult(rahul);
const snehaResultAfter = getEndSemStudentResult(sneha);
check("Rahul can see result after publish", Boolean(rahulResultAfter), "(missing)");
check("Sneha can see result after publish", Boolean(snehaResultAfter), "(missing)");
check("Rahul's result is Rahul's", rahulResultAfter?.studentId === "stu-rahul", `(${rahulResultAfter?.studentId})`);
check("Sneha's result is Sneha's", snehaResultAfter?.studentId === "stu-sneha", `(${snehaResultAfter?.studentId})`);
check("Rahul's result score is not Sneha's", rahulResultAfter?.evaluation?.score !== snehaResultAfter?.evaluation?.score, "(same score)");

// ---- 10. Student status after publish ----
const rahulStatusAfter = getEndSemStudentStatus(rahul);
const snehaStatusAfter = getEndSemStudentStatus(sneha);
check("Rahul status is Result Published", rahulStatusAfter.key === "result-published", `(${rahulStatusAfter.key})`);
check("Sneha status is Result Published", snehaStatusAfter.key === "result-published", `(${snehaStatusAfter.key})`);

// ---- 11. No cross-student data leakage ----
check("Rahul's result does not contain Sneha's data", rahulResultAfter?.studentName !== "Sneha Kulkarni", "(leak)");
check("Sneha's result does not contain Rahul's data", snehaResultAfter?.studentName !== "Rahul Patil", "(leak)");
check("Rahul's result file is Rahul's", rahulResultAfter?.fileName === "RahulPatil_EndSem_AnswerSheet.pdf", `(${rahulResultAfter?.fileName})`);
check("Sneha's result file is Sneha's", snehaResultAfter?.fileName === "SnehaKulkarni_EndSem_AnswerSheet.pdf", `(${snehaResultAfter?.fileName})`);

console.log("\n" + results.join("\n"));
console.log(`\n${failures === 0 ? "ALL TESTS PASSED ✅" : `${failures} TEST(S) FAILED ❌`}`);
process.exit(failures === 0 ? 0 : 1);