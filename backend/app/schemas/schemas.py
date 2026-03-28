"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# --- Chat Schemas ---


class TextChatRequest(BaseModel):
    message: str
    scenario: str = "free_talk"
    conversation_id: Optional[str] = None


class Correction(BaseModel):
    original: str
    corrected: str
    explanation: str


class NewExpression(BaseModel):
    expression: str
    meaning: str
    example: str


class ChatResponse(BaseModel):
    conversation_id: str
    transcription: Optional[str] = None  # Populated for voice requests
    response: str
    correction: Optional[Correction] = None
    new_expression: Optional[NewExpression] = None
    pronunciation_tip: Optional[str] = None
    audio_url: Optional[str] = None


# --- Message Schemas ---


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    transcription: Optional[str] = None
    audio_filename: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationHistoryOut(BaseModel):
    conversation_id: str
    mode: str
    messages: list[MessageOut]


# --- Vocabulary Schemas ---


class VocabularyItemOut(BaseModel):
    id: str
    word: str
    meaning_pt: str
    example: str
    date_added: datetime
    times_reviewed: int
    last_reviewed: Optional[datetime] = None

    model_config = {"from_attributes": True}


class VocabularyListOut(BaseModel):
    items: list[VocabularyItemOut]
    total: int


# --- Recurring Errors Schemas ---


class RecurringErrorOut(BaseModel):
    id: str
    error_type: str
    original: str
    corrected: str
    count: int
    last_seen: datetime
    resolved: bool

    model_config = {"from_attributes": True}


# --- Progress Schemas ---


class ProgressStatsOut(BaseModel):
    total_sessions: int
    total_messages: int
    vocabulary_count: int
    streak_days: int
    top_errors: list[RecurringErrorOut]
    messages_today: int
    sessions_this_week: int
