import { expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderAsync, screen } from "@testing-library/react-native";
import App from "./App";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({ Navigator: () => null, Screen: () => null }),
}));
jest.mock("./navigation/TabNavigator", () => () => null);
jest.mock("./screens/OnboardingScreen", () => () => null);
jest.mock("./components/ProgressSyncStatus", () => () => null);
jest.mock("./services/progressSync", () => ({ startProgressSync: () => undefined }));

it("contains the approved splash until onboarding storage is ready, without a fixed delay", async () => {
  let finish!: (value: string | null) => void;
  const pending = new Promise<string | null>((resolve) => {
    finish = resolve;
  });
  jest.mocked(AsyncStorage.getItem).mockReturnValue(pending);
  await renderAsync(<App />);

  const splash = screen.getByLabelText("Prosody. Find your rhythm. Loading.");
  expect(splash.props.source).toEqual(require("./assets/splash.png"));
  expect(splash.props.resizeMode).toBe("contain");

  await act(async () => finish(null));
  expect(screen.queryByLabelText("Prosody. Find your rhythm. Loading.")).toBeNull();
});
