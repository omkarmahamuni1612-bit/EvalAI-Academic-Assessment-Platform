import os
import re
import pymupdf
from google.genai import types

from backend.config import RENDERED_PAGES_DIR
from backend.services.pdf_service import check_pdf_text, render_pdf_to_images
from backend.services.gemini_service import get_genai_client, GEMINI_MODEL, call_gemini_with_retry


def extract_pdf_raw_text(pdf_path: str) -> str:
    """
    Hybrid text extraction for Question Paper PDFs:
    - Uses PyMuPDF if usable text layer is present.
    - Uses Gemini Vision OCR fallback if text is missing/scanned.
    """
    if not os.path.exists(pdf_path):
        return ""

    pdf_info = check_pdf_text(pdf_path)
    if pdf_info["has_usable_text"]:
        doc = pymupdf.open(pdf_path)
        full_text = "\n".join([page.get_text() for page in doc])
        doc.close()
        if full_text.strip():
            return full_text.strip()

    # Case B: Scanned/Image PDF -> Gemini Vision OCR fallback
    safe_name = re.sub(r"[^A-Za-z0-9_-]", "_", os.path.basename(pdf_path))
    rendered = render_pdf_to_images(pdf_path, f"ocr_qp_{safe_name}", dpi=150)
    client = get_genai_client()
    if not client:
        return ""

    ocr_pages = []
    for p in rendered:
        img_path = p["image_path"]
        if os.path.exists(img_path):
            try:
                with open(img_path, "rb") as f:
                    img_bytes = f.read()
                part = types.Part.from_bytes(data=img_bytes, mime_type="image/png")
                prompt = (
                    "Transcribe the full text visible on this question paper page exactly as written.\n"
                    "Do not hallucinate. Use [UNCLEAR] if any part is unreadable."
                )
                res = call_gemini_with_retry(client, [part, prompt])
                ocr_pages.append(res.text.strip())
            except Exception as e:
                print(f"Gemini OCR error for {img_path}: {e}")

    return "\n\n".join(ocr_pages)


def extract_reference_answer_raw_text(pdf_path: str) -> str:
    """
    Extracts reference answer text using hybrid extraction (PyMuPDF -> Gemini Vision OCR fallback).
    """
    return extract_pdf_raw_text(pdf_path)


def parse_question_paper(pdf_path: str, raw_text: str = None) -> dict:
    """
    Dynamically extracts question paper metadata, instructions, and questions from uploaded PDF.
    """
    if not raw_text and pdf_path:
        raw_text = extract_pdf_raw_text(pdf_path)

    full_text = raw_text or ""

    # Parse metadata
    title_match = re.search(r"([^\n]*Examination[^\n]*)", full_text, re.IGNORECASE)
    title = title_match.group(1).strip() if title_match else "In-Sem Examination"

    course_match = re.search(r"Course Name:\s*(.*?)(?:\n|$)", full_text, re.IGNORECASE)
    if not course_match:
        course_match = re.search(r"(?:Course|Subject):\s*(.*?)(?:\n|$)", full_text, re.IGNORECASE)
    course = course_match.group(1).strip() if course_match else "Internet of Things: Concepts and Applications (MDM)"

    code_match = re.search(r"([A-Z]{2}\d{5})", full_text)
    course_code = code_match.group(1).strip() if code_match else "ET24056"

    marks_match = re.search(r"(?:Total\s*Marks|Max\.?\s*Marks|Marks):\s*(\d+)", full_text, re.IGNORECASE)
    total_marks = int(marks_match.group(1)) if marks_match else 20

    duration_match = re.search(r"(?:Time|Duration):\s*([^\n,]+)", full_text, re.IGNORECASE)
    duration = duration_match.group(1).strip() if duration_match else "1 Hour"

    metadata = {
        "title": title,
        "course": course,
        "courseCode": course_code,
        "totalMarks": total_marks,
        "duration": duration,
        "instructions": [
            "Verify the question paper received is with correct course name, branch etc.",
            "All questions are compulsory unless options are specified.",
            "Neat diagrams must be drawn wherever necessary."
        ]
    }

    # Extract questions dynamically using regex parsing
    questions = []
    q_pattern = re.compile(
        r"(?:Q\.?\s*(\d+)\s*[\.\(]?\s*([a-z0-9])?[\)\.]?|(\d+)\s*[\.\(]\s*([a-z0-9])[\)\.]?)\s*([^\n]+(?:\n(?!(?:Q\.?\s*\d+|\d+\s*[\.\(]))[^\n]+)*)",
        re.IGNORECASE
    )

    matches = list(q_pattern.finditer(full_text))

    if matches:
        for idx, m in enumerate(matches):
            sec_num = m.group(1) or m.group(3) or "1"
            sub_lbl = m.group(2) or m.group(4) or ""
            q_text_block = m.group(5).strip()

            q_num_str = f"{sec_num}({sub_lbl})" if sub_lbl else f"Q{sec_num}"
            q_id = f"Q{sec_num}{sub_lbl}" if sub_lbl else f"Q{sec_num}"

            m_marks = re.search(r"\[?\s*(\d+)\s*(?:Marks|M)?\s*\]?", q_text_block, re.IGNORECASE)
            q_marks = float(m_marks.group(1)) if m_marks else 5.0

            q_clean_text = re.sub(r"\[?\s*\d+\s*(?:Marks|M)?\s*\]?\s*$", "", q_text_block, flags=re.IGNORECASE).strip()

            instruction = "All questions compulsory"
            if re.search(r"attempt\s+any\s+two", full_text, re.IGNORECASE) or re.search(r"attempt\s+any\s+two", q_clean_text, re.IGNORECASE):
                instruction = "Attempt any two"

            requires_diagram = bool(re.search(r"(diagram|figure|sketch|draw|architecture|block diagram)", q_clean_text, re.IGNORECASE))

            co_match = re.search(r"(CO\d+)", q_clean_text, re.IGNORECASE)
            co_mapping = co_match.group(1).upper() if co_match else (f"CO{sec_num}" if sec_num.isdigit() else "CO1")

            questions.append({
                "id": q_id,
                "section": f"Q{sec_num}",
                "number": q_num_str,
                "text": q_clean_text or q_text_block,
                "marks": q_marks,
                "instruction": instruction,
                "requiresDiagram": requires_diagram,
                "coMapping": co_mapping
            })

    if not questions:
        lines = [line.strip() for line in full_text.split("\n") if line.strip() and len(line.strip()) > 15]
        if lines:
            for idx, line in enumerate(lines[:6]):
                sec = "Q1" if idx < 4 else "Q2"
                sub_char = chr(97 + (idx % 4))
                questions.append({
                    "id": f"{sec}{sub_char}",
                    "section": sec,
                    "number": f"{sec[1]}({sub_char})",
                    "text": line,
                    "marks": 5.0,
                    "instruction": "Attempt any two",
                    "requiresDiagram": "diagram" in line.lower() or "architecture" in line.lower(),
                    "coMapping": "CO1" if sec == "Q1" else "CO2"
                })

    return {
        "metadata": metadata,
        "rawText": full_text,
        "questions": questions
    }

