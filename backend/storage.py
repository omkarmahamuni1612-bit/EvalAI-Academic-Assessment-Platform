import json
import os
from pathlib import Path
from backend.config import STORAGE_FILE, DOWNLOADS_DIR

INITIAL_QUESTION_PAPER = {
    "id": "insem-qp-001",
    "filename": "CAA CO1 and CO2 Question Paper1.pdf",
    "title": "CAA (CO1 & CO2) Examination — August 2026",
    "course": "Internet of Things: Concepts and Applications (MDM)",
    "courseCode": "ET24056",
    "totalMarks": 20,
    "duration": "1 Hour",
    "instructions": [
        "Verify the question paper received is with correct course name, branch etc.",
        "All questions are compulsory.",
        "Neat diagrams must be drawn wherever necessary.",
        "Assume Suitable data if necessary.",
        "The figures on right side indicates the marks."
    ],
    "questions": [
        {
            "id": "Q1a",
            "section": "Q1",
            "number": "1(a)",
            "text": "Evaluate the physical design of an IoT system using a suitable example.",
            "marks": 5,
            "instruction": "Attempt any two",
            "requiresDiagram": False,
            "coMapping": "CO1"
        },
        {
            "id": "Q1b",
            "section": "Q1",
            "number": "1(b)",
            "text": "Explain identification schemes used in IoT.",
            "marks": 5,
            "instruction": "Attempt any two",
            "requiresDiagram": False,
            "coMapping": "CO1"
        },
        {
            "id": "Q1c",
            "section": "Q1",
            "number": "1(c)",
            "text": "Differentiate between local-area and wide-area networking in IoT.",
            "marks": 5,
            "instruction": "Attempt any two",
            "requiresDiagram": False,
            "coMapping": "CO1"
        },
        {
            "id": "Q1d",
            "section": "Q1",
            "number": "1(d)",
            "text": "Explain the role of IoT devices and gateways.",
            "marks": 5,
            "instruction": "Attempt any two",
            "requiresDiagram": False,
            "coMapping": "CO1"
        },
        {
            "id": "Q2a",
            "section": "Q2",
            "number": "2(a)",
            "text": "Evaluate the role of networking devices and topologies in ensuring IoT reliability.",
            "marks": 5,
            "instruction": "Attempt any two",
            "requiresDiagram": False,
            "coMapping": "CO2"
        },
        {
            "id": "Q2b",
            "section": "Q2",
            "number": "2(b)",
            "text": "Explain IoT architecture given by IBM with a neat diagram.",
            "marks": 5,
            "instruction": "Attempt any two",
            "requiresDiagram": True,
            "coMapping": "CO2"
        }
    ]
}


def get_default_student_list():
    """
    Returns base directory of up to 20 students.
    """
    base_students = [
        {"id": "stu-rahul", "name": "Rahul Patil", "roll": "ET202-041"},
        {"id": "stu-sneha", "name": "Sneha Kulkarni", "roll": "ET202-089"},
        {"id": "stu-aarav", "name": "Aarav Sharma", "roll": "ET202-012"},
        {"id": "stu-priya", "name": "Priya Deshmukh", "roll": "ET202-056"},
        {"id": "stu-rohan", "name": "Rohan Jadhav", "roll": "ET202-102"},
        {"id": "stu-ananya", "name": "Ananya Kulkarni", "roll": "ET202-077"},
        {"id": "stu-aditya", "name": "Aditya Shinde", "roll": "ET202-034"},
        {"id": "stu-vikram", "name": "Vikram Joshi", "roll": "ET202-095"},
        {"id": "stu-9", "name": "Karan Malhotra", "roll": "ET202-093"},
        {"id": "stu-10", "name": "Neha Singh", "roll": "ET202-105"},
        {"id": "stu-11", "name": "Siddharth Nair", "roll": "ET202-118"},
        {"id": "stu-12", "name": "Tanvi Patel", "roll": "ET202-124"},
        {"id": "stu-13", "name": "Aditya Rao", "roll": "ET202-136"},
        {"id": "stu-14", "name": "Shruti Kapoor", "roll": "ET202-142"},
        {"id": "stu-15", "name": "Vivek Verma", "roll": "ET202-150"},
        {"id": "stu-16", "name": "Pooja Hegde", "roll": "ET202-162"},
        {"id": "stu-17", "name": "Rishabh Pant", "roll": "ET202-175"},
        {"id": "stu-18", "name": "Deepika Padukone", "roll": "ET202-184"},
        {"id": "stu-19", "name": "Hardik Pandya", "roll": "ET202-191"},
        {"id": "stu-20", "name": "Shubman Gill", "roll": "ET202-200"}
    ]
    return base_students


class InSemStorage:
    def __init__(self):
        self.question_paper = INITIAL_QUESTION_PAPER
        self.submissions = {}
        self.published = False
        self.published_at = None
        self._initialize_from_downloads()

    def _initialize_from_downloads(self):
        """
        Discovers 14 uploaded PDFs in C:\\Users\\OMKAR\\Downloads\\ and populates submission records.
        """
        pdf_mapping = [
            ("iot1.pdf", "stu-rahul", "Rahul Patil", "ET202-041"),
            ("iot2.pdf", "stu-sneha", "Sneha Kulkarni", "ET202-089"),
            ("iot3.pdf", "stu-aarav", "Aarav Sharma", "ET202-012"),
            ("iot4.pdf", "stu-priya", "Priya Deshmukh", "ET202-056"),
            ("iot5.pdf", "stu-rohan", "Rohan Jadhav", "ET202-102"),
            ("iot 6.pdf", "stu-ananya", "Ananya Kulkarni", "ET202-077"),
            ("iot7.pdf", "stu-aditya", "Aditya Shinde", "ET202-034"),
            ("iot8.pdf", "stu-vikram", "Vikram Joshi", "ET202-095"),
            ("iot9.pdf", "stu-9", "Karan Malhotra", "ET202-093"),
            ("iot10.pdf", "stu-10", "Neha Singh", "ET202-105"),
            ("iot11.pdf", "stu-11", "Siddharth Nair", "ET202-118"),
            ("iot12.pdf", "stu-12", "Tanvi Patel", "ET202-124"),
            ("iot13.pdf", "stu-13", "Aditya Rao", "ET202-136"),
            ("iot14.pdf", "stu-14", "Shruti Kapoor", "ET202-142")
        ]

        for fname, student_id, student_name, roll in pdf_mapping:
            filepath = DOWNLOADS_DIR / fname
            if filepath.exists():
                sub_id = f"insem-sub-{student_id}"
                if sub_id not in self.submissions:
                    self.submissions[sub_id] = {
                        "id": sub_id,
                        "studentId": student_id,
                        "studentName": student_name,
                        "rollNumber": roll,
                        "fileName": fname,
                        "filePath": str(filepath),
                        "evaluationId": f"insem-eval-{student_id}",
                        "status": "Uploaded",
                        "mappingStatus": "MATCHED",
                        "extractionStatus": "PENDING",
                        "evaluationStatus": "PENDING",
                        "score": "—",
                        "renderedPages": [],
                        "extractedData": None,
                        "mappedAnswers": [],
                        "rawQuestionScores": {},
                        "evaluationResults": {},
                        "activeDifficulty": "moderate",
                        "evaluation": None,
                        "teacherApproved": False,
                        "published": False
                    }

    def get_all_submissions(self):
        return list(self.submissions.values())

    def get_submission(self, sub_id):
        return self.submissions.get(sub_id)

    def save_submission(self, sub_dict):
        sub_id = sub_dict["id"]
        self.submissions[sub_id] = sub_dict
        return sub_dict


storage = InSemStorage()
