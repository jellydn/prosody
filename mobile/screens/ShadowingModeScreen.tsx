import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import FeedbackCard from "../components/FeedbackCard";
import { API_BASE_URL } from "../config/api";
import { appendByopToFormData } from "../config/byop";
import type { AnalysisResult } from "../types/analysis";
import type { Exercise, ExerciseScores } from "./ExerciseScreen";

interface ShadowingModeScreenProps {
  exercise: Exercise;
  onNext: () => void;
  onBack: () => void;
  onComplete: (exerciseId: string, scores: ExerciseScores) => void;
}

export default function ShadowingModeScreen({
  exercise,
  onNext,
  onBack,
  onComplete,
}: ShadowingModeScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isShadowing, setIsShadowing] = useState(false);
  const [modelSound, setModelSound] = useState<Audio.Sound | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlayingModel, setIsPlayingModel] = useState(false);
  const [isPlayingUser, setIsPlayingUser] = useState(false);
  const [userSound, setUserSound] = useState<Audio.Sound | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [shadowingComplete, setShadowingComplete] = useState(false);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert(
          "Microphone Permission Required",
          "Please enable microphone access in Settings to record your voice.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (modelSound) modelSound.unloadAsync();
      if (userSound) userSound.unloadAsync();
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
    };
  }, [modelSound, userSound]);

  const startShadowing = async () => {
    if (!hasPermission) {
      Alert.alert("Permission Required", "Microphone permission is required to record.");
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      setIsShadowing(true);
      setRecordedUri(null);
      setShadowingComplete(false);

      if (exercise.audioUrl) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: exercise.audioUrl },
          { shouldPlay: true },
          (status: any) => {
            if (status.didJustFinish) {
              setIsPlayingModel(false);
              stopRecordingAfterDelay(newRecording, 500);
            }
          },
        );
        setModelSound(sound);
        setIsPlayingModel(true);
      } else {
        playbackTimeoutRef.current = setTimeout(() => {
          stopRecordingAfterDelay(newRecording, 0);
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to start shadowing", err);
    }
  };

  const stopRecordingAfterDelay = async (rec: Audio.Recording, delay: number) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setRecordedUri(uri);
      setRecording(null);
      setIsShadowing(false);
      setShadowingComplete(true);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  const stopShadowing = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordedUri(uri);
        setRecording(null);
      } catch (err) {
        console.error("Failed to stop recording", err);
      }
    }

    if (modelSound) {
      await modelSound.stopAsync();
    }

    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }

    setIsShadowing(false);
    setShadowingComplete(true);
  };

  const playModelAudio = async () => {
    if (!exercise.audioUrl) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (modelSound) {
        await modelSound.replayAsync();
        setIsPlayingModel(true);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: exercise.audioUrl },
          { shouldPlay: true },
          (status: any) => {
            if (status.didJustFinish) {
              setIsPlayingModel(false);
            }
          },
        );
        setModelSound(sound);
        setIsPlayingModel(true);
      }
    } catch (err) {
      console.error("Failed to play model audio", err);
    }
  };

  const playUserRecording = async () => {
    if (!recordedUri) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (userSound) {
        await userSound.replayAsync();
        setIsPlayingUser(true);
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          { shouldPlay: true },
          (status: any) => {
            if (status.didJustFinish) {
              setIsPlayingUser(false);
            }
          },
        );
        setUserSound(sound);
        setIsPlayingUser(true);
      }
    } catch (err) {
      console.error("Failed to play user recording", err);
    }
  };

  const analyzeRecording = async () => {
    if (!recordedUri) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append("audio", {
        uri: recordedUri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any);
      formData.append("target_text", exercise.targetText);
      await appendByopToFormData(formData);

      const response = await fetch(`${API_BASE_URL}/api/v1/analyze`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
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

  const reRecord = () => {
    setRecordedUri(null);
    setShadowingComplete(false);
    setAnalysisResult(null);
    if (userSound) {
      userSound.unloadAsync();
      setUserSound(null);
    }
  };

  const renderRhythmDots = () => {
    const stressPattern = exercise.stressPattern;
    if (!stressPattern || stressPattern.length === 0) return null;

    return (
      <View style={styles.rhythmContainer}>
        <Text style={styles.rhythmTitle}>Rhythm Pattern</Text>
        <View style={styles.rhythmRow}>
          <Text style={styles.rhythmLabel}>Model:</Text>
          <View style={styles.dotsContainer}>
            {stressPattern.map((isStressed, index) => (
              <View
                key={`model-dot-${exercise.id}-${index}`}
                style={[styles.rhythmDot, isStressed ? styles.stressedDot : styles.unstressedDot]}
              />
            ))}
          </View>
        </View>
        {shadowingComplete && (
          <View style={styles.rhythmRow}>
            <Text style={styles.rhythmLabel}>You:</Text>
            <View style={styles.dotsContainer}>
              {stressPattern.map((_, index) => (
                <View
                  key={`user-dot-${exercise.id}-${index}`}
                  style={[styles.rhythmDot, styles.userDot]}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTips = () => {
    return (
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips:</Text>
        {exercise.tips.map((tip, index) => (
          <View key={`tip-${exercise.id}-${index}`} style={styles.tipItem}>
            <Ionicons name="bulb" size={16} color="#FF9500" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting microphone permission...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Microphone permission not granted</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{exercise.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.instructionContainer}>
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.instruction}>{exercise.instruction}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.targetText}>{exercise.targetText}</Text>
          </View>

          {renderRhythmDots()}

          {!shadowingComplete && (
            <View style={styles.shadowingSection}>
              <Text style={styles.sectionTitle}>Shadowing Mode</Text>
              <Text style={styles.sectionSubtitle}>
                {exercise.audioUrl
                  ? "Tap to start speaking along with the model"
                  : "Tap to start recording your speech"}
              </Text>
              <Pressable
                onPress={isShadowing ? stopShadowing : startShadowing}
                style={[styles.shadowButton, isShadowing && styles.shadowButtonActive]}
              >
                <Ionicons name={isShadowing ? "stop" : "mic"} size={40} color="#fff" />
              </Pressable>
              {isShadowing && (
                <Text style={styles.recordingText}>Speak along with the model...</Text>
              )}
            </View>
          )}

          {shadowingComplete && !analysisResult && (
            <View style={styles.playbackSection}>
              <Text style={styles.sectionTitle}>Compare Your Speech</Text>

              <View style={styles.playbackRow}>
                <View style={styles.playbackItem}>
                  <Pressable
                    onPress={playModelAudio}
                    style={[styles.playButton, isPlayingModel && styles.playButtonActive]}
                  >
                    <Ionicons
                      name={isPlayingModel ? "pause" : "play"}
                      size={28}
                      color={isPlayingModel ? "#fff" : "#007AFF"}
                    />
                  </Pressable>
                  <Text style={styles.playbackLabel}>Model</Text>
                </View>

                <View style={styles.playbackItem}>
                  <Pressable
                    onPress={playUserRecording}
                    style={[styles.playButton, isPlayingUser && styles.playButtonActive]}
                  >
                    <Ionicons
                      name={isPlayingUser ? "pause" : "play"}
                      size={28}
                      color={isPlayingUser ? "#fff" : "#007AFF"}
                    />
                  </Pressable>
                  <Text style={styles.playbackLabel}>You</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Pressable onPress={reRecord} style={styles.rerecordButton}>
                  <Ionicons name="refresh" size={20} color="#FF3B30" />
                  <Text style={styles.rerecordText}>Re-record</Text>
                </Pressable>
                <Pressable onPress={analyzeRecording} style={styles.analyzeButton}>
                  <Text style={styles.analyzeText}>Get Feedback</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          )}

          {isAnalyzing && <FeedbackCard result={null} isLoading={true} />}

          {analysisResult && (
            <>
              <FeedbackCard result={analysisResult} />
              {renderTips()}
              <Pressable
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
              </Pressable>
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
  textContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  targetText: {
    fontSize: 22,
    lineHeight: 32,
    color: "#000",
    textAlign: "center",
    fontWeight: "500",
  },
  rhythmContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  rhythmTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  rhythmRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rhythmLabel: {
    width: 60,
    fontSize: 14,
    color: "#8E8E93",
  },
  dotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rhythmDot: {
    borderRadius: 4,
  },
  stressedDot: {
    width: 16,
    height: 24,
    backgroundColor: "#007AFF",
  },
  unstressedDot: {
    width: 12,
    height: 16,
    backgroundColor: "#E5E5EA",
    alignSelf: "flex-end",
  },
  userDot: {
    width: 14,
    height: 20,
    backgroundColor: "#34C759",
  },
  shadowingSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 20,
    textAlign: "center",
  },
  shadowButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  shadowButtonActive: {
    backgroundColor: "#FF3B30",
    shadowColor: "#FF3B30",
  },
  recordingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "600",
  },
  playbackSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  playbackRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  playbackItem: {
    alignItems: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E3F2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  playButtonActive: {
    backgroundColor: "#007AFF",
  },
  playbackLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  rerecordButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
  },
  rerecordText: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "600",
  },
  analyzeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  analyzeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
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
