import { teacherProfile } from "../data/mockData.js";

export const TEACHER_SESSION_KEY = "evalai_teacher_session";
export const DEMO_TEACHER_EMAIL = "teacher@college.edu";
export const DEMO_TEACHER_PASSWORD = "teacher123";

let memorySession = null;

const getStorage = () => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage;
  }
  return {
    getItem: (key) => memorySession ? JSON.stringify(memorySession) : null,
    setItem: (key, val) => { memorySession = JSON.parse(val); },
    removeItem: (key) => { memorySession = null; },
  };
};

/**
 * Validate teacher login credentials and create session in sessionStorage.
 */
export function loginTeacher(email, password) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const trimmedPassword = (password || "").trim();

  // Basic validation check
  if (!normalizedEmail || !trimmedPassword) {
    return { success: false, error: "Please enter both email address and password." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (trimmedPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const teacherId = normalizedEmail.includes("teacherb") || normalizedEmail.includes("teacher-b")
    ? "teacher-B-456"
    : normalizedEmail === "teacher@college.edu" || normalizedEmail === "teachera@college.edu" || normalizedEmail === "teacher123"
    ? "teacher-123"
    : `teacher-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`;

  // Create session object
  const sessionData = {
    id: teacherId,
    teacherId: teacherId,
    name: teacherProfile.name,
    email: normalizedEmail,
    department: teacherProfile.department,
    institution: teacherProfile.institution,
    loggedInAt: new Date().toISOString(),
  };


  try {
    getStorage().setItem(TEACHER_SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error("Failed to save teacher session", err);
  }

  return { success: true, teacher: sessionData };
}

/**
 * Retrieve the current logged-in teacher session.
 */
export function getCurrentTeacher() {
  try {
    const raw = getStorage().getItem(TEACHER_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Check if a valid teacher session exists.
 */
export function isTeacherAuthenticated() {
  return Boolean(getCurrentTeacher());
}

/**
 * Remove teacher session from sessionStorage.
 */
export function logoutTeacher() {
  try {
    getStorage().removeItem(TEACHER_SESSION_KEY);
  } catch (err) {
    console.error("Failed to remove teacher session", err);
  }
}
