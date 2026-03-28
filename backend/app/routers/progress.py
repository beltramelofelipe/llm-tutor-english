"""Progress router: stats and analytics."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.database import Message, RecurringError, Session_, VocabularyItem, get_db
from app.schemas.schemas import ProgressStatsOut, RecurringErrorOut

router = APIRouter()


@router.get("/stats", response_model=ProgressStatsOut)
async def get_stats(db: Session = Depends(get_db)):
    """Return comprehensive progress statistics for Felipe."""
    total_sessions = db.query(Session_).count()
    total_messages = db.query(Message).filter(Message.role == "user").count()
    vocabulary_count = db.query(VocabularyItem).count()

    # Top 5 unresolved recurring errors
    top_errors_raw = (
        db.query(RecurringError)
        .filter(RecurringError.resolved == False)
        .order_by(RecurringError.count.desc())
        .limit(5)
        .all()
    )
    top_errors = [RecurringErrorOut.model_validate(e) for e in top_errors_raw]

    # Messages today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = (
        db.query(Message)
        .filter(Message.role == "user", Message.created_at >= today_start)
        .count()
    )

    # Sessions this week
    week_start = datetime.utcnow() - timedelta(days=7)
    sessions_this_week = (
        db.query(Session_).filter(Session_.date >= week_start).count()
    )

    # Streak: consecutive days with at least one message
    streak_days = _calculate_streak(db)

    return ProgressStatsOut(
        total_sessions=total_sessions,
        total_messages=total_messages,
        vocabulary_count=vocabulary_count,
        streak_days=streak_days,
        top_errors=top_errors,
        messages_today=messages_today,
        sessions_this_week=sessions_this_week,
    )


def _calculate_streak(db: Session) -> int:
    """Calculate consecutive days with at least one practice message."""
    # Get distinct days with user messages, ordered descending
    days_with_messages = (
        db.query(func.date(Message.created_at).label("day"))
        .filter(Message.role == "user")
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at).desc())
        .all()
    )

    if not days_with_messages:
        return 0

    streak = 0
    today = datetime.utcnow().date()
    expected_day = today

    for row in days_with_messages:
        # SQLite returns date as string "YYYY-MM-DD"
        if isinstance(row.day, str):
            day = datetime.strptime(row.day, "%Y-%m-%d").date()
        else:
            day = row.day

        if day == expected_day or day == expected_day - timedelta(days=1):
            streak += 1
            expected_day = day - timedelta(days=1)
        else:
            break

    return streak
