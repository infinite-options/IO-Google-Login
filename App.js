import "./polyfills";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import config from "./config";
import MapScreen from "./screens/MapScreen";
import Constants from "expo-constants";
import { requestBluetoothPermissions } from "./src/utils/permissions"; // Import BLE permissions helper
import { startBluetoothScan, startBluetoothBroadcast } from "./src/utils/BLEUtils"; // Import BLE utilities

console.log("App.js - Imported config:", config);

export default function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Idle");

  useEffect(() => {
    const initializeGoogleSignIn = async () => {
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

        // **Sign out user on every app start (for demo purposes)**
        await GoogleSignin.signOut();
        console.log("User signed out on app start.");
        setUserInfo(null);
      } catch (error) {
        console.error("Google Sign-In configuration error:", error);
        setError(error.message);
      }
    };

    initializeGoogleSignIn();
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        console.log("Requesting Bluetooth permissions...");
        const hasPermission = await requestBluetoothPermissions();
        if (hasPermission) {
          console.log("BLE permissions granted, proceeding with BLE operations...");
          // Start scanning or broadcasting based on your needs
          setStatus("Scanning..."); // Change status to scanning
          startBluetoothScan(); // Start scanning
          setStatus("Broadcasting..."); // If broadcasting is needed, you can use this
          startBluetoothBroadcast(); // Start broadcasting
        } else {
          console.warn("BLE permissions not granted, BLE features may not work properly.");
        }
      } catch (error) {
        console.error("Error checking BLE permissions:", error);
      }
    };

    checkPermissions();
  }, []); // Runs once when component mounts

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

  const startScan = () => {
    setStatus("Scanning...");
    startBluetoothScan();
  };

  const startBroadcast = () => {
    setStatus("Broadcasting...");
    startBluetoothBroadcast();
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
          {/* BLE Operation Buttons */}
          <View style={styles.bleButtonsContainer}>
            <Text>Status: {status}</Text>
            <Button title='Start BLE Scan' onPress={startScan} />
            <Button title='Start BLE Broadcast' onPress={startBroadcast} />
          </View>
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
  bleButtonsContainer: {
    marginTop: 20,
    alignItems: "center",
  },
});
