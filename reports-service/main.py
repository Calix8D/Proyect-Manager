from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_pool
from app.routes.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pool()
    print("✅ Pool de conexiones PostgreSQL inicializado")
    yield
    print("🔌 Servidor detenido")


app = FastAPI(title="Reports Service", version="1.0.0", lifespan=lifespan)

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
