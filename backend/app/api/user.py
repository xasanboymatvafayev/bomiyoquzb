from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import verify_telegram_init_data
from app.models.models import User, Transaction

router = APIRouter()


@router.get("/user/profile")
async def get_profile(init_data: str, db: AsyncSession = Depends(get_db)):
    user_data = verify_telegram_init_data(init_data)
    telegram_id = user_data["id"]

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        # Auto-create
        user = User(
            telegram_id=telegram_id,
            username=user_data.get("username"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "balance": float(user.balance),
        "stars": user.stars,
        "premium_expire": user.premium_expire.isoformat() if user.premium_expire else None,
        "referral_code": user.referral_code,
        "created_at": user.created_at.isoformat(),
    }


@router.get("/user/history")
async def get_history(init_data: str, db: AsyncSession = Depends(get_db)):
    user_data = verify_telegram_init_data(init_data)
    telegram_id = user_data["id"]

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tx_result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    txs = tx_result.scalars().all()

    return [
        {
            "id": tx.id,
            "type": tx.type,
            "amount": float(tx.amount),
            "stars_amount": tx.stars_amount,
            "period": tx.period,
            "status": tx.status,
            "created_at": tx.created_at.isoformat(),
        }
        for tx in txs
    ]
