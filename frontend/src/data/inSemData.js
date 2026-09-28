// ===== IN-SEM EXAMINATION DATA & STATE MANAGEMENT =====
// Manages teacher-controlled manual enrollment, question paper, reference answer, per-student answer PDF upload, and isolated evaluation.

export const inSemExam = {
  id: "insem-001",
  assessmentType: "in-sem",
  title: "CAA (CO1 & CO2) Examination — August 2026",
  shortTitle: "In-Sem Exam — IoT",
  course: "Internet of Things: Concepts and Applications (MDM)",
  courseCode: "ET24056",
  subject: "Internet of Things",
  topic: "Physical Design, Identification Schemes, Gateway & Architecture",
  branch: "ENTC / IT",
  division: "T.Y.B.Tech. IT Semester-I",
  teacher: "Prof. A. Deshmukh",
  examDate: "20 Aug 2026, 10:00 AM",
  totalMarks: 20,
  duration: "1 Hour",
  description:
    "In-Semester examination covering physical design, identification schemes, networking, IoT devices/gateways, and IBM IoT architecture. Attempt any two questions per section.",
  questionPaperPdf: { name: "CAA CO1 and CO2 Question Paper1.pdf", size: 245760, type: "application/pdf" },
  referenceAnswerPdf: { name: "IoT_InSem_ReferenceAnswer.pdf", size: 198000, type: "application/pdf" },
  referenceAnswerText:
    "Physical design includes IoT devices and protocols. Identification schemes include IPv6 and MAC addressing. Local-area vs wide-area networking differentiates short range (Zigbee/BLE) vs long range (LoRa/Cellular). IBM IoT architecture comprises Device, Gateway, Cloud Platform, and Applications layers.",
  questions: [
    { id: "Q1a", text: "Evaluate the physical design of an IoT system using a suitable example.", marks: 5, instruction: "Attempt any two", requiresDiagram: false },
    { id: "Q1b", text: "Explain identification schemes used in IoT.", marks: 5, instruction: "Attempt any two", requiresDiagram: false },
    { id: "Q1c", text: "Differentiate between local-area and wide-area networking in IoT.", marks: 5, instruction: "Attempt any two", requiresDiagram: false },
    { id: "Q1d", text: "Explain the role of IoT devices and gateways.", marks: 5, instruction: "Attempt any two", requiresDiagram: false },
    { id: "Q2a", text: "Evaluate the role of networking devices and topologies in ensuring IoT reliability.", marks: 5, instruction: "Attempt any two", requiresDiagram: false },
    { id: "Q2b", text: "Explain IoT architecture given by IBM with a neat diagram.", marks: 5, instruction: "Attempt any two", requiresDiagram: true },
  ]
};

// Enrolled student roster for this exam
export const inSemEnrolledStudents = [
  { id: "stu-rahul", name: "Rahul Patil", roll: "ET202-041", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-sneha", name: "Sneha Kulkarni", roll: "ET202-089", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-aarav", name: "Aarav Sharma", roll: "ET202-012", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-priya", name: "Priya Deshmukh", roll: "ET202-056", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-rohan", name: "Rohan Jadhav", roll: "ET202-102", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-ananya", name: "Ananya Kulkarni", roll: "ET202-077", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-aditya", name: "Aditya Shinde", roll: "ET202-034", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-vikram", name: "Vikram Joshi", roll: "ET202-095", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-9", name: "Karan Malhotra", roll: "ET202-093", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-10", name: "Neha Singh", roll: "ET202-105", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-11", name: "Siddharth Nair", roll: "ET202-118", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-12", name: "Tanvi Patel", roll: "ET202-124", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-13", name: "Aditya Rao", roll: "ET202-136", branch: "ENTC", division: "TE ENTC – A" },
  { id: "stu-14", name: "Shruti Kapoor", roll: "ET202-142", branch: "ENTC", division: "TE ENTC – A" }
];

export const initialSubmissionsList = [];

export const inSemSubmissions = [];


export const inSemPublishState = {
  [inSemExam.id]: {
    published: false,
    publishedAt: null,
  },
};

export const inSemNotifications = [];

export const getInSemStudentNotifications = (studentId) => {
  return inSemNotifications.filter((n) => n.studentId === studentId);
};

export const markInSemNotificationRead = (notificationId) => {
  const notif = inSemNotifications.find((n) => n.id === notificationId);
  if (notif) notif.read = true;
  return notif;
};

const normalizeRoll = (val) => String(val || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const INSEM_STORAGE_KEY = "evalai_insem_submissions_v3";
const INSEM_PUBLISH_STORAGE_KEY = "evalai_insem_publish_state_v3";

export const persistInSemState = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(INSEM_STORAGE_KEY, JSON.stringify(inSemSubmissions));
    window.localStorage.setItem(INSEM_PUBLISH_STORAGE_KEY, JSON.stringify(inSemPublishState));
  } catch (e) {}
};

const hydrateInSemState = () => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const savedSubs = JSON.parse(window.localStorage.getItem(INSEM_STORAGE_KEY) || "[]");
    if (Array.isArray(savedSubs) && savedSubs.length > 0) {
      savedSubs.forEach((record) => {
        const sub = inSemSubmissions.find((item) => item.id === record.id);
        if (sub) {
          Object.assign(sub, record);
        } else {
          inSemSubmissions.push(record);
        }
      });
    }
    const savedPublish = JSON.parse(window.localStorage.getItem(INSEM_PUBLISH_STORAGE_KEY) || "{}");
    if (savedPublish && typeof savedPublish === "object") {
      Object.assign(inSemPublishState, savedPublish);
    }
  } catch {}
};
hydrateInSemState();

// ===== MANUAL ENROLLMENT HELPERS =====

export const enrollStudentInExam = (studentData) => {
  if (!studentData?.name || !studentData?.roll) {
    return { error: "Student Name and Roll Number are required." };
  }

  const studentId = studentData.id || `stu-${Date.now()}`;
  const newStudent = {
    id: studentId,
    name: studentData.name,
    roll: studentData.roll,
    branch: studentData.branch || "ENTC",
    division: studentData.division || "TE ENTC – A"
  };

  const existing = inSemEnrolledStudents.find((s) => s.id === studentId || normalizeRoll(s.roll) === normalizeRoll(studentData.roll));
  if (existing) {
    Object.assign(existing, newStudent);
  } else {
    inSemEnrolledStudents.push(newStudent);
  }

  const subId = `${inSemExam.id}_${studentId}`;
  let sub = inSemSubmissions.find((s) => s.id === subId);
  if (!sub) {
    sub = {
      id: subId,
      submissionId: subId,
      examId: inSemExam.id,
      assessmentId: inSemExam.id,
      assessmentType: "in-sem",
      studentId: studentId,
      studentName: newStudent.name,
      rollNumber: newStudent.roll,
      fileName: "",
      evaluationId: `insem-eval-${studentId}`,
      status: "Not Uploaded",
      mappingStatus: "UNMAPPED",
      evaluationStatus: "PENDING",
      score: "—",
      renderedPages: [],
      rawQuestionScores: {},
      evaluationResults: {},
      activeDifficulty: "moderate",
      evaluation: null,
      teacherApproved: false,
      published: false,
    };
    inSemSubmissions.push(sub);
  }

  persistInSemState();
  return { success: true, student: newStudent, submission: sub };
};

// ===== LOOKUP HELPERS =====

export const getInSemExam = () => inSemExam;
export const getInSemEnrolledStudents = () => inSemEnrolledStudents;
export const getInSemSubmissions = () => inSemSubmissions;
export const getInSemSubmissionById = (id) => inSemSubmissions.find((item) => item.id === id || item.evaluationId === id || item.submissionId === id) || null;
export const getInSemSubmissionByEvaluationId = (evaluationId) => inSemSubmissions.find((item) => item.evaluationId === evaluationId || item.id === evaluationId) || null;

export const getInSemSubmissionByStudent = (student) => {
  if (!student) return null;
  const targetRoll = normalizeRoll(student.roll || student.rollNumber);
  return (
    inSemSubmissions.find(
      (item) =>
        (student.id && item.studentId === student.id) ||
        (targetRoll && normalizeRoll(item.rollNumber || item.roll) === targetRoll) ||
        (student.name && (item.studentName === student.name || item.student === student.name))
    ) || null
  );
};

export const isInSemAssessment = (assessment) => Boolean(assessment && assessment.assessmentType === "in-sem");

export const mapAnswerSheetToStudent = (student, file, options = {}) => {
  if (!student) return { error: "Please select a student to map the answer sheet." };
  if (!file) return { error: "Please upload the student's answer sheet PDF first." };

  const subId = `${inSemExam.id}_${student.id}`;
  let submission = inSemSubmissions.find((item) => item.id === subId || item.studentId === student.id);

  if (submission && options.replace === false && submission.fileName) {
    return { error: `${student.name} already has an answer sheet. Choose Replace Existing to replace it.` };
  }

  if (!submission) {
    submission = {
      id: subId,
      submissionId: subId,
      examId: inSemExam.id,
      assessmentId: inSemExam.id,
      assessmentType: "in-sem",
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.roll,
      fileName: file.name,
      evaluationId: `insem-eval-${student.id}`,
      uploadDate: new Date().toISOString(),
      mappingStatus: "MATCHED",
      evaluationStatus: "PENDING",
      status: "Uploaded",
      score: "—",
      evaluationResults: {},
      rawQuestionScores: {},
      evaluation: null,
      teacherApproved: false,
      published: false,
    };
    inSemSubmissions.push(submission);
  } else {
    submission.fileName = file.name;
    submission.uploadDate = new Date().toISOString();
    submission.mappingStatus = "MATCHED";
    submission.evaluationStatus = "PENDING";
    submission.status = "Uploaded";
    submission.score = "—";
  }

  persistInSemState();
  return { success: true, submission };
};

export const startInSemEvaluation = (submissionId, difficulty = "moderate") => {
  const submission = inSemSubmissions.find((item) => item.id === submissionId || item.evaluationId === submissionId || item.submissionId === submissionId);
  if (!submission) return null;

  if (!submission.mappedAnswers || submission.mappedAnswers.length === 0) {
    submission.status = "Extraction Failed";
    submission.evaluationError = "AI extraction/evaluation unavailable. Please extract answers first or verify Gemini API configuration.";
    persistInSemState();
    return submission;
  }

  submission.activeDifficulty = difficulty;
  submission.evaluationStatus = "Needs Teacher Review";
  submission.status = "Evaluation Completed";
  persistInSemState();
  return submission;
};

export const reEvaluateInSemSubmission = (submissionId, difficulty = "moderate") => {
  const submission = inSemSubmissions.find((item) => item.id === submissionId || item.evaluationId === submissionId || item.submissionId === submissionId);
  if (!submission) return null;
  return startInSemEvaluation(submission.id, difficulty);
};

export const getInSemEvaluationProgress = () => {
  const total = inSemSubmissions.length;
  const evaluated = inSemSubmissions.filter(
    (item) => Boolean(item.evaluation) || item.status === "Evaluation Completed" || item.status === "Result Published" || item.status === "Teacher Approved"
  ).length;
  return {
    total,
    evaluated,
    pending: total - evaluated,
    allEvaluated: total > 0 && evaluated === total,
    percentage: total > 0 ? Math.round((evaluated / total) * 100) : 0,
  };
};

export const isInSemResultsPublished = () => {
  return inSemPublishState[inSemExam.id]?.published || false;
};

export const publishInSemResults = () => {
  const state = inSemPublishState[inSemExam.id] || { published: false, publishedAt: null };

  if (state.published) {
    return { alreadyPublished: true, notifications: [] };
  }

  const progress = getInSemEvaluationProgress();
  if (!progress.allEvaluated) {
    return { alreadyPublished: false, notifications: [], incomplete: true };
  }

  state.published = true;
  state.publishedAt = new Date().toISOString();
  inSemPublishState[inSemExam.id] = state;

  inSemSubmissions.forEach((sub) => {
    sub.published = true;
    sub.status = "Result Published";
    sub.evaluationStatus = "PUBLISHED";
  });

  persistInSemState();
  return { alreadyPublished: false, notifications: [] };
};

export const getInSemStudentResult = (student) => {
  if (!student) return null;
  const submission = getInSemSubmissionByStudent(student);
  if (!submission) return null;
  if (!isInSemResultsPublished()) return null;
  return submission;
};

export const approveInSemEvaluation = (submissionId, teacherName = "Prof. A. Deshmukh") => {
  const submission = inSemSubmissions.find((item) => item.id === submissionId || item.evaluationId === submissionId || item.submissionId === submissionId);
  if (!submission?.evaluation) return { error: "Unable to approve evaluation. Evaluation data is missing." };
  submission.teacherApproved = true;
  submission.evaluation.approvedBy = teacherName;
  submission.evaluation.approvedAt = new Date().toISOString();
  submission.evaluationStatus = "Approved";
  submission.status = "Teacher Approved";
  persistInSemState();
  return { success: true, submission };
};

export const saveInSemTeacherReview = (submissionId, changes = {}) => {
  const submission = inSemSubmissions.find((item) => item.id === submissionId || item.evaluationId === submissionId || item.submissionId === submissionId);
  if (!submission?.evaluation) return { error: "Unable to save evaluation changes." };
  if (Array.isArray(changes.questionWiseResults)) {
    submission.evaluation.questionWiseResults = changes.questionWiseResults;
    const obtainedMarks = Math.round(changes.questionWiseResults.reduce((sum, q) => sum + Number(q.marksAwarded || q.awardedMarks || 0), 0) * 10) / 10;
    submission.evaluation.obtainedMarks = obtainedMarks;
    submission.evaluation.score = obtainedMarks;
    submission.score = `${obtainedMarks} / 20`;
  }
  persistInSemState();
  return { success: true, submission };
};

export const getInSemStudentStatus = (student) => {
  if (!student) return { label: "Not Available", key: "not-available" };
  const submission = getInSemSubmissionByStudent(student);
  if (!submission) return { label: "Not Available", key: "not-available" };

  const published = isInSemResultsPublished();
  if (published) return { label: "Result Published", key: "result-published" };
  if (submission.status === "Evaluation Completed" || submission.status === "Teacher Approved") {
    return { label: "Results Pending Publication", key: "results-pending" };
  }
  if (submission.status === "Under Evaluation" || submission.status === "Uploaded") {
    return { label: "Under Evaluation", key: "under-evaluation" };
  }
  return { label: "Status Unavailable", key: "unavailable" };
};
