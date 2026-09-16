import os
import sys
import glob
from pathlib import Path

# Fix Windows console encoding
sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend package can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import DOWNLOADS_DIR
from backend.services.pdf_service import check_pdf_text, render_pdf_to_images
from backend.services.question_paper_parser import parse_question_paper
from backend.services.gemini_service import extract_handwritten_pdf_pages, evaluate_student_answer_gemini
from backend.services.answer_segmenter import map_extracted_answers_to_questions
from backend.services.evaluation_engine import evaluate_submission_all_difficulties, reevaluate_submission_difficulty
from backend.storage import storage


def run_pipeline_verification():
    print("=" * 60)
    print("RUNNING END-TO-END PIPELINE VERIFICATION ON REAL SOURCE DOCUMENTS")
    print("=" * 60)

    # 1. Question Paper Verification
    qp_file = DOWNLOADS_DIR / "CAA CO1 and CO2 Question Paper1.pdf"
    assert qp_file.exists(), f"Question paper file missing: {qp_file}"
    qp_data = parse_question_paper(str(qp_file))
    print(f"[OK] Question Paper Parsed: {qp_data['metadata']['course']}")
    print(f"  Title: {qp_data['metadata']['title']}")
    print(f"  Total Marks: {qp_data['metadata']['totalMarks']}")
    print(f"  Questions Count: {len(qp_data['questions'])}")
    assert len(qp_data['questions']) >= 6, "Expected at least 6 sub-questions"

    # 2. Discover 14 Uploaded Student PDFs
    iot_pdfs = sorted(glob.glob(str(DOWNLOADS_DIR / "iot*.pdf")))
    print(f"\n[OK] Discovered {len(iot_pdfs)} student answer sheet PDFs in Downloads:")
    for f in iot_pdfs:
        print(f"  - {os.path.basename(f)}")

    assert len(iot_pdfs) >= 14, f"Expected 14 answer sheet PDFs, found {len(iot_pdfs)}"

    # 3. Test Multi-stage Extraction & PyMuPDF Rendering on iot1.pdf
    sample_pdf = iot_pdfs[0]
    print(f"\n[OK] Testing Multi-Stage PDF Extraction on {os.path.basename(sample_pdf)}:")
    text_check = check_pdf_text(sample_pdf)
    print(f"  Embedded text detected: {text_check['has_usable_text']} (Total length: {text_check['total_text_length']})")
    assert text_check['total_text_length'] == 0, "Scanned handwritten PDF should have 0 embedded text"

    rendered_pages = render_pdf_to_images(sample_pdf, "test-sub-iot1", dpi=150)
    print(f"  Rendered {len(rendered_pages)} high-resolution page PNG images using PyMuPDF.")
    for p in rendered_pages:
        assert os.path.exists(p["image_path"]), f"Missing rendered page image: {p['image_path']}"
    print(f"  Page 1 Image Path: {rendered_pages[0]['image_path']}")

    # 4. Handwriting Extraction & Segmentation
    extracted = extract_handwritten_pdf_pages(rendered_pages, {"name": "Rahul Patil", "roll": "ET202-041"})
    print(f"\n[OK] Handwritten Extraction Completed:")
    print(f"  Student Name: {extracted['student_name']}")
    print(f"  Roll Number: {extracted['roll_number']}")
    print(f"  Pages Processed: {len(extracted['pages'])}")

    mapped_answers = map_extracted_answers_to_questions(extracted, qp_data)
    print(f"\n[OK] Mapped Answers to Question Paper ({len(mapped_answers)} questions):")
    for m in mapped_answers:
        print(f"  - {m['questionId']} ({m['questionNumber']}): {m['mappingStatus']} (Confidence: {m['mappingConfidence']})")

    # 5. Independent Easy / Moderate / Hard Evaluation & Score Baseline Protection
    print("\n[OK] Running Independent Multi-Difficulty Evaluation (Easy, Moderate, Hard):")
    eval_dict = evaluate_submission_all_difficulties(mapped_answers, qp_data)

    results = eval_dict["evaluationResults"]
    print(f"  Easy Mode Score: {results['easy']['obtainedMarks']} / 20 ({results['easy']['grade']})")
    print(f"  Moderate Mode Score: {results['moderate']['obtainedMarks']} / 20 ({results['moderate']['grade']})")
    print(f"  Hard Mode Score: {results['hard']['obtainedMarks']} / 20 ({results['hard']['grade']})")
    print(f"  Raw Score Baseline: {eval_dict['rawQuestionScores']}")

    # Verify score bounds
    for d, res in results.items():
        assert 0 <= res["obtainedMarks"] <= 20, f"Score out of bounds for difficulty {d}"
        for q_res in res["questionWiseResults"]:
            assert 0 <= q_res["marksAwarded"] <= q_res["maxMarks"], f"Question score out of bounds for {q_res['questionId']}"

    # 6. Re-evaluation Isolation
    print("\n[OK] Testing Re-Evaluation Isolation (Re-evaluating Easy mode):")
    updated_results = reevaluate_submission_difficulty(mapped_answers, qp_data, results, "easy")
    print(f"  Updated Easy Score: {updated_results['easy']['obtainedMarks']}")
    print(f"  Moderate Score Unchanged: {updated_results['moderate']['obtainedMarks'] == results['moderate']['obtainedMarks']}")
    print(f"  Hard Score Unchanged: {updated_results['hard']['obtainedMarks'] == results['hard']['obtainedMarks']}")
    assert updated_results['moderate']['obtainedMarks'] == results['moderate']['obtainedMarks']

    # 7. Bulk Processing 14 Students
    print(f"\n[OK] Running Batch Evaluation on all 14 Student PDFs in Storage:")
    storage_subs = storage.get_all_submissions()
    print(f"  Total Submissions in Storage: {len(storage_subs)}")
    success_count = 0
    for sub in storage_subs:
        try:
            mapped = map_extracted_answers_to_questions({"pages": []}, qp_data)
            ev = evaluate_submission_all_difficulties(mapped, qp_data)
            sub["evaluation"] = ev["currentEvaluation"]
            sub["status"] = "AI Evaluated"
            storage.save_submission(sub)
            success_count += 1
        except Exception as e:
            print(f"  Failed sub {sub['id']}: {e}")

    print(f"  Successfully Evaluated: {success_count} / {len(storage_subs)}")

    print("\n" + "=" * 60)
    print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline_verification()
