from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import uvicorn

from app.core.config import settings
from app.core.database import engine, Base
from app.api import deposit, payment, stars, premium, user, leaderboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    await engine.dispose()


app = FastAPI(
    title="TelegramStars API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.WEBAPP_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deposit.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(stars.router, prefix="/api")
app.include_router(premium.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


# 🔥 Railway uchun eng muhim qism
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
