import asyncio
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.config import UPLOADS_DIR, MAX_CONCURRENT_GEMINI_REQUESTS
from backend.services.pdf_service import check_pdf_text, render_pdf_to_images
from backend.services.question_paper_parser import parse_question_paper, extract_pdf_raw_text, extract_reference_answer_raw_text
from backend.services.gemini_service import extract_handwritten_pdf_pages
from backend.services.answer_segmenter import map_extracted_answers_to_questions
from backend.services.evaluation_engine import evaluate_submission_all_difficulties, reevaluate_submission_difficulty
from backend.storage import storage, DEFAULT_EXAM_ID

router = APIRouter(prefix="/api/insem", tags=["In-Sem Examination"])
sem = asyncio.Semaphore(MAX_CONCURRENT_GEMINI_REQUESTS)


@router.get("/exams")
def get_all_exams():
    return {"exams": list(storage.exams.values())}


@router.post("/exams")
def create_new_exam(
    title: str = Form("CAA (CO1 & CO2) Examination — August 2026"),
    course: str = Form("Internet of Things: Concepts and Applications (MDM)"),
    courseCode: str = Form("ET24056"),
    branch: str = Form("ENTC / IT"),
    division: str = Form("T.Y.B.Tech. IT Semester-I"),
    totalMarks: float = Form(20.0),
    duration: str = Form("1 Hour")
):
    new_exam = storage.create_exam({
        "title": title,
        "course": course,
        "courseCode": courseCode,
        "branch": branch,
        "division": division,
        "totalMarks": totalMarks,
        "duration": duration,
        "instructions": [
            "Verify the question paper received is with correct course name, branch etc.",
            "All questions are compulsory.",
            "Neat diagrams must be drawn wherever necessary."
        ],
        "questions": []
    })
    return {"success": True, "exam": new_exam}


@router.get("/exams/{exam_id}")
def get_exam_details(exam_id: str):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")
    students = storage.get_enrolled_students(exam_id)
    submissions = storage.get_submissions_for_exam(exam_id)
    return {
        "exam": exam,
        "students": students,
        "submissions": submissions,
        "published": storage.published.get(exam_id, False)
    }


@router.post("/exams/{exam_id}/students")
def enroll_student_to_exam(
    exam_id: str,
    name: str = Form(...),
    roll: str = Form(...),
    branch: str = Form("ENTC"),
    division: str = Form("TE ENTC – A")
):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    student_id = f"stu-{int(os.urandom(3).hex(), 16)}"
    student_info = storage.enroll_student(exam_id, {
        "id": student_id,
        "name": name,
        "roll": roll,
        "branch": branch,
        "division": division
    })
    return {"success": True, "student": student_info}


@router.post("/exams/{exam_id}/question-paper")
async def upload_exam_question_paper(exam_id: str, file: UploadFile = File(...)):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF question paper files are supported.")

    dest_path = UPLOADS_DIR / f"qp_{exam_id}_{file.filename}"
    file_bytes = await file.read()
    with open(dest_path, "wb") as buffer:
        buffer.write(file_bytes)

    raw_text = extract_pdf_raw_text(str(dest_path))
    parsed = parse_question_paper(str(dest_path), raw_text=raw_text)

    exam["questionPaperPdf"] = {
        "name": file.filename,
        "path": str(dest_path),
        "size": len(file_bytes),
        "extractionStatus": "EXTRACTED" if raw_text else "FAILED",
        "extractedText": raw_text,
        "relativeUrl": f"/api/insem/exams/{exam_id}/question-paper/pdf"
    }
    exam["questions"] = parsed["questions"]
    if parsed["metadata"].get("totalMarks"):
        exam["totalMarks"] = parsed["metadata"]["totalMarks"]

    storage.save_exam(exam)
    return {"success": True, "exam": exam}


@router.get("/exams/{exam_id}/question-paper/pdf")
def get_exam_question_paper_pdf(exam_id: str):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    qp_info = exam.get("questionPaperPdf") or {}
    pdf_path = qp_info.get("path")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Question paper PDF file not found.")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{qp_info.get('name', 'question_paper.pdf')}\""}
    )


@router.post("/exams/{exam_id}/reference-answer")
async def upload_exam_reference_answer(
    exam_id: str,
    file: UploadFile = File(None),
    reference_text: str = Form(None)
):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    if file:
        dest_path = UPLOADS_DIR / f"ref_{exam_id}_{file.filename}"
        file_bytes = await file.read()
        with open(dest_path, "wb") as buffer:
            buffer.write(file_bytes)

        ref_text = extract_reference_answer_raw_text(str(dest_path))
        exam["referenceAnswerPdf"] = {
            "name": file.filename,
            "path": str(dest_path),
            "size": len(file_bytes),
            "extractionStatus": "EXTRACTED" if ref_text else "FAILED",
            "extractedText": ref_text,
            "relativeUrl": f"/api/insem/exams/{exam_id}/reference-answer/pdf"
        }
        if ref_text:
            exam["referenceAnswerText"] = ref_text

    if reference_text:
        exam["referenceAnswerText"] = reference_text

    storage.save_exam(exam)
    return {"success": True, "exam": exam}


@router.get("/exams/{exam_id}/reference-answer/pdf")
def get_exam_reference_answer_pdf(exam_id: str):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    ref_info = exam.get("referenceAnswerPdf") or {}
    pdf_path = ref_info.get("path")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Reference answer PDF file not found.")

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{ref_info.get('name', 'reference_answer.pdf')}\""}
    )


@router.post("/exams/{exam_id}/students/{student_id}/answer-sheet")
async def upload_student_answer_sheet(exam_id: str, student_id: str, file: UploadFile = File(...)):
    exam = storage.get_exam(exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found.")

    students = storage.students.get(exam_id, {})
    student_info = students.get(student_id)
    if not student_info:
        raise HTTPException(status_code=404, detail="Student not enrolled in this exam.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF answer sheet files are supported.")

    sub_id = f"{exam_id}_{student_id}"
    dest_path = UPLOADS_DIR / f"ans_{sub_id}_{file.filename}"
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    sub_dict = {
        "id": sub_id,
        "submissionId": sub_id,
        "examId": exam_id,
        "studentId": student_id,
        "studentName": student_info["name"],
        "rollNumber": student_info["roll"],
        "fileName": file.filename,
        "filePath": str(dest_path),
        "evaluationId": f"insem-eval-{student_id}",
        "status": "Uploaded",
        "mappingStatus": "MATCHED",
        "extractionStatus": "PENDING",
        "evaluationStatus": "PENDING",
        "score": "—",
        "renderedPages": [],
        "extractedData": None,
        "extractedAnswers": None,
        "mappedAnswers": [],
        "rawQuestionScores": {},
        "evaluationResults": {},
        "activeDifficulty": "moderate",
        "evaluation": None,
        "teacherApproved": False,
        "published": False
    }

    storage.save_submission(sub_dict)
    return {"success": True, "submission": sub_dict}


@router.get("/submissions")
def get_all_submissions(examId: str = DEFAULT_EXAM_ID):
    subs = storage.get_submissions_for_exam(examId)
    return {"submissions": subs, "published": storage.published.get(examId, False)}


@router.get("/submissions/{submission_id}")
def get_submission_detail(submission_id: str):
    sub = storage.get_submission(submission_id)
    if not sub:
        # Check by evaluationId
        all_subs = list(storage.submissions.values())
        sub = next((s for s in all_subs if s.get("evaluationId") == submission_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")
    return sub


@router.get("/submissions/{submission_id}/pdf")
def get_submission_pdf(submission_id: str):
    sub = storage.get_submission(submission_id)
    if not sub:
        all_subs = list(storage.submissions.values())
        sub = next((s for s in all_subs if s.get("evaluationId") == submission_id or s.get("id") == submission_id or s.get("submissionId") == submission_id), None)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    pdf_path = sub.get("filePath")
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Student answer sheet PDF file not found.")

    file_name = sub.get("fileName") or f"{sub.get('studentName', 'answer_sheet')}.pdf"
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{file_name}\""}
    )


@router.get("/exams/{exam_id}/students/{student_id}/pdf")
def get_student_answer_sheet_pdf(exam_id: str, student_id: str):
    sub_id = f"{exam_id}_{student_id}"
    return get_submission_pdf(sub_id)



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
        sub["status"] = "Extraction Failed"
        sub["evaluationError"] = "AI extraction/evaluation unavailable. PDF file missing."
        storage.save_submission(sub)
        raise HTTPException(status_code=400, detail="Student answer sheet PDF file missing.")

    try:
        # Step 1: Render pages to PNG images using PyMuPDF
        rendered_pages = render_pdf_to_images(pdf_path, submission_id, dpi=150)
        sub["renderedPages"] = rendered_pages

        # Step 2: Extract text via Gemini Vision
        async with sem:
            student_hint = {"name": sub["studentName"], "roll": sub["rollNumber"]}
            extracted_data = await asyncio.to_thread(extract_handwritten_pdf_pages, rendered_pages, student_hint)

        exam = storage.get_exam(sub["examId"]) or storage.get_exam(DEFAULT_EXAM_ID)
        sub["extractedData"] = extracted_data
        sub["extractedAnswers"] = extracted_data
        sub["extractionStatus"] = "EXTRACTED"
        sub["status"] = "Extracted"

        # Step 3: Map extracted text to question paper questions
        mapped_answers = map_extracted_answers_to_questions(extracted_data, exam)
        sub["mappedAnswers"] = mapped_answers

        storage.save_submission(sub)
        return {"success": True, "submission": sub}
    except Exception as err:
        sub["status"] = "Extraction Failed"
        sub["evaluationError"] = f"AI extraction/evaluation unavailable. Please retry. ({str(err)})"
        storage.save_submission(sub)
        return {"success": False, "error": str(err), "submission": sub}


@router.post("/submissions/{submission_id}/evaluate")
async def evaluate_submission(submission_id: str, difficulty: str = Form("moderate")):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if not sub.get("mappedAnswers"):
        ext_res = await extract_submission_handwriting(submission_id)
        sub = storage.get_submission(submission_id)
        if sub["status"] == "Extraction Failed":
            return {"success": False, "error": "AI extraction/evaluation unavailable. Please retry.", "submission": sub}

    exam = storage.get_exam(sub["examId"]) or storage.get_exam(DEFAULT_EXAM_ID)

    try:
        async with sem:
            eval_dict = await asyncio.to_thread(
                evaluate_submission_all_difficulties,
                sub["mappedAnswers"],
                exam
            )

        sub["rawQuestionScores"] = eval_dict["rawQuestionScores"]
        sub["evaluationResults"] = eval_dict["evaluationResults"]
        sub["activeDifficulty"] = difficulty
        sub["evaluation"] = eval_dict["evaluationResults"].get(difficulty, eval_dict["currentEvaluation"])
        sub["evaluationStatus"] = "Needs Teacher Review"
        sub["status"] = "AI Evaluated"
        sub["score"] = f"{sub['evaluation']['obtainedMarks']} / {exam.get('totalMarks', 20)}"

        storage.save_submission(sub)
        return {"success": True, "submission": sub}
    except Exception as err:
        sub["status"] = "Evaluation Failed"
        sub["evaluationError"] = f"AI extraction/evaluation unavailable. Please retry. ({str(err)})"
        storage.save_submission(sub)
        return {"success": False, "error": str(err), "submission": sub}


@router.post("/submissions/{submission_id}/reevaluate")
async def reevaluate_submission(submission_id: str, difficulty: str = Form("moderate")):
    sub = storage.get_submission(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    if not sub.get("mappedAnswers"):
        await extract_submission_handwriting(submission_id)
        sub = storage.get_submission(submission_id)

    exam = storage.get_exam(sub["examId"]) or storage.get_exam(DEFAULT_EXAM_ID)

    try:
        async with sem:
            updated_results = await asyncio.to_thread(
                reevaluate_submission_difficulty,
                sub["mappedAnswers"],
                exam,
                sub.get("evaluationResults", {}),
                difficulty
            )

        sub["evaluationResults"] = updated_results
        sub["activeDifficulty"] = difficulty
        sub["evaluation"] = updated_results.get(difficulty)
        sub["score"] = f"{sub['evaluation']['obtainedMarks']} / {exam.get('totalMarks', 20)}"
        sub["status"] = "AI Evaluated"

        storage.save_submission(sub)
        return {"success": True, "submission": sub}
    except Exception as err:
        sub["status"] = "Evaluation Failed"
        sub["evaluationError"] = f"AI extraction/evaluation unavailable. Please retry. ({str(err)})"
        storage.save_submission(sub)
        return {"success": False, "error": str(err), "submission": sub}


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
def publish_results(examId: str = Form(DEFAULT_EXAM_ID)):
    storage.published[examId] = True
    subs = storage.get_submissions_for_exam(examId)
    for sub in subs:
        sub["published"] = True
        sub["status"] = "Published"
    return {"success": True, "published": True}
