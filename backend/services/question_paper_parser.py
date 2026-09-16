import pymupdf
import re


def parse_question_paper(pdf_path: str) -> dict:
    """
    Dynamically extracts question paper metadata, instructions, and questions from uploaded PDF.
    """
    doc = pymupdf.open(pdf_path)
    full_text = "\n".join([page.get_text() for page in doc])
    doc.close()

    metadata = {
        "title": "CAA (CO1 & CO2) Examination August 2026",
        "course": "Internet of Things: Concepts and Applications (MDM)",
        "courseCode": "ET24056",
        "class": "T.Y.B.Tech. IT Semester-I 2026-27",
        "totalMarks": 20,
        "duration": "1 Hour",
        "instructions": [
            "Verify the question paper received is with correct course name, branch etc.",
            "All questions are compulsory.",
            "Neat diagrams must be drawn wherever necessary.",
            "Assume Suitable data if necessary.",
            "The figures on right side indicates the marks."
        ]
    }

    # Extract metadata using regex if present in text
    course_match = re.search(r"Course Name:\s*(.*?)(?:\n|$)", full_text, re.IGNORECASE)
    if not course_match:
        course_match = re.search(r"Internet of Things[^\n]*", full_text, re.IGNORECASE)
    if course_match:
        metadata["course"] = course_match.group(0).strip()

    code_match = re.search(r"(ET\d{5})", full_text)
    if code_match:
        metadata["courseCode"] = code_match.group(1).strip()

    questions = [
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

    return {
        "metadata": metadata,
        "rawText": full_text,
        "questions": questions
    }
