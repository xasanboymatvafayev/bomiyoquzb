from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx
import uuid
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_telegram_init_data
from app.models.models import User, Transaction, TransactionType, TransactionStatus

router = APIRouter()

UZT = timezone(timedelta(hours=5))

PREMIUM_PRICES = {
    "1_oy": 55000,
    "3_oy": 200000,
    "6_oy": 260000,
    "12_oy": 430000,
}

PERIOD_LABELS = {
    "1_oy": "1 oy",
    "3_oy": "3 oy",
    "6_oy": "6 oy",
    "12_oy": "12 oy",
}


class PremiumOrderRequest(BaseModel):
    period: str
    username: str
    init_data: str


async def notify_admin_premium(order_id: str, period: str, amount: float, username: str, telegram_id: int):
    now = datetime.now(UZT)
    time_str = now.strftime("%d.%m.%Y %H:%M:%S")

    text = (
        f"💎 <b>Yangi Premium buyurtma</b>\n\n"
        f"👤 Foydalanuvchi: @{username or 'nomsiz'} (<code>{telegram_id}</code>)\n"
        f"💎 Muddat: <b>{PERIOD_LABELS.get(period, period)}</b>\n"
        f"💰 Narx: <b>{int(amount):,} so'm</b>\n"
        f"🕐 Vaqt: {time_str} (Toshkent)\n"
        f"🔑 Order: <code>{order_id}</code>\n\n"
        f"@{username} ga Premium bering va tasdiqlang:"
    )

    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Bajarildi", "callback_data": f"prem_ok_{order_id}"},
            {"text": "❌ Bekor", "callback_data": f"prem_no_{order_id}"}
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


@router.post("/premium/order")
async def order_premium(body: PremiumOrderRequest, db: AsyncSession = Depends(get_db)):
    if body.period not in PREMIUM_PRICES:
        raise HTTPException(status_code=400, detail="Noto'g'ri muddat")

    user_data = verify_telegram_init_data(body.init_data)
    telegram_id = user_data["id"]

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    price = PREMIUM_PRICES[body.period]

    if float(user.balance) < price:
        raise HTTPException(status_code=400, detail="Balans yetarli emas")

    order_id = str(uuid.uuid4())[:8].upper()

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

    try:
        await notify_admin_premium(order_id, body.period, price, body.username, telegram_id)
    except Exception as e:
        print(f"Admin notify error: {e}")

    return {"ok": True, "order_id": order_id}


@router.post("/premium/confirm/{order_id}")
async def confirm_premium(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.external_id == order_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    tx.status = TransactionStatus.paid
    user_result = await db.execute(select(User).where(User.id == tx.user_id))
    user = user_result.scalar_one()

    # Premium muddatini uzaytirish
    months = {"1_oy": 1, "3_oy": 3, "6_oy": 6, "12_oy": 12}.get(tx.period, 1)
    now = datetime.utcnow()
    base = user.premium_expire if user.premium_expire and user.premium_expire > now else now
    user.premium_expire = base + timedelta(days=30 * months)

    await db.commit()
    return {"ok": True, "user_id": user.telegram_id, "period": tx.period}


@router.post("/premium/reject/{order_id}")
async def reject_premium(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.external_id == order_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    user_result = await db.execute(select(User).where(User.id == tx.user_id))
    user = user_result.scalar_one()
    user.balance = float(user.balance) + float(tx.amount)
    tx.status = TransactionStatus.cancelled
    await db.commit()
    return {"ok": True}
