import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEventAsync, renderAsync, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { Alert } from "react-native";
import OnboardingScreen from "./OnboardingScreen";

jest.mock("../components/Logo", () => ({ Logo: () => null }));
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const replace = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

async function renderOnboarding() {
  const props = { navigation: { replace } } as unknown as ComponentProps<typeof OnboardingScreen>;
  await renderAsync(<OnboardingScreen {...props} />);
}

async function selectProfile() {
  await fireEventAsync.press(screen.getByText("Spanish"));
  await fireEventAsync.press(screen.getByText("Advanced"));
  await fireEventAsync.press(screen.getByText("Presentations"));
}

it("does not submit an incomplete profile", async () => {
  global.fetch = jest.fn();
  await renderOnboarding();
  expect(screen.getByText("Get Started")).toBeDisabled();
  await fireEventAsync.press(screen.getByText("Get Started"));
  expect(global.fetch).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

it("saves the returned identity and selected profile before entering the app", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ user_id: 73 }) });
  await renderOnboarding();
  await selectProfile();
  await fireEventAsync.press(screen.getByText("Get Started"));

  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining("/api/v1/users"),
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({
        native_language: "es",
        english_level: "advanced",
        goal: "presentations",
      }),
    }),
  );
  expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
    [
      "userProfile",
      JSON.stringify({ nativeLanguage: "es", englishLevel: "advanced", goal: "presentations" }),
    ],
    ["userId", "73"],
  ]);
  expect(replace).toHaveBeenCalledWith("Main");
});

it("clears partial setup and stays on onboarding after a failed request", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
  await renderOnboarding();
  await selectProfile();
  await fireEventAsync.press(screen.getByText("Get Started"));

  expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(["userProfile", "userId"]);
  expect(AsyncStorage.multiSet).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to complete setup. Please try again.", [
    { text: "OK" },
  ]);
  expect(screen.getByText("Get Started")).toBeEnabled();
});
