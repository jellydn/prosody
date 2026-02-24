import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Logo } from "../components/Logo";
import { API_BASE_URL } from "../config/api";

const NATIVE_LANGUAGES = [
  { code: "vi", name: "Vietnamese" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "hi", name: "Hindi" },
] as const;

const ENGLISH_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const GOALS = [
  { value: "meetings", label: "Meetings" },
  { value: "presentations", label: "Presentations" },
  { value: "confidence", label: "General confidence" },
] as const;

type NativeLanguage = (typeof NATIVE_LANGUAGES)[number]["code"];
type EnglishLevel = (typeof ENGLISH_LEVELS)[number]["value"];
type Goal = (typeof GOALS)[number]["value"];

interface UserProfile {
  nativeLanguage: NativeLanguage;
  englishLevel: EnglishLevel;
  goal: Goal;
}

type OnboardingScreenProps = NativeStackScreenProps<{
  Onboarding: undefined;
  Main: undefined;
}>;

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage>("vi");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = englishLevel !== null && goal !== null;

  const handleComplete = async () => {
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const profile: UserProfile = {
        nativeLanguage,
        englishLevel: englishLevel!,
        goal: goal!,
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          native_language: profile.nativeLanguage,
          english_level: profile.englishLevel,
          goal: profile.goal,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.multiSet([
          ["userProfile", JSON.stringify(profile)],
          ["userId", data.user_id.toString()],
        ]);
        navigation.replace("Main");
      } else {
        throw new Error("Failed to create profile");
      }
    } catch (error) {
      await AsyncStorage.multiRemove(["userProfile", "userId"]);
      Alert.alert("Error", "Failed to complete setup. Please try again.", [{ text: "OK" }]);
      console.error("Onboarding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Logo size={48} />
          </View>
          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>Let's personalize your English rhythm training</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Native Language</Text>
          <View style={styles.optionContainer}>
            {NATIVE_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.option, nativeLanguage === lang.code && styles.optionSelected]}
                onPress={() => setNativeLanguage(lang.code)}
              >
                <Text
                  style={[
                    styles.optionText,
                    nativeLanguage === lang.code && styles.optionTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>English Level</Text>
          <View style={styles.optionContainer}>
            {ENGLISH_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[styles.option, englishLevel === level.value && styles.optionSelected]}
                onPress={() => setEnglishLevel(level.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    englishLevel === level.value && styles.optionTextSelected,
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Goal</Text>
          <View style={styles.optionContainer}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.option, goal === g.value && styles.optionSelected]}
                onPress={() => setGoal(g.value)}
              >
                <Text style={[styles.optionText, goal === g.value && styles.optionTextSelected]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.completeButton,
            (!isFormValid || isLoading) && styles.completeButtonDisabled,
          ]}
          onPress={handleComplete}
          disabled={!isFormValid || isLoading}
        >
          <Text
            style={[
              styles.completeButtonText,
              (!isFormValid || isLoading) && styles.completeButtonTextDisabled,
            ]}
          >
            {isLoading ? "Setting up..." : "Get Started"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    minWidth: 100,
    alignItems: "center",
  },
  optionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  optionTextSelected: {
    color: "#fff",
  },
  completeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  completeButtonDisabled: {
    backgroundColor: "#B3D7FF",
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  completeButtonTextDisabled: {
    color: "#fff",
    opacity: 0.6,
  },
});
