import asyncio
import json
from google.cloud import speech_v1
from google.cloud.speech_v1 import (
    RecognitionConfig,
    RecognitionAudio,
)
from .base import (
    SpeechAnalyzer,
    BYOPScoringMixin,
    AnalysisResult,
    FeedbackItem,
    FeedbackType,
)


class GoogleAnalyzer(BYOPScoringMixin, SpeechAnalyzer):
    def __init__(self, api_key: str):
        self.api_key = api_key

        # Check if api_key is a JSON string (service account credentials)
        try:
            credentials_json = json.loads(api_key)
            # If it parses as JSON, treat it as service account credentials
            self.client = speech_v1.SpeechClient.from_service_account_info(
                credentials_json
            )
        except (json.JSONDecodeError, ValueError):
            # If it doesn't parse as JSON, treat it as a plain API key
            self.client = speech_v1.SpeechClient(client_options={"api_key": api_key})

    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        with open(audio_path, "rb") as audio_file:
            audio_content = audio_file.read()

        audio = RecognitionAudio(content=audio_content)
        config = RecognitionConfig(
            encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="en-US",
        )

        response = await asyncio.to_thread(
            self.client.recognize, config=config, audio=audio
        )

        if not response.results:
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

        recognized_text = " ".join(
            [result.alternatives[0].transcript for result in response.results]
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
