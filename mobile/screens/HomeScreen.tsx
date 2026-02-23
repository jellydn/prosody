import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import day01Data from "../assets/curriculum/day-01.json";
import type { Exercise, ExerciseType, HomeStackParamList } from "./ExerciseScreen";

type DayData = {
  day: number;
  theme: string;
  exercises: Exercise[];
};

const EXERCISE_ICONS: Record<ExerciseType, string> = {
  stress: "volume-high",
  linking: "link",
  chunk: "albums",
  shadow: "mic",
  intonation: "trending-up",
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [currentDay, setCurrentDay] = useState<DayData | null>(null);
  const [completedExercises, _setCompletedExercises] = useState<Set<string>>(new Set());
  const [sessionScores, setSessionScores] = useState<
    Array<{
      exerciseId: string;
      rhythm_score: number;
      stress_score: number;
      pacing_score: number;
      intonation_score: number;
    }>
  >([]);
  const [streak, setStreak] = useState<number>(5);
  const [previousAverage, setPreviousAverage] = useState<number | undefined>(undefined);

  const loadProgress = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        const response = await fetch(`http://localhost:8000/api/v1/progress/${userId}/summary`);
        if (response.ok) {
          const data = await response.json();
          setStreak(data.streak || 0);

          if (data.average_score !== null) {
            setPreviousAverage(data.average_score);
          }
        }
      }
    } catch (err) {
      console.error("Error loading progress:", err);
    }
  }, []);

  useEffect(() => {
    setCurrentDay(day01Data as DayData);
    loadProgress();
  }, [loadProgress]);

  const handleExerciseComplete = useCallback(
    (
      exerciseId: string,
      scores: {
        rhythm_score: number;
        stress_score: number;
        pacing_score: number;
        intonation_score: number;
      },
    ) => {
      setSessionScores((prev) => [...prev, { exerciseId, ...scores }]);
    },
    [],
  );

  useEffect(() => {
    if (currentDay && sessionScores.length === currentDay.exercises.length) {
      navigation.navigate("SessionCompletion", {
        day: currentDay.day,
        scores: sessionScores,
        streak,
        previousAverage,
      });
    }
  }, [sessionScores, currentDay, navigation, streak, previousAverage]);

  if (!currentDay) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={20} color="#FF6B6B" />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
          <Text style={styles.dayTitle}>Day {currentDay.day} of 14</Text>
          <Text style={styles.themeTitle}>{currentDay.theme}</Text>
          <View style={styles.metaInfo}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" />
            <Text style={styles.metaText}>~10 min</Text>
            <Ionicons name="list-outline" size={16} color="#8E8E93" style={styles.metaIcon} />
            <Text style={styles.metaText}>{currentDay.exercises.length} exercises</Text>
          </View>
          <TouchableOpacity
            style={styles.viewProgramButton}
            onPress={() => navigation.navigate("ProgramOverview")}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.viewProgramText}>View Program</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Today's Exercises</Text>
          {currentDay.exercises.map((exercise) => {
            const isCompleted = completedExercises.has(exercise.id);
            return (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseCard}
                onPress={() =>
                  navigation.navigate("ExerciseScreen", {
                    exercise,
                    onComplete: handleExerciseComplete,
                  })
                }
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIcon}>
                    <Ionicons
                      name={EXERCISE_ICONS[exercise.type] as any}
                      size={24}
                      color="#007AFF"
                    />
                  </View>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <Text style={styles.exerciseType}>
                      {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)}
                    </Text>
                  </View>
                  {isCompleted && <Ionicons name="checkmark-circle" size={24} color="#34C759" />}
                </View>
              </TouchableOpacity>
            );
          })}
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  streakText: {
    marginLeft: 6,
    color: "#FF6B6B",
    fontWeight: "600",
    fontSize: 14,
  },
  dayTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  themeTitle: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    marginLeft: 4,
    color: "#8E8E93",
    fontSize: 14,
  },
  metaIcon: {
    marginLeft: 12,
  },
  viewProgramButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  viewProgramText: {
    marginLeft: 6,
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  exercisesContainer: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  exerciseType: {
    fontSize: 14,
    color: "#8E8E93",
  },
});
