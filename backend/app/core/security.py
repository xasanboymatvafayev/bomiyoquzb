import hashlib
import hmac
import json
from urllib.parse import unquote
from fastapi import HTTPException, Header
from app.core.config import settings


def verify_telegram_init_data(init_data: str) -> dict:
    """Verify Telegram WebApp initData"""
    try:
        parsed = dict(item.split("=", 1) for item in init_data.split("&"))
        received_hash = parsed.pop("hash", None)
        if not received_hash:
            raise HTTPException(status_code=401, detail="Missing hash")

        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed.items())
        )

        secret_key = hmac.new(b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(computed_hash, received_hash):
            raise HTTPException(status_code=401, detail="Invalid hash")

        user_data = json.loads(unquote(parsed.get("user", "{}")))
        return user_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid initData: {e}")


def verify_fragment_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(
        settings.FRAGMENT_API_KEY.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_arzonstars_signature(payload: bytes, signature: str) -> bool:
    expected = hmac.new(
        settings.ARZONSTARS_CALLBACK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
