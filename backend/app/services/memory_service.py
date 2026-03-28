"""Memory service: vocabulary, error tracking, and spaced repetition."""
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.database import RecurringError, VocabularyItem, Session_

logger = logging.getLogger(__name__)


def save_vocabulary(db: Session, word: str, meaning_pt: str, example: str) -> VocabularyItem:
    """
    Upsert a vocabulary item. Updates example if word already exists.

    Args:
        db: Database session.
        word: The English word or expression.
        meaning_pt: Portuguese meaning.
        example: Example sentence.

    Returns:
        The saved VocabularyItem.
    """
    item = db.query(VocabularyItem).filter(VocabularyItem.word == word.lower()).first()
    if item:
        item.example = example
        item.meaning_pt = meaning_pt
    else:
        item = VocabularyItem(
            word=word.lower(),
            meaning_pt=meaning_pt,
            example=example,
        )
        db.add(item)
    db.commit()
    db.refresh(item)
    logger.info(f"Vocabulary saved: {word}")
    return item


def save_error(
    db: Session,
    error_type: str,
    original: str,
    corrected: str,
) -> RecurringError:
    """
    Upsert a recurring error. Increments count if already exists.

    Args:
        db: Database session.
        error_type: Category of error (grammar, vocabulary, pronunciation).
        original: What the user said.
        corrected: The correct form.

    Returns:
        The saved RecurringError.
    """
    error = (
        db.query(RecurringError)
        .filter(
            RecurringError.original == original,
            RecurringError.corrected == corrected,
        )
        .first()
    )
    if error:
        error.count += 1
        error.last_seen = datetime.utcnow()
        error.resolved = False
    else:
        error = RecurringError(
            error_type=error_type,
            original=original,
            corrected=corrected,
        )
        db.add(error)
    db.commit()
    db.refresh(error)
    return error


def get_top_errors(db: Session, n: int = 5) -> list[dict]:
    """
    Retrieve the top N most frequent unresolved errors.

    Args:
        db: Database session.
        n: Number of top errors to return.

    Returns:
        List of dicts with error_type, original, corrected, count.
    """
    errors = (
        db.query(RecurringError)
        .filter(RecurringError.resolved == False)
        .order_by(RecurringError.count.desc())
        .limit(n)
        .all()
    )
    return [
        {
            "error_type": e.error_type,
            "original": e.original,
            "corrected": e.corrected,
            "count": e.count,
        }
        for e in errors
    ]


def get_review_vocabulary(db: Session) -> list[VocabularyItem]:
    """
    Return vocabulary items due for spaced repetition review.
    Logic: reviewed < 3 times OR last_reviewed > 3 days ago.

    Args:
        db: Database session.

    Returns:
        List of VocabularyItem objects due for review.
    """
    three_days_ago = datetime.utcnow() - timedelta(days=3)
    items = (
        db.query(VocabularyItem)
        .filter(
            (VocabularyItem.times_reviewed < 3)
            | (VocabularyItem.last_reviewed < three_days_ago)
            | (VocabularyItem.last_reviewed == None)
        )
        .order_by(VocabularyItem.date_added.asc())
        .limit(20)
        .all()
    )
    return items


def mark_vocabulary_reviewed(db: Session, vocab_id: str) -> VocabularyItem | None:
    """Mark a vocabulary item as reviewed (for spaced repetition)."""
    item = db.query(VocabularyItem).filter(VocabularyItem.id == vocab_id).first()
    if item:
        item.times_reviewed += 1
        item.last_reviewed = datetime.utcnow()
        db.commit()
        db.refresh(item)
    return item


def save_session(
    db: Session,
    mode: str,
    message_count: int,
    duration_mins: float = 0.0,
) -> Session_:
    """Save a completed conversation session for progress tracking."""
    session = Session_(
        mode=mode,
        message_count=message_count,
        duration_mins=duration_mins,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
