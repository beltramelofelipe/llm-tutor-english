"""Groq LLM service for generating tutor responses."""
import json
import logging
from typing import Any

from groq import AsyncGroq

from app.config import get_settings
from app.prompts.tutor_prompts import get_system_prompt
from app.schemas.schemas import Correction, NewExpression

logger = logging.getLogger(__name__)

settings = get_settings()


def _parse_llm_response(raw_text: str) -> dict[str, Any]:
    """Parse the JSON response from the LLM with fallback handling."""
    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Attempt to extract JSON object from surrounding text
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

    logger.warning("Failed to parse LLM JSON response, using raw text as response")
    return {
        "response": raw_text,
        "correction": None,
        "new_expression": None,
        "pronunciation_tip": None,
    }


async def generate_response(
    user_message: str,
    mode: str,
    conversation_history: list[dict[str, str]],
    top_errors: list[dict] | None = None,
) -> dict[str, Any]:
    """
    Generate a tutor response using Groq's LLM.

    Args:
        user_message: The user's input text.
        mode: Conversation mode (free_talk, interview, etc.)
        conversation_history: List of prior messages [{role, content}].
        top_errors: Felipe's top recurring errors to inject into the system prompt.

    Returns:
        Parsed dict with keys: response, correction, new_expression, pronunciation_tip.
    """
    client = AsyncGroq(api_key=settings.groq_api_key)

    system_prompt = get_system_prompt(mode, top_errors)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history[-settings.max_conversation_history :])
    messages.append({"role": "user", "content": user_message})

    completion = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=1024,
        response_format={"type": "json_object"},
    )

    raw_text = completion.choices[0].message.content or ""
    parsed = _parse_llm_response(raw_text)

    # Validate and coerce fields
    correction = None
    if parsed.get("correction"):
        try:
            correction = Correction(**parsed["correction"])
        except Exception:
            pass

    new_expression = None
    if parsed.get("new_expression"):
        try:
            new_expression = NewExpression(**parsed["new_expression"])
        except Exception:
            pass

    return {
        "response": parsed.get("response", raw_text),
        "correction": correction,
        "new_expression": new_expression,
        "pronunciation_tip": parsed.get("pronunciation_tip"),
    }
