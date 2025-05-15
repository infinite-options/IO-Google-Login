import "./polyfills";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Platform, Alert, TouchableOpacity } from "react-native";
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import config from "./config";
import MapScreen from "./screens/MapScreen";
import Constants from "expo-constants";
import AppleSignIn from "./AppleSignIn";

console.log("App.js - Imported config:", config);

// Get Maps API Key from environment variables and export it for use in other components
export const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const mapsApiKeyDisplay = mapsApiKey ? "..." + mapsApiKey.slice(-4) : "Not set";

console.log("App.js - Maps API Key configuration:", {
  key: mapsApiKey ? "..." + mapsApiKey.slice(-4) : "Not set",
  length: mapsApiKey ? mapsApiKey.length : 0,
  environment: __DEV__ ? "Development" : "Production",
});

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [appleAuthStatus, setAppleAuthStatus] = useState("Checking...");

  // Google Sign-In config state management
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [isGoogleConfiguring, setIsGoogleConfiguring] = useState(true);
  const [configAttemptCount, setConfigAttemptCount] = useState(0);
  const maxAttempts = 3;

  // Helper function to check state values (for debugging)
  const checkGoogleStates = () => {
    console.log(`App.js Google Sign-In States: isGoogleConfigured=${isGoogleConfigured}, isGoogleConfiguring=${isGoogleConfiguring}, configAttemptCount=${configAttemptCount}`);
  };

  useEffect(() => {
    console.log("App.js - Component mounted");
    console.log("App.js - Maps API Key status:", {
      isConfigured: !!mapsApiKey,
      keyLength: mapsApiKey ? mapsApiKey.length : 0,
      lastFour: mapsApiKeyDisplay,
    });
    let configAttempts = 0;
    const configureGoogleSignIn = async () => {
      configAttempts++;
      setConfigAttemptCount(configAttempts);
      console.log(`App.js Google Sign-In configuration attempt ${configAttempts}/${maxAttempts}`);
      try {
        setIsGoogleConfiguring(true);
        const googleConfig = {
          iosClientId: config.googleClientIds.ios,
          androidClientId: config.googleClientIds.android,
          webClientId: config.googleClientIds.web,
          offlineAccess: true,
          scopes: ["profile", "email"],
        };
        if (Platform.OS === "ios" && config.googleClientIds.googleURLScheme) {
          googleConfig.googleURLScheme = config.googleClientIds.googleURLScheme;
          console.log("- In App.js: Configured URL scheme for iOS:", config.googleClientIds.googleURLScheme);
        }
        await GoogleSignin.configure(googleConfig);
        setIsGoogleConfigured(true);
        setIsGoogleConfiguring(false);
        setTimeout(checkGoogleStates, 100);
        setTimeout(checkGoogleStates, 500);
        setTimeout(checkGoogleStates, 1000);
      } catch (error) {
        console.error(`App.js Google Sign-In configuration error (attempt ${configAttempts}/${maxAttempts}):`, error);
        if (configAttempts < maxAttempts) {
          console.log(`App.js Retrying Google Sign-In configuration in 1 second (attempt ${configAttempts}/${maxAttempts} failed)`);
          setTimeout(configureGoogleSignIn, 1000);
        } else {
          setIsGoogleConfigured(false);
          setIsGoogleConfiguring(false);
          console.log("App.js Google Sign-In configuration failed - isGoogleConfigured set to FALSE, isGoogleConfiguring set to FALSE");
        }
      }
    };
    configureGoogleSignIn();
    return () => {
      setIsGoogleConfigured(false);
      setIsGoogleConfiguring(false);
    };
  }, []);

  const handleSignIn = (userInfo) => {
    console.log("Handling successful sign-in...");
    try {
      setUserInfo(userInfo);
      setError(null);
      console.log("Successfully set user info");
    } catch (error) {
      console.error("Error in handleSignIn:", error);
      setError("Failed to process login information");
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  const signIn = async () => {
    // Block sign-in if config is not ready
    if (isGoogleConfiguring) {
      Alert.alert("Please Wait", "Google Sign-In is still being configured. Please try again in a moment.");
      return;
    }
    if (!isGoogleConfigured) {
      Alert.alert("Error", "Google Sign-In is not configured properly. Please try again later.");
      return;
    }
    try {
      // Always sign out before sign-in for a clean state
      try {
        await GoogleSignin.signOut();
        console.log("App.js Successfully signed out before new sign-in attempt");
      } catch (signOutError) {
        console.log("App.js Sign out before sign in resulted in error (can be ignored):", signOutError);
      }
      console.log("\n=== Starting Google Sign-In Process ===");
      console.log("1. Checking credentials before sign-in:");
      console.log("- iOS Client ID:", config.googleClientIds.ios);
      console.log("- Android Client ID:", config.googleClientIds.android);
      console.log("- Web Client ID:", config.googleClientIds.web);
      console.log("- URL Scheme:", config.googleClientIds.googleURLScheme);
      console.log("\n2. Checking if user is already signed in...");
      const isSignedIn = await GoogleSignin.isSignedIn();
      console.log("Is user already signed in?", isSignedIn);
      console.log("\n3. Checking Play Services (if applicable)...");
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log("\n4. Initiating Google Sign-In...");
      try {
        console.log("→ Requesting Google Sign-In sheet...");
        const userInfo = await GoogleSignin.signIn();
        console.log("→ Sign-In sheet closed successfully");
        console.log("\n5. Sign-in successful!");
        console.log("User Info received:", JSON.stringify(userInfo, null, 2));
        handleSignIn(userInfo);
      } catch (error) {
        console.error("\n❌ Sign-in sheet error:");
        if (error.code) {
          console.error("Error code:", error.code);
          switch (error.code) {
            case statusCodes.SIGN_IN_CANCELLED:
              console.log("→ User cancelled the sign-in flow (closed the sheet)");
              break;
            case statusCodes.IN_PROGRESS:
              console.log("→ Sign-in sheet already showing");
              break;
            case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
              console.log("→ Play services not available");
              break;
            default:
              console.error("→ Other error code:", error.code);
          }
        }
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error("\n❌ Sign-in error:");
      if (error.code) {
        console.error("Error code:", error.code);
      }
      console.error("Error message:", error.message);
      console.error("Full error:", error);
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

  console.log("Full URL Scheme:", config.googleClientIds.googleURLScheme);
  console.log("URL Scheme exists:", !!config.googleClientIds.googleURLScheme);

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
            <Text style={styles.apiKeysText}>URL Scheme: {config.googleClientIds.googleURLScheme ? "..." + config.googleClientIds.googleURLScheme.slice(-2) : "Not set"}</Text>
            <Text style={styles.apiKeysText}>Maps API: {mapsApiKeyDisplay}</Text>
            <Text style={styles.apiKeysText}>Apple Auth: {appleAuthStatus}</Text>
            <Text style={styles.apiKeysText}>Environment: {__DEV__ ? "Development" : "Production"}</Text>
          </View>
        </>
      ) : (
        <View style={styles.mainContainer}>
          <View style={styles.header}>
            <Text>Welcome {userInfo?.user?.name || "User"}</Text>
            <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          {userInfo && (
            <>
              {/* {console.log("App.js - Rendering MapScreen with userInfo:", userInfo)} */}
              {console.log("App.js - About to render MapScreen with userInfo:", {
                name: userInfo?.user?.name,
                email: userInfo?.user?.email,
                id: userInfo?.user?.id,
              })}
              <MapScreen onLogout={signOut} userInfo={userInfo} />
            </>
          )}
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
    top: "70%", // Position below the title
    width: "90%",
  },
  signOutButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginLeft: 10,
  },
  signOutText: {
    color: "#E4423F",
  },
});
