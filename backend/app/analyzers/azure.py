from azure.cognitiveservices.speech import (
    AudioConfig,
    SpeechConfig,
    SpeechRecognizer,
    ResultReason,
)
from .base import SpeechAnalyzer, AnalysisResult, FeedbackItem, FeedbackType
from typing import List


class AzureAnalyzer(SpeechAnalyzer):
    def __init__(self, api_key: str, region: str = "eastus"):
        self.api_key = api_key
        self.region = region

    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        speech_config = SpeechConfig(subscription=self.api_key, region=self.region)
        audio_config = AudioConfig(filename=audio_path)

        recognizer = SpeechRecognizer(
            speech_config=speech_config, audio_config=audio_config
        )

        result = recognizer.recognize_once()

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
        intonation_score = self._calculate_intonation()

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

    def _calculate_rhythm(self, recognized: str, target: str) -> float:
        word_match = self._word_similarity(recognized, target)
        return round(max(1.0, min(5.0, word_match * 5)), 1)

    def _calculate_stress(self, recognized: str, target: str) -> float:
        target_words = target.lower().split()
        recognized_words = recognized.lower().split()
        match_rate = len(set(target_words) & set(recognized_words)) / max(
            len(target_words), 1
        )
        return round(max(1.0, min(5.0, match_rate * 5)), 1)

    def _calculate_pacing(self, recognized: str, target: str) -> float:
        recognized_words = len(recognized.split())
        target_words = len(target.split())
        ratio = min(recognized_words, target_words) / max(target_words, 1)
        return round(max(1.0, min(5.0, ratio * 5)), 1)

    def _calculate_intonation(self) -> float:
        return 3.5

    def _word_similarity(self, text1: str, text2: str) -> float:
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        if not words1 or not words2:
            return 0.0
        intersection = words1 & words2
        return len(intersection) / max(len(words1), len(words2))

    def _generate_feedback(
        self,
        rhythm_score: float,
        stress_score: float,
        pacing_score: float,
        intonation_score: float,
    ) -> List[FeedbackItem]:
        feedback_items = []

        if rhythm_score >= 4.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.good, message="Your speech rhythm is excellent!"
                )
            )

        if stress_score >= 4.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.good, message="Great stress on key words!"
                )
            )

        avg_score = (rhythm_score + stress_score + pacing_score + intonation_score) / 4
        if avg_score < 3.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.tip,
                    message="Keep practicing! Focus on clarity and consistency.",
                )
            )

        return feedback_items
