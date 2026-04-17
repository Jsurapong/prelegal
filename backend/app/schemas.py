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


class GenericChatRequest(BaseModel):
    messages: list[ChatMessage]
    document_type: str | None = None
    current_fields: dict[str, str | None] = {}


class GenericChatResponse(BaseModel):
    reply: str
    document_type: str | None = None
    doc_fields: dict[str, str | None] = {}


# ── Documents ────────────────────────────────────────────────────────────────


class SaveDocumentRequest(BaseModel):
    id: int | None = None
    title: str
    document_type: str
    doc_fields: dict[str, str | None] = {}
    messages: list[ChatMessage] = []


class DocumentSummary(BaseModel):
    id: int
    title: str
    document_type: str
    updated_at: str


class DocumentDetail(DocumentSummary):
    doc_fields: dict[str, str | None] = {}
    messages: list[ChatMessage] = []
