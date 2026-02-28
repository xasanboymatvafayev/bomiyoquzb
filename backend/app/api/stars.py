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

STARS_PRICES = {
    50: 5000,
    100: 9500,
    250: 22000,
    500: 43000,
    1000: 85000,
}


class StarsOrderRequest(BaseModel):
    stars: int
    username: str
    init_data: str


@router.post("/stars/order")
async def order_stars(body: StarsOrderRequest, db: AsyncSession = Depends(get_db)):
    user_data = verify_telegram_init_data(body.init_data)
    telegram_id = user_data["id"]

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate price
    price = STARS_PRICES.get(body.stars)
    if price is None:
        # Custom stars - calculate proportionally
        price = round(body.stars * 85000 / 1000)

    if float(user.balance) < price:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    order_id = str(uuid.uuid4())

    # Call ArzonStars API
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.ARZONSTARS_BASE_URL}{settings.ARZONSTARS_STARS_ENDPOINT}",
            headers={"Authorization": f"Bearer {settings.ARZONSTARS_API_KEY}"},
            json={
                "username": body.username,
                "stars": body.stars,
                "order_id": order_id,
                "callback_url": f"{settings.WEBAPP_URL.replace('https://', 'https://').rstrip('/')}/api/payment/arzonsstars/webhook"
            },
            timeout=30
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="ArzonStars API error")
        data = resp.json()

    # Deduct balance and save transaction
    user.balance = float(user.balance) - price
    tx = Transaction(
        user_id=user.id,
        external_id=order_id,
        type=TransactionType.stars,
        amount=price,
        stars_amount=body.stars,
        status=TransactionStatus.pending
    )
    db.add(tx)
    await db.commit()

    return {"ok": True, "order_id": order_id}
