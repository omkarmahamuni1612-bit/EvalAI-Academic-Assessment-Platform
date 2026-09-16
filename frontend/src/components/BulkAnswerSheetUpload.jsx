import { useMemo, useState } from "react";
import { Check, FileText, FileWarning, Search, Upload, X } from "lucide-react";

const normalize = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

const naturalRollCompare = (a, b) =>
  String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });

const getRollFromFilename = (filename, students) => {
  const normalizedName = normalize(filename.replace(/\.pdf$/i, ""));
  const exactStudent = students.find((student) => normalizedName.includes(normalize(student.roll)));
  if (exactStudent) return exactStudent.roll;
  const match = filename.match(/[A-Za-z]{2,}\s*\d{3,}(?:[-_]\d{2,})?/i);
  return match ? match[0].replace(/[\s_]+/g, "-").toUpperCase() : "";
};

const initialStatus = (file, students, submissions) => {
  if (!file || file.size === 0 || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) {
    return { rollNumber: "", student: null, status: "INVALID_FILE" };
  }
  const rollNumber = getRollFromFilename(file.name, students);
  if (!rollNumber) return { rollNumber: "", student: null, status: "NEEDS_REVIEW" };
  const student = students.find((item) => normalize(item.roll) === normalize(rollNumber));
  if (!student) return { rollNumber, student: null, status: "STUDENT_NOT_FOUND" };
  const alreadyUploaded = submissions.some(
    (item) => item.studentId === student.id && normalize(item.rollNumber) === normalize(student.roll),
  );
  return { rollNumber: student.roll, student, status: alreadyUploaded ? "ALREADY_UPLOADED" : "MATCHED" };
};

const statusLabels = {
  MATCHED: "Matched",
  NEEDS_REVIEW: "Needs Review",
  STUDENT_NOT_FOUND: "Student Not Found",
  DUPLICATE: "Duplicate",
  INVALID_FILE: "Invalid File",
  ALREADY_UPLOADED: "Already Uploaded",
};

export function BulkAnswerSheetUpload({ students, submissions, mapAnswerSheet, onMapped }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [mapping, setMapping] = useState(false);
  const [mappedCount, setMappedCount] = useState(0);
  const [message, setMessage] = useState("");

  const processFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const next = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}`,
      file,
      ...initialStatus(file, students, submissions),
      manualStudentId: "",
      resolution: "",
    }));
    const rollCounts = next.reduce((counts, row) => {
      if (row.rollNumber) counts[row.rollNumber] = (counts[row.rollNumber] || 0) + 1;
      return counts;
    }, {});
    setRows(next.map((row) => rollCounts[row.rollNumber] > 1 && row.status !== "INVALID_FILE"
      ? { ...row, status: "DUPLICATE" } : row));
    setMessage("");
    setMappedCount(0);
  };

  const handleInput = (event) => {
    processFiles(event.target.files);
    event.target.value = "";
  };

  const updateRow = (id, changes) => setRows((current) => current.map((row) => row.id === id ? { ...row, ...changes } : row));

  const manuallyMap = (row, studentId) => {
    const student = students.find((item) => item.id === studentId) || null;
    const exists = student && submissions.some((item) => item.studentId === student.id);
    updateRow(row.id, {
      student,
      manualStudentId: studentId,
      rollNumber: student?.roll || row.rollNumber,
      status: exists ? "ALREADY_UPLOADED" : "MATCHED",
      resolution: exists ? "replace" : "",
    });
  };

  const chooseDuplicate = (row, resolution) => {
    if (resolution === "replace") updateRow(row.id, { status: "MATCHED", resolution });
    if (resolution === "keep") updateRow(row.id, { status: "ALREADY_UPLOADED", resolution });
    if (resolution === "cancel") updateRow(row.id, { status: "NEEDS_REVIEW", resolution });
  };

  const visibleRows = useMemo(() => rows
    .filter((row) => statusFilter === "ALL" || row.status === statusFilter)
    .filter((row) => `${row.rollNumber} ${row.student?.name || ""} ${row.file.name}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => naturalRollCompare(a.rollNumber || a.file.name, b.rollNumber || b.file.name)), [rows, query, statusFilter]);

  const counts = rows.reduce((result, row) => { result[row.status] = (result[row.status] || 0) + 1; return result; }, {});
  const readyRows = rows.filter((row) => row.status === "MATCHED");

  const mapAll = async () => {
    if (!readyRows.length) return;
    setMapping(true);
    setMessage("");
    let completed = 0;
    for (const row of readyRows) {
      const result = mapAnswerSheet(row.student, row.file, { replace: row.resolution === "replace" });
      if (!result?.error) completed += 1;
      setMappedCount(completed);
      await new Promise((resolve) => setTimeout(resolve, 18));
    }
    setMapping(false);
    onMapped();
    setMessage(`${completed} answer sheet${completed === 1 ? "" : "s"} successfully mapped.`);
    setRows((current) => current.filter((row) => !readyRows.some((ready) => ready.id === row.id)));
  };

  return (
    <div className="bulk-upload-panel">
      <div className="bulk-upload-heading">
        <div><span className="bulk-kicker">PRIMARY UPLOAD</span><h3>Bulk Answer Sheet Upload</h3><p>Upload multiple student answer-sheet PDFs at once. EvalAI will automatically match each file using the student's roll number.</p></div>
        <label className="workflow-btn primary bulk-upload-button"><Upload size={15} /> Select Multiple PDFs<input type="file" accept="application/pdf,.pdf" multiple onChange={handleInput} /></label>
      </div>
      <div className="bulk-drop-hint">Drag and drop multiple PDFs here, or use the button above. Preferred filename: <strong>ET202041.pdf</strong></div>
      {rows.length > 0 && <>
        <div className="bulk-summary-grid">
          <div><strong>{rows.length}</strong><span>Files Selected</span></div>
          <div className="bulk-good"><strong>{counts.MATCHED || 0}</strong><span>Matched</span></div>
          <div className="bulk-warn"><strong>{(counts.NEEDS_REVIEW || 0) + (counts.ALREADY_UPLOADED || 0)}</strong><span>Needs Review</span></div>
          <div className="bulk-bad"><strong>{(counts.DUPLICATE || 0) + (counts.STUDENT_NOT_FOUND || 0) + (counts.INVALID_FILE || 0)}</strong><span>Needs Attention</span></div>
        </div>
        <div className="bulk-verification-heading"><div><span className="bulk-kicker">VERIFICATION</span><h3>Answer Sheet Verification</h3></div><div className="bulk-tools"><label><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roll number" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div>
        <div className="bulk-table-wrap"><table className="bulk-table"><thead><tr><th>Roll No</th><th>Student Name</th><th>Answer Sheet</th><th>Status</th><th>Action</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id}><td><strong>{row.rollNumber || "—"}</strong></td><td>{row.student?.name || "—"}</td><td><span className="insem-file-pill"><FileText size={14} />{row.file.name}</span></td><td><span className={`bulk-status bulk-status-${row.status.toLowerCase()}`}>{row.status === "MATCHED" && <Check size={13} />}{statusLabels[row.status]}</span></td><td>{row.status === "NEEDS_REVIEW" || row.status === "STUDENT_NOT_FOUND" ? <select value={row.manualStudentId} onChange={(event) => manuallyMap(row, event.target.value)}><option value="">Select Student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.roll} — {student.name}</option>)}</select> : row.status === "DUPLICATE" || row.status === "ALREADY_UPLOADED" ? <div className="bulk-row-actions"><button type="button" onClick={() => chooseDuplicate(row, "keep")}>Keep Existing</button><button type="button" onClick={() => chooseDuplicate(row, "replace")}>Replace Existing</button><button type="button" onClick={() => chooseDuplicate(row, "cancel")}><X size={13} /> Cancel</button></div> : row.status === "INVALID_FILE" ? <span className="bulk-action-muted">PDF required</span> : <span className="bulk-action-ok">Ready</span>}</td></tr>)}</tbody></table></div>
        <div className="bulk-footer"><span>{readyRows.length} ready to map · {rows.length - readyRows.length} need attention</span><button type="button" className="workflow-btn primary" disabled={!readyRows.length || mapping} onClick={mapAll}>{mapping ? `Mapping Answer Sheets... ${mappedCount} / ${readyRows.length}` : `Map All Matched Answer Sheets (${readyRows.length})`}</button></div>
        {mapping && <div className="bulk-progress"><i style={{ width: `${(mappedCount / readyRows.length) * 100}%` }} /></div>}
        {message && <div className="insem-validation bulk-success"><Check size={15} />{message}</div>}
      </>}
      {rows.length === 0 && <div className="bulk-empty"><FileText size={21} /><span>No bulk files selected yet.</span></div>}
    </div>
  );
}

export function ExaminationProcessingStatus({ students, submissions, published, evaluationProgress }) {
  const evaluated = evaluationProgress?.evaluated || 0;
  return <section className="insem-surface exam-processing-status"><div className="bulk-kicker">EXAMINATION PROCESSING STATUS</div><div className="exam-status-grid"><div><span>Answer Sheets</span><strong>{submissions.length} / {students.length}</strong></div><div><span>Mapped</span><strong>{submissions.filter((item) => item.mappingStatus === "MATCHED" || item.fileName).length} / {students.length}</strong></div><div><span>Ready for Evaluation</span><strong>{submissions.filter((item) => item.fileName).length} / {students.length}</strong></div><div><span>Evaluation Completed</span><strong>{evaluated} / {submissions.length}</strong></div><div><span>Results Published</span><strong>{published ? "Yes" : "No"}</strong></div></div></section>;
}
