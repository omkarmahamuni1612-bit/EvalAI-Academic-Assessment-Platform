import os
import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend path is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import app
from backend.storage import storage, DEFAULT_EXAM_ID

class TestStudentPdfViewer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.exam_id = DEFAULT_EXAM_ID

    def test_student_pdf_isolation(self):
        # Create dummy PDF A for Rahul
        rahul_pdf = Path(__file__).parent / "uploads" / "test_rahul_iot1.pdf"
        rahul_pdf.parent.mkdir(parents=True, exist_ok=True)
        rahul_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n% Rahul Patil Answer Sheet\n"
        with open(rahul_pdf, "wb") as f:
            f.write(rahul_content)

        # Create dummy PDF B for Sneha
        sneha_pdf = Path(__file__).parent / "uploads" / "test_sneha_iot2.pdf"
        sneha_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n% Sneha Kulkarni Answer Sheet\n"
        with open(sneha_pdf, "wb") as f:
            f.write(sneha_content)

        # Save submission for Rahul
        sub_rahul = {
            "id": f"{self.exam_id}_stu-rahul",
            "submissionId": f"{self.exam_id}_stu-rahul",
            "examId": self.exam_id,
            "studentId": "stu-rahul",
            "studentName": "Rahul Patil",
            "rollNumber": "ET202-041",
            "fileName": "iot1.pdf",
            "filePath": str(rahul_pdf),
            "status": "Uploaded"
        }
        storage.save_submission(sub_rahul)

        # Save submission for Sneha
        sub_sneha = {
            "id": f"{self.exam_id}_stu-sneha",
            "submissionId": f"{self.exam_id}_stu-sneha",
            "examId": self.exam_id,
            "studentId": "stu-sneha",
            "studentName": "Sneha Kulkarni",
            "rollNumber": "ET202-089",
            "fileName": "iot2.pdf",
            "filePath": str(sneha_pdf),
            "status": "Uploaded"
        }
        storage.save_submission(sub_sneha)

        # Test Rahul PDF endpoint
        res_rahul = self.client.get(f"/api/insem/submissions/{sub_rahul['id']}/pdf")
        self.assertEqual(res_rahul.status_code, 200)
        self.assertIn("application/pdf", res_rahul.headers.get("content-type", ""))
        self.assertEqual(res_rahul.content, rahul_content)

        # Test Sneha PDF endpoint
        res_sneha = self.client.get(f"/api/insem/submissions/{sub_sneha['id']}/pdf")
        self.assertEqual(res_sneha.status_code, 200)
        self.assertIn("application/pdf", res_sneha.headers.get("content-type", ""))
        self.assertEqual(res_sneha.content, sneha_content)

        # Verify Rahul PDF != Sneha PDF
        self.assertNotEqual(res_rahul.content, res_sneha.content)
        print("[OK] Rahul and Sneha PDFs are distinct, persisted, and returned with application/pdf header.")

if __name__ == "__main__":
    unittest.main()
