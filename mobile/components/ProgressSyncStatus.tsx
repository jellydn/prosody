import { useSyncExternalStore } from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { progressQueue } from "../services/progressSync";

export default function ProgressSyncStatus() {
  const status = useSyncExternalStore(
    progressQueue.subscribe,
    progressQueue.getStatus,
    progressQueue.getStatus,
  );
  return (
    <View style={styles.container}>
      <Text accessibilityLiveRegion="polite" style={styles.text}>
        {status}
      </Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => void progressQueue.sync()}>
        <Text style={styles.retry}>Retry sync</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: "#E3F2FF" },
  text: { color: "#1C1C1E", textAlign: "center" },
  retry: { color: "#005BBB", textAlign: "center", padding: 8, fontWeight: "600" },
});
