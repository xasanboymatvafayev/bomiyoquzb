from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_telegram_init_data
from app.models.models import User, Transaction, TransactionType, TransactionStatus
from sqlalchemy import select

router = APIRouter()


class DepositOrderRequest(BaseModel):
    amount: float
    init_data: str


@router.post("/deposit/order")
async def create_deposit_order(
    body: DepositOrderRequest,
    db: AsyncSession = Depends(get_db)
):
    if body.amount < 3000:
        raise HTTPException(status_code=400, detail="Minimum deposit is 3000 UZS")

    user_data = verify_telegram_init_data(body.init_data)
    telegram_id = user_data["id"]

    # Get or create user
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(telegram_id=telegram_id, username=user_data.get("username"))
        db.add(user)
        await db.flush()

    order_id = str(uuid.uuid4())

    # Call Fragment API
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.FRAGMENT_API_URL}/v1/payments",
            headers={"Authorization": f"Bearer {settings.FRAGMENT_API_KEY}"},
            json={
                "amount": body.amount,
                "currency": "UZS",
                "description": "Balance top-up",
                "order_id": order_id,
                "success_url": f"{settings.WEBAPP_URL}/payment/success",
                "cancel_url": f"{settings.WEBAPP_URL}/payment/cancel"
            },
            timeout=30
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Payment provider error")
        data = resp.json()

    # Save transaction
    tx = Transaction(
        user_id=user.id,
        external_id=data["id"],
        type=TransactionType.deposit,
        amount=body.amount,
        status=TransactionStatus.pending
    )
    db.add(tx)
    await db.commit()

    return {"payment_url": data["payment_url"], "order_id": order_id}
