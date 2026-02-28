from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_telegram_init_data
from app.models.models import User, Transaction, TransactionType, TransactionStatus

router = APIRouter()

PREMIUM_PRICES = {
    "1_oy": 25000,
    "3_oy": 65000,
    "6_oy": 120000,
    "12_oy": 220000,
}


class PremiumOrderRequest(BaseModel):
    period: str
    username: str
    init_data: str


@router.post("/premium/order")
async def order_premium(body: PremiumOrderRequest, db: AsyncSession = Depends(get_db)):
    if body.period not in PREMIUM_PRICES:
        raise HTTPException(status_code=400, detail="Invalid period")

    user_data = verify_telegram_init_data(body.init_data)
    telegram_id = user_data["id"]

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    price = PREMIUM_PRICES[body.period]
    if float(user.balance) < price:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    order_id = str(uuid.uuid4())

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.ARZONSTARS_BASE_URL}{settings.ARZONSTARS_PREMIUM_ENDPOINT}",
            headers={"Authorization": f"Bearer {settings.ARZONSTARS_API_KEY}"},
            json={
                "username": body.username,
                "period": body.period,
                "order_id": order_id,
                "callback_url": f"{settings.WEBAPP_URL.rstrip('/')}/api/payment/arzonsstars/webhook"
            },
            timeout=30
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="ArzonStars API error")

    user.balance = float(user.balance) - price
    tx = Transaction(
        user_id=user.id,
        external_id=order_id,
        type=TransactionType.premium,
        amount=price,
        period=body.period,
        status=TransactionStatus.pending
    )
    db.add(tx)
    await db.commit()

    return {"ok": True, "order_id": order_id}
