from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from jose import jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_db
from app.schemas import SignInRequest, SignUpRequest, TokenResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_MIN_PASSWORD_LENGTH = 8


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": email, "exp": expire},
        settings.secret_key,
        algorithm=settings.algorithm,
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignUpRequest):
    if len(request.password) < _MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Password must be at least {_MIN_PASSWORD_LENGTH} characters.",
        )

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (request.email,)
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (request.email, _hash_password(request.password)),
        )
        conn.commit()

    return TokenResponse(access_token=_create_token(request.email))


@router.post("/signin", response_model=TokenResponse)
def signin(request: SignInRequest):
    with get_db() as conn:
        row = conn.execute(
            "SELECT password_hash FROM users WHERE email = ?", (request.email,)
        ).fetchone()

    if not row or not _verify_password(request.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return TokenResponse(access_token=_create_token(request.email))
