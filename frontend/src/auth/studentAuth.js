import { calculateGrade, demoAssignment, getAssignmentById, isAssignmentPastDueDate, workflowSubmissions } from "../data/workflowData.js";

const STUDENT_SESSION_KEY = "evalai_student_session";

// Demo access password — shared by all mock students until a database is added.
export const DEMO_STUDENT_PASSWORD = "student123";

// Build the student directory from the existing mock submission data.
// Every student already present in the project can log in with their roll number.
export const students = [
  { id: "stu-rahul", name: "Rahul Patil", roll: "ET202-041", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-sneha", name: "Sneha Kulkarni", roll: "ET202-089", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-aarav", name: "Aarav Sharma", roll: "ET202-012", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-priya", name: "Priya Deshmukh", roll: "ET202-056", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-rohan", name: "Rohan Jadhav", roll: "ET202-102", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-ananya", name: "Ananya Kulkarni", roll: "ET202-077", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-aditya", name: "Aditya Shinde", roll: "ET202-034", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
  { id: "stu-vikram", name: "Vikram Joshi", roll: "ET202-095", branch: "ENTC", division: "TE ENTC – A", password: DEMO_STUDENT_PASSWORD },
];

// Normalize a roll number so formatting differences (e.g. "ET202-041" vs
// "ET202041") never cause a valid student to be rejected.
const normalizeRoll = (value) =>
  String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export const getStudentByRoll = (roll) => {
  const normalized = normalizeRoll(roll);
  return students.find((student) => normalizeRoll(student.roll) === normalized) || null;
};

let memoryStudentSession = null;

const getStorage = () => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage;
  }
  return {
    getItem: (key) => memoryStudentSession ? JSON.stringify(memoryStudentSession) : null,
    setItem: (key, val) => { memoryStudentSession = JSON.parse(val); },
    removeItem: (key) => { memoryStudentSession = null; },
  };
};

// Store the logged-in student's identity in the current frontend session.
export const loginStudent = (roll, password) => {
  const student = getStudentByRoll(roll);
  if (!student || password !== DEMO_STUDENT_PASSWORD) {
    return null;
  }
  const sessionData = { id: student.id, name: student.name, roll: student.roll, branch: student.branch, division: student.division };
  try {
    getStorage().setItem(STUDENT_SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {}
  return student;
};

export const getCurrentStudent = () => {
  try {
    const raw = getStorage().getItem(STUDENT_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const found = students.find(
      (student) => student.id === session.id || normalizeRoll(student.roll) === normalizeRoll(session.roll)
    );
    return (
      found || {
        id: session.id || `stu-${normalizeRoll(session.roll)}`,
        name: session.name || "Student",
        roll: session.roll,
        branch: session.branch || "ENTC",
        division: session.division || "TE ENTC – A",
      }
    );
  } catch {
    return null;
  }
};

export const logoutStudent = () => {
  try {
    getStorage().removeItem(STUDENT_SESSION_KEY);
  } catch (e) {}
};

import { getStudentSubmission } from "../data/workflowData.js";
export { getStudentSubmission };