from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.document_registry import REGISTRY, get_catalog_summary, get_template_content

router = APIRouter()


@router.get("/catalog")
def catalog():
    """Return the list of available document types."""
    return get_catalog_summary()


@router.get("/{doc_id}", response_class=PlainTextResponse)
def get_template(doc_id: str):
    """Return the raw markdown template for a document type."""
    if doc_id not in REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown document type: {doc_id}")
    content = get_template_content(doc_id)
    if content is None:
        raise HTTPException(status_code=404, detail=f"Template file not found for: {doc_id}")
    return PlainTextResponse(content, media_type="text/markdown")
