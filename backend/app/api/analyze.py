from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
import tempfile
import os


class AnalysisResponse(BaseModel):
    rhythm_score: float
    stress_score: float
    pacing_score: float
    intonation_score: float
    feedback: List[dict]


router = APIRouter(prefix="/api/v1", tags=["analysis"])


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
    api_key: Optional[str] = Form(None, description="API key for paid providers"),
):
    if audio.content_type not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Supported formats: {', '.join(SUPPORTED_FORMATS)}",
        )

    temp_path = None

    try:
        from app.analyzers.factory import get_analyzer
        from app.analyzers.base import AnalysisResult

        analyzer = get_analyzer(provider or "free", api_key)

        audio_content = await audio.read()
        if len(audio_content) > MAX_AUDIO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file exceeds maximum size of {MAX_AUDIO_SIZE_BYTES // (1024 * 1024)}MB",
            )

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_path = temp_file.name
        temp_file.close()

        with open(temp_path, "wb") as f:
            f.write(audio_content)

        if audio.content_type not in {"audio/wav", "audio/x-wav"}:
            from pydub import AudioSegment

            source_format = CONTENT_TYPE_TO_FORMAT.get(audio.content_type)
            if not source_format:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported conversion content type: {audio.content_type}",
                )

            try:
                audio_segment = AudioSegment.from_file(temp_path, format=source_format)
                audio_segment.export(temp_path, format="wav")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to convert audio format",
                )

        result: AnalysisResult = await analyzer.analyze(temp_path, target_text)

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
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed",
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
