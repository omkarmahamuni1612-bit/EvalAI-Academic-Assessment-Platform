from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import RENDERED_PAGES_DIR
from backend.routers import insem

app = FastAPI(
    title="EvalAI API — AI-Powered Academic Assessment Platform",
    description="Backend API for real In-Sem Examination handwritten evaluation workflow.",
    version="2.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount rendered page images
app.mount("/static/rendered_pages", StaticFiles(directory=str(RENDERED_PAGES_DIR)), name="rendered_pages")

# Include In-Sem examination router
app.include_router(insem.router)


@app.get("/")
def root():
    return {
        "message": "EvalAI API is running",
        "status": "success",
        "version": "2.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
