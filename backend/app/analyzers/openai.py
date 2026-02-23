from openai import AsyncOpenAI
from .base import (
    SpeechAnalyzer,
    BYOPScoringMixin,
    AnalysisResult,
    FeedbackItem,
    FeedbackType,
)


class OpenAIAnalyzer(BYOPScoringMixin, SpeechAnalyzer):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        with open(audio_path, "rb") as audio_file:
            transcription_response = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=(audio_path, audio_file, "audio/wav"),
            )

        recognized_text = transcription_response.text

        if not recognized_text:
            return AnalysisResult(
                rhythm_score=3.0,
                stress_score=3.0,
                pacing_score=3.0,
                intonation_score=3.0,
                feedback_items=[
                    FeedbackItem(
                        type=FeedbackType.warning,
                        message="Could not recognize speech. Please try again.",
                    )
                ],
            )

        rhythm_score = self._calculate_rhythm(recognized_text, target_text)
        stress_score = self._calculate_stress(recognized_text, target_text)
        pacing_score = self._calculate_pacing(recognized_text, target_text)
        intonation_score = self._calculate_intonation(recognized_text, target_text)

        feedback_items = self._generate_feedback(
            rhythm_score, stress_score, pacing_score, intonation_score
        )

        return AnalysisResult(
            rhythm_score=rhythm_score,
            stress_score=stress_score,
            pacing_score=pacing_score,
            intonation_score=intonation_score,
            feedback_items=feedback_items,
        )
