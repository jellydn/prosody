import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import TabNavigator from "./navigation/TabNavigator";

export default function App() {
	return (
		<NavigationContainer>
			<TabNavigator />
		</NavigationContainer>
	);
}
