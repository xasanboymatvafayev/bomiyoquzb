from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import uuid
import httpx
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.security import verify_telegram_init_data
from app.models.models import User, Transaction, TransactionType, TransactionStatus
from app.core.config import settings
from sqlalchemy import select

router = APIRouter()

# UZS narxlar
MIN_DEPOSIT = 10000  # 10,000 so'm

UZT = timezone(timedelta(hours=5))  # Toshkent vaqti


class DepositOrderRequest(BaseModel):
    amount: float
    init_data: str


async def notify_admin(order_id: str, amount: float, username: str, telegram_id: int):
    """Adminga xabar yuborish"""
    now = datetime.now(UZT)
    time_str = now.strftime("%d.%m.%Y %H:%M:%S")

    text = (
        f"💳 <b>Yangi to'lov so'rovi</b>\n\n"
        f"👤 Foydalanuvchi: @{username or 'nomsiz'} (<code>{telegram_id}</code>)\n"
        f"💰 Summa: <b>{int(amount):,} so'm</b>\n"
        f"🕐 Vaqt: {time_str} (Toshkent)\n"
        f"🔑 Order ID: <code>{order_id}</code>\n\n"
        f"Karta: <code>5614 6835 8227 9246</code>\n\n"
        f"To'lovni tasdiqlash uchun quyidagi tugmani bosing:"
    )

    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Tasdiqlash", "callback_data": f"approve_{order_id}"},
            {"text": "❌ Rad etish", "callback_data": f"reject_{order_id}"}
        ]]
    }

    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage",
            json={
                "chat_id": settings.ADMIN_TELEGRAM_ID,
                "text": text,
                "parse_mode": "HTML",
                "reply_markup": keyboard
            },
            timeout=10
        )


@router.post("/deposit/order")
async def create_deposit_order(
    body: DepositOrderRequest,
    db: AsyncSession = Depends(get_db)
):
    if body.amount < MIN_DEPOSIT:
        raise HTTPException(status_code=400, detail=f"Minimal summa: {MIN_DEPOSIT:,} so'm")

    user_data = verify_telegram_init_data(body.init_data)
    telegram_id = user_data["id"]
    username = user_data.get("username", "")

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(telegram_id=telegram_id, username=username)
        db.add(user)
        await db.flush()

    order_id = str(uuid.uuid4())[:8].upper()

    tx = Transaction(
        user_id=user.id,
        external_id=order_id,
        type=TransactionType.deposit,
        amount=body.amount,
        status=TransactionStatus.pending
    )
    db.add(tx)
    await db.commit()

    # Adminga xabar yuborish
    try:
        await notify_admin(order_id, body.amount, username, telegram_id)
    except Exception as e:
        print(f"Admin notify error: {e}")

    return {
        "order_id": order_id,
        "card": "5614 6835 8227 9246",
        "amount": body.amount,
        "message": "To'lov ma'lumotlari yuborildi"
    }


@router.post("/deposit/confirm/{order_id}")
async def admin_confirm_deposit(order_id: str, db: AsyncSession = Depends(get_db)):
    """Admin tomonidan tasdiqlash (bot callback orqali chaqiriladi)"""
    result = await db.execute(
        select(Transaction).where(Transaction.external_id == order_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Order topilmadi")
    if tx.status != TransactionStatus.pending:
        raise HTTPException(status_code=400, detail="Bu order allaqachon qayta ishlangan")

    tx.status = TransactionStatus.paid
    user_result = await db.execute(select(User).where(User.id == tx.user_id))
    user = user_result.scalar_one()
    user.balance = float(user.balance) + float(tx.amount)
    await db.commit()

    return {"ok": True, "user_id": user.telegram_id, "amount": float(tx.amount)}


@router.post("/deposit/reject/{order_id}")
async def admin_reject_deposit(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Transaction).where(Transaction.external_id == order_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Order topilmadi")

    tx.status = TransactionStatus.cancelled
    await db.commit()
    return {"ok": True}
