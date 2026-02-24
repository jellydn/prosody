import appJson from "./app.json";

const profile = process.env.EAS_BUILD_PROFILE ?? "development";

const appIdsByProfile: Record<string, string> = {
  development: "com.englishrhythmcoach.app",
  production: "com.dunghd.englishrhythmcoach",
  "android-apk": "com.dunghd.englishrhythmcoach",
  "ios-ipa": "com.dunghd.englishrhythmcoach",
  "ios-simulator": "com.englishrhythmcoach.app",
};

const appId = appIdsByProfile[profile] ?? appIdsByProfile.development;

export default {
  ...appJson,
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: appId,
    },
    android: {
      ...appJson.expo.android,
      package: appId,
    },
  },
};
