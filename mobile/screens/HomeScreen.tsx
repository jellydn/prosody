import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CURRICULUM_BY_DAY } from "../assets/curriculum";
import { API_BASE_URL } from "../config/api";
import type { Exercise, ExerciseScores, ExerciseType, HomeStackParamList } from "./ExerciseScreen";

type DayData = {
  day: number;
  theme: string;
  exercises: Exercise[];
};

type ProgressSummaryResponse = {
  streak?: number;
  average_score?: number | null;
  averages?: Record<string, number>;
};

const EXERCISE_ICONS: Record<ExerciseType, string> = {
  stress: "volume-high",
  linking: "link",
  chunk: "albums",
  shadow: "mic",
  intonation: "trending-up",
};

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ route }: HomeScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [currentDay, setCurrentDay] = useState<DayData | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [sessionScores, setSessionScores] = useState<
    Array<{
      exerciseId: string;
      rhythm_score: number;
      stress_score: number;
      pacing_score: number;
      intonation_score: number;
    }>
  >([]);
  const [streak, setStreak] = useState<number>(0);
  const [previousAverage, setPreviousAverage] = useState<number | undefined>(undefined);
  const [lastCompletedAtHandled, setLastCompletedAtHandled] = useState<number | null>(null);

  const loadProgress = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        await AsyncStorage.multiRemove(["userProfile", "userId"]);
        const rootNavigation = navigation.getParent()?.getParent();
        rootNavigation?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Onboarding" }],
          }),
        );
        return;
      }

      const [summaryResponse, sessionsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/progress/${userId}/summary`),
        fetch(`${API_BASE_URL}/api/v1/progress/${userId}`),
      ]);

      if (summaryResponse.ok) {
        const data = (await summaryResponse.json()) as ProgressSummaryResponse;
        setStreak(data.streak || 0);

        const fallbackAverage =
          data.averages && Object.keys(data.averages).length > 0
            ? Object.values(data.averages).reduce((acc, value) => acc + value, 0) /
              Object.values(data.averages).length
            : undefined;
        const averageScore =
          typeof data.average_score === "number" ? data.average_score : fallbackAverage;

        if (averageScore !== undefined) {
          setPreviousAverage(averageScore);
        }
      }

      let dayToLoad = 1;

      if (route.params?.selectedDay && route.params.selectedDay in CURRICULUM_BY_DAY) {
        dayToLoad = route.params.selectedDay;
      } else if (sessionsResponse.ok) {
        const sessions = (await sessionsResponse.json()) as Array<{
          day: number;
        }>;
        const completedDays = new Set(sessions.map((session) => session.day));
        const highestCompletedDay =
          completedDays.size > 0 ? Math.max(...Array.from(completedDays)) : 0;
        const nextDay = Math.min(highestCompletedDay + 1, 14);
        dayToLoad = nextDay;
      }

      setCurrentDay(CURRICULUM_BY_DAY[dayToLoad as keyof typeof CURRICULUM_BY_DAY] as DayData);
    } catch (err) {
      console.error("Error loading progress:", err);
      setCurrentDay(CURRICULUM_BY_DAY[1] as DayData);
    }
  }, [navigation, route.params?.selectedDay]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleExerciseComplete = useCallback((exerciseId: string, scores: ExerciseScores) => {
    setSessionScores((prev) => [...prev, { exerciseId, ...scores }]);
  }, []);

  useEffect(() => {
    const completedExercise = route.params?.completedExercise;
    const completedAt = route.params?.completedAt;

    if (!completedExercise || !completedAt || completedAt === lastCompletedAtHandled) {
      return;
    }

    setCompletedExercises((prev) => new Set(prev).add(completedExercise.exerciseId));
    handleExerciseComplete(completedExercise.exerciseId, completedExercise);
    setLastCompletedAtHandled(completedAt);
    navigation.setParams({
      completedExercise: undefined,
      completedAt: undefined,
    });
  }, [route.params, lastCompletedAtHandled, navigation, handleExerciseComplete]);

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
                    source: "home",
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
