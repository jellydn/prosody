import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Image, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TabNavigator from "./navigation/TabNavigator";
import OnboardingScreen from "./screens/OnboardingScreen";
import { startProgressSync } from "./services/progressSync";
import ProgressSyncStatus from "./components/ProgressSyncStatus";

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
      const [profile, userId] = await Promise.all([
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("userId"),
      ]);

      const isSetupComplete = profile !== null && userId !== null;
      setHasCompletedOnboarding(isSetupComplete);

      if (profile !== null && userId === null) {
        await AsyncStorage.removeItem("userProfile");
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  useEffect(startProgressSync, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#100b50" }}>
        <Image
          source={require("./assets/splash.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
          accessibilityLabel="Prosody. Find your rhythm. Loading."
        />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ProgressSyncStatus />
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={hasCompletedOnboarding ? "Main" : "Onboarding"}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
