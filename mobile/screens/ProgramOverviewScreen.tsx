import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_BASE_URL } from "../config/api";
import type { HomeStackParamList } from "./ExerciseScreen";

export type ProgramOverviewScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  "ProgramOverview"
>;

interface DayCardData {
  day: number;
  theme: string;
  isCompleted: boolean;
  isLocked: boolean;
}

const THEMES: Record<number, string> = {
  1: "Word Stress Basics",
  2: "Linking Words Together",
  3: "Speaking in Chunks",
  4: "Shadowing Practice",
  5: "Advanced Shadowing",
  6: "Meeting Scenarios",
  7: "Professional Phrases",
  8: "Mixed Drills I",
  9: "Mixed Drills II",
  10: "Mixed Drills III",
  11: "Advanced Linking",
  12: "Word Reductions",
  13: "Natural Speech",
  14: "Final Review",
};

export default function ProgramOverviewScreen({ navigation }: ProgramOverviewScreenProps) {
  const [days, setDays] = useState<DayCardData[]>([]);
  const [maxUnlockedDay, setMaxUnlockedDay] = useState<number>(1);

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

      const response = await fetch(`${API_BASE_URL}/api/v1/progress/${userId}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const completedDays = new Set<number>(data.map((session: { day: number }) => session.day));

      const maxDay = completedDays.size > 0 ? Math.max(...completedDays) + 1 : 1;
      setMaxUnlockedDay(Math.min(maxDay, 14));

      const dayCards: DayCardData[] = Array.from({ length: 14 }, (_, i) => {
        const dayNum = i + 1;
        return {
          day: dayNum,
          theme: THEMES[dayNum] || `Day ${dayNum}`,
          isCompleted: completedDays.has(dayNum),
          isLocked: dayNum > maxDay,
        };
      });

      setDays(dayCards);
    } catch (err) {
      console.error("Error loading progress:", err);
    }
  }, [navigation]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleDayPress = useCallback(
    (dayCard: DayCardData) => {
      if (dayCard.isLocked) {
        Alert.alert(
          "Day Locked",
          "Complete previous days to unlock this one. Do you want to skip anyway?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Skip",
              style: "destructive",
              onPress: () => {
                navigation.navigate("HomeMain", { selectedDay: dayCard.day });
              },
            },
          ],
        );
        return;
      }

      if (dayCard.isCompleted) {
        Alert.alert("Day Completed", "You've already completed this day.");
        return;
      }

      navigation.navigate("HomeMain", { selectedDay: dayCard.day });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>14-Day Program</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.subtitle}>Track your progress through the complete program</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{maxUnlockedDay}</Text>
            <Text style={styles.statLabel}>Unlocked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{days.filter((d) => d.isCompleted).length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>14</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        <View style={styles.daysContainer}>
          {days.map((dayCard) => (
            <TouchableOpacity
              key={dayCard.day}
              style={[
                styles.dayCard,
                dayCard.isCompleted && styles.dayCardCompleted,
                dayCard.isLocked && styles.dayCardLocked,
              ]}
              onPress={() => handleDayPress(dayCard)}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayNumber}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      dayCard.isCompleted && styles.dayNumberTextCompleted,
                      dayCard.isLocked && styles.dayNumberTextLocked,
                    ]}
                  >
                    {dayCard.day}
                  </Text>
                </View>
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayTheme, dayCard.isLocked && styles.dayThemeLocked]}>
                    {dayCard.theme}
                  </Text>
                  <Text style={styles.dayStatus}>
                    {dayCard.isCompleted
                      ? "Completed"
                      : dayCard.isLocked
                        ? "Locked"
                        : "In Progress"}
                  </Text>
                </View>
                {dayCard.isCompleted && (
                  <Ionicons name="checkmark-circle" size={28} color="#34C759" />
                )}
                {dayCard.isLocked && !dayCard.isCompleted && (
                  <Ionicons name="lock-closed" size={24} color="#8E8E93" />
                )}
              </View>
            </TouchableOpacity>
          ))}
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
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
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
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
  },
  daysContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dayCard: {
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
  dayCardCompleted: {
    borderWidth: 2,
    borderColor: "#34C759",
  },
  dayCardLocked: {
    opacity: 0.6,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dayNumberText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  dayNumberTextCompleted: {
    color: "#34C759",
    backgroundColor: "#E8F5E9",
  },
  dayNumberTextLocked: {
    backgroundColor: "#F2F2F7",
    color: "#8E8E93",
  },
  dayInfo: {
    flex: 1,
  },
  dayTheme: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  dayThemeLocked: {
    color: "#8E8E93",
  },
  dayStatus: {
    fontSize: 14,
    color: "#8E8E93",
  },
});
