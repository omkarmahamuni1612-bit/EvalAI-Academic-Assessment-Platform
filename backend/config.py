import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env or system
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

# Upload and storage paths
DOWNLOADS_DIR = Path(r"C:\Users\OMKAR\Downloads")
UPLOADS_DIR = BASE_DIR / "uploads"
RENDERED_PAGES_DIR = BASE_DIR / "rendered_pages"
STORAGE_FILE = BASE_DIR / "storage_data.json"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
RENDERED_PAGES_DIR.mkdir(parents=True, exist_ok=True)

MAX_CONCURRENT_GEMINI_REQUESTS = 3
