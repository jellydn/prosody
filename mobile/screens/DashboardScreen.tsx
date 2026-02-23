import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

interface ProgressSummary {
  streak: number;
  averages: {
    rhythm: number;
    stress: number;
    pacing: number;
    intonation: number;
  };
  total_sessions: number;
  trend: string;
}

interface SessionResult {
  id: number;
  user_id: number;
  day: number;
  exercises_completed: number;
  rhythm_score: number;
  stress_score: number;
  pacing_score: number;
  intonation_score: number;
  completed_at: string;
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [chartView, setChartView] = useState<"daily" | "weekly">("daily");
  const [userId, setUserId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const savedUserId = await AsyncStorage.getItem("userId");
      if (!savedUserId) {
        setLoading(false);
        return;
      }
      setUserId(parseInt(savedUserId, 10));

      const [summaryRes, sessionsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/progress/${savedUserId}/summary`),
        fetch(`http://localhost:8000/api/v1/progress/${savedUserId}`),
      ]);

      if (summaryRes.ok && sessionsRes.ok) {
        const summaryData = await summaryRes.json();
        const sessionsData = await sessionsRes.json();
        setSummary(summaryData);
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getChartData = () => {
    if (!sessions.length) {
      return { labels: [], datasets: [{ data: [] }] };
    }

    let dataSessions: SessionResult[] = [];

    if (chartView === "daily") {
      dataSessions = sessions;
    } else {
      dataSessions = sessions.filter((_, index) => index % 7 === 0);
      if (
        sessions.length > 0 &&
        dataSessions[dataSessions.length - 1]?.day !== sessions[sessions.length - 1].day
      ) {
        dataSessions.push(sessions[sessions.length - 1]);
      }
    }

    return {
      labels: dataSessions.map((s) => `Day ${s.day}`),
      datasets: [
        {
          data: dataSessions.map((s) => s.rhythm_score),
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const getOverallAverage = () => {
    if (!summary) return 0;
    const values = Object.values(summary.averages);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const getTrendIcon = () => {
    if (!summary) return null;
    switch (summary.trend) {
      case "Improving":
        return <Ionicons name="trending-up" size={20} color="#34C759" />;
      case "Declining":
        return <Ionicons name="trending-down" size={20} color="#FF3B30" />;
      default:
        return <Ionicons name="remove" size={20} color="#8E8E93" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Please complete onboarding first</Text>
      </View>
    );
  }

  if (!summary || sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="bar-chart-outline" size={64} color="#C7C7CC" />
        <Text style={styles.emptyText}>No progress data yet</Text>
        <Text style={styles.subText}>Complete your first session to see your stats</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Your Progress</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
          <Text style={styles.statValue}>{summary.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.statValue}>{summary.total_sessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#FFD60A" />
          <Text style={styles.statValue}>{getOverallAverage().toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      <View style={styles.trendRow}>
        <Text style={styles.trendText}>Trend: {summary.trend}</Text>
        {getTrendIcon()}
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Rhythm Progress</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, chartView === "daily" && styles.toggleButtonActive]}
              onPress={() => setChartView("daily")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  chartView === "daily" && styles.toggleButtonTextActive,
                ]}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, chartView === "weekly" && styles.toggleButtonActive]}
              onPress={() => setChartView("weekly")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  chartView === "weekly" && styles.toggleButtonTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <LineChart
          data={getChartData()}
          width={screenWidth - 48}
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: "4", strokeWidth: "2", stroke: "#007AFF" },
          }}
          bezier
          style={styles.chart}
          withDots={true}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          yAxisLabel=""
          yAxisSuffix=""
          yAxisInterval={1}
          segments={5}
        />
      </View>

      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Score Breakdown</Text>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCard}>
            <Ionicons name="musical-notes" size={24} color="#007AFF" />
            <Text style={styles.breakdownValue}>{summary.averages.rhythm.toFixed(1)}</Text>
            <Text style={styles.breakdownLabel}>Rhythm</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Ionicons name="volume-high" size={24} color="#FF9500" />
            <Text style={styles.breakdownValue}>{summary.averages.stress.toFixed(1)}</Text>
            <Text style={styles.breakdownLabel}>Stress</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Ionicons name="timer" size={24} color="#34C759" />
            <Text style={styles.breakdownValue}>{summary.averages.pacing.toFixed(1)}</Text>
            <Text style={styles.breakdownLabel}>Pacing</Text>
          </View>
          <View style={styles.breakdownCard}>
            <Ionicons name="trending-up" size={24} color="#AF52DE" />
            <Text style={styles.breakdownValue}>{summary.averages.intonation.toFixed(1)}</Text>
            <Text style={styles.breakdownLabel}>Intonation</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 16,
  },
  subText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  trendText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#fff",
  },
  toggleButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8E8E93",
  },
  toggleButtonTextActive: {
    color: "#000",
  },
  chart: {
    borderRadius: 16,
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  breakdownCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    margin: "1%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
  },
  breakdownLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
});
