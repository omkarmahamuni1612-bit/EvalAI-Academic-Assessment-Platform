export const demoAssignment = {
  id: "dsp-a03",
  title: "Digital Signal Processing — Assignment 03",
  shortTitle: "DSP — Assignment 03",
  course: "Digital Signal Processing",
  courseCode: "ET305",
  division: "TE ENTC – A",
  dueDate: "14 Aug 2026, 11:59 PM",
  totalMarks: 20,
  referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
};

export const workflowSubmissions = [
  { id: "sub-001", student: "Rahul Patil", roll: "ET202-041", submittedAt: "Today, 10:24 AM", file: "RahulPatil_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "17 / 20", evaluationId: "eval-rahul" },
  { id: "sub-002", student: "Sneha Kulkarni", roll: "ET202-089", submittedAt: "Today, 9:48 AM", file: "SnehaKulkarni_DSP_A03.pdf", pages: 3, status: "Submitted", score: "—", evaluationId: "eval-sneha" },
  { id: "sub-003", student: "Aarav Sharma", roll: "ET202-012", submittedAt: "Yesterday, 6:15 PM", file: "AaravSharma_DSP_A03.pdf", pages: 5, status: "Processing", score: "—", evaluationId: "eval-aarav" },
  { id: "sub-004", student: "Priya Deshmukh", roll: "ET202-056", submittedAt: "Yesterday, 4:32 PM", file: "PriyaDeshmukh_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "18 / 20", evaluationId: "eval-priya" },
  { id: "sub-005", student: "Rohan Jadhav", roll: "ET202-102", submittedAt: "Yesterday, 1:09 PM", file: "RohanJadhav_DSP_A03.pdf", pages: 4, status: "Pending", score: "—", evaluationId: "eval-rohan" },
  { id: "sub-006", student: "Ananya Kulkarni", roll: "ET202-077", submittedAt: "12 Aug, 3:20 PM", file: "AnanyaKulkarni_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "16 / 20", evaluationId: "eval-ananya" },
  { id: "sub-007", student: "Aditya Shinde", roll: "ET202-034", submittedAt: "12 Aug, 11:05 AM", file: "AdityaShinde_DSP_A03.pdf", pages: 3, status: "Submitted", score: "—", evaluationId: "eval-aditya" },
];

export const rubricRows = [
  { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Correctly explains sampling and identifies the relationship to a discrete-time signal." },
  { name: "Technical Accuracy", score: 5, max: 6, confidence: "High", reason: "Nyquist condition is stated correctly; the anti-aliasing role needs more precision." },
  { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Reasoning is clear, but mathematical justification is brief." },
  { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well structured response with clear sequencing and readable notation." },
];

export const answerText = "Sampling is the process of representing a continuous signal as discrete values. According to the Nyquist theorem, the sampling frequency should be greater than or equal to two times the maximum frequency of the input signal. If it is lower, aliasing occurs. A low-pass filter is used before sampling to remove unwanted high-frequency components.";

export const analyticsTrend = [
  { name: "Assignment 01", score: 72, benchmark: 70 }, { name: "Assignment 02", score: 75, benchmark: 72 }, { name: "Assignment 03", score: 78.4, benchmark: 75 }, { name: "Assignment 04", score: 81, benchmark: 77 },
];
export const scoreDistribution = [{ name: "0–39", students: 2 }, { name: "40–59", students: 6 }, { name: "60–74", students: 16 }, { name: "75–89", students: 22 }, { name: "90–100", students: 7 }];
export const rubricAnalytics = [{ name: "Concept", score: 84 }, { name: "Accuracy", score: 76 }, { name: "Reasoning", score: 69 }, { name: "Presentation", score: 88 }];

export const studentAssignments = [
  { id: "dsp-a03", title: "Digital Signal Processing — Assignment 03", course: "ET305 · Digital Signal Processing", due: "Due 14 Aug, 11:59 PM", status: "Result Released", score: "17 / 20" },
  { id: "sig-a02", title: "Signals & Systems — Assignment 02", course: "ET301 · Signals & Systems", due: "Due 18 Aug, 11:59 PM", status: "Due Soon", score: "—" },
  { id: "micro-l04", title: "Microcontrollers — Lab Assignment 04", course: "ET304 · Embedded Systems", due: "Submitted 10 Aug", status: "Evaluated", score: "18 / 20" },
];
