import json

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.database import get_db
from app.schemas import (
    DocumentDetail,
    DocumentSummary,
    SaveDocumentRequest,
)

router = APIRouter()


def _row_to_summary(row) -> DocumentSummary:
    return DocumentSummary(
        id=row["id"],
        title=row["title"],
        document_type=row["document_type"],
        updated_at=row["updated_at"],
    )


def _row_to_detail(row) -> DocumentDetail:
    return DocumentDetail(
        id=row["id"],
        title=row["title"],
        document_type=row["document_type"],
        updated_at=row["updated_at"],
        doc_fields=json.loads(row["doc_fields_json"]),
        messages=json.loads(row["messages_json"]),
    )


@router.get("/", response_model=list[DocumentSummary])
def list_documents(current_user: str = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, document_type, updated_at "
            "FROM documents WHERE user_email = ? ORDER BY updated_at DESC, id DESC",
            (current_user,),
        ).fetchall()
    return [_row_to_summary(r) for r in rows]


@router.post("/", response_model=DocumentDetail, status_code=status.HTTP_200_OK)
def save_document(
    request: SaveDocumentRequest,
    current_user: str = Depends(get_current_user),
):
    fields_json = json.dumps(request.doc_fields)
    messages_json = json.dumps([m.model_dump() for m in request.messages])

    with get_db() as conn:
        if request.id is not None:
            # Update existing document owned by this user
            result = conn.execute(
                "UPDATE documents SET title = ?, document_type = ?, "
                "doc_fields_json = ?, messages_json = ?, updated_at = CURRENT_TIMESTAMP "
                "WHERE id = ? AND user_email = ?",
                (
                    request.title,
                    request.document_type,
                    fields_json,
                    messages_json,
                    request.id,
                    current_user,
                ),
            )
            conn.commit()
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Document not found",
                )
            doc_id = request.id
        else:
            # Create new document
            cursor = conn.execute(
                "INSERT INTO documents (user_email, title, document_type, doc_fields_json, messages_json) "
                "VALUES (?, ?, ?, ?, ?)",
                (
                    current_user,
                    request.title,
                    request.document_type,
                    fields_json,
                    messages_json,
                ),
            )
            conn.commit()
            doc_id = cursor.lastrowid

        row = conn.execute(
            "SELECT * FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()

    return _row_to_detail(row)


@router.get("/{doc_id}", response_model=DocumentDetail)
def load_document(doc_id: int, current_user: str = Depends(get_current_user)):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ? AND user_email = ?",
            (doc_id, current_user),
        ).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return _row_to_detail(row)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(doc_id: int, current_user: str = Depends(get_current_user)):
    with get_db() as conn:
        result = conn.execute(
            "DELETE FROM documents WHERE id = ? AND user_email = ?",
            (doc_id, current_user),
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
