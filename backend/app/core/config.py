from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    BOT_TOKEN: str
    WEBAPP_URL: str
    FRAGMENT_API_URL: str = "https://api.fragment-api.com"
    FRAGMENT_API_KEY: str
    ARZONSTARS_API_KEY: str
    ARZONSTARS_BASE_URL: str = "https://arzonstars.uz"
    ARZONSTARS_STARS_ENDPOINT: str = "/api/stars/order"
    ARZONSTARS_PREMIUM_ENDPOINT: str = "/api/premium/order"
    ARZONSTARS_CALLBACK_SECRET: str
    DB_URL: str
    SECRET_KEY: str

    class Config:
        env_file = ".env"


settings = Settings()
