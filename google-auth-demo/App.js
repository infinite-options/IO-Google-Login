import "./polyfills";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, Platform } from "react-native";
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import config from "./config";
import MapScreen from "./screens/MapScreen";

console.log("App.js - Imported config:", config);

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const configureGoogleSignIn = async () => {
    try {
      console.log("Configuring Google Sign-In...");
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

      // Check if a user is already signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      console.log("Is user signed in?", isSignedIn);

      if (isSignedIn) {
        getCurrentUserInfo();
      }
    } catch (error) {
      console.error("Google Sign-In configuration error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      setError(error.message);
    }
  };

  const getCurrentUserInfo = async () => {
    try {
      console.log("Getting current user info...");
      const userInfo = await GoogleSignin.signInSilently();
      console.log("Current user info:", userInfo);
      setUserInfo(userInfo);
    } catch (error) {
      console.error("Error getting current user:", error);
      if (error.code === statusCodes.SIGN_IN_REQUIRED) {
        console.log("User needs to sign in");
      }
      setError(error.message);
    }
  };

  const signIn = async () => {
    try {
      console.log("Starting Google Sign-In process...");
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log("Sign-in successful:", userInfo);
      setUserInfo(userInfo);
      setError(null);
    } catch (error) {
      console.error("Sign-in error:", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled sign-in");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign-in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available");
      }
      setError(error.message);
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

  return (
    <View style={styles.container}>
      {!userInfo ? (
        <>
          <Text style={styles.title}>Google Auth Demo</Text>
          {error && <Text style={styles.error}>Error: {error}</Text>}
          <GoogleSigninButton style={styles.googleButton} size={GoogleSigninButton.Size.Wide} color={GoogleSigninButton.Color.Dark} onPress={signIn} />
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
  userInfo: {
    alignItems: "center",
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
});
