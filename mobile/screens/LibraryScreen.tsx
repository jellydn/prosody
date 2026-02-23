import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Exercise, ExerciseScreenParams } from "./ExerciseScreen";

interface MeetingPhrase {
  id: string;
  category: string;
  text: string;
  audioUrl: string | null;
}

interface MeetingsData {
  phrases: MeetingPhrase[];
}

export type LibraryStackParamList = {
  LibraryMain: undefined;
  ExerciseScreen: ExerciseScreenParams;
};

type LibraryScreenProps = NativeStackScreenProps<LibraryStackParamList, "LibraryMain">;

interface Category {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const categories: Category[] = [
  { key: "updates", title: "Updates", icon: "list-outline", color: "#007AFF" },
  {
    key: "opinions",
    title: "Opinions",
    icon: "chatbubble-outline",
    color: "#FF9500",
  },
  {
    key: "clarifications",
    title: "Clarifications",
    icon: "help-circle-outline",
    color: "#34C759",
  },
  {
    key: "presenting",
    title: "Presenting",
    icon: "mic-outline",
    color: "#AF52DE",
  },
];

export default function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [meetingsData, setMeetingsData] = useState<MeetingsData | null>(null);
  const [expandedPhraseId, setExpandedPhraseId] = useState<string | null>(null);

  useEffect(() => {
    const loadMeetingsData = async () => {
      try {
        const data = require("../assets/phrases/meetings.json") as MeetingsData;
        setMeetingsData(data);
      } catch (error) {
        console.error("Failed to load meeting phrases:", error);
        Alert.alert("Error", "Failed to load meeting phrases");
      }
    };
    loadMeetingsData();
  }, []);

  const handlePractice = (phrase: MeetingPhrase) => {
    const exercise: Exercise = {
      id: phrase.id,
      type: "shadow",
      title: `Meeting Phrase - ${phrase.category}`,
      instruction: `Practice this common meeting phrase for ${phrase.category}. Listen to the example, then speak along to match the rhythm and intonation.`,
      targetText: phrase.text,
      audioUrl: phrase.audioUrl,
      tips: [
        "Focus on the natural rhythm of professional speech",
        "Pay attention to stress on key words",
        "Keep your tone professional and confident",
      ],
    };

    navigation.navigate("ExerciseScreen", { exercise, source: "library" });
  };

  const togglePhrase = (phraseId: string) => {
    setExpandedPhraseId(expandedPhraseId === phraseId ? null : phraseId);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Meeting Phrases</Text>
          <Text style={styles.subtitle}>Practice common workplace expressions</Text>
        </View>

        {meetingsData &&
          categories.map((category) => {
            const categoryPhrases = meetingsData.phrases.filter((p) => p.category === category.key);
            return (
              <View key={category.key} style={styles.categorySection}>
                <View style={[styles.categoryHeader, { borderLeftColor: category.color }]}>
                  <Ionicons name={category.icon} size={20} color={category.color} />
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryCount}>{categoryPhrases.length}</Text>
                </View>

                {categoryPhrases.map((phrase) => (
                  <View key={phrase.id} style={styles.phraseCard}>
                    <TouchableOpacity
                      style={styles.phraseHeader}
                      onPress={() => togglePhrase(phrase.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.phraseTextContainer}>
                        <Text style={styles.phraseText}>{phrase.text}</Text>
                      </View>
                      <Ionicons
                        name={expandedPhraseId === phrase.id ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>

                    {expandedPhraseId === phrase.id && (
                      <View style={styles.expandedContent}>
                        <TouchableOpacity
                          style={[styles.practiceButton, { backgroundColor: category.color }]}
                          onPress={() => handlePractice(phrase)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="mic-outline" size={18} color="#fff" />
                          <Text style={styles.practiceButtonText}>Practice</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  categorySection: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginLeft: 12,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8E8E93",
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phraseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  phraseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  phraseTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  phraseText: {
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  practiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  practiceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
