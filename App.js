import "./polyfills";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import config from "./config";
import MapScreen from "./screens/MapScreen";
import Constants from "expo-constants";
import AppleSignIn from "./AppleSignIn";

console.log("App.js - Imported config:", config);

// Get Maps API Key from environment variables and export it for use in other components
export const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const mapsApiKeyDisplay = mapsApiKey ? "..." + mapsApiKey.slice(-4) : "Not set";

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [appleAuthStatus, setAppleAuthStatus] = useState("Checking...");

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("Configuring Google Sign-In...");
        console.log("Environment:", __DEV__ ? "Development" : "Production");

        console.log("Using client IDs:", {
          ios: config.googleClientIds.ios,
          android: config.googleClientIds.android,
          web: config.googleClientIds.web,
        });

        console.log("Using URL scheme:", config.googleURLScheme);

        const googleConfig = {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
          offlineAccess: true,
        };
        console.log("Google Sign-In configuration:", googleConfig);

        await GoogleSignin.configure(googleConfig);
        console.log("Google Sign-In configured successfully");

        // Sign out any existing user on app start
        await GoogleSignin.signOut();
        setUserInfo(null);
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
        setError(error.message);
      }
    };

    initialize();
  }, []);

  const handleSignIn = (userInfo) => {
    setUserInfo(userInfo);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const signIn = async () => {
    try {
      console.log("Starting Google Sign-In process...");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("Sign-in successful:", userInfo);
      handleSignIn(userInfo);
    } catch (error) {
      console.error("Sign-in error:", error);
      handleError(error.message);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      await GoogleSignin.signOut();
      console.log("Sign-out successful");
      setUserInfo(null);
      setError(null);
    } catch (error) {
      console.error("Sign-out error:", error);
      setError(error.message);
    }
  };

  // Helper function to extract the last two digits before .apps.googleusercontent.com
  const getLastTwoDigits = (clientId) => {
    if (!clientId) return "Not set";

    // Extract the part before .apps.googleusercontent.com
    const match = clientId.match(/(.+)\.apps\.googleusercontent\.com$/);
    if (match) {
      const idPart = match[1];
      // Get the last two digits of the ID part
      return "..." + idPart.slice(-2);
    }

    // Fallback if the pattern doesn't match
    return "..." + clientId.slice(-2);
  };

  console.log("Full URL Scheme:", config.googleURLScheme);
  console.log("URL Scheme exists:", !!config.googleURLScheme);

  return (
    <View style={styles.container}>
      {!userInfo ? (
        <>
          <Text style={styles.title}>Sign In</Text>
          {error && <Text style={styles.error}>Error: {error}</Text>}
          <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={signIn} />
          <AppleSignIn onSignIn={handleSignIn} onError={handleError} />

          <View style={styles.apiKeysContainer}>
            <Text style={styles.apiKeysTitle}>API Keys (Last 2 Digits):</Text>
            <Text style={styles.apiKeysText}>iOS: {getLastTwoDigits(config.googleClientIds.ios)}</Text>
            <Text style={styles.apiKeysText}>Android: {getLastTwoDigits(config.googleClientIds.android)}</Text>
            <Text style={styles.apiKeysText}>Web: {getLastTwoDigits(config.googleClientIds.web)}</Text>
            <Text style={styles.apiKeysText}>URL Scheme: {config.googleURLScheme ? "..." + config.googleURLScheme.slice(-2) : "Not set"}</Text>
            <Text style={styles.apiKeysText}>Maps API: {mapsApiKeyDisplay}</Text>
            <Text style={styles.apiKeysText}>Apple Auth: {appleAuthStatus}</Text>
            <Text style={styles.apiKeysText}>Environment: {__DEV__ ? "Development" : "Production"}</Text>
          </View>
        </>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Text>Welcome {userInfo.user.name}</Text>
          </View>
          <MapScreen onLogout={signOut} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  googleButton: {
    width: 192,
    height: 48,
    marginTop: 20,
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
  },
  apiKeysContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    top: "60%", // Position below the title
    width: "90%",
  },
});
