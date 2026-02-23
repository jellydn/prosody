import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import TabNavigator from "./navigation/TabNavigator";
import OnboardingScreen from "./screens/OnboardingScreen";

const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const profile = await AsyncStorage.getItem("userProfile");
      setHasCompletedOnboarding(profile !== null);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    LogBox.ignoreLogs([
      "[expo-av]: Expo AV has been deprecated and will be removed in SDK 54.",
    ]);
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {hasCompletedOnboarding ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
