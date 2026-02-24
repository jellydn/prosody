import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AudioPlayer from "../components/AudioPlayer";
import AudioRecorder from "../components/AudioRecorder";
import FeedbackCard from "../components/FeedbackCard";
import { API_BASE_URL } from "../config/api";
import { appendByopToFormData } from "../config/byop";
import type { AnalysisResult } from "../types/analysis";
import type { Exercise, ExerciseScores } from "./ExerciseScreen";

interface LinkingPracticeScreenProps {
  exercise: Exercise;
  onNext: () => void;
  onBack: () => void;
  onComplete: (exerciseId: string, scores: ExerciseScores) => void;
}

export default function LinkingPracticeScreen({
  exercise,
  onNext,
  onBack,
  onComplete,
}: LinkingPracticeScreenProps) {
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const cleanupRecording = useCallback(async () => {
    if (recordedUri) {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch (err) {
        console.error("Error cleaning up audio mode:", err);
      }
    }
  }, [recordedUri]);

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, [cleanupRecording]);

  const handleRecordingComplete = (uri: string | null) => {
    setRecordedUri(uri);
    if (uri) {
      analyzeRecording(uri);
    }
  };

  const analyzeRecording = async (uri: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);
      formData.append("target_text", exercise.targetText);
      const byopHeaders = await appendByopToFormData(formData);

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
          ...byopHeaders,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      console.error("Error analyzing recording:", err);
      Alert.alert("Analysis Failed", "Could not analyze your recording. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderLinkedText = () => {
    const words = exercise.targetText.split(/\s+/);
    return (
      <View style={styles.linkedTextContainer}>
        {words.map((word, index) => (
          <View key={`word-${index}`} style={styles.wordWrapper}>
            <Text style={styles.wordText}>{word}</Text>
            {index < words.length - 1 && <Text style={styles.linkSymbol}>‿</Text>}
          </View>
        ))}
      </View>
    );
  };

  const renderTips = () => {
    return (
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips:</Text>
        {exercise.tips.map((tip, index) => (
          <View key={`tip-${index}`} style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color="#FF9500" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.instructionContainer}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.instruction}>{exercise.instruction}</Text>
          </View>

          <View style={styles.linkedTextSection}>
            <Text style={styles.sectionTitle}>Connected Speech</Text>
            {renderLinkedText()}
          </View>

          <AudioPlayer
            audioUrl={exercise.audioUrl ?? null}
            targetText={exercise.targetText}
            stressPattern={exercise.stressPattern}
            chunks={exercise.chunks}
          />

          <View style={styles.recordingSection}>
            <Text style={styles.sectionTitle}>
              {recordedUri ? "Replay or re-record" : "Record your voice"}
            </Text>
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          </View>

          {isAnalyzing && <FeedbackCard result={null} isLoading={true} />}

          {analysisResult && (
            <>
              <FeedbackCard result={analysisResult} />
              {renderTips()}
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => {
                  onComplete(exercise.id, {
                    rhythm_score: analysisResult.rhythm_score,
                    stress_score: analysisResult.stress_score,
                    pacing_score: analysisResult.pacing_score,
                    intonation_score: analysisResult.intonation_score,
                  });
                  onNext();
                }}
              >
                <Text style={styles.nextButtonText}>Next Exercise</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  instructionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E3F2FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instruction: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
    marginLeft: 8,
  },
  linkedTextSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  linkedTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  wordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    color: "#000",
  },
  linkSymbol: {
    fontSize: 18,
    color: "#FF9500",
    marginHorizontal: 2,
  },
  recordingSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  tipsContainer: {
    backgroundColor: "#FFF9E6",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#3C3C43",
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginRight: 8,
  },
});
