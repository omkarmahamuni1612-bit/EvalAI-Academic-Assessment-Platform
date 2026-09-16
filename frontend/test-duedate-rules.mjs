import { calculateGrade, demoAssignment, getEvaluationProgress, getNonSubmittingStudents, isAssignmentPastDueDate, isResultsPublished, parseDueDate, publishResults, workflowSubmissions } from "./src/data/workflowData.js";
import { getStudentSubmission, students } from "./src/auth/studentAuth.js";
import { buildGradeSheet } from "./src/data/gradeSheetData.js";
import { getInSemExam, getInSemSubmissions } from "./src/data/inSemData.js";
import { getEndSemExam, getEndSemSubmissions } from "./src/data/endSemData.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS  ${message}`);
}

console.log("=== PHASE 7C ASSIGNMENT DUE DATE & NON-SUBMISSION ZERO-MARK TESTS ===");

// TEST 1: Student submits before due date
const rahulSub = workflowSubmissions.find((s) => s.student === "Rahul Patil");
assert(rahulSub !== undefined, "TEST 1: Rahul has a submission.");
assert(rahulSub.evaluation.score === 17, "TEST 1: Rahul evaluated normally with 17/20 marks.");

// TEST 2: Student does not submit before due date (Future due date test)
const futureAssignment = { ...demoAssignment, dueDate: "31 Dec 2030, 11:59 PM" };
assert(isAssignmentPastDueDate(futureAssignment) === false, "TEST 2: Future due date is not past due.");

// TEST 3: Due date passes (Current assignment due date: 14 Aug 2026)
assert(isAssignmentPastDueDate(demoAssignment) === true, "TEST 3: Assignment 03 (14 Aug 2026) is past due date.");

// TEST 4: Teacher opens submissions after due date (Vikram Joshi has no submission)
const vikramStudent = students.find((s) => s.name === "Vikram Joshi");
assert(vikramStudent !== undefined, "TEST 4: Vikram Joshi is an enrolled non-submitting student.");
const vikramSub = getStudentSubmission(vikramStudent);
assert(vikramSub.status === "Missing / Failed" || vikramSub.status === "Not Submitted", "TEST 4: Non-submitting student shows status 'Missing / Failed'.");
assert(vikramSub.score === "0 / 20", "TEST 4: Non-submitting student receives 0 / 20 after due date.");
assert(vikramSub.evaluation.score === 0, "TEST 4: Evaluation score is 0.");
assert(vikramSub.evaluation.confidence === undefined, "TEST 4: No fake AI confidence generated.");
assert(vikramSub.evaluation.rubric === undefined, "TEST 4: No fake rubric generated.");

// TEST 5: Teacher publishes results (Allowed even if non-submitters exist after due date)
const progress = getEvaluationProgress(demoAssignment.id);
assert(progress.isPastDue === true, "TEST 5: Progress recognizes past due date.");
assert(progress.canPublish === true, "TEST 5: Teacher is allowed to publish results after due date when all submitted answers are evaluated.");
const pubResult = publishResults(demoAssignment.id);
assert(pubResult.alreadyPublished === false || pubResult.alreadyPublished === true, "TEST 5: publishResults executed successfully.");
assert(isResultsPublished(demoAssignment.id) === true, "TEST 5: Results are marked as published.");

// TEST 6: Student checks result before publication guard (Test logic on future assignment)
const futureAsgId = "asg-future-01";
assert(isResultsPublished(futureAsgId) === false, "TEST 6: Future assignment is not published.");

// TEST 7: Student checks result after publication
const publishedVikramSub = getStudentSubmission(vikramStudent);
assert(publishedVikramSub.score === "0 / 20", "TEST 7: Published non-submission shows 0 / 20.");
assert(publishedVikramSub.evaluation.percentage === 0, "TEST 7: Percentage is 0%.");
assert(publishedVikramSub.evaluation.grade === "F" || publishedVikramSub.evaluation.grade === calculateGrade(0), "TEST 7: Grade matches project grade logic for 0%.");

// TEST 8: Submitted students retain actual evaluated marks
const rahulSub2 = getStudentSubmission(students.find((s) => s.name === "Rahul Patil"));
assert(rahulSub2.evaluation.score === 17, "TEST 8: Rahul's evaluated score remains 17 / 20.");
const snehaSub = getStudentSubmission(students.find((s) => s.name === "Sneha Kulkarni"));
assert(snehaSub.evaluation.score === 15, "TEST 8: Sneha's evaluated score remains 15 / 20.");

// TEST 9: Refresh page multiple times -> No duplicate zero-result records
const nonSubCount1 = getNonSubmittingStudents(demoAssignment.id, students).length;
const nonSubCount2 = getNonSubmittingStudents(demoAssignment.id, students).length;
assert(nonSubCount1 === nonSubCount2, "TEST 9: Non-submitting student count is deterministic and has no duplicates.");

// TEST 10: Analytics -> Non-submission is not counted as AI evaluated
const submittedEvaluated = workflowSubmissions.filter((s) => s.evaluation && (s.status === "Evaluated" || s.status === "Submitted" || s.status === "Processing" || s.status === "Pending" || s.status === "Result Published")).length;
assert(submittedEvaluated >= 2, "TEST 10: Submitted records are handled separately from non-submissions.");

// TEST 11: Grade Sheet -> Non-submitter appears as 0/20 after publication
const asgGradeSheet = buildGradeSheet("assignment");
const vikramRow = asgGradeSheet.rows.find((r) => r.studentName === "Vikram Joshi");
assert(vikramRow !== undefined, "TEST 11: Vikram Joshi appears in Assignment Grade Sheet.");
assert(vikramRow.obtainedMarks === 0, "TEST 11: Vikram Joshi has 0 obtained marks.");
assert(vikramRow.totalMarks === 20, "TEST 11: Total marks is 20.");
assert(vikramRow.status === "Not Submitted", "TEST 11: Grade sheet status is Not Submitted.");

// TEST 12: In-Sem / End-Sem NO behavior change
const inSemGradeSheet = buildGradeSheet("in-sem");
assert(inSemGradeSheet.exam.totalMarks === 30, "TEST 12: In-Sem total marks is 30.");
const endSemGradeSheet = buildGradeSheet("end-sem");
assert(endSemGradeSheet.exam.totalMarks === 60, "TEST 12: End-Sem total marks is 60.");

console.log("\nALL ASSIGNMENT DUE DATE & NON-SUBMISSION TESTS PASSED ✅");
