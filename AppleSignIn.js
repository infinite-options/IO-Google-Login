import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AppleSignIn = ({ onSignIn, onError }) => {
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });

      // If we received the user's name, store it for future use
      if (credential.fullName) {
        const userFullName = {
          givenName: credential.fullName.givenName,
          familyName: credential.fullName.familyName,
        };
        await AsyncStorage.setItem(`apple_user_${credential.user}`, JSON.stringify(userFullName));
      }

      // Try to get stored name if not provided in current sign-in
      let fullName = credential.fullName;
      if (!fullName?.givenName) {
        try {
          const storedName = await AsyncStorage.getItem(`apple_user_${credential.user}`);
          if (storedName) {
            fullName = JSON.parse(storedName);
          }
        } catch (error) {
          console.log("Error retrieving stored name:", error);
        }
      }

      // User is authenticated
      const userInfo = {
        user: {
          id: credential.user,
          email: credential.email,
          name: fullName?.givenName ? `${fullName.givenName} ${fullName.familyName}` : "Apple User",
        },
        idToken: credential.identityToken,
      };

      onSignIn(userInfo);
    } catch (error) {
      if (error.code === "ERR_CANCELED") {
        // Handle user canceling the sign-in flow
        console.log("User canceled Apple Sign-in");
      } else {
        console.error("Apple Sign-In Error:", error);
        onError(error.message);
      }
    }
  };

  // Only show Apple Sign In on iOS
  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={5}
        style={styles.appleButton}
        onPress={handleAppleSignIn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  appleButton: {
    width: 192,
    height: 48,
  },
});

export default AppleSignIn;
