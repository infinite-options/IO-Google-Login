import { Platform } from "react-native";

console.log("Loading environment variables...");
const ENV = {
  IOS_CLIENT_ID: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
  ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  WEB_CLIENT_ID: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
};
console.log("Environment variables loaded:", ENV);

if (!ENV.IOS_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_IOS_CLIENT_ID is not defined in .env file");
}
if (!ENV.ANDROID_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_ANDROID_CLIENT_ID is not defined in .env file");
}
if (!ENV.WEB_CLIENT_ID) {
  console.error("ERROR: EXPO_PUBLIC_WEB_CLIENT_ID is not defined in .env file");
}

const getGoogleClientId = () => ENV.IOS_CLIENT_ID || "";
const getGoogleURLScheme = () => {
  if (!ENV.IOS_CLIENT_ID) {
    console.error("Cannot generate URL scheme: IOS_CLIENT_ID is undefined");
    return "";
  }
  return `com.googleusercontent.apps.${ENV.IOS_CLIENT_ID.split(".")[0]}`;
};

console.log("Generating URL scheme:", getGoogleURLScheme());
console.log("Expected app.json URL scheme:", "$(PRODUCT_BUNDLE_IDENTIFIER)");
console.log("Expected eas.json GOOGLE_URL_SCHEME:", getGoogleURLScheme());

const config = {
  googleClientIds: {
    ios: ENV.IOS_CLIENT_ID,
    android: ENV.ANDROID_CLIENT_ID,
    web: ENV.WEB_CLIENT_ID,
  },
  googleURLScheme: getGoogleURLScheme(),
};

console.log("Exporting config:", config);
console.log("Verify these values match:");
console.log("1. app.json CFBundleURLSchemes:", "$(PRODUCT_BUNDLE_IDENTIFIER)");
console.log("2. eas.json GOOGLE_URL_SCHEME:", getGoogleURLScheme());
console.log("3. Info.plist CFBundleURLSchemes:", getGoogleURLScheme());

export default config;
