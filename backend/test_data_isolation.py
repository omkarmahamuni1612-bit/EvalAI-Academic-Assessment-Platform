import os
import sys
from pathlib import Path

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import DOWNLOADS_DIR
from backend.storage import storage
from backend.services.pdf_service import render_pdf_to_images
from backend.services.question_paper_parser import parse_question_paper
from backend.services.answer_segmenter import map_extracted_answers_to_questions
from backend.services.evaluation_engine import evaluate_submission_all_difficulties, reevaluate_submission_difficulty


def test_cross_student_isolation():
    print("=" * 60)
    print("TESTING CROSS-STUDENT DATA ISOLATION & REGRESSION PREVENTION")
    print("=" * 60)

    qp_file = DOWNLOADS_DIR / "CAA CO1 and CO2 Question Paper1.pdf"
    qp_data = parse_question_paper(str(qp_file))

    pdf_a = DOWNLOADS_DIR / "iot1.pdf"
    pdf_b = DOWNLOADS_DIR / "iot2.pdf"

    assert pdf_a.exists() and pdf_b.exists(), "Source PDFs missing"

    # Process Student A (Rahul)
    rendered_a = render_pdf_to_images(str(pdf_a), "sub_A_rahul", dpi=150)
    extracted_a = {
        "student_name": "Rahul Patil",
        "roll_number": "ET202-041",
        "pages": [
            {
                "page_number": 1,
                "raw_text": "Physical design of IoT system involves IoT devices, sensors, microcontrollers and protocols. Example: Smart Home Automation System with temperature sensor sending data via MQTT.",
                "questions_detected": [{"question_number": "Q1(a)", "answer_text": "Physical design of IoT system involves IoT devices, sensors, microcontrollers and protocols. Example: Smart Home Automation System with temperature sensor sending data via MQTT."}]
            },
            {
                "page_number": 2,
                "raw_text": "Identification schemes in IoT include IPv6 addressing, MAC address, EPC (Electronic Product Code), and URI/URL. Each device requires unique ID for network communication.",
                "questions_detected": [{"question_number": "Q1(b)", "answer_text": "Identification schemes in IoT include IPv6 addressing, MAC address, EPC (Electronic Product Code), and URI/URL."}]
            }
        ]
    }
    mapped_a = map_extracted_answers_to_questions(extracted_a, qp_data)

    # Process Student B (Sneha)
    rendered_b = render_pdf_to_images(str(pdf_b), "sub_B_sneha", dpi=150)
    extracted_b = {
        "student_name": "Sneha Kulkarni",
        "roll_number": "ET202-089",
        "pages": [
            {
                "page_number": 1,
                "raw_text": "IoT physical design consists of node devices and connectivity layers.",
                "questions_detected": [{"question_number": "Q1(a)", "answer_text": "IoT physical design consists of node devices and connectivity layers."}]
            }
        ]
    }
    mapped_b = map_extracted_answers_to_questions(extracted_b, qp_data)

    print("\n[OK] Checking Extraction Isolation:")
    text_a = mapped_a[0]["answerText"]
    text_b = mapped_b[0]["answerText"]
    print(f"  Student A (Rahul) Q1a Text: \"{text_a[:60]}...\"")
    print(f"  Student B (Sneha) Q1a Text: \"{text_b[:60]}...\"")

    assert text_a != text_b, "CRITICAL ERROR: Student A and Student B share identical extracted text!"
    print("✓ PASS: Student A extracted answers != Student B extracted answers.")

    # Storage Submission Isolation
    sub_a_id = "insem-001_stu-rahul"
    sub_b_id = "insem-001_stu-sneha"

    sub_a = {
        "id": sub_a_id,
        "submissionId": sub_a_id,
        "studentId": "stu-rahul",
        "studentName": "Rahul Patil",
        "rollNumber": "ET202-041",
        "mappedAnswers": mapped_a,
        "extractedAnswers": extracted_a,
        "status": "Uploaded"
    }

    sub_b = {
        "id": sub_b_id,
        "submissionId": sub_b_id,
        "studentId": "stu-sneha",
        "studentName": "Sneha Kulkarni",
        "rollNumber": "ET202-089",
        "mappedAnswers": mapped_b,
        "extractedAnswers": extracted_b,
        "status": "Uploaded"
    }

    storage.save_submission(sub_a)
    storage.save_submission(sub_b)

    retrieved_a = storage.get_submission(sub_a_id)
    retrieved_b = storage.get_submission(sub_b_id)

    assert retrieved_a["studentId"] == "stu-rahul"
    assert retrieved_b["studentId"] == "stu-sneha"
    assert retrieved_a["mappedAnswers"][0]["answerText"] != retrieved_b["mappedAnswers"][0]["answerText"]
    print("✓ PASS: Storage isolated retrieval verified for Student A and Student B.")

    print("\n" + "=" * 60)
    print("DATA ISOLATION & REGRESSION PREVENTION VERIFICATION SUCCESSFUL!")
    print("=" * 60)


if __name__ == "__main__":
    test_cross_student_isolation()
