from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.reports import router as reports_router

app = FastAPI(title="Reports Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports_router)


@app.get("/health")
def health():
    return {"status": "ok"}
