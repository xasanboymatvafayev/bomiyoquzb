from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_fragment_signature, verify_arzonstars_signature
from app.models.models import Transaction, TransactionStatus, User, TransactionType

router = APIRouter()


@router.post("/payment/fragment/callback")
async def fragment_callback(
    request: Request,
    x_fragment_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    if not x_fragment_signature or not verify_fragment_signature(payload, x_fragment_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    external_id = data.get("id")
    status = data.get("status")
    amount = data.get("amount")

    result = await db.execute(select(Transaction).where(Transaction.external_id == external_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if status == "paid" and tx.status == TransactionStatus.pending:
        tx.status = TransactionStatus.paid
        # Add balance to user
        user_result = await db.execute(select(User).where(User.id == tx.user_id))
        user = user_result.scalar_one()
        user.balance = float(user.balance) + float(amount)
        await db.commit()

    return {"ok": True}


@router.post("/payment/arzonsstars/webhook")
async def arzonstars_webhook(
    request: Request,
    x_signature: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    if not x_signature or not verify_arzonstars_signature(payload, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    order_id = data.get("order_id")
    status = data.get("status")

    result = await db.execute(select(Transaction).where(Transaction.external_id == order_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if status in ("completed", "success") and tx.status == TransactionStatus.pending:
        tx.status = TransactionStatus.paid
        user_result = await db.execute(select(User).where(User.id == tx.user_id))
        user = user_result.scalar_one()

        if tx.type == TransactionType.stars and tx.stars_amount:
            user.stars = (user.stars or 0) + tx.stars_amount
        elif tx.type == TransactionType.premium and tx.period:
            from datetime import datetime, timedelta
            months = {"1_oy": 1, "3_oy": 3, "6_oy": 6, "12_oy": 12}.get(tx.period, 1)
            now = datetime.utcnow()
            base = user.premium_expire if user.premium_expire and user.premium_expire > now else now
            user.premium_expire = base + timedelta(days=30 * months)

        await db.commit()

    return {"ok": True}
