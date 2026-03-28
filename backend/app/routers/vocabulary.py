"""Vocabulary router: list, review, and manage learned vocabulary."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import VocabularyItem, get_db
from app.schemas.schemas import VocabularyItemOut, VocabularyListOut
from app.services import memory_service

router = APIRouter()


@router.get("", response_model=VocabularyListOut)
async def list_vocabulary(
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List all saved vocabulary items with optional search filter."""
    query = db.query(VocabularyItem)

    if search:
        query = query.filter(
            VocabularyItem.word.ilike(f"%{search}%")
            | VocabularyItem.meaning_pt.ilike(f"%{search}%")
        )

    total = query.count()
    items = query.order_by(VocabularyItem.date_added.desc()).offset(offset).limit(limit).all()

    return VocabularyListOut(
        items=[VocabularyItemOut.model_validate(i) for i in items],
        total=total,
    )


@router.get("/review", response_model=VocabularyListOut)
async def get_review_list(db: Session = Depends(get_db)):
    """Return vocabulary items due for spaced repetition review."""
    items = memory_service.get_review_vocabulary(db)
    return VocabularyListOut(
        items=[VocabularyItemOut.model_validate(i) for i in items],
        total=len(items),
    )


@router.patch("/{vocab_id}/reviewed")
async def mark_reviewed(vocab_id: str, db: Session = Depends(get_db)):
    """Mark a vocabulary item as reviewed (spaced repetition)."""
    item = memory_service.mark_vocabulary_reviewed(db, vocab_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")
    return {"status": "reviewed", "id": item.id, "times_reviewed": item.times_reviewed}


@router.delete("/{vocab_id}")
async def delete_vocabulary(vocab_id: str, db: Session = Depends(get_db)):
    """Delete a vocabulary item."""
    item = db.query(VocabularyItem).filter(VocabularyItem.id == vocab_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Vocabulary item not found")
    db.delete(item)
    db.commit()
    return {"status": "deleted", "id": vocab_id}
