from __future__ import annotations

import base64
import hmac
import os
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse, Response
from urllib.parse import quote, urlencode
from urllib.request import Request as UrlRequest, urlopen
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


@app.get("/api/tts")
def natural_german_tts(text: str):
    clean = " ".join(text.split()).strip()[:450]
    if not clean:
        return Response(status_code=400)
    url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&ttsspeed=1&q=" + quote(clean)
    req = UrlRequest(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://translate.google.com/"})
    try:
        with urlopen(req, timeout=8) as upstream:
            audio = upstream.read()
        return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=2592000"})
    except Exception:
        return Response(status_code=503)



@app.get("/api/translate")
def german_to_spanish(text: str):
    clean = " ".join(text.split()).strip()[:900]
    if not clean:
        return Response(status_code=400)
    url = "https://translate.googleapis.com/translate_a/single?" + urlencode({"client":"gtx","sl":"de","tl":"es","dt":"t","q":clean})
    req = UrlRequest(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        import json
        with urlopen(req, timeout=8) as upstream:
            payload = json.loads(upstream.read().decode("utf-8"))
        translated = "".join((part[0] or "") for part in (payload[0] or []))
        return {"es": translated, "de": clean}
    except Exception:
        return Response(status_code=503)


@app.get("/api/translate-literal")
def german_to_literal_spanish(text: str):
    clean = " ".join(text.split()).strip()[:900]
    if not clean:
        return Response(status_code=400)
    # This endpoint must never depend on an external translator: the drill needs a stable scaffold.
    # Preserve the German clause shape explicitly and translate the structural connectors.
    structural = clean
    replacements = [
        ("Warum ", "Por qué "), (" sollte ", " debería "), (" der ", " el "), (" die ", " la "),
        (" das ", " eso "), (" dann ", " entonces "), (" suchen", " buscar"), (" wenn ", " si/cuando "),
        (" weil ", " porque "), (" dass ", " que "), (" ob ", " si "), (" obwohl ", " aunque "),
        (" damit ", " para que "), (" bevor ", " antes de que "), (" nachdem ", " después de que "),
        (" sobald ", " tan pronto como "), (" während ", " mientras "), (" auch ", " también "),
        (" keine ", " ningún "), (" sein ", " su "), (" ist ", " ES "), (" hat", " TIENE"),
        (" kann", " PUEDE"), (" können", " PUEDEN"), (" muss", " DEBE"), (" müssen", " DEBEN"),
        (" gibt", " DA"), (" machen", " HACER"), (" arbeiten", " TRABAJAR"), (" helfen", " AYUDAR"),
    ]
    padded = " " + structural + " "
    for de, es in replacements:
        padded = padded.replace(de, es)
    scaffold = " ".join(padded.split())
    cue_map = [("dass","que"),("weil","porque"),("ob","si"),("wenn","si/cuando"),("obwohl","aunque"),("damit","para que"),("bevor","antes de que"),("nachdem","después de que"),("sobald","tan pronto como"),("während","mientras")]
    cue = next((es for de,es in cue_map if (" "+de+" ") in (" "+clean.lower()+" ")), None)
    if cue:
        scaffold += "  ·  MOLDE: [principal] + " + cue + " + [sujeto/complementos] + [VERBO AL FINAL]"
    return {"es": scaffold}


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "10000")))
