import asyncio
import logging
import httpx
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo, CallbackQuery
import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
ADMIN_ID = int(os.getenv("ADMIN_TELEGRAM_ID", "0"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

WELCOME_TEXT = """⭐️ <b>Tez va qulay</b>
Telegram Premium va Stars bir necha soniyada mavjud.

💳 <b>To'lov:</b> Uzcard / Humo orqali
✅ Xavfsiz to'lov
✅ Avtomatik hisobga o'tkaziladi

👇 Davom etish uchun quyidagi tugmani bosing."""


@dp.message(CommandStart())
async def start_handler(message: types.Message):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="🚀 Do'konni ochish", web_app=WebAppInfo(url=WEBAPP_URL))
    ]])
    await message.answer(WELCOME_TEXT, reply_markup=keyboard, parse_mode="HTML")


# ===== DEPOSIT =====
@dp.callback_query(F.data.startswith("approve_"))
async def approve_deposit(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return await callback.answer("Siz admin emassiz!", show_alert=True)

    order_id = callback.data.replace("approve_", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BACKEND_URL}/api/deposit/confirm/{order_id}", timeout=10)

    if resp.status_code == 200:
        data = resp.json()
        amount = data.get("amount", 0)
        user_tid = data.get("user_id")
        try:
            await bot.send_message(
                user_tid,
                f"✅ <b>To'lovingiz tasdiqlandi!</b>\n\n"
                f"💰 <b>{int(amount):,} so'm</b> hisobingizga o'tkazildi.\n"
                f"Do'konga qaytish uchun /start bosing.",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"User notify error: {e}")

        await callback.message.edit_text(
            callback.message.text + f"\n\n✅ <b>TASDIQLANDI</b> — {int(amount):,} so'm",
            parse_mode="HTML"
        )
        await callback.answer("✅ Tasdiqlandi!")
    else:
        detail = resp.json().get("detail", "Xato")
        await callback.answer(f"❌ {detail}", show_alert=True)


@dp.callback_query(F.data.startswith("reject_"))
async def reject_deposit(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return await callback.answer("Siz admin emassiz!", show_alert=True)

    order_id = callback.data.replace("reject_", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BACKEND_URL}/api/deposit/reject/{order_id}", timeout=10)

    if resp.status_code == 200:
        await callback.message.edit_text(
            callback.message.text + "\n\n❌ <b>RAD ETILDI</b>",
            parse_mode="HTML"
        )
        await callback.answer("❌ Rad etildi")
    else:
        await callback.answer("Xato yuz berdi", show_alert=True)


# ===== STARS =====
@dp.callback_query(F.data.startswith("stars_ok_"))
async def confirm_stars(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return await callback.answer("Siz admin emassiz!", show_alert=True)

    order_id = callback.data.replace("stars_ok_", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BACKEND_URL}/api/stars/confirm/{order_id}", timeout=10)

    if resp.status_code == 200:
        data = resp.json()
        stars = data.get("stars", 0)
        user_tid = data.get("user_id")
        try:
            await bot.send_message(
                user_tid,
                f"⭐️ <b>{stars} Stars yuborildi!</b>\n\n"
                f"Hisobingizni tekshiring.\n"
                f"Do'konga qaytish uchun /start bosing.",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"User notify error: {e}")

        await callback.message.edit_text(
            callback.message.text + f"\n\n✅ <b>BAJARILDI</b> — {stars} Stars yuborildi",
            parse_mode="HTML"
        )
        await callback.answer("✅ Bajarildi!")
    else:
        detail = resp.json().get("detail", "Xato")
        await callback.answer(f"❌ {detail}", show_alert=True)


@dp.callback_query(F.data.startswith("stars_no_"))
async def reject_stars(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return await callback.answer("Siz admin emassiz!", show_alert=True)

    order_id = callback.data.replace("stars_no_", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BACKEND_URL}/api/stars/reject/{order_id}", timeout=10)

    if resp.status_code == 200:
        await callback.message.edit_text(
            callback.message.text + "\n\n❌ <b>BEKOR QILINDI</b> — pul qaytarildi",
            parse_mode="HTML"
        )
        await callback.answer("❌ Bekor qilindi")
    else:
        await callback.answer("Xato yuz berdi", show_alert=True)


# ===== PREMIUM =====
@dp.callback_query(F.data.startswith("prem_ok_"))
async def confirm_premium(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return await callback.answer("Siz admin emassiz!", show_alert=True)

    order_id = callback.data.replace("prem_ok_", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BACKEND_URL}/api/premium/confirm/{order_id}", timeout=10)

    if resp.status_code == 200:
        data = resp.json()
        period = data.get("period", "")
        user_tid = data.get("user_id")
        period_labels = {"1_oy": "1 oy", "3_oy": "3 oy", "6_oy": "6 oy", "12_oy": "12 oy"}
        label = period_labels.get(period, period)
        try:
            await bot.send_message(
                user_tid,
                f"💎 <b>Telegram Premium faollashdi!</b>\n\n"
                f"Muddat: <b>{label}</b>\n"
                f"Endi barcha Premium imkoniyatlardan foydalaning!",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"User notify error: {e}")

        await callback.message.edit_text(
            callback.message.text + f"\n\n✅ <b>BAJARILDI</b> — {label} Premium berildi",
            parse_mode="HTML"
        )
        await callback.answer("✅ Bajarildi!")
    else:
        detail = resp.json().get("detail", "Xato")
        await callback.answer(f"❌ {detail}", show_alert=True)


@dp.callback_query(F.data.startswith("prem_no_"))
async def reject_premium(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return await callback.answer("Siz admin emassiz!", show_alert=True)

    order_id = callback.data.replace("prem_no_", "")
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BACKEND_URL}/api/premium/reject/{order_id}", timeout=10)

    if resp.status_code == 200:
        await callback.message.edit_text(
            callback.message.text + "\n\n❌ <b>BEKOR QILINDI</b> — pul qaytarildi",
            parse_mode="HTML"
        )
        await callback.answer("❌ Bekor qilindi")
    else:
        await callback.answer("Xato yuz berdi", show_alert=True)


async def main():
    logger.info("Bot ishga tushdi...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
