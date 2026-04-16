from typing import Literal

from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Chat ──────────────────────────────────────────────────────────────────────


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class NdaFields(BaseModel):
    """Flat representation of all NDA fields. All optional for progressive fill."""

    purpose: str | None = None
    effective_date: str | None = None
    mnda_term_type: Literal["expires", "until_terminated"] | None = None
    mnda_term_years: str | None = None
    confidentiality_term_type: Literal["expires", "perpetuity"] | None = None
    confidentiality_term_years: str | None = None
    governing_law: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1_company: str | None = None
    party1_print_name: str | None = None
    party1_title: str | None = None
    party1_notice_address: str | None = None
    party1_date: str | None = None
    party2_company: str | None = None
    party2_print_name: str | None = None
    party2_title: str | None = None
    party2_notice_address: str | None = None
    party2_date: str | None = None


class NdaAiResponse(BaseModel):
    """Structured output returned by the LLM in a single call."""

    reply: str
    nda_fields: NdaFields


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: NdaFields = NdaFields()


class ChatResponse(BaseModel):
    reply: str
    nda_fields: NdaFields
