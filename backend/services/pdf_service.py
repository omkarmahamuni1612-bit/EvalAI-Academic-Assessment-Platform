import os
import pymupdf
from pathlib import Path
from backend.config import RENDERED_PAGES_DIR


def check_pdf_text(pdf_path: str) -> dict:
    """
    Check if a PDF file contains usable embedded text layers.
    Returns dict with page_count, total_text_length, and text_per_page.
    """
    doc = pymupdf.open(pdf_path)
    page_count = len(doc)
    text_per_page = []
    total_length = 0

    for i in range(page_count):
        txt = doc[i].get_text().strip()
        text_per_page.append({"page_number": i + 1, "text": txt, "length": len(txt)})
        total_length += len(txt)

    doc.close()
    return {
        "page_count": page_count,
        "total_text_length": total_length,
        "has_usable_text": total_length > 50,
        "text_per_page": text_per_page,
    }


def render_pdf_to_images(pdf_path: str, submission_id: str, dpi: int = 150) -> list:
    """
    Renders every page of a PDF file into high-resolution PNG images using PyMuPDF.
    Saves PNG files under backend/rendered_pages/{submission_id}/page_{page_num}.png
    """
    doc = pymupdf.open(pdf_path)
    out_dir = RENDERED_PAGES_DIR / submission_id
    out_dir.mkdir(parents=True, exist_ok=True)

    rendered_pages = []
    for i, page in enumerate(doc):
        page_num = i + 1
        pix = page.get_pixmap(dpi=dpi)
        img_filename = f"page_{page_num}.png"
        img_path = out_dir / img_filename
        pix.save(str(img_path))

        rendered_pages.append({
            "page_number": page_num,
            "image_path": str(img_path),
            "relative_url": f"/api/insem/submissions/{submission_id}/page/{page_num}",
            "width": pix.width,
            "height": pix.height,
            "size_bytes": len(pix.tobytes("png"))
        })

    doc.close()
    return rendered_pages
