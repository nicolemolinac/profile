from __future__ import annotations

import base64
import hmac
import os
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import DateTime, Integer, JSON, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class GermanProgress(Base):
    __tablename__ = "german_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ProgressIn(BaseModel):
    data: dict


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg2://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        return "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


database_url = normalize_database_url(os.getenv("DATABASE_URL", "sqlite:///./german_cloud.db"))
engine = create_engine(database_url, pool_pre_ping=True)
Base.metadata.create_all(engine)

app = FastAPI(title="Private German B1 Coach")


def _service_request_allowed(request: Request) -> bool:
    expected = os.getenv("SERVICE_TOKEN", "")
    supplied = request.headers.get("x-service-token", "")
    return bool(expected and supplied and hmac.compare_digest(expected, supplied))


@app.middleware("http")
async def private_basic_auth(request: Request, call_next):
    if request.url.path == "/health" or _service_request_allowed(request):
        return await call_next(request)

    username = os.getenv("APP_USERNAME", "")
    password = os.getenv("APP_PASSWORD", "")
    if not username or not password:
        return await call_next(request)

    header = request.headers.get("authorization", "")
    ok = False
    if header.lower().startswith("basic "):
        try:
            raw = base64.b64decode(header.split(" ", 1)[1]).decode("utf-8")
            supplied_user, supplied_password = raw.split(":", 1)
            ok = hmac.compare_digest(supplied_user, username) and hmac.compare_digest(supplied_password, password)
        except Exception:
            ok = False

    if not ok:
        return PlainTextResponse(
            "German Coach is private.",
            status_code=401,
            headers={"WWW-Authenticate": 'Basic realm="German B1 Coach"'},
        )
    return await call_next(request)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/progress")
def get_progress():
    with Session(engine) as db:
        row = db.get(GermanProgress, 1)
        if not row:
            return {"configured": True, "data": None, "updated_at": None}
        return {
            "configured": True,
            "data": row.data,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }


@app.post("/api/progress")
def save_progress(payload: ProgressIn):
    with Session(engine) as db:
        row = db.get(GermanProgress, 1)
        if row is None:
            row = GermanProgress(id=1, data=payload.data, updated_at=datetime.utcnow())
            db.add(row)
        else:
            row.data = payload.data
            row.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(row)
        return {
            "ok": True,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        }


frontend_dist = Path(os.getenv("FRONTEND_DIST", Path(__file__).resolve().parent / "dist"))
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
