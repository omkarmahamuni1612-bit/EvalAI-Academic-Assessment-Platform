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
  {
    id: "sub-001", student: "Rahul Patil", roll: "ET202-041", submittedAt: "Today, 10:24 AM",
    file: "RahulPatil_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "17 / 20", evaluationId: "eval-rahul",
    evaluation: {
      score: 17, totalMarks: 20, grade: "Grade A", confidence: "94%", semanticRelevance: "87%",
      answerText: "Sampling is the process of representing a continuous signal as discrete values. According to the Nyquist theorem, the sampling frequency should be greater than or equal to two times the maximum frequency of the input signal. If it is lower, aliasing occurs. A low-pass filter is used before sampling to remove unwanted high-frequency components.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Correctly explains sampling and identifies the relationship to a discrete-time signal." },
        { name: "Technical Accuracy", score: 5, max: 6, confidence: "High", reason: "Nyquist condition is stated correctly; the anti-aliasing role needs more precision." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Reasoning is clear, but mathematical justification is brief." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well structured response with clear sequencing and readable notation." },
      ],
      feedback: {
        strengths: "Correct explanation of sampling and aliasing concepts.",
        improvements: "Explain the Nyquist condition with clearer mathematical justification.",
        missing: "Anti-aliasing filter before sampling."
      }
    }
  },
  {
    id: "sub-002", student: "Sneha Kulkarni", roll: "ET202-089", submittedAt: "Today, 9:48 AM",
    file: "SnehaKulkarni_DSP_A03.pdf", pages: 3, status: "Submitted", score: "—", evaluationId: "eval-sneha",
    evaluation: {
      score: 15, totalMarks: 20, grade: "Grade B", confidence: "91%", semanticRelevance: "82%",
      answerText: "Sampling converts a continuous signal into discrete samples at regular intervals. The Nyquist theorem requires the sampling rate to be at least twice the highest frequency component. If sampling is too slow, aliasing distorts the signal. A low-pass filter is applied before sampling to remove high-frequency components.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 4, max: 6, confidence: "High", reason: "Correctly explains sampling but misses some nuance about discrete-time representation." },
        { name: "Technical Accuracy", score: 4, max: 6, confidence: "Medium", reason: "Nyquist condition stated correctly, but the anti-aliasing explanation is incomplete." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Clear reasoning with adequate examples, though mathematical detail is limited." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well organized response with logical flow and readable notation." },
      ],
      feedback: {
        strengths: "Good understanding of the sampling process and Nyquist theorem.",
        improvements: "Provide more mathematical justification for the sampling rate condition.",
        missing: "Detailed explanation of aliasing effects and their prevention."
      }
    }
  },
  {
    id: "sub-003", student: "Aarav Sharma", roll: "ET202-012", submittedAt: "Yesterday, 6:15 PM",
    file: "AaravSharma_DSP_A03.pdf", pages: 5, status: "Processing", score: "—", evaluationId: "eval-aarav",
    evaluation: {
      score: 19, totalMarks: 20, grade: "Grade A+", confidence: "96%", semanticRelevance: "93%",
      answerText: "Sampling is the process of converting a continuous-time signal into a discrete-time signal by taking samples at regular intervals. According to the Nyquist-Shannon sampling theorem, the sampling frequency must be at least twice the maximum frequency present in the signal to avoid aliasing. An anti-aliasing filter is used before the sampler to remove frequency components above the Nyquist frequency.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 6, max: 6, confidence: "High", reason: "Comprehensive explanation of sampling and the Nyquist-Shannon theorem." },
        { name: "Technical Accuracy", score: 6, max: 6, confidence: "High", reason: "All technical conditions stated precisely with correct terminology." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Strong reasoning, though a worked example would strengthen the response." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Excellent structure with clear logical progression and notation." },
      ],
      feedback: {
        strengths: "Excellent grasp of sampling theory with precise technical terminology.",
        improvements: "Include a numerical example to illustrate the Nyquist rate calculation.",
        missing: "Discussion of practical sampling considerations like quantization."
      }
    }
  },
  {
    id: "sub-004", student: "Priya Deshmukh", roll: "ET202-056", submittedAt: "Yesterday, 4:32 PM",
    file: "PriyaDeshmukh_DSP_A03.pdf", pages: 4, status: "Evaluated", score: "18 / 20", evaluationId: "eval-priya",
    evaluation: {
      score: 18, totalMarks: 20, grade: "Grade A+", confidence: "93%", semanticRelevance: "89%",
      answerText: "Sampling is the conversion of a continuous-time signal into a discrete-time sequence by measuring its amplitude at uniform time intervals. The Nyquist criterion states that the sampling frequency must exceed twice the highest frequency component of the signal. Failure to meet this condition results in aliasing. An anti-aliasing low-pass filter is placed before the sampler.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Solid understanding of sampling with correct terminology." },
        { name: "Technical Accuracy", score: 5, max: 6, confidence: "High", reason: "Nyquist criterion stated correctly with proper conditions." },
        { name: "Explanation & Reasoning", score: 5, max: 5, confidence: "High", reason: "Well-reasoned explanation with clear cause-effect relationships." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Clean presentation with well-organized paragraphs." },
      ],
      feedback: {
        strengths: "Clear and accurate explanation of the sampling process.",
        improvements: "Elaborate on the mathematical relationship between sampling rate and signal bandwidth.",
        missing: "Mention of reconstruction and interpolation after sampling."
      }
    }
  },
  {
    id: "sub-005", student: "Rohan Jadhav", roll: "ET202-102", submittedAt: "Yesterday, 1:09 PM",
    file: "RohanJadhav_DSP_A03.pdf", pages: 4, status: "Pending", score: "—", evaluationId: "eval-rohan",
    evaluation: {
      score: 14, totalMarks: 20, grade: "Grade B", confidence: "88%", semanticRelevance: "76%",
      answerText: "Sampling is taking discrete values from a continuous signal. The sampling frequency should be high enough. If the sampling rate is too low, we get aliasing. A filter is used to remove high frequencies.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 4, max: 6, confidence: "Medium", reason: "Basic understanding of sampling, but lacks depth in explaining discrete-time representation." },
        { name: "Technical Accuracy", score: 4, max: 6, confidence: "Medium", reason: "Nyquist condition mentioned but not precisely stated with the factor of two." },
        { name: "Explanation & Reasoning", score: 3, max: 5, confidence: "Medium", reason: "Reasoning is brief and lacks mathematical justification." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Response is concise and readable, though sparse." },
      ],
      feedback: {
        strengths: "Correct basic understanding of sampling and aliasing.",
        improvements: "State the Nyquist theorem precisely with the 2x frequency condition.",
        missing: "Detailed explanation of the anti-aliasing filter's role."
      }
    }
  },
  {
    id: "sub-006", student: "Ananya Kulkarni", roll: "ET202-077", submittedAt: "12 Aug, 3:20 PM",
    file: "AnanyaKulkarni_DSP_A03.pdf", pages: 4, status: "Submitted", score: "—", evaluationId: "eval-ananya",
    evaluation: {
      score: 16, totalMarks: 20, grade: "Grade A", confidence: "92%", semanticRelevance: "85%",
      answerText: "Sampling is the process of converting a continuous signal into a sequence of discrete values at regular time intervals. According to the Nyquist theorem, the sampling frequency should be at least twice the maximum frequency of the signal to avoid aliasing. An anti-aliasing filter is used before sampling to eliminate high-frequency components that could cause distortion.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 5, max: 6, confidence: "High", reason: "Good understanding of sampling with correct terminology." },
        { name: "Technical Accuracy", score: 4, max: 6, confidence: "Medium", reason: "Nyquist condition stated correctly, but the anti-aliasing explanation could be more precise." },
        { name: "Explanation & Reasoning", score: 4, max: 5, confidence: "Medium", reason: "Clear reasoning with adequate detail, though some mathematical depth is missing." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Well-structured response with logical flow." },
      ],
      feedback: {
        strengths: "Good conceptual understanding of sampling and aliasing.",
        improvements: "Add more mathematical detail to the Nyquist condition explanation.",
        missing: "Discussion of what happens when the sampling condition is violated."
      }
    }
  },
  {
    id: "sub-007", student: "Aditya Shinde", roll: "ET202-034", submittedAt: "12 Aug, 11:05 AM",
    file: "AdityaShinde_DSP_A03.pdf", pages: 3, status: "Evaluated", score: "13 / 20", evaluationId: "eval-aditya",
    evaluation: {
      score: 13, totalMarks: 20, grade: "Grade C", confidence: "86%", semanticRelevance: "71%",
      answerText: "Sampling means taking samples of a signal. The sampling rate must be high. If it is low, aliasing happens. We use a low-pass filter to remove high frequencies before sampling.",
      referenceAnswer: "Sampling converts a continuous-time signal into a discrete-time sequence. The sampling frequency must be at least twice the highest signal frequency to prevent aliasing. An anti-aliasing low-pass filter removes frequency components above the Nyquist frequency before sampling.",
      rubric: [
        { name: "Concept Understanding", score: 4, max: 6, confidence: "Medium", reason: "Basic understanding present, but explanation is superficial." },
        { name: "Technical Accuracy", score: 3, max: 6, confidence: "Low", reason: "Nyquist condition not stated precisely; missing the 2x frequency requirement." },
        { name: "Explanation & Reasoning", score: 3, max: 5, confidence: "Medium", reason: "Reasoning is minimal and lacks technical depth." },
        { name: "Presentation / Structure", score: 3, max: 3, confidence: "High", reason: "Concise and readable, though brief." },
      ],
      feedback: {
        strengths: "Identifies the key concepts of sampling and aliasing.",
        improvements: "State the Nyquist theorem precisely and explain the 2x frequency condition.",
        missing: "Explanation of how the anti-aliasing filter prevents distortion."
      }
    }
  },
];

// Reusable dynamic lookup helpers — return null when not found (no silent fallback)
export const getSubmissionById = (id) => workflowSubmissions.find((item) => item.id === id) || null;
export const getSubmissionByEvaluationId = (evaluationId) => workflowSubmissions.find((item) => item.evaluationId === evaluationId) || null;

// Mark a single submission as Evaluated (used after AI evaluation completes)
export const markAsEvaluated = (submissionId) => {
  const submission = workflowSubmissions.find((item) => item.id === submissionId);
  if (submission) {
    submission.status = "Evaluated";
    submission.score = submission.evaluation ? `${submission.evaluation.score} / ${submission.evaluation.totalMarks}` : "—";
  }
  return submission;
};

// Re-run AI evaluation for a single submission — generates fresh evaluation data
// while preserving the student's identity, submissionId and evaluationId.
export const reEvaluateSubmission = (submissionId) => {
  const submission = workflowSubmissions.find((item) => item.id === submissionId);
  if (!submission) return null;

  const base = submission.evaluation || {
    score: 0,
    totalMarks: demoAssignment.totalMarks,
    grade: "Grade D",
    confidence: "—",
    semanticRelevance: "—",
    answerText: "No extracted answer text available for this submission.",
    referenceAnswer: demoAssignment.referenceAnswer,
    rubric: [],
    feedback: { strengths: "", improvements: "", missing: "" },
  };

  // Generate a fresh score within a realistic band (keeps the same student's data)
  const freshScore = Math.min(
    base.totalMarks,
    Math.max(1, base.score + (Math.floor(Math.random() * 3) - 1)),
  );
  const freshGrade = freshScore >= 18 ? "Grade A+" : freshScore >= 16 ? "Grade A" : freshScore >= 14 ? "Grade B" : freshScore >= 12 ? "Grade C" : "Grade D";
  const freshConfidence = `${88 + Math.floor(Math.random() * 9)}%`;
  const freshSemantic = `${74 + Math.floor(Math.random() * 19)}%`;

  submission.evaluation = {
    ...base,
    score: freshScore,
    grade: freshGrade,
    confidence: freshConfidence,
    semanticRelevance: freshSemantic,
    rubric: base.rubric.map((item) => ({
      ...item,
      score: Math.max(0, Math.min(item.max, item.score + (Math.floor(Math.random() * 3) - 1))),
      confidence: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
    })),
    feedback: {
      strengths: base.feedback.strengths,
      improvements: base.feedback.improvements,
      missing: base.feedback.missing,
    },
  };

  submission.status = "Evaluated";
  submission.score = `${submission.evaluation.score} / ${submission.evaluation.totalMarks}`;
  return submission;
};

// Build a complete student report object from a submission's evaluation data
export const getStudentReport = (submission) => {
  if (!submission) return null;
  const evaluation = submission.evaluation || null;
  if (!evaluation) return null;
  const percentage = Math.round((evaluation.score / evaluation.totalMarks) * 100);
  return {
    student: submission.student,
    roll: submission.roll,
    submissionId: submission.id,
    evaluationId: submission.evaluationId,
    file: submission.file,
    pages: submission.pages,
    submittedAt: submission.submittedAt,
    status: submission.status,
    score: evaluation.score,
    totalMarks: evaluation.totalMarks,
    percentage,
    grade: evaluation.grade,
    confidence: evaluation.confidence,
    semanticRelevance: evaluation.semanticRelevance,
    answerText: evaluation.answerText,
    referenceAnswer: evaluation.referenceAnswer,
    rubric: evaluation.rubric,
    feedback: evaluation.feedback,
    assignment: demoAssignment,
  };
};

// Compute class analytics from all submissions (data-driven, no hardcoded values)
export const getClassAnalytics = () => {
  const evaluated = workflowSubmissions.filter((item) => item.status === "Evaluated");
  if (evaluated.length === 0) return null;
  const scores = evaluated.map((item) => item.evaluation.score);
  const totalMarks = evaluated[0].evaluation.totalMarks;
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const highestStudent = evaluated.find((item) => item.evaluation.score === highest);
  const lowestStudent = evaluated.find((item) => item.evaluation.score === lowest);
  return {
    totalStudents: workflowSubmissions.length,
    evaluatedCount: evaluated.length,
    pendingCount: workflowSubmissions.length - evaluated.length,
    averagePercentage: Math.round((average / totalMarks) * 100),
    highestScore: highest,
    highestPercentage: Math.round((highest / totalMarks) * 100),
    highestStudent: highestStudent?.student || "—",
    lowestScore: lowest,
    lowestPercentage: Math.round((lowest / totalMarks) * 100),
    lowestStudent: lowestStudent?.student || "—",
    completionPercentage: Math.round((evaluated.length / workflowSubmissions.length) * 100),
  };
};

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