import logging
import os

from fastapi import APIRouter, HTTPException, status
from litellm import completion
from pydantic import ValidationError

from app.config import settings
from app.schemas import ChatRequest, ChatResponse, NdaAiResponse, NdaFields

router = APIRouter()
logger = logging.getLogger(__name__)

# Set the API key once at module import, not per request
if settings.openrouter_api_key:
    os.environ["OPENROUTER_API_KEY"] = settings.openrouter_api_key

_MAX_MESSAGES = 40

_MODEL = "openrouter/openai/gpt-oss-120b"
_EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

_FIELD_LABELS: dict[str, str] = {
    "purpose": "Purpose (how Confidential Information may be used)",
    "effective_date": "Effective Date",
    "mnda_term_type": "MNDA Term Type (expires or until_terminated)",
    "mnda_term_years": "MNDA Term Years",
    "confidentiality_term_type": "Confidentiality Term Type (expires or perpetuity)",
    "confidentiality_term_years": "Confidentiality Term Years",
    "governing_law": "Governing Law (state name)",
    "jurisdiction": "Jurisdiction (city/county and state)",
    "modifications": "Modifications to standard terms",
    "party1_company": "Party 1 Company Name",
    "party1_print_name": "Party 1 Signatory Name",
    "party1_title": "Party 1 Signatory Title",
    "party1_notice_address": "Party 1 Notice Address (email or postal)",
    "party1_date": "Party 1 Signing Date",
    "party2_company": "Party 2 Company Name",
    "party2_print_name": "Party 2 Signatory Name",
    "party2_title": "Party 2 Signatory Title",
    "party2_notice_address": "Party 2 Notice Address (email or postal)",
    "party2_date": "Party 2 Signing Date",
}

_SYSTEM_TEMPLATE = """\
You are a friendly, professional legal document assistant helping a user create \
a Mutual Non-Disclosure Agreement (MNDA) based on the Common Paper MNDA Standard \
Terms v1.0.

Your job:
1. Have a natural conversation to collect the information needed for the NDA.
2. Ask about one or two related fields at a time — do not overwhelm the user.
3. When the user provides information, acknowledge it and move to the next empty fields.
4. When all required fields are filled, congratulate the user and let them know \
they can review the document in the preview panel and download the PDF.

Field status (FILLED fields are already collected — do not re-ask):
{field_status}

Guidelines:
- For dates, convert to YYYY-MM-DD format.
- For mnda_term_type use exactly "expires" or "until_terminated".
- For confidentiality_term_type use exactly "expires" or "perpetuity".
- For term years, use a simple number string like "1" or "3".
- The modifications field is optional — only fill it if the user mentions custom terms.
- Keep your reply concise (under 150 words).
- In nda_fields, include ALL fields you are confident about from the entire \
conversation so far, not just from the latest message. Use null for unknown fields.\
"""


def _build_system_prompt(current_fields: NdaFields) -> str:
    field_dict = current_fields.model_dump()
    lines = []
    for key, label in _FIELD_LABELS.items():
        val = field_dict.get(key)
        if val is not None and val != "":
            lines.append(f"  - {label}: \"{val}\" [FILLED]")
        else:
            lines.append(f"  - {label}: [EMPTY]")
    return _SYSTEM_TEMPLATE.format(field_status="\n".join(lines))


def _call_llm(system_prompt: str, messages: list[dict]) -> NdaAiResponse:
    all_messages = [{"role": "system", "content": system_prompt}] + messages

    response = completion(
        model=_MODEL,
        messages=all_messages,
        response_format=NdaAiResponse,
        reasoning_effort="low",
        extra_body=_EXTRA_BODY,
    )

    raw = response.choices[0].message.content
    return NdaAiResponse.model_validate_json(raw)


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    system_prompt = _build_system_prompt(request.current_fields)
    # Cap history to prevent unbounded context window cost
    recent = request.messages[-_MAX_MESSAGES:] if len(request.messages) > _MAX_MESSAGES else request.messages
    messages = [m.model_dump() for m in recent]

    try:
        ai_response = _call_llm(system_prompt, messages)
    except ValidationError:
        logger.exception("LLM returned invalid structured output")
        return ChatResponse(
            reply="I had trouble processing that. Could you rephrase?",
            nda_fields=request.current_fields,
        )
    except Exception:
        logger.exception("LLM call failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service unavailable. Please try again.",
        )

    return ChatResponse(reply=ai_response.reply, nda_fields=ai_response.nda_fields)
