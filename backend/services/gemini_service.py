import time
import json
import re
import os
from pathlib import Path
import google.genai as genai
from google.genai import types

from backend.config import GEMINI_API_KEY, GEMINI_MODEL


def get_genai_client():
    key = os.environ.get("GEMINI_API_KEY") or GEMINI_API_KEY
    if not key:
        return None
    try:
        return genai.Client(api_key=key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
        return None


def call_gemini_with_retry(client, contents, max_retries=5, initial_delay=2.0):
    """
    Calls Gemini generate_content with retry logic for transient API load spikes (503/429/UNAVAILABLE).
    """
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            return client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents
            )
        except Exception as e:
            last_err = e
            err_str = str(e)
            if attempt < max_retries and ("503" in err_str or "429" in err_str or "UNAVAILABLE" in err_str or "RESOURCE_EXHAUSTED" in err_str or "Quota" in err_str):
                sleep_time = initial_delay * attempt
                print(f"Gemini API transient error (attempt {attempt}/{max_retries}): {e}. Retrying in {sleep_time}s...")
                time.sleep(sleep_time)
                continue
            raise last_err



def extract_handwritten_pdf_pages(rendered_pages: list, student_hint: dict = None) -> dict:
    """
    Extracts handwritten text, student identity, and detected questions from rendered page images.
    Uses Gemini Vision API when GEMINI_API_KEY is available.
    """
    client = get_genai_client()
    extracted_pages = []

    system_prompt = (
        "Read only what is visibly written in this student's uploaded answer sheet.\n"
        "Do not correct, improve, complete, infer, or invent answers.\n"
        "Preserve the student's actual wording and meaning.\n"
        "Identify question numbers and sub-question labels.\n"
        "If text is unreadable, return [UNCLEAR].\n"
        "If an answer is absent, return [NOT_ATTEMPTED].\n"
        "Never use another student's answer.\n\n"
        "Return structured JSON matching this schema:\n"
        "{\n"
        '  "student_name": "Name if clearly visible, otherwise Unknown",\n'
        '  "roll_number": "Roll Number if clearly visible, otherwise Unknown",\n'
        '  "questions_detected": [\n'
        "    {\n"
        '      "question_number": "Q1(a) or 1a",\n'
        '      "answer_text": "Extracted answer text"\n'
        "    }\n"
        "  ],\n"
        '  "raw_page_text": "Full extracted text on page"\n'
        "}"
    )

    detected_student_name = "Unknown"
    detected_roll_number = "Unknown"

    if not client:
        # If API key is unavailable, throw error so UI displays "AI extraction/evaluation unavailable. Please retry."
        raise RuntimeError("AI extraction/evaluation unavailable. Please set GEMINI_API_KEY in environment and retry.")

    for page_info in rendered_pages:
        page_num = page_info["page_number"]
        img_path = page_info["image_path"]

        if os.path.exists(img_path):
            try:
                with open(img_path, "rb") as f:
                    img_bytes = f.read()

                image_part = types.Part.from_bytes(data=img_bytes, mime_type="image/png")
                response = call_gemini_with_retry(client, [image_part, system_prompt])

                response_text = response.text.strip()
                json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
                if json_match:
                    page_data = json.loads(json_match.group(0))
                    if page_data.get("student_name") and page_data["student_name"] != "Unknown":
                        detected_student_name = page_data["student_name"]
                    if page_data.get("roll_number") and page_data["roll_number"] != "Unknown":
                        detected_roll_number = page_data["roll_number"]

                    extracted_pages.append({
                        "page_number": page_num,
                        "raw_text": page_data.get("raw_page_text", response_text),
                        "questions_detected": page_data.get("questions_detected", [])
                    })
                    continue
            except Exception as err:
                print(f"Gemini vision call failed for page {page_num}: {err}")
                raise RuntimeError(f"AI extraction unavailable for page {page_num}: {err}")

    # Use hint if detection yielded Unknown
    if detected_student_name == "Unknown" and student_hint and student_hint.get("name"):
        detected_student_name = student_hint["name"]
    if detected_roll_number == "Unknown" and student_hint and student_hint.get("roll"):
        detected_roll_number = student_hint["roll"]

    return {
        "student_name": detected_student_name,
        "roll_number": detected_roll_number,
        "pages": extracted_pages
    }


def evaluate_student_answer_gemini(
    question_id: str,
    question_text: str,
    max_marks: float,
    student_answer_text: str,
    reference_answer_text: str = "",
    difficulty: str = "moderate",
    requires_diagram: bool = False
) -> dict:
    """
    Evaluates a single student answer using Gemini AI based on actual question, reference answer, student answer, and difficulty mode.
    """
    client = get_genai_client()

    if not client:
        raise RuntimeError("AI extraction/evaluation unavailable. Please set GEMINI_API_KEY in environment and retry.")

    difficulty_rubrics = {
        "easy": "EASY MODE: Evaluate with high tolerance for minor omissions. Award marks if basic concepts and main definitions are present.",
        "moderate": "MODERATE MODE: Balanced academic evaluation. Check correctness, clarity, completeness, and relevant points against reference answer.",
        "hard": "HARD MODE: Strict evaluation standard. Require high technical precision, complete explanations, and penalize conceptual omissions strongly."
    }

    diff_instruction = difficulty_rubrics.get(difficulty.lower(), difficulty_rubrics["moderate"])

    diagram_instruction = ""
    if requires_diagram:
        diagram_instruction = " This question explicitly requires a diagram. Check if the answer includes/describes key diagram components, labels, and structure."

    prompt = (
        f"You are an academic evaluator scoring an IoT In-Sem examination answer.\n"
        f"Difficulty Mode: {difficulty.upper()}\n"
        f"{diff_instruction}\n"
        f"{diagram_instruction}\n\n"
        f"Question ID: {question_id}\n"
        f"Question Text: {question_text}\n"
        f"Maximum Marks: {max_marks}\n"
        f"Model/Reference Answer:\n\"\"\"{reference_answer_text}\"\"\"\n\n"
        f"Student's Actual Extracted Answer:\n\"\"\"{student_answer_text}\"\"\"\n\n"
        f"Return structured JSON matching this format:\n"
        f"{{\n"
        f'  "marksAwarded": float (between 0.0 and {max_marks}),\n'
        f'  "confidence": float (between 0.0 and 1.0),\n'
        f'  "reason": "Brief summary of evaluation based on actual answer",\n'
        f'  "correctness": "Evaluation of correctness",\n'
        f'  "relevance": "Evaluation of relevance",\n'
        f'  "completeness": "Evaluation of completeness",\n'
        f'  "conceptualUnderstanding": "Evaluation of conceptual clarity",\n'
        f'  "missingPoints": "Key points missing from answer",\n'
        f'  "diagramReviewRequired": boolean\n'
        f"}}\n"
    )

    try:
        response = call_gemini_with_retry(client, [prompt])
        response_text = response.text.strip()
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            res = json.loads(json_match.group(0))
            awarded = max(0.0, min(float(max_marks), float(res.get("marksAwarded", 0.0))))
            return {
                "questionId": question_id,
                "maxMarks": max_marks,
                "marksAwarded": round(awarded, 1),
                "percentage": round((awarded / max_marks) * 100) if max_marks > 0 else 0,
                "evaluation": {
                    "correctness": res.get("correctness", "Evaluated against rubric."),
                    "relevance": res.get("relevance", "Evaluated against rubric."),
                    "completeness": res.get("completeness", "Evaluated against rubric."),
                    "conceptualUnderstanding": res.get("conceptualUnderstanding", "Evaluated against rubric."),
                    "missingPoints": res.get("missingPoints", "")
                },
                "confidence": round(float(res.get("confidence", 0.9)), 2),
                "reason": res.get("reason", "Evaluated based on actual student answer content."),
                "diagramReviewRequired": bool(res.get("diagramReviewRequired", False))
            }
    except Exception as e:
        print(f"Gemini answer evaluation failed: {e}")
        raise RuntimeError(f"AI extraction/evaluation unavailable: {e}")

    raise RuntimeError("AI evaluation unavailable. Failed to parse valid Gemini response.")
