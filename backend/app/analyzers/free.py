import librosa
import numpy as np
import parselmouth
from .base import SpeechAnalyzer, AnalysisResult, FeedbackItem, FeedbackType
from typing import List


class FreeAnalyzer(SpeechAnalyzer):
    async def analyze(self, audio_path: str, target_text: str) -> AnalysisResult:
        y, sr = librosa.load(audio_path)

        rhythm_score = self._analyze_rhythm(y, sr)
        stress_score = self._analyze_stress(y, sr, target_text)
        pacing_score = self._analyze_pacing(y, sr, target_text)
        intonation_score = self._analyze_intonation(audio_path)

        feedback_items = self._generate_feedback(
            rhythm_score, stress_score, pacing_score, intonation_score, target_text
        )

        return AnalysisResult(
            rhythm_score=rhythm_score,
            stress_score=stress_score,
            pacing_score=pacing_score,
            intonation_score=intonation_score,
            feedback_items=feedback_items,
        )

    def _analyze_rhythm(self, y: np.ndarray, sr: int) -> float:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        ideal_tempo = 110
        tempo_diff = abs(tempo - ideal_tempo)
        max_diff = 50
        rhythm_score = max(1.0, min(5.0, 5.0 - (tempo_diff / max_diff) * 4))
        return round(rhythm_score, 1)

    def _analyze_stress(self, y: np.ndarray, sr: int, text: str) -> float:
        rms = librosa.feature.rms(y=y)
        rms_normalized = rms / np.max(rms)
        std_dev = np.std(rms_normalized)
        stress_score = max(1.0, min(5.0, 2.0 + std_dev * 10))
        return round(stress_score, 1)

    def _analyze_pacing(self, y: np.ndarray, sr: int, text: str) -> float:
        words = len(text.split())
        duration = librosa.get_duration(y=y, sr=sr)
        words_per_minute = (words / duration) * 60
        ideal_wpm = 140
        wpm_diff = abs(words_per_minute - ideal_wpm)
        max_diff = 60
        pacing_score = max(1.0, min(5.0, 5.0 - (wpm_diff / max_diff) * 4))
        return round(pacing_score, 1)

    def _analyze_intonation(self, audio_path: str) -> float:
        sound = parselmouth.Sound(audio_path)
        pitch = sound.to_pitch()
        pitch_values = pitch.selected_array["frequency"]
        pitch_values = pitch_values[pitch_values > 0]

        if len(pitch_values) == 0:
            return 3.0

        pitch_range = np.max(pitch_values) - np.min(pitch_values)
        ideal_range = 150
        range_diff = abs(pitch_range - ideal_range)
        max_diff = 100
        intonation_score = max(1.0, min(5.0, 5.0 - (range_diff / max_diff) * 4))
        return round(intonation_score, 1)

    def _generate_feedback(
        self,
        rhythm_score: float,
        stress_score: float,
        pacing_score: float,
        intonation_score: float,
        text: str,
    ) -> List[FeedbackItem]:
        feedback_items = []

        if rhythm_score >= 4.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.good,
                    message="Your rhythm is consistent and natural.",
                )
            )
        elif rhythm_score <= 2.5:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.warning,
                    message="Your rhythm could be more regular. Try speaking with a steady beat.",
                )
            )
        else:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.tip,
                    message="Good rhythm overall. Practice maintaining a steady pace.",
                )
            )

        if stress_score >= 4.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.good,
                    message="Excellent word stress on key syllables.",
                )
            )
        elif stress_score <= 2.5:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.tip,
                    message="Emphasize important words by speaking them slightly louder and longer.",
                )
            )

        if pacing_score >= 4.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.good,
                    message="Your speaking pace is natural and easy to follow.",
                )
            )
        elif pacing_score <= 2.5:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.warning,
                    message="You're speaking too fast or too slow. Aim for a conversational pace.",
                )
            )

        if intonation_score >= 4.0:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.good,
                    message="Your voice has good variation and sounds engaging.",
                )
            )
        elif intonation_score <= 2.5:
            feedback_items.append(
                FeedbackItem(
                    type=FeedbackType.tip,
                    message="Your voice sounds a bit flat. Try varying your pitch for questions and emphasis.",
                )
            )

        return feedback_items
