import "./polyfills";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import config from "./config";
import MapScreen from "./screens/MapScreen";
import LoginSuccess from "./screens/LoginSuccess";
import Constants from "expo-constants";
import AppleSignIn from "./AppleSignIn";

console.log("App.js - Imported config:", config);

// Get Maps API Key from environment variables and export it for use in other components
export const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const mapsApiKeyDisplay = mapsApiKey ? "..." + mapsApiKey.slice(-4) : "Not set";

export default function App() {
  console.log("------- Program Starting in App.js -------");
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [appleAuthStatus, setAppleAuthStatus] = useState("Checking...");
  const [isInitializing, setIsInitializing] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        if (!isMounted) return;

        console.log("Configuring Google Sign-In...");
        console.log("Environment:", __DEV__ ? "Development" : "Production");

        // Add a small delay to ensure the app is fully loaded
        await new Promise((resolve) => setTimeout(resolve, 1000));

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
        if (isMounted) {
          setUserInfo(null);
          setIsInitializing(false);
        }
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
        if (isMounted) {
          setError(error.message);
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignIn = (userInfo) => {
    setUserInfo(userInfo);
    setError(null);
    setShowMap(false); // Reset map state when signing in
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
      console.log("Sign-in successful:", userInfo.user);
      console.log("Sign-in successful:", userInfo.user.name);
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

  // Helper function to extract the first four digits/letters of the unique part before .apps.googleusercontent.com
  const getFirstFourDigits = (clientId) => {
    if (!clientId) return "Not set";

    // Extract the part before .apps.googleusercontent.com
    const match = clientId.match(/([\w-]+)-([\w]+)\.apps\.googleusercontent\.com$/);
    if (match) {
      const uniquePart = match[2];
      return uniquePart.slice(0, 4);
    }

    // Fallback: try to extract the part after the first hyphen
    const fallback = clientId.split("-")[1];
    if (fallback) {
      return fallback.slice(0, 4);
    }

    return "Not found";
  };

  console.log("Full URL Scheme:", config.googleURLScheme);
  console.log("URL Scheme exists:", !!config.googleURLScheme);

  const handleNavigateToMap = useCallback(() => {
    try {
      console.log("Navigating to map set to true...");
      setShowMap(true);
    } catch (error) {
      console.error("Error navigating to map:", error);
      setMapError(error.message);
      setShowMap(false);
      Alert.alert("Map Error", "There was an error loading the map. Please try again later.", [{ text: "OK" }]);
    }
  }, []);

  const handleMapError = (error) => {
    console.error("Map error occurred:", error);
    setMapError(error.message);
    setShowMap(false);
    Alert.alert("Map Error", "There was an error with the map. Please try again later.", [{ text: "OK" }]);
  };

  if (isInitializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size='large' color='#0000ff' />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

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
            <Text style={styles.apiKeysText}>iOS: {getFirstFourDigits(config.googleClientIds.ios)}</Text>
            <Text style={styles.apiKeysText}>Android: {getFirstFourDigits(config.googleClientIds.android)}</Text>
            <Text style={styles.apiKeysText}>Web: {getFirstFourDigits(config.googleClientIds.web)}</Text>
            <Text style={styles.apiKeysText}>URL Scheme: {config.googleURLScheme ? config.googleURLScheme.split("-").pop().slice(0, 4) : "Not set"}</Text>
            <Text style={styles.apiKeysText}>Maps API: {mapsApiKeyDisplay}</Text>
            <Text style={styles.apiKeysText}>Apple Auth: {appleAuthStatus}</Text>
            <Text style={styles.apiKeysText}>Environment: {__DEV__ ? "Development" : "Production"}</Text>
          </View>
        </>
      ) : showMap ? (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Text>Welcome {userInfo?.user?.name || "User"}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => setShowMap(false)}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
          {mapError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Map Error: {mapError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setMapError(null);
                  setShowMap(false);
                }}
              >
                <Text style={styles.retryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapScreen onLogout={signOut} onError={handleMapError} />
          )}
        </View>
      ) : (
        <LoginSuccess onNavigateToMap={handleNavigateToMap} mapError={mapError} />
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
    top: "70%",
    width: "90%",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  backButtonText: {
    color: "#333",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
  },
});
