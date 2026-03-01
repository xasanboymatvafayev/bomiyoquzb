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

STARS_PRICES = {
    50: 13000,
    100: 24000,
    250: 58000,
    500: 115000,
    1000: 227000,
}


class StarsOrderRequest(BaseModel):
    stars: int
    username: str
    init_data: str


async def notify_admin_stars(order_id: str, stars: int, amount: float, username: str, telegram_id: int):
    now = datetime.now(UZT)
    time_str = now.strftime("%d.%m.%Y %H:%M:%S")

    text = (
        f"⭐️ <b>Yangi Stars buyurtma</b>\n\n"
        f"👤 Foydalanuvchi: @{username or 'nomsiz'} (<code>{telegram_id}</code>)\n"
        f"⭐️ Miqdor: <b>{stars} Stars</b>\n"
        f"💰 Narx: <b>{int(amount):,} so'm</b>\n"
        f"🕐 Vaqt: {time_str} (Toshkent)\n"
        f"🔑 Order: <code>{order_id}</code>\n\n"
        f"Buyurtmani bajaring va tasdiqlang:"
    )

    keyboard = {
        "inline_keyboard": [[
            {"text": "✅ Bajarildi", "callback_data": f"stars_ok_{order_id}"},
            {"text": "❌ Bekor", "callback_data": f"stars_no_{order_id}"}
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


@router.post("/stars/order")
async def order_stars(body: StarsOrderRequest, db: AsyncSession = Depends(get_db)):
    user_data = verify_telegram_init_data(body.init_data)
    telegram_id = user_data["id"]

    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    price = STARS_PRICES.get(body.stars, round(body.stars * 240000 / 1000))

    if float(user.balance) < price:
        raise HTTPException(status_code=400, detail="Balans yetarli emas")

    order_id = str(uuid.uuid4())[:8].upper()

    # Balansdan ayirish
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

    try:
        await notify_admin_stars(order_id, body.stars, price, body.username, telegram_id)
    except Exception as e:
        print(f"Admin notify error: {e}")

    return {"ok": True, "order_id": order_id}


@router.post("/stars/confirm/{order_id}")
async def confirm_stars(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.external_id == order_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    tx.status = TransactionStatus.paid
    user_result = await db.execute(select(User).where(User.id == tx.user_id))
    user = user_result.scalar_one()
    await db.commit()
    return {"ok": True, "user_id": user.telegram_id, "stars": tx.stars_amount}


@router.post("/stars/reject/{order_id}")
async def reject_stars(order_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Transaction).where(Transaction.external_id == order_id))
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")

    # Pulni qaytarish
    user_result = await db.execute(select(User).where(User.id == tx.user_id))
    user = user_result.scalar_one()
    user.balance = float(user.balance) + float(tx.amount)
    tx.status = TransactionStatus.cancelled
    await db.commit()
    return {"ok": True}
