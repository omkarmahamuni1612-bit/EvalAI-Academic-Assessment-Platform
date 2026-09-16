// Verification test for the Grade Sheet data logic.
// Defines students inline (matching the actual student directory) to avoid
// Node ESM extensionless-import limitations in pre-existing modules.
import { inSemExam, inSemSubmissions } from "./src/data/inSemData.js";
import { endSemExam, endSemSubmissions } from "./src/data/endSemData.js";

// Students derived from workflowSubmissions (the same source as studentAuth.js)
const students = [
  { id: "stu-rahul", name: "Rahul Patil", roll: "ET202-041" },
  { id: "stu-sneha", name: "Sneha Kulkarni", roll: "ET202-089" },
  { id: "stu-aarav", name: "Aarav Sharma", roll: "ET202-012" },
  { id: "stu-priya", name: "Priya Deshmukh", roll: "ET202-056" },
  { id: "stu-rohan", name: "Rohan Jadhav", roll: "ET202-102" },
  { id: "stu-ananya", name: "Ananya Kulkarni", roll: "ET202-077" },
  { id: "stu-aditya", name: "Aditya Shinde", roll: "ET202-034" },
];

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

function buildRows(submissions, exam) {
  return students.map((student, index) => {
    const submission = submissions.find(
      (item) =>
        item.rollNumber === student.roll ||
        item.studentId === student.id ||
        item.studentName === student.name,
    ) || null;
    const evaluation = submission?.evaluation || null;
    return {
      srNo: index + 1,
      rollNumber: student.roll,
      studentName: student.name,
      classDivision: exam.division,
      subject: exam.subject,
      examination: exam.title,
      totalMarks: exam.totalMarks,
      obtainedMarks: evaluation ? evaluation.score : "—",
      percentage: evaluation ? Math.round((evaluation.score / evaluation.totalMarks) * 100) : "—",
      grade: evaluation ? evaluation.grade : "—",
      status: evaluation ? "Results Pending Publication" : "Pending Evaluation",
    };
  });
}

const insemRows = buildRows(inSemSubmissions, inSemExam);
const endsemRows = buildRows(endSemSubmissions, endSemExam);

// ---- 1. All students present ----
check("students directory has 7 entries", students.length === 7, `(${students.length})`);

// ---- 2. In-Sem grade sheet ----
check("In-Sem has one row per student", insemRows.length === students.length, `(${insemRows.length} vs ${students.length})`);
check("In-Sem total marks is 30", insemRows[0].totalMarks === 30, `(${insemRows[0].totalMarks})`);
check("In-Sem Rahul has marks 25", insemRows.find((r) => r.rollNumber === "ET202-041")?.obtainedMarks === 25, `(${insemRows.find((r) => r.rollNumber === "ET202-041")?.obtainedMarks})`);
check("In-Sem Sneha has marks 22", insemRows.find((r) => r.rollNumber === "ET202-089")?.obtainedMarks === 22, `(${insemRows.find((r) => r.rollNumber === "ET202-089")?.obtainedMarks})`);
check("In-Sem pending students show Pending Evaluation", insemRows.filter((r) => r.obtainedMarks === "—").every((r) => r.status === "Pending Evaluation"), "(not pending)");
check("In-Sem marks never exceed 30", insemRows.every((r) => r.obtainedMarks === "—" || r.obtainedMarks <= 30), "(exceeds)");

// ---- 3. End-Sem grade sheet ----
check("End-Sem has one row per student", endsemRows.length === students.length, `(${endsemRows.length} vs ${students.length})`);
check("End-Sem total marks is 60", endsemRows[0].totalMarks === 60, `(${endsemRows[0].totalMarks})`);
check("End-Sem Rahul has marks 48", endsemRows.find((r) => r.rollNumber === "ET202-041")?.obtainedMarks === 48, `(${endsemRows.find((r) => r.rollNumber === "ET202-041")?.obtainedMarks})`);
check("End-Sem Sneha has marks 42", endsemRows.find((r) => r.rollNumber === "ET202-089")?.obtainedMarks === 42, `(${endsemRows.find((r) => r.rollNumber === "ET202-089")?.obtainedMarks})`);
check("End-Sem marks never exceed 60", endsemRows.every((r) => r.obtainedMarks === "—" || r.obtainedMarks <= 60), "(exceeds)");

// ---- 4. Data isolation ----
check("In-Sem Rahul marks NOT equal End-Sem Rahul marks", insemRows.find((r) => r.rollNumber === "ET202-041")?.obtainedMarks !== endsemRows.find((r) => r.rollNumber === "ET202-041")?.obtainedMarks, "(same)");
check("In-Sem max is 25 (not 48)", Math.max(...insemRows.map((r) => r.obtainedMarks === "—" ? 0 : r.obtainedMarks)) === 25, "(wrong)");
check("End-Sem max is 48 (not 25)", Math.max(...endsemRows.map((r) => r.obtainedMarks === "—" ? 0 : r.obtainedMarks)) === 48, "(wrong)");

console.log("\n" + results.join("\n"));
console.log(`\n${failures === 0 ? "ALL TESTS PASSED ✅" : `${failures} TEST(S) FAILED ❌`}`);
process.exit(failures === 0 ? 0 : 1);