// ===== GRADE SHEET DATA (Reports Center Enhancement) =====
// Builds complete examination grade sheets for Assignment, In-Sem, and End-Sem.
// Uses the existing verified assessment/evaluation data — never mock marks.
// Reuses the existing grading logic (evaluation.grade) — no new grading system.

import { students } from "../auth/studentAuth.js";
import { getCurrentTeacher } from "../auth/teacherAuth.js";
import {
  calculateGrade,
  createdAssessments,
  demoAssignment,
  getAssignmentById,
  getTeacherAssignments,
  isAssignmentPastDueDate,
  isResultsPublished,
  workflowSubmissions,
} from "./workflowData.js";
import {
  getInSemExam,
  inSemExam,
  inSemSubmissions,
  isInSemResultsPublished,
} from "./inSemData.js";
import {
  getEndSemExam,
  endSemExam,
  endSemSubmissions,
  isEndSemResultsPublished,
} from "./endSemData.js";

// Available filter options for the grade sheet UI.
export const gradeSheetFilters = {
  "assignment": {
    type: "assignment",
    label: "Assignment — Grade Sheet",
    exam: demoAssignment,
    classDivisions: [demoAssignment.division || "SE ENTC – A"],
    subjects: [demoAssignment.subject || "Digital Signal Processing"],
    examinations: [demoAssignment.shortTitle || "Assignment 03"],
  },
  "in-sem": {
    type: "in-sem",
    label: "In-Sem Examination — Grade Sheet",
    exam: inSemExam,
    classDivisions: [inSemExam.division],
    subjects: [inSemExam.subject],
    examinations: [inSemExam.title],
  },
  "end-sem": {
    type: "end-sem",
    label: "End-Sem Examination — Grade Sheet",
    exam: endSemExam,
    classDivisions: [endSemExam.division],
    subjects: [endSemExam.subject],
    examinations: [endSemExam.title],
  },
};

// Derive the evaluation status for a student in a grade sheet.
function deriveStatus(submission, published, type = "in-sem") {
  if (type === "assignment" && (!submission || submission.status === "Pending" || submission.status === "Not Submitted")) {
    return "Not Submitted";
  }
  if (!submission || !submission.evaluation) return "Pending Evaluation";
  if (published || submission.status === "Result Published" || submission.evaluationStatus === "PUBLISHED") return "Published";
  if (submission.status === "Approved" || submission.evaluationStatus === "Approved" || submission.evaluation?.evaluationStatus === "Approved") return "Approved";
  if (submission.status === "Evaluated" || submission.status === "Evaluation Completed") return "Evaluated";
  return "Pending Evaluation";
}

const normStr = (str) => String(str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

// Build the complete grade sheet for ALL students in the class/division dynamically.
export function buildGradeSheet(type = "assignment", selectedId = null) {
  let exam = null;
  let submissions = [];
  let published = false;
  let isPastDue = false;

  const currentTeacher = getCurrentTeacher();
  const teacherId = currentTeacher?.teacherId || currentTeacher?.id;

  if (type === "assignment") {
    const teacherAssgs = teacherId ? getTeacherAssignments(teacherId) : [];
    if (selectedId) {
      exam = getAssignmentById(selectedId);
    } else if (teacherAssgs.length > 0) {
      exam = teacherAssgs[0];
    } else {
      exam = null;
    }

    if (exam && (exam.id === demoAssignment.id || exam.id === "dsp-a03")) {
      exam = null;
    }

    // Verify teacher ownership: a teacher can never view another teacher's assignment grade sheet
    if (exam && teacherId && exam.createdByTeacherId && exam.createdByTeacherId !== teacherId) {
      exam = null; // Ownership violation
    }

    if (!exam) {
      return {
        type: "assignment",
        exam: null,
        rows: [],
        published: false,
        summary: {
          totalStudents: 0,
          evaluatedStudents: 0,
          pendingEvaluations: 0,
          averageMarks: 0,
          highestMarks: 0,
          lowestMarks: 0,
          passPercentage: 0,
        },
      };
    }

    submissions = workflowSubmissions.filter(
      (s) => s.assignmentId === exam.id || s.assessmentId === exam.id
    );
    published = isResultsPublished(exam.id);
    isPastDue = isAssignmentPastDueDate(exam);
  } else if (type === "in-sem") {
    const createdInSems = (createdAssessments || []).filter(
      (a) => (a.assessmentType === "in-sem" || a.assessmentCategory === "in-sem") && (!teacherId || a.createdByTeacherId === teacherId)
    );
    if (selectedId) {
      exam = createdInSems.find((a) => a.id === selectedId) || (typeof getInSemExam === "function" ? getInSemExam(selectedId) : inSemExam);
    } else {
      exam = createdInSems[0] || (typeof getInSemExam === "function" ? getInSemExam() : inSemExam);
    }

    if (!exam) {
      return {
        type: "in-sem",
        exam: null,
        rows: [],
        published: false,
        summary: { totalStudents: 0, evaluatedStudents: 0, pendingEvaluations: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0, passPercentage: 0 },
      };
    }

    submissions = inSemSubmissions.filter((s) => s.assessmentId === exam.id || (!s.assessmentId && exam.id === "insem-01"));
    published = isInSemResultsPublished();
  } else if (type === "end-sem") {
    const createdEndSems = (createdAssessments || []).filter(
      (a) => (a.assessmentType === "end-sem" || a.assessmentCategory === "end-sem") && (!teacherId || a.createdByTeacherId === teacherId)
    );
    if (selectedId) {
      exam = createdEndSems.find((a) => a.id === selectedId) || (typeof getEndSemExam === "function" ? getEndSemExam(selectedId) : endSemExam);
    } else {
      exam = createdEndSems[0] || (typeof getEndSemExam === "function" ? getEndSemExam() : endSemExam);
    }

    if (!exam) {
      return {
        type: "end-sem",
        exam: null,
        rows: [],
        published: false,
        summary: { totalStudents: 0, evaluatedStudents: 0, pendingEvaluations: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0, passPercentage: 0 },
      };
    }

    submissions = endSemSubmissions.filter((s) => s.assessmentId === exam.id || (!s.assessmentId && exam.id === "endsem-01"));
    published = isEndSemResultsPublished();
  }

  // Targeted students roster matching exam branch & division
  const targetedStudents = students.filter((s) => {
    if (!exam) return false;
    const sBranch = normStr(s.branch || "ENTC");
    const sDiv = normStr(s.division || "TE ENTC – A");
    const eBranch = normStr(exam.branch || "ENTC");
    const eDiv = normStr(exam.division || "TE ENTC – A");
    return sBranch === eBranch && sDiv === eDiv;
  });

  const sortedStudents = (targetedStudents.length > 0 ? targetedStudents : students).sort((a, b) =>
    (a.roll || "").localeCompare(b.roll || "", undefined, { numeric: true })
  );

  const totalMarks = exam?.totalMarks || (type === "end-sem" ? 60 : 30);

  const rows = sortedStudents.map((student, index) => {
    const submission = submissions.find(
      (item) =>
        item.rollNumber === student.roll ||
        item.roll === student.roll ||
        item.studentId === student.id ||
        item.studentName === student.name ||
        item.student === student.name
    ) || null;
    const evaluation = submission?.evaluation || null;

    let obtainedMarks = "—";
    let percentage = "—";
    let grade = "—";

    if (evaluation) {
      obtainedMarks = evaluation.obtainedMarks ?? evaluation.score;
      percentage = Math.round((obtainedMarks / totalMarks) * 100);
      grade = evaluation.grade || calculateGrade(percentage);
    } else if (type === "assignment" && (published || isPastDue)) {
      obtainedMarks = 0;
      percentage = 0;
      grade = calculateGrade(0);
    }

    return {
      srNo: index + 1,
      rollNumber: student.roll,
      studentName: student.name,
      classDivision: exam?.division || "TE ENTC – A",
      subject: exam?.subjectName || exam?.subject || exam?.course || "Subject",
      examination: exam?.shortTitle || exam?.title || "Examination",
      totalMarks,
      obtainedMarks,
      percentage,
      grade,
      status: deriveStatus(submission, published, type),
    };
  });

  // Summary statistics — calculated only from actual evaluation data.
  const evaluatedRows = rows.filter((row) => row.obtainedMarks !== "—");
  const scores = evaluatedRows.map((row) => Number(row.obtainedMarks));
  const average = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;
  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;
  const passCount = evaluatedRows.filter((row) => Number(row.percentage) >= 60).length;
  const passPercentage = evaluatedRows.length
    ? Math.round((passCount / evaluatedRows.length) * 100)
    : 0;

  return {
    type,
    exam,
    rows,
    published,
    summary: {
      totalStudents: rows.length,
      evaluatedStudents: evaluatedRows.length,
      pendingEvaluations: rows.length - evaluatedRows.length,
      averageMarks: average,
      highestMarks: highest,
      lowestMarks: lowest,
      passPercentage,
    },
  };
}

// Build the CSV content for Excel export (UTF-8 BOM for Excel compatibility).
export function buildGradeSheetCsv(gradeSheet) {
  if (!gradeSheet || !gradeSheet.rows) return "";
  const headers = [
    "Sr No",
    "Roll Number",
    "Student Name",
    "Class / Division",
    "Subject",
    "Examination",
    "Total Marks",
    "Obtained Marks",
    "Percentage",
    "Grade",
    "Evaluation Status",
  ];
  const csvRows = [headers];
  gradeSheet.rows.forEach((row) => {
    csvRows.push([
      row.srNo,
      row.rollNumber,
      row.studentName,
      row.classDivision,
      row.subject,
      row.examination,
      row.totalMarks,
      row.obtainedMarks,
      row.percentage === "—" ? "—" : `${row.percentage}%`,
      row.grade,
      row.status,
    ]);
  });
  return (
    "\uFEFF" +
    csvRows
      .map((cells) =>
        cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n")
  );
}

// Recommended filename for the exported Excel file.
export function getGradeSheetExcelFilename(type, exam = null) {
  const title = (exam?.title || exam?.shortTitle || type).replace(/[^A-Za-z0-9]/g, "_");
  return `EvalAI_${title}_GradeSheet.xlsx`;
}

// Recommended filename for the exported PDF file.
export function getGradeSheetPdfFilename(type, exam = null) {
  const title = (exam?.title || exam?.shortTitle || type).replace(/[^A-Za-z0-9]/g, "_");
  return `EvalAI_${title}_GradeSheet.pdf`;
}