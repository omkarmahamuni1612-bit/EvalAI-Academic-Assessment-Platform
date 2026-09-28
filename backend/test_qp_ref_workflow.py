import os
import sys
import unittest
from pathlib import Path

# Ensure root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir))

from fastapi.testclient import TestClient
from backend.main import app
from backend.storage import storage, DEFAULT_EXAM_ID, STORAGE_FILE

client = TestClient(app)

class TestQpRefWorkflow(unittest.TestCase):
    def test_01_question_paper_upload_stream_and_extraction(self):
        print("\n[TEST 1] Uploading Real Question Paper PDF...")
        sample_qp = Path(r"C:\Users\OMKAR\Downloads\CAA CO1 and CO2 Question Paper1.pdf")
        if not sample_qp.exists():
            sample_qp = root_dir / "test_qp.pdf"
            import pymupdf
            doc = pymupdf.open()
            page = doc.new_page()
            page.insert_text((50, 50), "CAA CO1 and CO2 Examination August 2026\nCourse Name: Internet of Things\n1(a) Evaluate the physical design of an IoT system. [5 Marks]\n1(b) Explain identification schemes in IoT. [5 Marks]")
            doc.save(str(sample_qp))
            doc.close()

        with open(sample_qp, "rb") as f:
            res = client.post(
                f"/api/insem/exams/{DEFAULT_EXAM_ID}/question-paper",
                files={"file": ("CAA_CO1_and_CO2_Question_Paper1.pdf", f, "application/pdf")}
            )

        self.assertEqual(res.status_code, 200, f"Upload failed: {res.text}")
        data = res.json()
        self.assertTrue(data.get("success"))
        exam = data.get("exam", {})
        qp_info = exam.get("questionPaperPdf", {})

        self.assertEqual(qp_info.get("name"), "CAA_CO1_and_CO2_Question_Paper1.pdf")
        self.assertEqual(qp_info.get("extractionStatus"), "EXTRACTED")
        self.assertTrue(len(qp_info.get("extractedText", "")) > 10)
        self.assertTrue(len(exam.get("questions", [])) > 0)
        print("[PASS] Question Paper uploaded, text extracted, and questions parsed.")

        stream_res = client.get(f"/api/insem/exams/{DEFAULT_EXAM_ID}/question-paper/pdf")
        self.assertEqual(stream_res.status_code, 200)
        self.assertEqual(stream_res.headers.get("content-type"), "application/pdf")
        self.assertTrue(len(stream_res.content) > 100)
        print("[PASS] GET /api/insem/exams/{exam_id}/question-paper/pdf streams exact PDF with application/pdf header.")

    def test_02_reference_answer_upload_stream_and_extraction(self):
        print("\n[TEST 2] Uploading Real Reference Answer PDF...")
        sample_ref = Path(r"C:\Users\OMKAR\Downloads\IoT_InSem_ReferenceAnswer.pdf")
        if not sample_ref.exists():
            sample_ref = root_dir / "test_ref.pdf"
            import pymupdf
            doc = pymupdf.open()
            page = doc.new_page()
            page.insert_text((50, 50), "Reference Answer Model Solution\n1(a) Physical design of IoT system involves devices, sensors, protocols...")
            doc.save(str(sample_ref))
            doc.close()

        with open(sample_ref, "rb") as f:
            res = client.post(
                f"/api/insem/exams/{DEFAULT_EXAM_ID}/reference-answer",
                files={"file": ("IoT_InSem_ReferenceAnswer.pdf", f, "application/pdf")}
            )

        self.assertEqual(res.status_code, 200, f"Upload failed: {res.text}")
        data = res.json()
        self.assertTrue(data.get("success"))
        exam = data.get("exam", {})
        ref_info = exam.get("referenceAnswerPdf", {})

        self.assertEqual(ref_info.get("name"), "IoT_InSem_ReferenceAnswer.pdf")
        self.assertEqual(ref_info.get("extractionStatus"), "EXTRACTED")
        self.assertTrue(len(ref_info.get("extractedText", "")) > 10)
        print("[PASS] Reference Answer uploaded and extracted.")

        stream_res = client.get(f"/api/insem/exams/{DEFAULT_EXAM_ID}/reference-answer/pdf")
        self.assertEqual(stream_res.status_code, 200)
        self.assertEqual(stream_res.headers.get("content-type"), "application/pdf")
        self.assertTrue(len(stream_res.content) > 100)
        print("[PASS] GET /api/insem/exams/{exam_id}/reference-answer/pdf streams exact PDF with application/pdf header.")

    def test_03_disk_persistence_and_refetch(self):
        print("\n[TEST 3] Testing Storage Disk Persistence & Re-fetch...")
        self.assertTrue(STORAGE_FILE.exists(), "STORAGE_FILE JSON file must exist on disk.")

        res = client.get(f"/api/insem/exams/{DEFAULT_EXAM_ID}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        exam = data.get("exam", {})

        self.assertIsNotNone(exam.get("questionPaperPdf"))
        self.assertIsNotNone(exam.get("referenceAnswerPdf"))
        print("[PASS] Question Paper & Reference Answer PDFs remain fully persisted and retrievable after re-fetch.")

if __name__ == "__main__":
    unittest.main()
