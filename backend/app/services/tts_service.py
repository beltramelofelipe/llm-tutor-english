"""edge-tts Text-to-Speech service."""
import asyncio
import logging
import os
import time
import uuid

import edge_tts

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Keep temp audio files for 1 hour then clean up
AUDIO_MAX_AGE_SECONDS = 3600


async def synthesize_speech(text: str) -> str:
    """
    Convert text to speech using edge-tts and save as MP3.

    Args:
        text: The text to synthesize.

    Returns:
        Filename (not full path) of the generated MP3 file.
    """
    os.makedirs(settings.temp_audio_dir, exist_ok=True)
    filename = f"{uuid.uuid4()}.mp3"
    output_path = os.path.join(settings.temp_audio_dir, filename)

    communicate = edge_tts.Communicate(
        text=text,
        voice=settings.edge_tts_voice,
        rate="+0%",
        pitch="+0Hz",
    )

    await communicate.save(output_path)
    logger.info(f"TTS audio saved: {filename}")

    # Schedule background cleanup without blocking response
    asyncio.create_task(_cleanup_old_files())

    return filename


async def _cleanup_old_files():
    """Remove TTS audio files older than AUDIO_MAX_AGE_SECONDS."""
    try:
        now = time.time()
        audio_dir = settings.temp_audio_dir
        if not os.path.exists(audio_dir):
            return
        for fname in os.listdir(audio_dir):
            fpath = os.path.join(audio_dir, fname)
            if os.path.isfile(fpath):
                age = now - os.path.getmtime(fpath)
                if age > AUDIO_MAX_AGE_SECONDS:
                    os.remove(fpath)
                    logger.debug(f"Cleaned up old audio file: {fname}")
    except Exception as e:
        logger.warning(f"Audio cleanup error: {e}")
