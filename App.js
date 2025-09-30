import "./polyfills";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
// Conditionally import Google Sign-In based on platform
let GoogleSignin, GoogleSigninButton, statusCodes;
if (Platform.OS !== "web") {
  const googleSignInModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = googleSignInModule.GoogleSignin;
  GoogleSigninButton = googleSignInModule.GoogleSigninButton;
  statusCodes = googleSignInModule.statusCodes;
} else {
  // Mock components for web
  GoogleSignin = {
    configure: () => Promise.resolve(),
    signIn: () => Promise.resolve({ user: { name: "Web User" } }),
    signOut: () => Promise.resolve(),
    isSignedIn: () => Promise.resolve(false),
    getCurrentUser: () => Promise.resolve(null),
    getTokens: () => Promise.resolve({ accessToken: null }),
    hasPlayServices: () => Promise.resolve(true),
  };
  GoogleSigninButton = ({ onPress, style, ...props }) => (
    <TouchableOpacity style={[styles.googleButton, style]} onPress={onPress}>
      <Text style={styles.googleButtonText}>Sign in with Google (Web)</Text>
    </TouchableOpacity>
  );
  GoogleSigninButton.Size = {
    Wide: "Wide",
    Standard: "Standard",
    Icon: "Icon",
  };
  GoogleSigninButton.Color = {
    Dark: "Dark",
    Light: "Light",
  };
  statusCodes = {};
}
import config from "./config";
import MapScreen from "./screens/MapScreen";
import LoginSuccess from "./screens/LoginSuccess";
import PhotoPickerScreen from "./screens/PhotoPickerScreen";

// Import web-compatible components
let MapScreenComponent;
try {
  MapScreenComponent = Platform.OS === "web" ? require("./screens/MapScreen.web.js").default : MapScreen;
} catch (error) {
  console.error("Error loading MapScreen component:", error);
  MapScreenComponent = MapScreen;
}
import GoogleApiService from "./services/googleApiService";
import GoogleSignInWeb from "./services/googleSignInWeb";
import Constants from "expo-constants";
import AppleSignIn from "./AppleSignIn";

console.log("App.js - Imported config:", config);

// Get Maps API Key from environment variables and export it for use in other components
export const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const mapsApiKeyDisplay = mapsApiKey ? "..." + mapsApiKey.slice(-4) : "Not set";

// App version and build info
const APP_VERSION = "1.2.0";
const BUILD_DATE = new Date().toISOString();
const BUILD_TIMESTAMP = new Date().toLocaleString();

export default function App() {
  console.log("------- Program Starting in App.js -------");
  console.log("App Version:", APP_VERSION);
  console.log("Build Date:", BUILD_DATE);
  console.log("Build Timestamp:", BUILD_TIMESTAMP);
  console.log("Platform:", Platform.OS);

  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [appleAuthStatus, setAppleAuthStatus] = useState("Checking...");
  const [isInitializing, setIsInitializing] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
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
          scopes: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/photoslibrary.readonly",
            "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
          ],
        };
        console.log("Google Sign-In configuration:", googleConfig);

        // Use web-specific implementation for web platform
        if (Platform.OS === "web") {
          await GoogleSignInWeb.configure(googleConfig);
          console.log("Google Sign-In configured for web");
        } else {
          await GoogleSignin.configure(googleConfig);
          console.log("Google Sign-In configured for mobile");
        }

        // Check if user is already signed in and has valid tokens
        const googleSignIn = Platform.OS === "web" ? GoogleSignInWeb : GoogleSignin;
        const isSignedIn = await googleSignIn.isSignedIn();
        if (isSignedIn) {
          try {
            const userInfo = await googleSignIn.getCurrentUser();
            const tokens = await googleSignIn.getTokens();

            if (tokens.accessToken) {
              await GoogleApiService.storeAccessToken(tokens.accessToken);
              console.log("User already signed in, tokens restored");

              // Test if the token has the right scopes
              try {
                const testResponse = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + tokens.accessToken);
                if (testResponse.ok) {
                  console.log("Existing token is valid");
                  if (isMounted) {
                    setUserInfo(userInfo);
                    setIsInitializing(false);
                    return;
                  }
                } else {
                  console.log("Existing token is invalid, signing out");
                  await googleSignIn.signOut();
                }
              } catch (error) {
                console.log("Error testing existing token:", error);
                await googleSignIn.signOut();
              }
            }
          } catch (error) {
            console.log("Error checking existing sign-in:", error);
            // Continue with sign out
          }
        }

        // Sign out any existing user on app start
        await googleSignIn.signOut();
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
    setShowPhotoPicker(false); // Reset photo picker state when signing in
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const signIn = async () => {
    try {
      console.log("Starting Google Sign-In process...");

      const googleSignIn = Platform.OS === "web" ? GoogleSignInWeb : GoogleSignin;

      // Force sign out first to clear any cached tokens
      try {
        await googleSignIn.signOut();
        console.log("Cleared existing session before sign-in");
      } catch (signOutError) {
        console.log("No existing session to clear:", signOutError.message);
      }

      if (Platform.OS !== "web") {
        await googleSignIn.hasPlayServices();
      }
      const userInfo = await googleSignIn.signIn();
      console.log("Sign-in successful:", userInfo);
      console.log("Sign-in successful:", userInfo.user);
      console.log("Sign-in successful:", userInfo.user.name);

      // Get access tokens and store them in GoogleApiService
      const tokens = await googleSignIn.getTokens();
      console.log("Access tokens received:", tokens);

      if (tokens.accessToken) {
        await GoogleApiService.storeAccessToken(tokens.accessToken);
        console.log("Access token stored in GoogleApiService");

        // Test the token with the new scopes
        try {
          const testResponse = await fetch("https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + tokens.accessToken);
          if (testResponse.ok) {
            const userInfo = await testResponse.json();
            console.log("Token test successful for user:", userInfo.email);

            // Test token scopes specifically
            try {
              const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${tokens.accessToken}`);
              if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                console.log("New token scopes:");
                const scopes = tokenInfo.scope?.split(" ") || [];
                scopes.forEach((scope, index) => {
                  console.log(`  ${index + 1}. ${scope}`);
                });
                const hasPhotosScope = tokenInfo.scope?.includes("photoslibrary.readonly");
                console.log("Has Photos scope:", hasPhotosScope);
                if (!hasPhotosScope) {
                  console.warn("⚠️ WARNING: New token still missing photoslibrary.readonly scope!");
                } else {
                  console.log("✅ SUCCESS: All required scopes present!");
                }
              }
            } catch (scopeError) {
              console.log("Could not check token scopes:", scopeError);
            }
          } else {
            console.log("Token test failed:", testResponse.status);
          }
        } catch (error) {
          console.log("Token test error:", error.message);
        }
      }

      handleSignIn(userInfo);
    } catch (error) {
      console.error("Sign-in error:", error);
      handleError(error.message);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      const googleSignIn = Platform.OS === "web" ? GoogleSignInWeb : GoogleSignin;
      await googleSignIn.signOut();
      await GoogleApiService.signOut(); // Also clear tokens from GoogleApiService
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
      setShowPhotoPicker(false);
    } catch (error) {
      console.error("Error navigating to map:", error);
      setMapError(error.message);
      setShowMap(false);
      Alert.alert("Map Error", "There was an error loading the map. Please try again later.", [{ text: "OK" }]);
    }
  }, []);

  const handleNavigateToPhotoPicker = useCallback(() => {
    try {
      console.log("Navigating to photo picker set to true...");
      setShowPhotoPicker(true);
      setShowMap(false);
    } catch (error) {
      console.error("Error navigating to photo picker:", error);
      Alert.alert("Photo Picker Error", "There was an error loading the photo picker. Please try again later.", [{ text: "OK" }]);
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
        <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
        <Text style={styles.debugText}>Version: {APP_VERSION}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Version Info Header */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v{APP_VERSION}</Text>
        <Text style={styles.buildText}>{BUILD_TIMESTAMP}</Text>
      </View>

      {!userInfo ? (
        <>
          <Text style={styles.title}>Sign In</Text>
          {error && <Text style={styles.error}>Error: {error}</Text>}
          <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={signIn} />
          {Platform.OS !== "web" && <AppleSignIn onSignIn={handleSignIn} onError={handleError} />}

          <View style={styles.apiKeysContainer}>
            <Text style={styles.apiKeysTitle}>API Keys (First 4 Digits):</Text>
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
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.backButton} onPress={() => setShowMap(false)}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
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
            <MapScreenComponent onLogout={signOut} onError={handleMapError} />
          )}
        </View>
      ) : showPhotoPicker ? (
        <PhotoPickerScreen onBack={() => setShowPhotoPicker(false)} userInfo={userInfo} onLogout={signOut} />
      ) : (
        <LoginSuccess onNavigateToMap={handleNavigateToMap} onNavigateToPhotoPicker={handleNavigateToPhotoPicker} onLogout={signOut} mapError={mapError} />
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
  versionContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  versionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  buildText: {
    color: "white",
    fontSize: 10,
    opacity: 0.8,
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
    backgroundColor: "#4285F4",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  debugText: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
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
  logoutButton: {
    padding: 10,
    backgroundColor: "#dc3545",
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
