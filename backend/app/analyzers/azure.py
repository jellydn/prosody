import asyncio
from azure.cognitiveservices.speech import (
    AudioConfig,
    SpeechConfig,
    SpeechRecognizer,
    ResultReason,
)
from .base import (
    SpeechAnalyzer,
    BYOPScoringMixin,
    AnalysisResult,
    FeedbackItem,
    FeedbackType,
)


class AzureAnalyzer(BYOPScoringMixin, SpeechAnalyzer):
    def __init__(self, api_key: str, region: str = "eastus"):
        self.api_key = api_key
        self.region = region

    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        speech_config = SpeechConfig(subscription=self.api_key, region=self.region)
        audio_config = AudioConfig(filename=audio_path)

        recognizer = SpeechRecognizer(
            speech_config=speech_config, audio_config=audio_config
        )

        result = await asyncio.to_thread(recognizer.recognize_once)

        if result.reason == ResultReason.RecognizedSpeech:
            recognized_text = result.text
        else:
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
