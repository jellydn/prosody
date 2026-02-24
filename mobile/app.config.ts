import appJson from "./app.json";

const profile = process.env.EAS_BUILD_PROFILE ?? "development";

const appIdsByProfile = {
  development: "com.englishrhythmcoach.app",
  production: "com.dunghd.englishrhythmcoach",
  "android-apk": "com.dunghd.englishrhythmcoach",
  "ios-ipa": "com.dunghd.englishrhythmcoach",
  "ios-simulator": "com.englishrhythmcoach.app",
} as const;

const appId = appIdsByProfile[profile as keyof typeof appIdsByProfile];

if (!appId) {
  const validProfiles = Object.keys(appIdsByProfile).join(", ");
  throw new Error(`Unknown EAS_BUILD_PROFILE: ${profile}. Expected one of: ${validProfiles}`);
}

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
