import asyncio
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.config import UPLOADS_DIR, MAX_CONCURRENT_GEMINI_REQUESTS
from backend.services.pdf_service import check_pdf_text, render_pdf_to_images
from backend.services.question_paper_parser import parse_question_paper
from backend.services.gemini_service import extract_handwritten_pdf_pages
from backend.services.answer_segmenter import map_extracted_answers_to_questions
from backend.services.evaluation_engine import evaluate_submission_all_difficulties, reevaluate_submission_difficulty
from backend.storage import storage, get_default_student_list

router = APIRouter(prefix="/api/insem", tags=["In-Sem Examination"])
sem = asyncio.Semaphore(MAX_CONCURRENT_GEMINI_REQUESTS)


@router.get("/question-paper")
def get_question_paper():
    return storage.question_paper


@router.post("/question-paper/upload")
async def upload_question_paper(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF question paper files are supported.")

    dest_path = UPLOADS_DIR / f"qp_{file.filename}"
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    parsed = parse_question_paper(str(dest_path))
    storage.question_paper = {
        "id": f"insem-qp-{int(asyncio.get_event_loop().time())}",
        "filename": file.filename,
        "title": parsed["metadata"]["title"],
        "course": parsed["metadata"]["course"],
        "courseCode": parsed["metadata"]["courseCode"],
        "totalMarks": parsed["metadata"]["totalMarks"],
        "duration": parsed["metadata"]["duration"],
        "instructions": parsed["metadata"]["instructions"],
        "questions": parsed["questions"]
    }
    return {"success": True, "questionPaper": storage.question_paper}


@router.get("/students")
def get_students():
    return get_default_student_list()


@router.get("/submissions")
def get_submissions():
    subs = storage.get_all_submissions()
    return {"submissions": subs, "published": storage.published}


@router.get("/submissions/{submission_id}")
def get_submission_detail(submission_id: str):
    sub = storage.get_submission(submission_id)
    if not sub:
        # Check by evaluationId
        all_subs = storage.get_all_submissions()
        sub = next((s for s in all_subs if s.get("evaluationId") == submission_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")
    return sub


@router.get("/submissions/{submission_id}/page/{page_num}")
def get_submission_page_image(submission_id: str, page_num: int):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    rendered_pages = sub.get("renderedPages", [])
    page_info = next((p for p in rendered_pages if p["page_number"] == page_num), None)

    if not page_info or not os.path.exists(page_info["image_path"]):
        raise HTTPException(status_code=404, detail=f"Page image {page_num} not found.")

    return FileResponse(page_info["image_path"], media_type="image/png")


@router.post("/submissions/{submission_id}/extract")
async def extract_submission_handwriting(submission_id: str):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    pdf_path = sub["filePath"]
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=400, detail="Student answer sheet PDF file missing.")

    # Step 1: Render pages to images using PyMuPDF
    rendered_pages = render_pdf_to_images(pdf_path, submission_id, dpi=150)
    sub["renderedPages"] = rendered_pages

    # Step 2: Extract text via Gemini Vision
    async with sem:
        student_hint = {"name": sub["studentName"], "roll": sub["rollNumber"]}
        extracted_data = await asyncio.to_thread(extract_handwritten_pdf_pages, rendered_pages, student_hint)

    sub["extractedData"] = extracted_data
    sub["extractionStatus"] = "EXTRACTED"
    sub["status"] = "Extracted"

    # Step 3: Map extracted text to question paper questions
    mapped_answers = map_extracted_answers_to_questions(extracted_data, storage.question_paper)
    sub["mappedAnswers"] = mapped_answers

    storage.save_submission(sub)
    return {"success": True, "submission": sub}


@router.post("/submissions/{submission_id}/evaluate")
async def evaluate_submission(submission_id: str, difficulty: str = Form("moderate")):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if not sub.get("mappedAnswers"):
        # Auto extract first if missing
        await extract_submission_handwriting(submission_id)
        sub = storage.get_submission(submission_id)

    async with sem:
        eval_dict = await asyncio.to_thread(
            evaluate_submission_all_difficulties,
            sub["mappedAnswers"],
            storage.question_paper
        )

    sub["rawQuestionScores"] = eval_dict["rawQuestionScores"]
    sub["evaluationResults"] = eval_dict["evaluationResults"]
    sub["activeDifficulty"] = difficulty
    sub["evaluation"] = eval_dict["evaluationResults"].get(difficulty, eval_dict["currentEvaluation"])
    sub["evaluationStatus"] = "Needs Teacher Review"
    sub["status"] = "AI Evaluated"
    sub["score"] = f"{sub['evaluation']['obtainedMarks']} / {sub['evaluation']['totalMarks']}"

    storage.save_submission(sub)
    return {"success": True, "submission": sub}


@router.post("/submissions/{submission_id}/reevaluate")
async def reevaluate_submission(submission_id: str, difficulty: str = Form("moderate")):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if not sub.get("mappedAnswers"):
        await extract_submission_handwriting(submission_id)
        sub = storage.get_submission(submission_id)

    async with sem:
        updated_results = await asyncio.to_thread(
            reevaluate_submission_difficulty,
            sub["mappedAnswers"],
            storage.question_paper,
            sub.get("evaluationResults", {}),
            difficulty
        )

    sub["evaluationResults"] = updated_results
    sub["activeDifficulty"] = difficulty
    sub["evaluation"] = updated_results.get(difficulty)
    sub["score"] = f"{sub['evaluation']['obtainedMarks']} / {sub['evaluation']['totalMarks']}"
    sub["status"] = "AI Evaluated"

    storage.save_submission(sub)
    return {"success": True, "submission": sub}


@router.post("/submissions/{submission_id}/approve")
def approve_submission(submission_id: str):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    sub["teacherApproved"] = True
    sub["evaluationStatus"] = "Approved"
    sub["status"] = "Teacher Approved"
    storage.save_submission(sub)
    return {"success": True, "submission": sub}


@router.post("/publish")
def publish_results():
    storage.published = True
    for sub in storage.submissions.values():
        sub["published"] = True
        sub["status"] = "Published"
    return {"success": True, "published": True}


@router.post("/process-all")
async def process_all_submissions(difficulty: str = Form("moderate")):
    subs = storage.get_all_submissions()
    results = []

    for sub in subs:
        try:
            sub_id = sub["id"]
            if not sub.get("mappedAnswers"):
                await extract_submission_handwriting(sub_id)
                sub = storage.get_submission(sub_id)

            await evaluate_submission(sub_id, difficulty=difficulty)
            results.append({"id": sub_id, "status": "SUCCESS"})
        except Exception as err:
            sub["status"] = "Extraction Failed"
            sub["evaluationError"] = str(err)
            storage.save_submission(sub)
            results.append({"id": sub["id"], "status": "FAILED", "error": str(err)})

    return {
        "success": True,
        "processedCount": len(results),
        "results": results,
        "submissions": storage.get_all_submissions()
    }
