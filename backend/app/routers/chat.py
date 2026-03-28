"""Chat router: voice and text conversation endpoints."""
import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.database import Conversation, Message, get_db
from app.schemas.schemas import (
    ChatResponse,
    ConversationHistoryOut,
    MessageOut,
    TextChatRequest,
)
from app.services import llm_service, memory_service, stt_service, tts_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _get_or_create_conversation(db: Session, conversation_id: str | None, mode: str) -> Conversation:
    """Retrieve existing conversation or create a new one."""
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conv:
            return conv

    conv = Conversation(id=str(uuid.uuid4()), mode=mode)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _get_history_for_llm(db: Session, conversation_id: str, limit: int = 20) -> list[dict]:
    """Build conversation history list for LLM context."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .all()
    )
    return [{"role": m.role, "content": m.content} for m in messages]


async def _process_chat(
    db: Session,
    user_text: str,
    scenario: str,
    conversation_id: str | None,
    transcription: str | None = None,
) -> ChatResponse:
    """Core chat processing logic shared by voice and text endpoints."""
    conv = _get_or_create_conversation(db, conversation_id, scenario)
    history = _get_history_for_llm(db, conv.id)
    top_errors = memory_service.get_top_errors(db)

    llm_result = await llm_service.generate_response(
        user_message=user_text,
        mode=scenario,
        conversation_history=history,
        top_errors=top_errors,
    )

    # Persist user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=user_text,
        transcription=transcription,
    )
    db.add(user_msg)

    # Generate TTS audio
    audio_filename = None
    audio_url = None
    try:
        audio_filename = await tts_service.synthesize_speech(llm_result["response"])
        audio_url = f"/api/audio/{audio_filename}"
    except Exception as e:
        logger.warning(f"TTS generation failed: {e}")

    # Persist assistant message
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=llm_result["response"],
        audio_filename=audio_filename,
    )
    db.add(assistant_msg)
    db.commit()

    # Save vocabulary and errors to memory
    if llm_result.get("new_expression"):
        expr = llm_result["new_expression"]
        try:
            memory_service.save_vocabulary(
                db,
                word=expr.expression,
                meaning_pt=expr.meaning,
                example=expr.example,
            )
        except Exception as e:
            logger.warning(f"Failed to save vocabulary: {e}")

    if llm_result.get("correction"):
        corr = llm_result["correction"]
        try:
            memory_service.save_error(
                db,
                error_type="grammar",
                original=corr.original,
                corrected=corr.corrected,
            )
        except Exception as e:
            logger.warning(f"Failed to save error: {e}")

    return ChatResponse(
        conversation_id=conv.id,
        transcription=transcription,
        response=llm_result["response"],
        correction=llm_result.get("correction"),
        new_expression=llm_result.get("new_expression"),
        pronunciation_tip=llm_result.get("pronunciation_tip"),
        audio_url=audio_url,
    )


@router.post("/voice", response_model=ChatResponse)
async def chat_voice(
    audio: UploadFile = File(..., description="Audio file from MediaRecorder (webm/ogg)"),
    scenario: str = Form(default="free_talk"),
    conversation_id: str = Form(default=None),
    db: Session = Depends(get_db),
):
    """
    Receive audio, transcribe with Whisper, generate AI response, return TTS audio.
    """
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    audio_bytes = await audio.read()
    if len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Audio file is too small")

    try:
        transcription = await stt_service.transcribe_audio(audio_bytes, audio.content_type)
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(status_code=502, detail=f"Transcription failed: {str(e)}")

    if not transcription:
        raise HTTPException(status_code=422, detail="Could not transcribe audio — please try again")

    return await _process_chat(db, transcription, scenario, conversation_id, transcription)


@router.post("/text", response_model=ChatResponse)
async def chat_text(
    body: TextChatRequest,
    db: Session = Depends(get_db),
):
    """
    Receive text message, generate AI response with TTS audio.
    """
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    return await _process_chat(db, body.message, body.scenario, body.conversation_id)


@router.get("/history", response_model=ConversationHistoryOut)
async def get_history(
    conversation_id: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Return conversation history. Uses most recent conversation if no ID given."""
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    else:
        conv = db.query(Conversation).order_by(Conversation.updated_at.desc()).first()

    if not conv:
        return ConversationHistoryOut(conversation_id="", mode="free_talk", messages=[])

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .all()
    )

    return ConversationHistoryOut(
        conversation_id=conv.id,
        mode=conv.mode,
        messages=[MessageOut.model_validate(m) for m in messages],
    )


@router.delete("/history")
async def clear_history(
    conversation_id: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Clear conversation history. Deletes specified conversation or most recent one.
    This starts a fresh session.
    """
    if conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    else:
        conv = db.query(Conversation).order_by(Conversation.updated_at.desc()).first()

    if conv:
        db.delete(conv)
        db.commit()
        return {"status": "cleared", "conversation_id": conv.id}

    return {"status": "no_conversation_found"}
