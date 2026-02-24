import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";

export type IconName = keyof typeof Ionicons.glyphMap;

export default function TabBarIcon({
	name,
	focused,
}: {
	name: IconName;
	focused: boolean;
}) {
	return (
		<Ionicons
			name={name}
			size={focused ? 28 : 24}
			color={focused ? "#007AFF" : "#8E8E93"}
			style={styles.icon}
		/>
	);
}

const styles = StyleSheet.create({
	icon: {
		marginBottom: -3,
	},
});
