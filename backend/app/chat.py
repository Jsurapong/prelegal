import logging
import os
from typing import Literal

from fastapi import APIRouter, HTTPException, status
from litellm import completion
from pydantic import BaseModel, ValidationError, create_model

from app.config import settings
from app.document_registry import (
    REGISTRY,
    DocumentType,
    get_catalog_summary,
)
from app.schemas import GenericChatRequest, GenericChatResponse

router = APIRouter()
logger = logging.getLogger(__name__)

if settings.openrouter_api_key:
    os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key

_MAX_MESSAGES = 40

_MODEL = "openrouter/openai/gpt-oss-120b"
_EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


# ── Document selection phase ─────────────────────────────────────────────────


class _SelectionResponse(BaseModel):
    reply: str
    selected_document_type: str | None = None


def _build_selection_prompt() -> str:
    catalog = get_catalog_summary()
    doc_list = "\n".join(
        f'  - doc_id: "{item["doc_id"]}" — {item["display_name"]}: {item["description"]}'
        for item in catalog
    )
    return f"""\
You are a friendly, professional legal document assistant. Your job is to help \
the user identify which legal document they need from our catalog.

Available document types:
{doc_list}

Instructions:
1. Based on the user's message, determine which document type they need.
2. If you can confidently identify the document, set selected_document_type to \
the matching doc_id and confirm with the user what you'll help them create.
3. If the request is ambiguous or could match multiple types, set \
selected_document_type to null and ask a clarifying question.
4. If the user asks for a document we don't support, explain that we can't \
generate it, suggest the closest document from our catalog that might help, \
and set selected_document_type to null.
5. Always end your reply with a question or next step for the user.
6. Keep your reply concise (under 120 words).\
"""


# ── Field collection phase ───────────────────────────────────────────────────


_FIELD_COLLECTION_TEMPLATE = """\
You are a friendly, professional legal document assistant helping a user create \
a {display_name}.

{system_intro}

Your job:
1. Have a natural conversation to collect the information needed for this document.
2. Ask about one or two related fields at a time — do not overwhelm the user.
3. When the user provides information, acknowledge it and move to the next empty fields.
4. If a field needs more information or clarification, always ask a follow-on question.
5. When all required fields are filled, congratulate the user and let them know \
they can review the document in the preview panel and download the PDF.

Field status (FILLED fields are already collected — do not re-ask):
{field_status}

Guidelines:
- For dates, convert to YYYY-MM-DD format.
- Optional fields: only fill if the user mentions them. You may briefly mention \
they exist but do not pressure the user.
{extra_guidelines}
- Keep your reply concise (under 150 words).
- In doc_fields, include ALL fields you are confident about from the entire \
conversation so far, not just from the latest message. Use null for unknown fields.
- IMPORTANT: Always end your reply with a follow-on question if any required \
fields are still empty. Guide the user to the next piece of information needed.\
"""


def _build_field_prompt(doc_type: DocumentType, current_fields: dict[str, str | None]) -> str:
    lines = []
    for f in doc_type.fields:
        val = current_fields.get(f.key)
        opt = " (optional)" if f.optional else ""
        if val is not None and val != "":
            lines.append(f'  - {f.label}{opt}: "{val}" [FILLED]')
        else:
            hint = f" — {f.hint}" if f.hint else ""
            lines.append(f"  - {f.label}{opt}{hint}: [EMPTY]")

    extra = []
    for f in doc_type.fields:
        if f.allowed_values:
            vals = ", ".join(f'"{v}"' for v in f.allowed_values)
            extra.append(f'- For {f.key}, use exactly one of: {vals}.')

    return _FIELD_COLLECTION_TEMPLATE.format(
        display_name=doc_type.display_name,
        system_intro=doc_type.system_intro,
        field_status="\n".join(lines),
        extra_guidelines="\n".join(extra),
    )


# ── Dynamic Pydantic model for structured output ────────────────────────────


_model_cache: dict[str, type[BaseModel]] = {}


def _get_response_model(doc_type: DocumentType) -> type[BaseModel]:
    if doc_type.doc_id in _model_cache:
        return _model_cache[doc_type.doc_id]

    field_defs: dict[str, tuple] = {
        "reply": (str, ...),
    }
    for f in doc_type.fields:
        if f.allowed_values:
            lit_type = Literal[tuple(f.allowed_values)]  # type: ignore[valid-type]
            field_defs[f.key] = (lit_type | None, None)
        else:
            field_defs[f.key] = (str | None, None)

    model = create_model(f"AiResponse_{doc_type.doc_id}", **field_defs)
    _model_cache[doc_type.doc_id] = model
    return model


def _parse_fields_from_response(response: BaseModel, doc_type: DocumentType) -> dict[str, str | None]:
    data = response.model_dump()
    return {f.key: data.get(f.key) for f in doc_type.fields}


# ── LLM call ─────────────────────────────────────────────────────────────────


def _call_llm(system_prompt: str, messages: list[dict], response_model: type[BaseModel]) -> BaseModel:
    all_messages = [{"role": "system", "content": system_prompt}] + messages
    response = completion(
        model=_MODEL,
        messages=all_messages,
        response_format=response_model,
        reasoning_effort="low",
        extra_body=_EXTRA_BODY,
    )
    raw = response.choices[0].message.content
    return response_model.model_validate_json(raw)


# ── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/", response_model=GenericChatResponse)
def chat(request: GenericChatRequest):
    recent = request.messages[-_MAX_MESSAGES:] if len(request.messages) > _MAX_MESSAGES else request.messages
    messages = [m.model_dump() for m in recent]

    # Phase 1: Document selection
    if request.document_type is None:
        system_prompt = _build_selection_prompt()
        try:
            ai_response = _call_llm(system_prompt, messages, _SelectionResponse)
        except ValidationError:
            logger.exception("LLM returned invalid structured output during selection")
            return GenericChatResponse(
                reply="I had trouble processing that. Could you rephrase?",
            )
        except Exception:
            logger.exception("LLM call failed during selection")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI service unavailable. Please try again.",
            )

        selected = ai_response.selected_document_type
        if selected and selected not in REGISTRY:
            logger.warning("LLM selected unknown doc type: %s", selected)
            selected = None

        return GenericChatResponse(
            reply=ai_response.reply,
            document_type=selected,
            doc_fields={},
        )

    # Phase 2: Field collection
    doc_type = REGISTRY.get(request.document_type)
    if doc_type is None:
        return GenericChatResponse(
            reply=(
                "I'm sorry, that document type isn't supported. I can help with: "
                + ", ".join(dt.display_name for dt in REGISTRY.values())
                + ". What would you like to create?"
            ),
            document_type=None,
            doc_fields={},
        )

    system_prompt = _build_field_prompt(doc_type, request.current_fields)
    response_model = _get_response_model(doc_type)

    try:
        ai_response = _call_llm(system_prompt, messages, response_model)
    except ValidationError:
        logger.exception("LLM returned invalid structured output")
        return GenericChatResponse(
            reply="I had trouble processing that. Could you rephrase?",
            document_type=request.document_type,
            doc_fields=request.current_fields,
        )
    except Exception:
        logger.exception("LLM call failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service unavailable. Please try again.",
        )

    doc_fields = _parse_fields_from_response(ai_response, doc_type)

    return GenericChatResponse(
        reply=ai_response.reply,
        document_type=request.document_type,
        doc_fields=doc_fields,
    )
