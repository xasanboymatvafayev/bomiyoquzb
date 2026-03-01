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
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[
            InlineKeyboardButton(
                text="🚀 Do'konni ochish",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]]
    )
    await message.answer(WELCOME_TEXT, reply_markup=keyboard, parse_mode="HTML")


@dp.callback_query(F.data.startswith("approve_"))
async def approve_payment(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("Siz admin emassiz!", show_alert=True)
        return

    order_id = callback.data.replace("approve_", "")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/deposit/confirm/{order_id}",
            timeout=10
        )

    if resp.status_code == 200:
        data = resp.json()
        user_tid = data.get("user_id")
        amount = data.get("amount", 0)

        # Foydalanuvchiga xabar yuborish
        try:
            await bot.send_message(
                user_tid,
                f"✅ <b>To'lovingiz tasdiqlandi!</b>\n\n"
                f"💰 <b>{int(amount):,} so'm</b> hisobingizga o'tkazildi.\n\n"
                f"Do'konga qaytish uchun /start bosing.",
                parse_mode="HTML"
            )
        except Exception as e:
            logger.error(f"User notify error: {e}")

        await callback.message.edit_text(
            callback.message.text + f"\n\n✅ <b>TASDIQLANDI</b> — {int(amount):,} so'm o'tkazildi",
            parse_mode="HTML"
        )
        await callback.answer("✅ To'lov tasdiqlandi!")
    else:
        detail = resp.json().get("detail", "Xato")
        await callback.answer(f"❌ Xato: {detail}", show_alert=True)


@dp.callback_query(F.data.startswith("reject_"))
async def reject_payment(callback: CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("Siz admin emassiz!", show_alert=True)
        return

    order_id = callback.data.replace("reject_", "")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/deposit/reject/{order_id}",
            timeout=10
        )

    if resp.status_code == 200:
        await callback.message.edit_text(
            callback.message.text + "\n\n❌ <b>RAD ETILDI</b>",
            parse_mode="HTML"
        )
        await callback.answer("❌ To'lov rad etildi")
    else:
        await callback.answer("Xato yuz berdi", show_alert=True)


async def main():
    logger.info("Bot ishga tushdi...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
