export const teacherProfile = {
  name: "Professor123",
  role: "Teacher · ENTC Engineering",
  department: "ENTC Engineering",
  institution: "State Engineering College",
  avatar: "P",
  email: "professor123@college.edu",
};

export const dashboardStats = [
  {
    id: "total-students",
    title: "Total Students",
    value: "128",
    change: "+12% this term",
    changeType: "positive",
    iconName: "Users",
    description: "Across 3 enrolled courses",
  },
  {
    id: "active-assignments",
    title: "Active Assignments",
    value: "6",
    change: "3 Due this week",
    changeType: "neutral",
    iconName: "BookOpen",
    description: "Currently accepting submissions",
  },
  {
    id: "pending-evaluations",
    title: "Pending Evaluations",
    value: "24",
    change: "Requires AI review",
    changeType: "warning",
    iconName: "Clock",
    description: "Awaiting AI & teacher review",
  },
  {
    id: "average-score",
    title: "Average Score",
    value: "78.4%",
    change: "+3.2% vs last assessment",
    changeType: "positive",
    iconName: "TrendingUp",
    description: "Overall class performance",
  },
];

export const performanceOverviewData = [
  { name: "Assignment 1", score: 72.0, benchmark: 70 },
  { name: "Assignment 2", score: 75.0, benchmark: 72 },
  { name: "Assignment 3", score: 71.5, benchmark: 72 },
  { name: "Assignment 4", score: 79.0, benchmark: 74 },
  { name: "Assignment 5", score: 78.4, benchmark: 75 },
];

export const submissionStatusData = [
  { name: "Evaluated", value: 68, count: 87, color: "#16A34A" },
  { name: "Pending", value: 22, count: 28, color: "#D97706" },
  { name: "Processing", value: 10, count: 13, color: "#2563EB" },
];

export const recentSubmissions = [
  {
    id: "sub-001",
    studentName: "Rahul Patil",
    rollNo: "ET202-041",
    assignmentTitle: "Data Structures — Binary Trees",
    course: "Data Structures (ET202)",
    submittedAt: "10 mins ago",
    score: "17 / 20",
    grade: "85%",
    status: "Evaluated",
    statusType: "success",
  },
  {
    id: "sub-002",
    studentName: "Sneha Kulkarni",
    rollNo: "ET101-089",
    assignmentTitle: "Recursion & Dynamic Programming",
    course: "Intro to Algorithms (ET101)",
    submittedAt: "35 mins ago",
    score: "Pending",
    grade: "-",
    status: "Pending",
    statusType: "warning",
  },
  {
    id: "sub-003",
    studentName: "Aarav Sharma",
    rollNo: "ET301-012",
    assignmentTitle: "Signals & Systems Analysis",
    course: "Signals & Systems (ET301)",
    submittedAt: "1 hour ago",
    score: "19 / 20",
    grade: "95%",
    status: "Evaluated",
    statusType: "success",
  },
  {
    id: "sub-004",
    studentName: "Priya Deshmukh",
    rollNo: "ET202-056",
    assignmentTitle: "Graph Traversals — BFS & DFS",
    course: "Data Structures (ET202)",
    submittedAt: "2 hours ago",
    score: "Processing",
    grade: "OCR Done",
    status: "Processing",
    statusType: "processing",
  },
  {
    id: "sub-005",
    studentName: "Rohan Jadhav",
    rollNo: "ET101-102",
    assignmentTitle: "Recursion & Dynamic Programming",
    course: "Intro to Algorithms (ET101)",
    submittedAt: "3 hours ago",
    score: "16 / 20",
    grade: "80%",
    status: "Evaluated",
    statusType: "success",
  },
];

export const upcomingAssignments = [
  {
    id: "asg-101",
    title: "Binary Trees & Heaps Implementation",
    course: "ET202 — Data Structures",
    dueDate: "Tomorrow, 11:59 PM",
    totalSubmissions: "38 / 45 Submitted",
    status: "Active",
  },
  {
    id: "asg-102",
    title: "Digital Signal Processing Filtering",
    course: "ET301 — Signals & Systems",
    dueDate: "Aug 4, 2026",
    totalSubmissions: "18 / 32 Submitted",
    status: "Active",
  },
  {
    id: "asg-103",
    title: "Microcontroller Interface & Programming",
    course: "ET304 — Embedded Systems",
    dueDate: "Aug 6, 2026",
    totalSubmissions: "51 / 51 Submitted",
    status: "Completed",
  },
];

export const recentActivity = [
  {
    id: "act-1",
    message: "AI evaluation completed for Rahul Patil (17/20)",
    time: "10 minutes ago",
    type: "ai",
  },
  {
    id: "act-2",
    message: "Sneha Kulkarni submitted assignment ET101-089",
    time: "35 minutes ago",
    type: "submission",
  },
  {
    id: "act-3",
    message: "Teacher approved AI evaluation for Aarav Sharma",
    time: "1 hour ago",
    type: "approval",
  },
  {
    id: "act-4",
    message: "Academic marksheet report generated for ET202 Midterm",
    time: "2 hours ago",
    type: "report",
  },
  {
    id: "act-5",
    message: "New assignment created: Microcontroller Interface",
    time: "5 hours ago",
    type: "assignment",
  },
];

export const evaluationPreviewData = {
  studentName: "Rahul Patil",
  rollNo: "ET202-041",
  subject: "ENTC Engineering",
  assignment: "Data Structures — Binary Trees",
  score: "17 / 20",
  percentage: "85%",
  ocrSnippet: "In-order traversal visits left subtree, root, then right subtree. Pre-order visits root first.",
  aiEvaluation: "Strong understanding of traversal techniques with minor conceptual gaps in tree balancing algorithms.",
  breakdown: [
    { criteria: "Concept Clarity", points: "5 / 5", status: "Full Marks" },
    { criteria: "Algorithm Correctness", points: "8 / 10", status: "Minor Error in Rotation" },
    { criteria: "Syntax & Structure", points: "4 / 5", status: "Clean Presentation" },
  ]
};
