import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExportedConfig } from "expo/config-plugins";
import withIosScenes from "../plugins/withIosScenes";

const baseConfig = { name: "Prosody", slug: "prosody" };
const modRequest = {
  projectRoot: "/fixture",
  platformProjectRoot: "/fixture/ios",
  platform: "ios" as const,
  introspect: true,
};

const appDelegate = `import Expo
@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  func start() {
    reactNativeFactory = factory
#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
// User customization must remain intact.
`;

async function applyDelegate(contents: string, language: "swift" | "objc" = "swift") {
  const config: ExportedConfig = withIosScenes(baseConfig);
  assert.ok(config.mods?.ios?.appDelegate);
  const result = await config.mods.ios.appDelegate({
    ...baseConfig,
    modRawConfig: baseConfig,
    modRequest: { ...modRequest, modName: "appDelegate" },
    modResults: { contents, language, path: "/fixture/ios/AppDelegate.swift" },
  });
  return result.modResults.contents;
}

test("moves startup to a single scene-owned window and preserves AppDelegate customization", async () => {
  const result = await applyDelegate(appDelegate);
  assert.ok(!result.includes("UIWindow(frame: UIScreen.main.bounds)"));
  assert.equal(result.match(/factory.startReactNative\(/g)?.length, 1);
  assert.ok(result.includes("UIWindow(windowScene: windowScene)"));
  assert.ok(result.includes("appDelegate.window = window"));
  assert.ok(result.includes("reactNativeFactory = factory"));
  assert.ok(result.includes("User customization must remain intact."));
  assert.ok(
    result.includes("super.application(application, didFinishLaunchingWithOptions: launchOptions)"),
  );
  assert.equal(await applyDelegate(result), result);
});

test("sets the matching Objective-C scene class without changing other plist values", async () => {
  const config: ExportedConfig = withIosScenes(baseConfig);
  assert.ok(config.mods?.ios?.infoPlist);
  const result = await config.mods.ios.infoPlist({
    ...baseConfig,
    modRawConfig: baseConfig,
    modRequest: { ...modRequest, modName: "infoPlist" },
    modResults: {
      UILaunchStoryboardName: "SplashScreen",
      NSMicrophoneUsageDescription: "Record practice",
    },
  });
  assert.equal(result.modResults.UILaunchStoryboardName, "SplashScreen");
  assert.equal(result.modResults.NSMicrophoneUsageDescription, "Record practice");
  assert.deepEqual(result.modResults.UIApplicationSceneManifest, {
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [
        {
          UISceneConfigurationName: "Default Configuration",
          UISceneDelegateClassName: "SceneDelegate",
        },
      ],
    },
  });
  assert.ok((await applyDelegate(appDelegate)).includes("@objc(SceneDelegate)"));
});

test("fails explicitly rather than silently applying to a different native template", async () => {
  await assert.rejects(applyDelegate("class AppDelegate {}"), /startup changed/);
  await assert.rejects(applyDelegate(appDelegate, "objc"), /Swift AppDelegate/);
});
