"""OpenAI Whisper Speech-to-Text service."""
import logging
import tempfile

from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


async def transcribe_audio(audio_bytes: bytes, content_type: str = "audio/webm") -> str:
    """
    Transcribe audio bytes using OpenAI Whisper API.

    Args:
        audio_bytes: Raw audio data from the browser (MediaRecorder, webm/ogg).
        content_type: MIME type of the audio.

    Returns:
        Transcribed text string.
    """
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    # Determine file extension from content type
    ext_map = {
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
        "audio/mp4": ".mp4",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
    }
    ext = ext_map.get(content_type.split(";")[0].strip(), ".webm")

    with tempfile.NamedTemporaryFile(suffix=ext, delete=True) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_file.flush()

        with open(tmp_file.name, "rb") as audio_file:
            transcription = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en",
                response_format="text",
            )

    result = str(transcription).strip()
    logger.info(f"Transcription: {result[:100]}...")
    return result
