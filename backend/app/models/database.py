"""SQLAlchemy ORM models and database setup."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite only
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency injection for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables on startup."""
    Base.metadata.create_all(bind=engine)


# --- ORM Models ---


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    mode = Column(String, nullable=False, default="free_talk")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    transcription = Column(Text, nullable=True)  # Raw Whisper transcript
    audio_filename = Column(String, nullable=True)  # TTS output filename
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class VocabularyItem(Base):
    __tablename__ = "vocabulary"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    word = Column(String, nullable=False, unique=True)
    meaning_pt = Column(Text, nullable=False)
    example = Column(Text, nullable=False)
    date_added = Column(DateTime, default=datetime.utcnow)
    times_reviewed = Column(Integer, default=0)
    last_reviewed = Column(DateTime, nullable=True)


class RecurringError(Base):
    __tablename__ = "recurring_errors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    error_type = Column(String, nullable=False)  # "grammar" | "vocabulary" | "pronunciation"
    original = Column(Text, nullable=False)
    corrected = Column(Text, nullable=False)
    count = Column(Integer, default=1)
    last_seen = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)


class Session_(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(DateTime, default=datetime.utcnow)
    duration_mins = Column(Float, default=0.0)
    mode = Column(String, nullable=False, default="free_talk")
    message_count = Column(Integer, default=0)
