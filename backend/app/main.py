from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import logging

from app.auth import router as auth_router
from app.chat import router as chat_router
from app.config import settings
from app.database import init_db
from app.document_registry import validate_registry
from app.template_router import router as template_router

logger = logging.getLogger(__name__)

_INSECURE_DEFAULT_KEY = "dev-secret-key-change-in-production"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.secret_key == _INSECURE_DEFAULT_KEY:
        logger.warning(
            "SECRET_KEY is set to the insecure default. "
            "Set a strong SECRET_KEY environment variable before deploying."
        )
    init_db()
    validate_registry()
    yield


app = FastAPI(title="Prelegal API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(template_router, prefix="/api/templates", tags=["templates"])


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


# Serve the statically-built Next.js frontend (present in production Docker image)
_static_dir = Path(__file__).parent.parent / "static"
if _static_dir.exists():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")
