import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, Award, BrainCircuit, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { getClassAnalytics, workflowSubmissions } from "../data/workflowData";
import "./TeacherAnalyticsPage.css";

const trend = [{ name: "A1", score: 72 }, { name: "A2", score: 75 }, { name: "A3", score: 71 }, { name: "A4", score: 79 }, { name: "A5", score: 78.4 }];
const topics = [{ name: "Fourier Transform", difficulty: 76 }, { name: "Sampling Theory", difficulty: 42 }, { name: "Convolution", difficulty: 61 }, { name: "Filter Design", difficulty: 55 }];

const Tip = ({ active, payload, label }) => active && payload?.length ? <div className="analytics-tip"><b>{label ?? payload[0].name}</b><span>{payload[0].value}</span></div> : null;

function TeacherAnalyticsPage() {
  const analytics = getClassAnalytics();
  const calculatedRubric = ["Concept", "Accuracy", "Reasoning", "Presentation"].map((name, index) => {
    const scores = workflowSubmissions.filter((s) => s.evaluation?.rubric?.[index]).map((s) => {
      const row = s.evaluation.rubric[index];
      return (row.score / row.max) * 100;
    });
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { name, score: avg };
  });
  const distributionData = [
    { name: "0-39", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 40).length },
    { name: "40-59", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 40 && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 60).length },
    { name: "60-74", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 60 && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 75).length },
    { name: "75-89", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 75 && (s.evaluation.score / s.evaluation.totalMarks) * 100 < 90).length },
    { name: "90-100", students: workflowSubmissions.filter((s) => s.evaluation && (s.evaluation.score / s.evaluation.totalMarks) * 100 >= 90).length }
  ];
  const statusData = [
    { name: "Evaluated", value: analytics?.evaluatedCount || 0, color: "#16a34a" },
    { name: "Pending", value: analytics?.pendingCount || 0, color: "#d97706" }
  ];
  const stats = [["Class Average", analytics ? `${analytics.averagePercentage}%` : "—", "+3.2% vs previous", TrendingUp, "blue"], ["Highest Score", analytics ? `${analytics.highestPercentage}%` : "—", analytics?.highestStudent || "Top performing student", Award, "green"], ["Lowest Score", analytics ? `${analytics.lowestPercentage}%` : "—", analytics?.lowestStudent || "Support recommended", AlertCircle, "amber"], ["Evaluation Completion", analytics ? `${analytics.completionPercentage}%` : "—", `${analytics?.evaluatedCount || 0} of ${analytics?.totalStudents || 0} papers`, CheckCircle2, "purple"]];
  return <div className="academic-analytics">
    <header className="analytics-heading"><div><p>ACADEMIC INSIGHTS</p><h1>Performance Analytics</h1><span>Understand class performance and identify learning gaps.</span></div><div className="analytics-context"><Users size={17} />TE ENTC - A · Assignment 03</div></header>
    <section className="analytics-stat-grid">{stats.map(([label, value, note, Icon, tone]) => <article className="analytics-stat" key={label}><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div><i className={tone}><Icon size={20} /></i></article>)}</section>
    <section className="analytics-chart-grid">
      <Chart title="Performance Trend" subtitle="Average marks across recent assignments" wide><ResponsiveContainer width="100%" height={250}><AreaChart data={trend}><defs><linearGradient id="analyticsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity=".25"/><stop offset="100%" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf2f7"/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis domain={[50, 100]} tickLine={false} axisLine={false}/><Tooltip content={<Tip/>}/><Area dataKey="score" stroke="#2563eb" strokeWidth={2.5} fill="url(#analyticsFill)"/></AreaChart></ResponsiveContainer></Chart>
      <Chart title="Submission Status" subtitle={`${analytics?.totalStudents || 0} active papers`}><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={statusData} dataKey="value" innerRadius={52} outerRadius={76} paddingAngle={4}>{statusData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip content={<Tip/>}/></PieChart></ResponsiveContainer><div className="status-key">{statusData.map((item) => <span key={item.name}><i style={{ background: item.color }}/>{item.name} {item.value}</span>)}</div></Chart>
      <Chart title="Score Distribution" subtitle="Students by final score band"><ResponsiveContainer width="100%" height={230}><BarChart data={distributionData}><CartesianGrid vertical={false} stroke="#edf2f7"/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip content={<Tip/>}/><Bar dataKey="students" fill="#2563eb" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer></Chart>
      <Chart title="Rubric Performance" subtitle="Average criterion score"><ResponsiveContainer width="100%" height={230}><BarChart data={calculatedRubric} layout="vertical"><XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false}/><YAxis type="category" dataKey="name" width={82} tickLine={false} axisLine={false}/><Tooltip content={<Tip/>}/><Bar dataKey="score" fill="#16a34a" radius={[0, 5, 5, 0]}/></BarChart></ResponsiveContainer></Chart>
      <Chart title="Topic Difficulty" subtitle="Higher score indicates more learner difficulty" wide><ResponsiveContainer width="100%" height={230}><BarChart data={topics}><CartesianGrid vertical={false} stroke="#edf2f7"/><XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis domain={[0, 100]} tickLine={false} axisLine={false}/><Tooltip content={<Tip/>}/><Bar dataKey="difficulty" fill="#d97706" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer></Chart>
    </section>
    <section className="ai-insights"><div className="insight-heading"><BrainCircuit size={22}/><div><p>AI LEARNING INSIGHTS</p><h2>Recommended academic interventions</h2></div></div><div className="insight-list"><p>Fourier Transform has the highest difficulty signal; consider a guided problem-solving tutorial.</p><p>Students show strong conceptual understanding but need more mathematical justification in responses.</p><p>Presentation quality is consistently strong, with 88% average rubric performance.</p></div></section>
  </div>;
}
function Chart({ title, subtitle, wide, children }) { return <article className={`analytics-chart ${wide ? "chart-wide" : ""}`}><header><h2>{title}</h2><p>{subtitle}</p></header>{children}</article>; }
export default TeacherAnalyticsPage;
