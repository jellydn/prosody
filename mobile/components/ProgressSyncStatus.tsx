import { useSyncExternalStore } from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { progressQueue } from "../services/progressSync";

export default function ProgressSyncStatus() {
  const status = useSyncExternalStore(
    progressQueue.subscribe,
    progressQueue.getStatus,
    progressQueue.getStatus,
  );
  if (status === "Progress is synced." || status === "Checking progress sync…") return null;

  return (
    <SafeAreaView edges={["top"]}>
      <View style={styles.container}>
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {status}
        </Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => void progressQueue.sync()}>
          <Text style={styles.retry}>Retry sync</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: "#E3F2FF" },
  text: { color: "#1C1C1E", textAlign: "center" },
  retry: { color: "#005BBB", textAlign: "center", padding: 8, fontWeight: "600" },
});
