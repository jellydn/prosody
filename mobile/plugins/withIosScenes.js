const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

const legacyStartup = `    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)`;
const sceneStartup = "    // React Native starts when SceneDelegate connects its UIWindowScene.";
const begin = "// @generated begin prosody-ios-scenes";
const end = "// @generated end prosody-ios-scenes";

module.exports = function withIosScenes(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "SceneDelegate",
          },
        ],
      },
    };
    return config;
  });

  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== "swift") {
      throw new Error("withIosScenes requires the Expo SDK 55 Swift AppDelegate.");
    }
    let contents = config.modResults.contents;
    if (!contents.includes(legacyStartup) && !contents.includes(sceneStartup)) {
      throw new Error(
        "AppDelegate startup changed. Review the iOS scene migration before prebuilding.",
      );
    }
    contents = contents.replace(legacyStartup, sceneStartup);
    contents = contents.replace(
      /\n\/\/ @generated begin prosody-ios-scenes[\s\S]*?\/\/ @generated end prosody-ios-scenes\n?/g,
      "",
    );
    const sceneDelegate = readFileSync(join(__dirname, "SceneDelegate.swift"), "utf8");
    config.modResults.contents = `${contents.trimEnd()}\n\n${begin}\n${sceneDelegate}${end}\n`;
    return config;
  });
};
