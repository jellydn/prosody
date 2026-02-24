import logging
import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List


class AnalysisResponse(BaseModel):
    rhythm_score: float
    stress_score: float
    pacing_score: float
    intonation_score: float
    feedback: List[dict]


router = APIRouter(prefix="/api/v1", tags=["analysis"])
logger = logging.getLogger(__name__)


SUPPORTED_FORMATS = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
}

CONTENT_TYPE_TO_FORMAT = {
    "audio/mpeg": "mp3",
    "audio/mp4": "mp4",
    "audio/x-m4a": "m4a",
}

MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024


@router.post(
    "/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK
)
async def analyze_audio(
    audio: UploadFile = File(..., description="Audio file (WAV or M4A)"),
    target_text: str = Form(..., description="Target text to compare against"),
    provider: Optional[str] = Form(
        None, description="Analyzer provider (free, azure, google, openai)"
    ),
    provider_api_key: Optional[str] = Header(
        None,
        alias="X-Provider-Api-Key",
        description="API key for paid providers",
    ),
):
    resolved_provider = (provider or "free").lower()
    audio_size_bytes: Optional[int] = None

    logger.info(
        "Analyze request received provider=%s content_type=%s filename=%s target_length=%d",
        resolved_provider,
        audio.content_type,
        audio.filename,
        len(target_text),
    )

    if audio.content_type not in SUPPORTED_FORMATS:
        logger.warning(
            "Unsupported audio format provider=%s content_type=%s filename=%s",
            resolved_provider,
            audio.content_type,
            audio.filename,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Supported formats: {', '.join(SUPPORTED_FORMATS)}",
        )

    temp_path = None

    try:
        from app.analyzers.factory import get_analyzer
        from app.analyzers.base import AnalysisResult

        analyzer = get_analyzer(resolved_provider, provider_api_key)

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_path = temp_file.name
        temp_file.close()

        audio_size_bytes = 0
        chunk_size = 1024 * 1024
        try:
            with open(temp_path, "wb") as f:
                while chunk := await audio.read(chunk_size):
                    audio_size_bytes += len(chunk)
                    if audio_size_bytes > MAX_AUDIO_SIZE_BYTES:
                        f.close()
                        os.unlink(temp_path)
                        temp_path = None
                        logger.warning(
                            "Audio payload too large provider=%s size_bytes=%d max_size_bytes=%d",
                            resolved_provider,
                            audio_size_bytes,
                            MAX_AUDIO_SIZE_BYTES,
                        )
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"Audio file exceeds maximum size of {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB",
                        )
                    f.write(chunk)
        except HTTPException:
            raise
        except Exception:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
                temp_path = None
            raise

        logger.info(
            "Audio payload streamed provider=%s size_bytes=%d",
            resolved_provider,
            audio_size_bytes,
        )

        if audio.content_type not in {"audio/wav", "audio/x-wav"}:
            from pydub import AudioSegment

            source_format = CONTENT_TYPE_TO_FORMAT.get(audio.content_type)
            if not source_format:
                logger.warning(
                    "Unsupported audio conversion content type provider=%s content_type=%s",
                    resolved_provider,
                    audio.content_type,
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported conversion content type: {audio.content_type}",
                )

            try:
                audio_segment = AudioSegment.from_file(temp_path, format=source_format)
                audio_segment.export(temp_path, format="wav")
                logger.info(
                    "Audio converted to wav provider=%s source_format=%s",
                    resolved_provider,
                    source_format,
                )
            except Exception:
                logger.exception(
                    "Audio conversion failed provider=%s source_format=%s",
                    resolved_provider,
                    source_format,
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to convert audio format",
                )

        result: AnalysisResult = await analyzer.analyze(temp_path, target_text)
        logger.info(
            "Analysis completed provider=%s rhythm=%.2f stress=%.2f pacing=%.2f intonation=%.2f",
            resolved_provider,
            result.rhythm_score,
            result.stress_score,
            result.pacing_score,
            result.intonation_score,
        )

        feedback_list = [
            {"type": item.type.value, "message": item.message}
            for item in result.feedback_items
        ]

        return AnalysisResponse(
            rhythm_score=result.rhythm_score,
            stress_score=result.stress_score,
            pacing_score=result.pacing_score,
            intonation_score=result.intonation_score,
            feedback=feedback_list,
        )

    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning(
            "Analysis request rejected provider=%s reason=%s",
            resolved_provider,
            str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception:
        logger.exception(
            "Unexpected analysis failure provider=%s content_type=%s audio_size_bytes=%s",
            resolved_provider,
            audio.content_type,
            audio_size_bytes,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed",
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
