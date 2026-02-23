from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import tempfile
import os

from app.models import get_db


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
    db: Session = Depends(get_db),
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

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        temp_path = temp_file.name
        temp_file.close()

        audio_content = await audio.read()
        with open(temp_path, "wb") as f:
            f.write(audio_content)

        if audio.content_type not in {"audio/wav", "audio/x-wav"}:
            from pydub import AudioSegment

            try:
                audio_segment = AudioSegment.from_file(
                    temp_path, format=audio.content_type.split("/")[-1]
                )
                audio_segment.export(temp_path, format="wav")
            except Exception as e:
                if temp_path and os.path.exists(temp_path):
                    os.unlink(temp_path)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to convert audio: {str(e)}",
                )

        result: AnalysisResult = await analyzer.analyze(temp_path, target_text)

        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
            temp_path = None

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
    except Exception as e:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )
