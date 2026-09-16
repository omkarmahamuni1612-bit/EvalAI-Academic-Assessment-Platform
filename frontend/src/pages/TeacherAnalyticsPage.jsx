import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, Award, BarChart3, CheckCircle2, ClipboardCheck, Download, GraduationCap, Loader2, RotateCcw, Search, Users } from "lucide-react";
import { getCurrentTeacher } from "../auth/teacherAuth";
import { students } from "../auth/studentAuth";
import { calculateGrade, getTeacherAssignments, getAssignmentById, workflowSubmissions, isResultsPublished } from "../data/workflowData";
import "./TeacherAnalyticsPage.css";

const toNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const evaluatedStatuses = ["Evaluated", "Evaluation Completed", "Result Published"];
const evaluationStatuses = ["Needs Teacher Review", "Approved", "COMPLETED", "PUBLISHED"];

const isEvaluated = (submission) =>
  Boolean(
    submission?.evaluation &&
      (evaluatedStatuses.includes(submission.status) || evaluationStatuses.includes(submission.evaluationStatus))
  );

const isApproved = (submission) =>
  submission?.evaluationStatus === "Approved" || submission?.evaluation?.evaluationStatus === "Approved";

const isPublished = (submission) =>
  submission?.status === "Result Published" || submission?.evaluationStatus === "PUBLISHED";

const normStr = (str) => String(str || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

// Check if student belongs to targeted branch + division of assessment
const isStudentTargeted = (student, assessment) => {
  if (!student || !assessment) return false;
  const studBranch = normStr(student.branch || "ENTC");
  const studDiv = normStr(student.division || "TE ENTC – A");
  const asgBranch = normStr(assessment.branch || "ENTC");
  const asgDiv = normStr(assessment.division || "TE ENTC – A");
  return studBranch === asgBranch && studDiv === asgDiv;
};

// Retrieve evaluation for submission matching active difficulty filter
const getSubmissionEvaluation = (sub, difficultyFilter = "all") => {
  if (!sub) return null;
  if (difficultyFilter && difficultyFilter !== "all") {
    if (sub.evaluationResults && sub.evaluationResults[difficultyFilter]) {
      return sub.evaluationResults[difficultyFilter];
    }
    if (sub.evaluation && sub.evaluation.evaluationDifficulty === difficultyFilter) {
      return sub.evaluation;
    }
  }
  return sub.evaluation || (sub.evaluationResults ? Object.values(sub.evaluationResults)[0] : null);
};

// Build records map strictly using selected assignmentId
const getAssessmentData = (assessment, difficultyFilter = "all") => {
  if (!assessment)
    return {
      assessment: null,
      label: "",
      submissions: [],
      records: [],
      evaluatedRecords: [],
      availableGrades: ["All Grades"],
      published: false,
    };

  const targetedStudents = students.filter((s) => isStudentTargeted(s, assessment));
  const assessmentSubs = workflowSubmissions.filter(
    (sub) => sub.assignmentId === assessment.id || sub.assessmentId === assessment.id
  );

  const recordsMap = new Map();

  // First put all actual submissions for this assignment
  assessmentSubs.forEach((sub) => {
    const studentId = sub.studentId || sub.id;
    const studentName = sub.studentName || sub.student;
    const rollNumber = sub.rollNumber || sub.roll;
    const division = sub.division || assessment.division || "TE ENTC – A";
    const activeEval = getSubmissionEvaluation(sub, difficultyFilter);

    let grade = null;
    if (activeEval) {
      const obtained = toNumber(activeEval.obtainedMarks ?? activeEval.score);
      const total = toNumber(assessment.totalMarks);
      const percentage = obtained !== null && total > 0 ? (obtained / total) * 100 : null;
      grade = activeEval.grade || (percentage !== null ? calculateGrade(percentage) : null);
    }

    const key = `${studentId || "unknown"}::${rollNumber || sub.id}`;
    recordsMap.set(key, {
      ...sub,
      assessmentId: assessment.id,
      studentId,
      studentName,
      rollNumber,
      division,
      activeEvaluation: activeEval,
      grade,
    });
  });

  // Add targeted non-submitting students as pending records
  targetedStudents.forEach((student) => {
    const key = `${student.id}::${student.roll}`;
    if (!recordsMap.has(key)) {
      recordsMap.set(key, {
        id: `unsub-${assessment.id}-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.roll,
        division: student.division || assessment.division || "TE ENTC – A",
        assessmentId: assessment.id,
        status: "Not Submitted",
        evaluation: null,
        activeEvaluation: null,
        grade: null,
      });
    }
  });

  const records = [...recordsMap.values()];
  const evaluatedRecords = records.filter(
    (r) =>
      r.activeEvaluation &&
      (r.activeEvaluation.score !== undefined || r.activeEvaluation.obtainedMarks !== undefined)
  );

  const extractedGrades = new Set();
  evaluatedRecords.forEach((r) => {
    if (r.grade && r.grade !== "—") {
      extractedGrades.add(r.grade);
    }
  });

  const availableGrades = ["All Grades", ...Array.from(extractedGrades).sort((a, b) => a.localeCompare(b))];
  const published = isResultsPublished(assessment.id);

  return {
    assessment,
    label: assessment.title,
    submissions: assessmentSubs,
    records,
    evaluatedRecords,
    availableGrades,
    published: Boolean(published),
  };
};

const getQuestionRows = (record, assessment) => {
  const evaluation = record?.activeEvaluation || record?.evaluation;
  if (evaluation?.questionWiseResults?.length) return evaluation.questionWiseResults;
  if (!assessment?.questions?.length) return [];
  return assessment.questions.map((question, index) => ({
    questionNumber: question.id,
    questionText: question.text || question.name || `Question ${question.id}`,
    maximumMarks: question.marks,
    awardedMarks: toNumber(evaluation?.rubric?.[index]?.score) ?? 0,
    feedback: evaluation?.rubric?.[index]?.reason || "",
  }));
};

const getScoredRecords = (data, selectedClass, selectedGrade) =>
  data.records
    .filter((record) => selectedClass === "All classes" || record.division === selectedClass)
    .filter((record) => Boolean(record.activeEvaluation))
    .map((record) => {
      const activeEval = record.activeEvaluation || record.evaluation;
      const obtained = toNumber(activeEval?.obtainedMarks ?? activeEval?.score);
      const total = toNumber(data.assessment.totalMarks);
      const percentage = obtained !== null && total > 0 ? (obtained / total) * 100 : null;
      const grade = record.grade || activeEval?.grade || (percentage !== null ? calculateGrade(percentage) : null);

      if (selectedGrade !== "All Grades" && grade !== selectedGrade) {
        return null;
      }
      return obtained !== null && total > 0
        ? { record: { ...record, grade }, obtained, total, percentage, grade }
        : null;
    })
    .filter(Boolean);

const calculateAnalytics = (data, selectedClass, selectedGrade) => {
  const classFilteredRecords = data.records.filter(
    (record) => selectedClass === "All classes" || record.division === selectedClass
  );

  const scored = getScoredRecords(data, selectedClass, selectedGrade);
  const percentages = scored.map((item) => item.percentage);

  const distribution = [
    ["0–20", 0, 20],
    ["21–40", 20, 40],
    ["41–60", 40, 60],
    ["61–80", 60, 80],
    ["81–100", 80, 100],
  ].map(([name, lower, upper], index, bands) => ({
    name,
    students: percentages.filter((value) =>
      index === 0
        ? value <= upper
        : index === bands.length - 1
        ? value > lower
        : value > lower && value <= upper
    ).length,
  }));

  const gradeCounts = data.evaluatedRecords
    .filter((record) => selectedClass === "All classes" || record.division === selectedClass)
    .reduce((result, record) => {
      const grade = record.grade;
      if (grade) {
        result[grade] = (result[grade] || 0) + 1;
      }
      return result;
    }, {});

  const averagePercentage = percentages.length
    ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
    : null;

  return {
    totalStudents: classFilteredRecords.length,
    evaluated: scored.length,
    pending: classFilteredRecords.length - data.evaluatedRecords.length,
    approved: classFilteredRecords.filter(isApproved).length,
    published: data.published ? classFilteredRecords.filter(isPublished).length : 0,
    averagePercentage,
    highestPercentage: percentages.length ? Math.max(...percentages) : null,
    lowestPercentage: percentages.length ? Math.min(...percentages) : null,
    averageMarks: scored.length ? scored.reduce((sum, item) => sum + item.obtained, 0) / scored.length : null,
    highestMarks: scored.length ? Math.max(...scored.map((item) => item.obtained)) : null,
    lowestMarks: scored.length ? Math.min(...scored.map((item) => item.obtained)) : null,
    passPercentage: scored.length
      ? (scored.filter((item) => item.percentage >= 60).length / scored.length) * 100
      : null,
    progressPercentage: classFilteredRecords.length ? (data.evaluatedRecords.length / classFilteredRecords.length) * 100 : 0,
    distribution,
    grades: Object.entries(gradeCounts)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([name, students]) => ({ name, students })),
  };
};

const formatPercent = (value) => (value === null ? "—" : `${Math.round(value * 100) / 100}%`);
const formatMarks = (value, total) => (value === null ? "—" : `${Math.round(value * 100) / 100} / ${total}`);
const Tip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="analytics-tip">
      <b>{label ?? payload[0].name}</b>
      <span>{payload[0].value}</span>
    </div>
  ) : null;

const ANALYTICS_PREFERENCE_KEY = "evalai_teacher_analytics_preferences";
const readAnalyticsPreferences = () => {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(ANALYTICS_PREFERENCE_KEY) || "{}");
  } catch {
    return {};
  }
};

function TeacherAnalyticsPage() {
  const currentTeacher = getCurrentTeacher();
  const teacherId = currentTeacher?.teacherId || currentTeacher?.id;

  const [retryKey, setRetryKey] = useState(0);
  const teacherAssignments = useMemo(() => {
    if (!teacherId) return [];
    return getTeacherAssignments(teacherId);
  }, [teacherId, retryKey]);

  const [assessmentId, setAssessmentId] = useState(() => {
    const stored = readAnalyticsPreferences().assessmentId;
    return stored && teacherAssignments.some((item) => item.id === stored)
      ? stored
      : teacherAssignments[0]?.id || "";
  });

  const [selectedGrade, setSelectedGrade] = useState("All Grades");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedClass, setSelectedClass] = useState(() => readAnalyticsPreferences().selectedClass || "All classes");
  const [tab, setTab] = useState(() => readAnalyticsPreferences().tab || "overview");
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(() => readAnalyticsPreferences().selectedStudentId || "");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Sync assessmentId if current selection is invalid or teacher assignments change
  useEffect(() => {
    if (teacherAssignments.length > 0) {
      if (!assessmentId || !teacherAssignments.some((item) => item.id === assessmentId)) {
        setAssessmentId(teacherAssignments[0].id);
        setSelectedGrade("All Grades");
      }
    } else {
      setAssessmentId("");
      setSelectedGrade("All Grades");
    }
  }, [teacherAssignments, assessmentId]);

  const selectedAssessment = useMemo(() => {
    if (!assessmentId) return null;
    return teacherAssignments.find((a) => a.id === assessmentId) || getAssignmentById(assessmentId);
  }, [assessmentId, teacherAssignments]);

  const selectedData = useMemo(
    () => getAssessmentData(selectedAssessment, selectedDifficulty),
    [selectedAssessment, selectedDifficulty, retryKey]
  );

  // Re-validate grade filter when selected assignment changes
  useEffect(() => {
    if (selectedData.availableGrades && !selectedData.availableGrades.includes(selectedGrade)) {
      setSelectedGrade("All Grades");
    }
  }, [selectedData.availableGrades, selectedGrade]);

  const classOptions = useMemo(
    () => ["All classes", ...new Set(selectedData.records.map((record) => record.division).filter(Boolean))],
    [selectedData.records]
  );
  const activeClass = classOptions.includes(selectedClass) ? selectedClass : "All classes";

  const analyticsResult = useMemo(() => {
    if (!selectedAssessment) return { data: null, error: "" };
    try {
      return { data: calculateAnalytics(selectedData, activeClass, selectedGrade), error: "" };
    } catch {
      return { data: null, error: "Unable to load analytics. Please try again." };
    }
  }, [selectedData, activeClass, selectedGrade, selectedAssessment]);

  const analytics = analyticsResult.data;
  const scoredRecords = useMemo(
    () => getScoredRecords(selectedData, activeClass, selectedGrade),
    [selectedData, activeClass, selectedGrade]
  );

  const detail = useMemo(() => {
    if (!selectedAssessment) return { questions: [], rankings: [], minimumResponses: 2 };
    const questionMap = new Map();
    scoredRecords.forEach(({ record }) =>
      getQuestionRows(record, selectedData.assessment).forEach((question) => {
        const max = toNumber(question.maximumMarks);
        const awarded = toNumber(question.awardedMarks);
        if (max === null || max <= 0 || awarded === null || awarded < 0 || awarded > max) return;
        const current = questionMap.get(question.questionNumber) || {
          questionNumber: question.questionNumber,
          questionText: question.questionText || `Question ${question.questionNumber}`,
          maximumMarks: max,
          responses: [],
        };
        current.responses.push({ awarded, percentage: (awarded / max) * 100 });
        current.maximumMarks = max;
        questionMap.set(question.questionNumber, current);
      })
    );

    const questions = [...questionMap.values()]
      .map((question) => ({
        ...question,
        evaluatedStudents: question.responses.length,
        averageMarks: question.responses.reduce((sum, item) => sum + item.awarded, 0) / question.responses.length,
        averagePercentage: question.responses.reduce((sum, item) => sum + item.percentage, 0) / question.responses.length,
        highestMarks: Math.max(...question.responses.map((item) => item.awarded)),
        lowestMarks: Math.min(...question.responses.map((item) => item.awarded)),
      }))
      .sort((a, b) => Number(a.questionNumber) - Number(b.questionNumber));

    const rankings = [...scoredRecords]
      .sort((a, b) => b.percentage - a.percentage || b.obtained - a.obtained)
      .map((item, index) => ({
        rank: index + 1,
        studentName: item.record.studentName,
        rollNumber: item.record.rollNumber,
        marks: item.obtained,
        percentage: item.percentage,
        grade: item.grade,
        status: isPublished(item.record) ? "Published" : isApproved(item.record) ? "Approved" : "Evaluated",
        record: item.record,
      }));

    return { questions, rankings, minimumResponses: 2 };
  }, [scoredRecords, selectedData.assessment, selectedAssessment]);

  const studentOptions = useMemo(
    () =>
      scoredRecords.map((item) => item.record).filter((record) => {
        const query = studentQuery.trim().toLowerCase();
        return !query || `${record.studentName} ${record.rollNumber}`.toLowerCase().includes(query);
      }),
    [scoredRecords, studentQuery]
  );

  const selectedStudent = selectedData.records.find((record) => record.studentId === selectedStudentId) || null;
  const selectedStudentScore = selectedStudent
    ? scoredRecords.find((item) => item.record.studentId === selectedStudent.studentId)
    : null;
  const classAverage = analytics?.averagePercentage ?? null;
  const studentQuestions = selectedStudentScore
    ? getQuestionRows(selectedStudent, selectedData.assessment)
        .map((question) => {
          const max = toNumber(question.maximumMarks);
          const awarded = toNumber(question.awardedMarks);
          return {
            ...question,
            maximumMarks: max,
            awardedMarks: awarded,
            percentage: max > 0 && awarded !== null ? (awarded / max) * 100 : null,
          };
        })
        .filter((question) => question.maximumMarks > 0)
    : [];

  const filteredQuestions = detail.questions;
  const attentionQuestions = filteredQuestions.filter(
    (question) => question.evaluatedStudents >= detail.minimumResponses && question.averagePercentage < 60
  );
  const strongQuestions = filteredQuestions.filter(
    (question) => question.evaluatedStudents >= detail.minimumResponses && question.averagePercentage >= 80
  );
  const questionRanking = [...filteredQuestions].sort((a, b) => b.averagePercentage - a.averagePercentage);

  const handleAssessmentChange = (event) => {
    setLoading(true);
    setAssessmentId(event.target.value);
    setSelectedGrade("All Grades");
    setSelectedClass("All classes");
    setSelectedStudentId("");
    setStudentQuery("");
  };

  const handleClassChange = (event) => {
    setLoading(true);
    setSelectedClass(event.target.value);
    setSelectedStudentId("");
  };

  useEffect(() => {
    setLoadError(analyticsResult.error);
  }, [analyticsResult.error]);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 180);
    return () => window.clearTimeout(timer);
  }, [assessmentId, selectedGrade, selectedDifficulty, activeClass, retryKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(
      ANALYTICS_PREFERENCE_KEY,
      JSON.stringify({ assessmentId, selectedClass: activeClass, selectedStudentId, tab })
    );
  }, [assessmentId, activeClass, selectedStudentId, tab]);

  // Security & Authentication check
  if (!currentTeacher || !teacherId) {
    return <Navigate to="/teacher/login" replace />;
  }

  // Handle empty state if teacher has no created assignments
  if (teacherAssignments.length === 0 || !selectedAssessment) {
    return (
      <div className="academic-analytics">
        <header className="analytics-heading">
          <div>
            <p>ACADEMIC INSIGHTS</p>
            <h1>Teacher Analytics</h1>
            <span>Review class performance using your created assessment evaluation data.</span>
          </div>
          <div className="analytics-context">
            <Users size={17} /> No Assessments
          </div>
        </header>
        <div className="analytics-empty surface">
          <BarChart3 size={36} style={{ color: "#94a3b8" }} />
          <h2>No assessments available</h2>
          <p>Create and publish an assignment to view its analytics here.</p>
        </div>
      </div>
    );
  }

  const cards = analytics
    ? [
        ["Total Students", analytics.totalStudents, "Targeted roster for assessment", Users, "blue"],
        ["Evaluated", analytics.evaluated, `${formatPercent(analytics.progressPercentage)} of total`, ClipboardCheck, "green"],
        ["Pending", analytics.pending, "Awaiting evaluation", AlertCircle, "amber"],
        ["Approved", analytics.approved, "Teacher-approved evaluations", CheckCircle2, "purple"],
        ["Published", analytics.published, "Visible through publication", GraduationCap, "blue"],
        ["Average Marks", formatMarks(analytics.averageMarks, selectedAssessment.totalMarks), formatPercent(analytics.averagePercentage), BarChart3, "green"],
        ["Highest Marks", formatMarks(analytics.highestMarks, selectedAssessment.totalMarks), formatPercent(analytics.highestPercentage), Award, "blue"],
        ["Lowest Marks", formatMarks(analytics.lowestMarks, selectedAssessment.totalMarks), formatPercent(analytics.lowestPercentage), AlertCircle, "amber"],
        ["Pass Percentage", formatPercent(analytics.passPercentage), "60% or above", CheckCircle2, "purple"],
      ]
    : [];

  const renderOverviewContent = () => {
    if (loading) return <LoadingState text="Preparing the selected assessment data." />;
    if (loadError) return <ErrorState onRetry={() => setRetryKey((value) => value + 1)} />;

    if (selectedData.submissions.length === 0) {
      return (
        <EmptyState
          title="No submissions available for this assessment."
          text="Students have not submitted any answer sheets for this assessment yet."
        />
      );
    }

    if (selectedData.evaluatedRecords.length === 0) {
      return (
        <EmptyState
          title="No evaluated results available yet."
          text="Evaluations have not been completed for this assignment yet."
        />
      );
    }

    if (!analytics || scoredRecords.length === 0) {
      return (
        <EmptyState
          title="No grade results available yet."
          text="No student evaluation results match the selected grade filter."
        />
      );
    }

    return (
      <>
        <section className="analytics-stat-grid">
          {cards.map(([label, value, note, Icon, tone]) => (
            <article className="analytics-stat" key={label}>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
              <i className={tone}>
                <Icon size={20} />
              </i>
            </article>
          ))}
        </section>
        <section className="analytics-progress surface">
          <div>
            <div className="analytics-section-kicker">EVALUATION PROGRESS</div>
            <h2>
              {analytics.evaluated} / {analytics.totalStudents} students evaluated
            </h2>
            <p>
              {analytics.pending} pending · {analytics.approved} approved · {analytics.published} published
            </p>
          </div>
          <strong>{formatPercent(analytics.progressPercentage)}</strong>
          <div className="analytics-progress-track">
            <span style={{ width: `${analytics.progressPercentage}%` }} />
          </div>
        </section>
        <section className="analytics-summary surface">
          <div>
            <div className="analytics-section-kicker">CLASS PERFORMANCE SUMMARY</div>
            <h2>{selectedAssessment.title}</h2>
            <p>
              Assessment total: {selectedAssessment.totalMarks} marks · Subject: {selectedAssessment.subjectName || selectedAssessment.subject} ({selectedAssessment.courseCode})
            </p>
          </div>
          <div className="analytics-summary-values">
            <div>
              <span>Average Percentage</span>
              <strong>{formatPercent(analytics.averagePercentage)}</strong>
            </div>
            <div>
              <span>Highest Percentage</span>
              <strong>{formatPercent(analytics.highestPercentage)}</strong>
            </div>
            <div>
              <span>Lowest Percentage</span>
              <strong>{formatPercent(analytics.lowestPercentage)}</strong>
            </div>
            <div>
              <span>Pass Percentage</span>
              <strong>{formatPercent(analytics.passPercentage)}</strong>
            </div>
          </div>
        </section>

        {/* Student Performance Table */}
        <section className="surface examination-table-panel" style={{ marginTop: "18px" }}>
          <div className="examination-table-heading">
            <div>
              <div className="analytics-section-kicker">EVALUATED STUDENTS</div>
              <h2>Student Results ({selectedGrade})</h2>
            </div>
          </div>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scoredRecords.map((item, index) => (
                  <tr key={item.record.studentId}>
                    <td>{index + 1}</td>
                    <td>{item.record.rollNumber}</td>
                    <td>{item.record.studentName}</td>
                    <td>{`${item.obtained} / ${selectedAssessment.totalMarks}`}</td>
                    <td>{formatPercent(item.percentage)}</td>
                    <td>
                      <span className="grade-badge">{item.grade}</span>
                    </td>
                    <td>{isPublished(item.record) ? "Published" : isApproved(item.record) ? "Approved" : "Evaluated"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="analytics-chart-grid" style={{ marginTop: "18px" }}>
          <Chart title="Performance Distribution" subtitle="Evaluated students by percentage band">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.distribution}>
                <CartesianGrid vertical={false} stroke="#edf2f7" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="students" fill="#2563eb" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
          <Chart title="Grade Distribution" subtitle="Evaluated grades for selected assessment">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={analytics.grades} dataKey="students" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4}>
                  {analytics.grades.map((entry, index) => (
                    <Cell key={entry.name} fill={["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="status-key">
              {analytics.grades.map((item) => (
                <span key={item.name}>
                  <i className="grade-dot" />
                  {item.name}: {item.students}
                </span>
              ))}
            </div>
          </Chart>
        </section>
      </>
    );
  };

  return (
    <div className="academic-analytics">
      <header className="analytics-heading">
        <div>
          <p>ACADEMIC INSIGHTS</p>
          <h1>Teacher Analytics</h1>
          <span>Review class performance using your created assessment evaluation data.</span>
        </div>
        <div className="analytics-context">
          <Users size={17} />
          {selectedAssessment.title} · {selectedAssessment.division || "TE ENTC – A"}
        </div>
      </header>

      {/* Top Filter Bar */}
      <section className="analytics-filters">
        <label>
          <span>Assessment</span>
          <select value={assessmentId} onChange={handleAssessmentChange}>
            {teacherAssignments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.courseCode || item.subjectName})
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Grade Filter</span>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
            {selectedData.availableGrades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Difficulty</span>
          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          <span>Class / Division</span>
          <select value={activeClass} onChange={handleClassChange}>
            {classOptions.map((className) => (
              <option key={className}>{className}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="workflow-btn"
          onClick={() => {
            setLoading(true);
            setRetryKey((value) => value + 1);
          }}
        >
          <RotateCcw size={14} /> Refresh
        </button>
      </section>

      {/* Manual Subject Data Display Panel */}
      {selectedAssessment && (
        <section className="analytics-metadata-panel">
          <div className="meta-item">
            <span>Assessment Title</span>
            <strong>{selectedAssessment.title}</strong>
          </div>
          <div className="meta-item">
            <span>Subject</span>
            <strong>{selectedAssessment.subjectName || selectedAssessment.subject || "N/A"}</strong>
          </div>
          <div className="meta-item">
            <span>Course Code</span>
            <strong>{selectedAssessment.courseCode || "N/A"}</strong>
          </div>
          <div className="meta-item">
            <span>Branch</span>
            <strong>{selectedAssessment.branch || "ENTC"}</strong>
          </div>
          <div className="meta-item">
            <span>Division</span>
            <strong>{selectedAssessment.division || "TE ENTC – A"}</strong>
          </div>
          <div className="meta-item">
            <span>Total Marks</span>
            <strong>{selectedAssessment.totalMarks} Marks</strong>
          </div>
          <div className="meta-item">
            <span>Due Date</span>
            <strong>
              {selectedAssessment.dueDate || "N/A"}{" "}
              {selectedAssessment.dueTime ? `at ${selectedAssessment.dueTime}` : ""}
            </strong>
          </div>
        </section>
      )}

      <nav className="analytics-tabs" aria-label="Analytics sections">
        <button
          type="button"
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Class Overview
        </button>
        <button
          type="button"
          className={tab === "detail" ? "active" : ""}
          onClick={() => setTab("detail")}
        >
          Detailed Analysis
        </button>
        <button
          type="button"
          className={tab === "exam" ? "active" : ""}
          onClick={() => setTab("exam")}
        >
          Examination Analytics
        </button>
      </nav>

      {tab === "overview" ? (
        renderOverviewContent()
      ) : tab === "exam" ? (
        <ExaminationAnalytics teacherAssignments={teacherAssignments} />
      ) : (
        <DetailedAnalysis
          loading={loading}
          loadError={loadError}
          onRetry={() => setRetryKey((value) => value + 1)}
          option={{ assessment: selectedAssessment, label: selectedAssessment.title }}
          analytics={analytics}
          studentOptions={studentOptions}
          studentQuery={studentQuery}
          setStudentQuery={setStudentQuery}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
          selectedStudent={selectedStudent}
          selectedStudentScore={selectedStudentScore}
          classAverage={classAverage}
          studentQuestions={studentQuestions}
          detail={detail}
          questionRanking={questionRanking}
          attentionQuestions={attentionQuestions}
          strongQuestions={strongQuestions}
        />
      )}
    </div>
  );
}

const examinationTypeOptions = [
  { value: "all", label: "All" },
  { value: "assignment", label: "Assignment" },
  { value: "in-sem", label: "In-Sem Examination" },
  { value: "end-sem", label: "End-Sem Examination" },
];
const EXAM_ANALYTICS_PREFERENCE_KEY = "evalai_exam_analytics_preferences";
const readExamPreferences = () => {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(EXAM_ANALYTICS_PREFERENCE_KEY) || "{}");
  } catch {
    return {};
  }
};

const examinationStatus = (record) =>
  isPublished(record) ? "Published" : isApproved(record) ? "Approved" : isEvaluated(record) ? "Evaluated" : "Pending";

const examinationRow = (record, assessment) => {
  const activeEval = record.activeEvaluation || record.evaluation;
  const obtained = isEvaluated(record) ? toNumber(activeEval?.obtainedMarks ?? activeEval?.score) : null;
  const total = toNumber(assessment.totalMarks);
  const percentage = obtained !== null && total > 0 ? (obtained / total) * 100 : null;
  return {
    record,
    assessment,
    rollNumber: record.rollNumber,
    studentName: record.studentName,
    division: record.division,
    status: examinationStatus(record),
    obtained,
    total,
    percentage,
    grade: record.grade || (percentage === null ? "—" : calculateGrade(percentage)),
  };
};

function ExaminationAnalytics({ teacherAssignments }) {
  const [type, setType] = useState(() => readExamPreferences().type || "all");
  const availableAssessments = useMemo(
    () => teacherAssignments.filter((item) => type === "all" || item.assessmentType === type),
    [teacherAssignments, type]
  );
  const [assessmentId, setAssessmentId] = useState(
    () => readExamPreferences().assessmentId || availableAssessments[0]?.id || ""
  );
  const [className, setClassName] = useState(() => readExamPreferences().className || "All Classes");
  const [division, setDivision] = useState(() => readExamPreferences().division || "All Divisions");
  const [status, setStatus] = useState(() => readExamPreferences().status || "All");
  const [performance, setPerformance] = useState(() => readExamPreferences().performance || "All");
  const [grade, setGrade] = useState(() => readExamPreferences().grade || "All");
  const [minMarks, setMinMarks] = useState(() => readExamPreferences().minMarks || "");
  const [maxMarks, setMaxMarks] = useState(() => readExamPreferences().maxMarks || "");
  const [query, setQuery] = useState(() => readExamPreferences().query || "");
  const [sortBy, setSortBy] = useState(() => readExamPreferences().sortBy || "percentage");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedAssessment = availableAssessments.find((item) => item.id === assessmentId) || availableAssessments[0] || null;
  const data = useMemo(() => (selectedAssessment ? getAssessmentData(selectedAssessment) : null), [selectedAssessment]);
  const rows = useMemo(() => (data ? data.records.map((record) => examinationRow(record, data.assessment)) : []), [data]);
  const classes = useMemo(() => ["All Classes", ...new Set(rows.map((row) => row.assessment.division).filter(Boolean))], [rows]);
  const divisions = useMemo(() => ["All Divisions", ...new Set(rows.map((row) => row.division).filter(Boolean))], [rows]);
  const grades = useMemo(() => ["All", ...new Set(rows.filter((row) => row.grade !== "—").map((row) => row.grade))], [rows]);
  const rangeError = minMarks !== "" && maxMarks !== "" && Number(minMarks) > Number(maxMarks);

  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !search || `${row.studentName} ${row.rollNumber}`.toLowerCase().includes(search);
      const matchesClass = className === "All Classes" || row.assessment.division === className;
      const matchesDivision = division === "All Divisions" || row.division === division;
      const matchesStatus = status === "All" || row.status === status;
      const matchesPerformance =
        performance === "All" ||
        (row.percentage !== null &&
          (performance === "Pass"
            ? row.percentage >= 60
            : performance === "Fail"
            ? row.percentage < 60
            : row.percentage < 60));
      const matchesGrade = grade === "All" || row.grade === grade;
      const matchesMin = minMarks === "" || (row.obtained !== null && row.obtained >= Number(minMarks));
      const matchesMax = maxMarks === "" || (row.obtained !== null && row.obtained <= Number(maxMarks));
      return !rangeError && matchesSearch && matchesClass && matchesDivision && matchesStatus && matchesPerformance && matchesGrade && matchesMin && matchesMax;
    });
  }, [rows, query, className, division, status, performance, grade, minMarks, maxMarks, rangeError]);

  const sortedRows = useMemo(
    () =>
      [...filteredRows]
        .sort((a, b) =>
          sortBy === "roll"
            ? String(a.rollNumber).localeCompare(String(b.rollNumber), undefined, { numeric: true })
            : sortBy === "marks"
            ? (b.obtained ?? -1) - (a.obtained ?? -1)
            : sortBy === "grade"
            ? a.grade.localeCompare(b.grade)
            : sortBy === "status"
            ? a.status.localeCompare(b.status)
            : (b.percentage ?? -1) - (a.percentage ?? -1)
        )
        .map((row, index) => ({ ...row, rank: index + 1 })),
    [filteredRows, sortBy]
  );

  const evaluated = filteredRows.filter((row) => row.percentage !== null);
  const summary = {
    total: filteredRows.length,
    evaluated: evaluated.length,
    pending: filteredRows.filter((row) => row.status === "Pending" || row.status === "Not Submitted").length,
    approved: filteredRows.filter((row) => row.status === "Approved").length,
    published: filteredRows.filter((row) => row.status === "Published").length,
    average: evaluated.length ? evaluated.reduce((sum, row) => sum + row.percentage, 0) / evaluated.length : null,
    highest: evaluated.length ? Math.max(...evaluated.map((row) => row.percentage)) : null,
    lowest: evaluated.length ? Math.min(...evaluated.map((row) => row.percentage)) : null,
    pass: evaluated.length ? (evaluated.filter((row) => row.percentage >= 60).length / evaluated.length) * 100 : null,
  };

  const distribution = [
    ["0–20", 0, 20],
    ["21–40", 20, 40],
    ["41–60", 40, 60],
    ["61–80", 60, 80],
    ["81–100", 80, 100],
  ].map(([name, lower, upper], index, bands) => ({
    name,
    students: evaluated.filter((row) =>
      index === 0 ? row.percentage <= upper : index === bands.length - 1 ? row.percentage > lower : row.percentage > lower && row.percentage <= upper
    ).length,
  }));

  const gradeData = Object.entries(
    evaluated.reduce((result, row) => {
      result[row.grade] = (result[row.grade] || 0) + 1;
      return result;
    }, {})
  ).map(([name, students]) => ({ name, students }));

  const reset = () => {
    setType("all");
    setAssessmentId(availableAssessments[0]?.id || "");
    setClassName("All Classes");
    setDivision("All Divisions");
    setStatus("All");
    setPerformance("All");
    setGrade("All");
    setMinMarks("");
    setMaxMarks("");
    setQuery("");
    setMessage("");
  };

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 150);
    return () => window.clearTimeout(timer);
  }, [type, assessmentId, className, division, status, performance, grade, minMarks, maxMarks, query]);

  useEffect(() => {
    if (availableAssessments.length && !availableAssessments.some((item) => item.id === assessmentId)) {
      setAssessmentId(availableAssessments[0].id);
    }
  }, [availableAssessments, assessmentId]);

  if (!selectedAssessment) return <EmptyState title="No assessments available" text="No assessments available for examination analytics." />;

  const activeLabels = [
    [type !== "all" && examinationTypeOptions.find((item) => item.value === type)?.label],
    [selectedAssessment.title],
    [className !== "All Classes" && className],
    [division !== "All Divisions" && division],
    [status !== "All" && status],
    [performance !== "All" && performance],
    [grade !== "All" && grade],
    [query && `Search: ${query}`],
    [(minMarks !== "" || maxMarks !== "") && `Marks: ${minMarks || 0}–${maxMarks || selectedAssessment.totalMarks}`],
  ]
    .flat()
    .filter(Boolean);

  const exportRows = () => {
    try {
      if (!selectedAssessment || !sortedRows.length) return setMessage("No students match the selected filters.");
      const fields = ["Roll Number", "Student Name", "Assessment", "Maximum Marks", "Obtained Marks", "Percentage", "Grade", "Evaluation Status"];
      const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
      const csv = [
        fields,
        ...sortedRows.map((row) => [
          row.rollNumber,
          row.studentName,
          row.assessment.title,
          row.total,
          row.obtained ?? "",
          row.percentage === null ? "" : `${Math.round(row.percentage * 100) / 100}%`,
          row.grade,
          row.status,
        ]),
      ]
        .map((line) => line.map(escape).join(","))
        .join("\n");
      const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${selectedAssessment.id}-analytics-grade-sheet.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`${sortedRows.length} filtered records exported.`);
    } catch {
      setMessage("Unable to generate the requested data. Please try again.");
    }
  };

  return (
    <section className="examination-analytics">
      <div className="examination-filter-grid">
        <label>
          <span>Assessment Type</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {examinationTypeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Assessment</span>
          <select value={selectedAssessment.id} onChange={(event) => setAssessmentId(event.target.value)}>
            {availableAssessments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Class</span>
          <select value={className} onChange={(event) => setClassName(event.target.value)}>
            {classes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Division</span>
          <select value={division} onChange={(event) => setDivision(event.target.value)}>
            {divisions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Student Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {["All", "Evaluated", "Pending", "Approved", "Published"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Performance</span>
          <select value={performance} onChange={(event) => setPerformance(event.target.value)}>
            {["All", "Pass", "Fail", "Needs Attention"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Grade</span>
          <select value={grade} onChange={(event) => setGrade(event.target.value)}>
            {grades.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Search Student</span>
          <div className="examination-search">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or roll number" />
          </div>
        </label>
        <label>
          <span>Minimum Marks</span>
          <input
            type="number"
            min="0"
            max={selectedAssessment.totalMarks}
            value={minMarks}
            onChange={(event) => setMinMarks(event.target.value)}
          />
        </label>
        <label>
          <span>Maximum Marks</span>
          <input
            type="number"
            min="0"
            max={selectedAssessment.totalMarks}
            value={maxMarks}
            onChange={(event) => setMaxMarks(event.target.value)}
          />
        </label>
      </div>

      <div className="active-filter-row">
        <strong>Active Filters</strong>
        {activeLabels.length ? activeLabels.map((item) => <span key={item}>{item}</span>) : <em>None</em>}
        <button type="button" className="text-action" onClick={reset}>
          Clear Filters
        </button>
      </div>

      {rangeError && <div className="analytics-filter-error" role="alert">Minimum marks cannot exceed maximum marks.</div>}
      {message && <div className="analytics-filter-message" role="status">{message}</div>}

      {loading ? (
        <LoadingState text="Updating examination analytics." />
      ) : !sortedRows.length ? (
        <EmptyState title="No matching students" text="No students match the selected filters." />
      ) : (
        <>
          <section className="analytics-stat-grid examination-summary-cards">
            {[
              ["Total Students", summary.total],
              ["Evaluated", summary.evaluated],
              ["Pending", summary.pending],
              ["Approved", summary.approved],
              ["Published", summary.published],
              ["Average", formatPercent(summary.average)],
              ["Highest", formatPercent(summary.highest)],
              ["Lowest", formatPercent(summary.lowest)],
              ["Pass %", formatPercent(summary.pass)],
            ].map(([label, value]) => (
              <article className="analytics-stat" key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>Filtered dataset</small>
                </div>
              </article>
            ))}
          </section>

          <section className="surface examination-table-panel">
            <div className="examination-table-heading">
              <div>
                <div className="analytics-section-kicker">FILTERED STUDENTS</div>
                <h2>Student performance</h2>
              </div>
              <div>
                <label className="sort-control">
                  Sort by{" "}
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="percentage">Percentage</option>
                    <option value="roll">Roll Number</option>
                    <option value="marks">Marks</option>
                    <option value="grade">Grade</option>
                    <option value="status">Status</option>
                  </select>
                </label>
                <button type="button" className="workflow-btn primary" onClick={exportRows}>
                  <Download size={14} /> Export Grade Sheet
                </button>
              </div>
            </div>
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll No</th>
                    <th>Student</th>
                    <th>Marks</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.record.studentId}>
                      <td>{row.rank}</td>
                      <td>{row.rollNumber}</td>
                      <td>{row.studentName}</td>
                      <td>{row.obtained === null ? "—" : `${row.obtained}/${row.total}`}</td>
                      <td>{formatPercent(row.percentage)}</td>
                      <td>{row.grade}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="analytics-chart-grid">
            <Chart title="Filtered Score Distribution" subtitle="Evaluated students by percentage">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={distribution}>
                  <CartesianGrid vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="students" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </Chart>
            <Chart title="Filtered Grade Distribution" subtitle="Actual grades in the filtered dataset">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={gradeData} dataKey="students" nameKey="name" innerRadius={52} outerRadius={78}>
                    {gradeData.map((item, index) => (
                      <Cell key={item.name} fill={["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </Chart>
          </section>
        </>
      )}
    </section>
  );
}

function DetailedAnalysis({
  loading,
  loadError,
  onRetry,
  option,
  analytics,
  studentOptions,
  studentQuery,
  setStudentQuery,
  selectedStudentId,
  setSelectedStudentId,
  selectedStudent,
  selectedStudentScore,
  classAverage,
  studentQuestions,
  detail,
  questionRanking,
  attentionQuestions,
  strongQuestions,
}) {
  if (loading) return <LoadingState text="Preparing detailed analytics." />;
  if (loadError) return <ErrorState message="Unable to load detailed analytics. Please try again." onRetry={onRetry} />;
  if (!analytics || analytics.evaluated === 0)
    return <EmptyState title="No evaluation data available yet." text="Evaluated student results will appear here when ready." />;

  const difference = selectedStudentScore && classAverage !== null ? selectedStudentScore.percentage - classAverage : null;
  const status = selectedStudent
    ? isPublished(selectedStudent)
      ? "Published"
      : isApproved(selectedStudent)
      ? "Approved"
      : isEvaluated(selectedStudent)
      ? "Evaluated"
      : "Pending"
    : "";

  return (
    <div className="detailed-analysis">
      <section className="student-selector surface">
        <div>
          <div className="analytics-section-kicker">STUDENT PERFORMANCE</div>
          <h2>Select a student</h2>
        </div>
        <label className="student-search">
          <Search size={15} />
          <input
            value={studentQuery}
            onChange={(event) => setStudentQuery(event.target.value)}
            placeholder="Search by name or roll number"
          />
        </label>
        <select
          className="student-select"
          value={selectedStudentId}
          onChange={(event) => setSelectedStudentId(event.target.value)}
        >
          <option value="">Select student…</option>
          {studentOptions.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.studentName} · {student.rollNumber}
            </option>
          ))}
        </select>
      </section>

      {!selectedStudent ? (
        <EmptyState title="Select a student" text="Select a student from the dropdown above to view individual performance." />
      ) : (
        <>
          <section className="student-performance surface">
            <div>
              <div className="analytics-section-kicker">STUDENT PERFORMANCE</div>
              <h2>{selectedStudent.studentName}</h2>
              <p>
                {selectedStudent.rollNumber} · {option.assessment.title}
              </p>
            </div>
            <div className="student-performance-metrics">
              <div>
                <span>Marks</span>
                <strong>
                  {selectedStudentScore ? `${selectedStudentScore.obtained} / ${option.assessment.totalMarks}` : "—"}
                </strong>
              </div>
              <div>
                <span>Percentage</span>
                <strong>{formatPercent(selectedStudentScore?.percentage ?? null)}</strong>
              </div>
              <div>
                <span>Grade</span>
                <strong>
                  {selectedStudentScore
                    ? selectedStudentScore.grade || calculateGrade(selectedStudentScore.percentage)
                    : "—"}
                </strong>
              </div>
              <div>
                <span>Class Average</span>
                <strong>{formatPercent(classAverage)}</strong>
              </div>
              <div className={difference !== null && difference >= 0 ? "positive" : "negative"}>
                <span>Difference</span>
                <strong>
                  {difference === null ? "—" : `${difference >= 0 ? "+" : ""}${Math.round(difference * 100) / 100}%`}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{status}</strong>
              </div>
            </div>
          </section>

          <section className="detail-grid">
            <article className="surface detail-panel">
              <div className="analytics-section-kicker">QUESTION-WISE STUDENT PERFORMANCE</div>
              <h2>Student answers by question</h2>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Maximum</th>
                      <th>Obtained</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentQuestions.length ? (
                      studentQuestions.map((question) => (
                        <tr key={question.questionNumber}>
                          <td>Q{question.questionNumber}</td>
                          <td>{question.maximumMarks}</td>
                          <td>{question.awardedMarks ?? "—"}</td>
                          <td>{formatPercent(question.percentage)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">Question-wise analytics are not available for this assessment.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="surface detail-panel">
              <div className="analytics-section-kicker">STUDENT QUESTION PERFORMANCE</div>
              <h2>Student vs class average</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={studentQuestions.map((question) => ({
                    name: `Q${question.questionNumber}`,
                    Student: question.percentage || 0,
                    Class: detail.questions.find((item) => item.questionNumber === question.questionNumber)?.averagePercentage || 0,
                  }))}
                >
                  <CartesianGrid vertical={false} stroke="#edf2f7" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="Student" fill="#2563eb" />
                  <Bar dataKey="Class" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </article>
          </section>

          <QuestionAnalysis
            detail={detail}
            questionRanking={questionRanking}
            attentionQuestions={attentionQuestions}
            strongQuestions={strongQuestions}
          />
          <StudentInsights questions={studentQuestions} />
          <RankingTable rankings={detail.rankings} />
        </>
      )}
    </div>
  );
}

function QuestionAnalysis({ detail, questionRanking, attentionQuestions, strongQuestions }) {
  return (
    <section className="surface question-analysis">
      <div className="analytics-section-kicker">QUESTION-WISE CLASS PERFORMANCE</div>
      <h2>Class question analysis</h2>
      {detail.questions.length < 1 ? (
        <p className="analytics-muted">Question-wise analytics are not available for this assessment.</p>
      ) : (
        <>
          <div className="analytics-table-wrap">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Maximum</th>
                  <th>Evaluated</th>
                  <th>Average</th>
                  <th>Average %</th>
                  <th>High</th>
                  <th>Low</th>
                </tr>
              </thead>
              <tbody>
                {detail.questions.map((question) => (
                  <tr key={question.questionNumber}>
                    <td>Q{question.questionNumber}</td>
                    <td>{question.maximumMarks}</td>
                    <td>{question.evaluatedStudents}</td>
                    <td>
                      {Math.round(question.averageMarks * 100) / 100} / {question.maximumMarks}
                    </td>
                    <td>{formatPercent(question.averagePercentage)}</td>
                    <td>{question.highestMarks}</td>
                    <td>{question.lowestMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="question-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={questionRanking.map((question) => ({
                  name: `Q${question.questionNumber}`,
                  performance: Math.round(question.averagePercentage * 100) / 100,
                }))}
              >
                <CartesianGrid vertical={false} stroke="#edf2f7" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="performance" fill="#2563eb" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="question-callouts">
            <QuestionCallout
              title="Questions Requiring Attention"
              questions={attentionQuestions}
              empty={
                detail.questions.some((question) => question.evaluatedStudents < detail.minimumResponses)
                  ? "Insufficient data for reliable question analysis."
                  : "No questions currently require attention."
              }
            />
            <QuestionCallout
              title="Strong Performing Questions"
              questions={strongQuestions}
              empty={
                detail.questions.some((question) => question.evaluatedStudents < detail.minimumResponses)
                  ? "Insufficient data for reliable question analysis."
                  : "No questions currently meet the strong-performance threshold."
              }
            />
          </div>
        </>
      )}
    </section>
  );
}

function QuestionCallout({ title, questions, empty }) {
  return (
    <div className="question-callout">
      <h3>{title}</h3>
      {questions.length ? (
        questions.map((question) => (
          <p key={question.questionNumber}>
            <strong>Q{question.questionNumber}</strong>
            <span>{formatPercent(question.averagePercentage)} average</span>
          </p>
        ))
      ) : (
        <p className="analytics-muted">{empty}</p>
      )}
    </div>
  );
}

function StudentInsights({ questions }) {
  const strengths = questions.filter((question) => question.percentage !== null && question.percentage >= 80);
  const improvements = questions.filter((question) => question.percentage !== null && question.percentage < 60);
  return (
    <section className="student-insights">
      <article className="surface">
        <div className="analytics-section-kicker">STUDENT STRENGTHS</div>
        <h2>Strong questions</h2>
        {strengths.length ? (
          strengths.map((question) => (
            <p key={question.questionNumber}>
              Q{question.questionNumber} · {formatPercent(question.percentage)}
            </p>
          ))
        ) : (
          <p className="analytics-muted">No strong question data available.</p>
        )}
      </article>
      <article className="surface">
        <div className="analytics-section-kicker">AREAS FOR IMPROVEMENT</div>
        <h2>Questions needing support</h2>
        {improvements.length ? (
          improvements.map((question) => (
            <p key={question.questionNumber}>
              Q{question.questionNumber} · {formatPercent(question.percentage)}
            </p>
          ))
        ) : (
          <p className="analytics-muted">No improvement areas identified.</p>
        )}
      </article>
    </section>
  );
}

function RankingTable({ rankings }) {
  return (
    <section className="surface ranking-panel">
      <div className="analytics-section-kicker">CLASS STUDENT RANKING</div>
      <h2>Evaluated students</h2>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Roll Number</th>
              <th>Marks</th>
              <th>Percentage</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {rankings.length ? (
              rankings.map((item) => (
                <tr key={item.record.studentId}>
                  <td>{item.rank}</td>
                  <td>{item.studentName}</td>
                  <td>{item.rollNumber}</td>
                  <td>{item.marks}</td>
                  <td>{formatPercent(item.percentage)}</td>
                  <td>{item.grade}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No evaluation data available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LoadingState({ text }) {
  return (
    <div className="analytics-empty">
      <Loader2 className="analytics-spinner" size={24} />
      <h2>Loading analytics…</h2>
      <p>{text}</p>
    </div>
  );
}

function EmptyState({ title = "No data available", text = "Available data will appear here when evaluations are completed." }) {
  return (
    <div className="analytics-empty surface">
      <BarChart3 size={28} style={{ color: "#94a3b8" }} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function ErrorState({ message = "Unable to load analytics. Please try again.", onRetry }) {
  return (
    <div className="analytics-empty surface">
      <AlertCircle size={28} style={{ color: "#ef4444" }} />
      <h2>Analytics unavailable</h2>
      <p>{message}</p>
      <button type="button" className="workflow-btn primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function Chart({ title, subtitle, children }) {
  return (
    <article className="analytics-chart">
      <header>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      {children}
    </article>
  );
}

export default TeacherAnalyticsPage;
