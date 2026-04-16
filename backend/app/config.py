from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    database_path: str = "data/prelegal.db"

    model_config = {"env_file": ".env"}


settings = Settings()
