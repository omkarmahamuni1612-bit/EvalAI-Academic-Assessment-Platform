import json
import os
from pathlib import Path
from backend.config import STORAGE_FILE, DOWNLOADS_DIR

DEFAULT_EXAM_ID = "insem-001"

DEFAULT_EXAM_METADATA = {
    "id": DEFAULT_EXAM_ID,
    "title": "CAA (CO1 & CO2) Examination — August 2026",
    "shortTitle": "In-Sem Exam — IoT",
    "course": "Internet of Things: Concepts and Applications (MDM)",
    "courseCode": "ET24056",
    "branch": "ENTC / IT",
    "division": "T.Y.B.Tech. IT Semester-I",
    "teacher": "Prof. A. Deshmukh",
    "examDate": "20 Aug 2026, 10:00 AM",
    "totalMarks": 20,
    "duration": "1 Hour",
    "description": "In-Semester examination covering physical design, identification schemes, networking, IoT devices/gateways, and IBM IoT architecture. Attempt any two questions per section.",
    "questionPaperPdf": {"name": "CAA CO1 and CO2 Question Paper1.pdf", "path": str(DOWNLOADS_DIR / "CAA CO1 and CO2 Question Paper1.pdf")},
    "referenceAnswerPdf": {"name": "IoT_InSem_ReferenceAnswer.pdf", "path": ""},
    "referenceAnswerText": "Physical design includes IoT devices and protocols. Identification schemes include IPv6 and MAC addressing. Local-area vs wide-area networking differentiates short range (Zigbee/BLE) vs long range (LoRa/Cellular). IBM IoT architecture comprises Device, Gateway, Cloud Platform, and Applications layers.",
    "questions": [
        {"id": "Q1a", "section": "Q1", "number": "1(a)", "text": "Evaluate the physical design of an IoT system using a suitable example.", "marks": 5, "instruction": "Attempt any two", "requiresDiagram": False, "coMapping": "CO1"},
        {"id": "Q1b", "section": "Q1", "number": "1(b)", "text": "Explain identification schemes used in IoT.", "marks": 5, "instruction": "Attempt any two", "requiresDiagram": False, "coMapping": "CO1"},
        {"id": "Q1c", "section": "Q1", "number": "1(c)", "text": "Differentiate between local-area and wide-area networking in IoT.", "marks": 5, "instruction": "Attempt any two", "requiresDiagram": False, "coMapping": "CO1"},
        {"id": "Q1d", "section": "Q1", "number": "1(d)", "text": "Explain the role of IoT devices and gateways.", "marks": 5, "instruction": "Attempt any two", "requiresDiagram": False, "coMapping": "CO1"},
        {"id": "Q2a", "section": "Q2", "number": "2(a)", "text": "Evaluate the role of networking devices and topologies in ensuring IoT reliability.", "marks": 5, "instruction": "Attempt any two", "requiresDiagram": False, "coMapping": "CO2"},
        {"id": "Q2b", "section": "Q2", "number": "2(b)", "text": "Explain IoT architecture given by IBM with a neat diagram.", "marks": 5, "instruction": "Attempt any two", "requiresDiagram": True, "coMapping": "CO2"}
    ]
}


class MultiExamStorage:
    def __init__(self):
        self.exams = {DEFAULT_EXAM_ID: dict(DEFAULT_EXAM_METADATA)}
        self.students = {DEFAULT_EXAM_ID: {}}
        self.submissions = {}  # Keyed by f"{exam_id}_{student_id}"
        self.published = {DEFAULT_EXAM_ID: False}
        self._initialize_default_roster()
        self.load_from_disk()

    def _initialize_default_roster(self):
        """
        Initializes default enrolled student roster for DEFAULT_EXAM_ID.
        """
        default_students = [
            {"id": "stu-rahul", "name": "Rahul Patil", "roll": "ET202-041", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-sneha", "name": "Sneha Kulkarni", "roll": "ET202-089", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-aarav", "name": "Aarav Sharma", "roll": "ET202-012", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-priya", "name": "Priya Deshmukh", "roll": "ET202-056", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-rohan", "name": "Rohan Jadhav", "roll": "ET202-102", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-ananya", "name": "Ananya Kulkarni", "roll": "ET202-077", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-aditya", "name": "Aditya Shinde", "roll": "ET202-034", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-vikram", "name": "Vikram Joshi", "roll": "ET202-095", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-9", "name": "Karan Malhotra", "roll": "ET202-093", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-10", "name": "Neha Singh", "roll": "ET202-105", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-11", "name": "Siddharth Nair", "roll": "ET202-118", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-12", "name": "Tanvi Patel", "roll": "ET202-124", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-13", "name": "Aditya Rao", "roll": "ET202-136", "branch": "ENTC", "division": "TE ENTC – A"},
            {"id": "stu-14", "name": "Shruti Kapoor", "roll": "ET202-142", "branch": "ENTC", "division": "TE ENTC – A"}
        ]

        for s in default_students:
            self.students[DEFAULT_EXAM_ID][s["id"]] = s

    def load_from_disk(self):
        if STORAGE_FILE.exists():
            try:
                with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "exams" in data and data["exams"]:
                        self.exams.update(data["exams"])
                    if "students" in data and data["students"]:
                        for exam_id, st_map in data["students"].items():
                            if exam_id not in self.students:
                                self.students[exam_id] = {}
                            self.students[exam_id].update(st_map)
                    if "submissions" in data and data["submissions"]:
                        self.submissions.update(data["submissions"])
                    if "published" in data and data["published"]:
                        self.published.update(data["published"])
            except Exception as e:
                print(f"Error loading STORAGE_FILE: {e}")

    def save_to_disk(self):
        try:
            STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "exams": self.exams,
                    "students": self.students,
                    "submissions": self.submissions,
                    "published": self.published
                }, f, indent=2)
        except Exception as e:
            print(f"Error saving to STORAGE_FILE: {e}")

    def get_exam(self, exam_id):
        return self.exams.get(exam_id)

    def save_exam(self, exam_data):
        exam_id = exam_data.get("id", DEFAULT_EXAM_ID)
        self.exams[exam_id] = exam_data
        self.save_to_disk()
        return exam_data

    def create_exam(self, exam_data):
        exam_id = exam_data.get("id") or f"insem-{int(os.urandom(3).hex(), 16)}"
        exam_data["id"] = exam_id
        self.exams[exam_id] = exam_data
        self.students[exam_id] = {}
        self.published[exam_id] = False
        self.save_to_disk()
        return exam_data

    def enroll_student(self, exam_id, student_info):
        if exam_id not in self.students:
            self.students[exam_id] = {}
        student_id = student_info.get("id") or f"stu-{int(os.urandom(3).hex(), 16)}"
        student_info["id"] = student_id
        self.students[exam_id][student_id] = student_info
        self.save_to_disk()
        return student_info

    def get_enrolled_students(self, exam_id):
        return list(self.students.get(exam_id, {}).values())

    def get_submissions_for_exam(self, exam_id):
        return [s for s in self.submissions.values() if s.get("examId") == exam_id]

    def get_submission(self, sub_id):
        return self.submissions.get(sub_id)

    def save_submission(self, sub_dict):
        sub_id = sub_dict["id"]
        self.submissions[sub_id] = sub_dict
        self.save_to_disk()
        return sub_dict


storage = MultiExamStorage()
