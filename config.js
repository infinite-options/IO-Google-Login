import { Platform } from "react-native";
import {
  EXPO_PUBLIC_IOS_CLIENT_ID,
  EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG,
  EXPO_PUBLIC_ANDROID_CLIENT_ID_RELEASE,
  EXPO_PUBLIC_WEB_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_URL_SCHEME,
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  EXPO_PUBLIC_PROJECT_ID,
  EXPO_PUBLIC_APP_NAME,
  EXPO_PUBLIC_APP_SLUG,
  EXPO_PUBLIC_BUNDLE_IDENTIFIER,
} from "@env";

console.log("Loading environment variables...");

const ENV = {
  IOS_CLIENT_ID: EXPO_PUBLIC_IOS_CLIENT_ID,
  ANDROID_CLIENT_ID_Debug: EXPO_PUBLIC_ANDROID_CLIENT_ID_DEBUG,
  ANDROID_CLIENT_ID_Release: EXPO_PUBLIC_ANDROID_CLIENT_ID_RELEASE,
  WEB_CLIENT_ID: EXPO_PUBLIC_WEB_CLIENT_ID,
  GOOGLE_URL_SCHEME: EXPO_PUBLIC_GOOGLE_URL_SCHEME,
  GOOGLE_MAPS_API_KEY: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  PROJECT_ID: EXPO_PUBLIC_PROJECT_ID,
  APP_NAME: EXPO_PUBLIC_APP_NAME,
  APP_SLUG: EXPO_PUBLIC_APP_SLUG,
  BUNDLE_IDENTIFIER: EXPO_PUBLIC_BUNDLE_IDENTIFIER,
};

console.log("Environment variables loaded:", ENV);

const checkEnvVariable = (key, value) => {
  if (!value) {
    console.error(`ERROR: ${key} is not defined in .env file`);
  }
};

Object.entries(ENV).forEach(([key, value]) => checkEnvVariable(key, value));

const getGoogleClientId = () => ENV.IOS_CLIENT_ID || "";
const getGoogleURLScheme = () => {
  if (!ENV.IOS_CLIENT_ID) {
    console.error("Cannot generate URL scheme: IOS_CLIENT_ID is undefined");
    return "";
  }
  return `com.googleusercontent.apps.${ENV.IOS_CLIENT_ID.split(".")[0]}`;
};

console.log("Generating URL scheme:", getGoogleURLScheme());
console.log("Bundle Identifier from app.json:", ENV.BUNDLE_IDENTIFIER);
console.log("Expected app.json URL scheme:", ENV.BUNDLE_IDENTIFIER);
console.log("Expected eas.json GOOGLE_URL_SCHEME:", getGoogleURLScheme());

console.log("Loading Maps API key:", ENV.GOOGLE_MAPS_API_KEY);

const getAndroidClientId = () => {
  const clientId = __DEV__ ? ENV.ANDROID_CLIENT_ID_Debug : ENV.ANDROID_CLIENT_ID_Release;

  console.log("Android Environment:", __DEV__ ? "Development" : "Production");
  console.log("Selected Android Client ID:", clientId);
  console.log("Debug Client ID available:", ENV.ANDROID_CLIENT_ID_Debug);
  console.log("Release Client ID available:", ENV.ANDROID_CLIENT_ID_Release);

  return clientId;
};

const config = {
  googleClientIds: {
    ios: ENV.IOS_CLIENT_ID,
    android: getAndroidClientId(),
    web: ENV.WEB_CLIENT_ID,
  },
  googleURLScheme: getGoogleURLScheme(),
  bundleIdentifier: ENV.BUNDLE_IDENTIFIER,
  googleMapsApiKey: ENV.GOOGLE_MAPS_API_KEY,
};

console.log("Exporting config:", config);
console.log("Verify these values match:");
console.log("1. app.json bundleIdentifier:", ENV.BUNDLE_IDENTIFIER);
console.log("2. app.json CFBundleURLSchemes:", ENV.BUNDLE_IDENTIFIER);
console.log("3. eas.json GOOGLE_URL_SCHEME:", getGoogleURLScheme());
console.log("4. Info.plist CFBundleURLSchemes:", getGoogleURLScheme());

console.log("Final Maps configuration:", {
  apiKey: ENV.GOOGLE_MAPS_API_KEY,
  bundleId: ENV.BUNDLE_IDENTIFIER,
});

export default config;
