import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import config from "../config";

export default function LoginSuccess({ onNavigateToMap, onNavigateToPhotoPicker, onLogout }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Success!</Text>

      <View style={styles.apiKeysContainer}>
        <Text style={styles.sectionTitle}>API Keys:</Text>

        <View style={styles.keyContainer}>
          <Text style={styles.keyLabel}>Google Maps API Key:</Text>
          <Text style={styles.keyValue}>{config.googleMapsApiKey || "Not set"}</Text>
        </View>

        {Platform.OS === "ios" && (
          <View style={styles.keyContainer}>
            <Text style={styles.keyLabel}>Apple Maps API Key:</Text>
            <Text style={styles.keyValue}>{config.appleMapsApiKey || "Not set"}</Text>
          </View>
        )}

        <View style={styles.keyContainer}>
          <Text style={styles.keyLabel}>Platform:</Text>
          <Text style={styles.keyValue}>{Platform.OS}</Text>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={onNavigateToMap}>
          <Text style={styles.buttonText}>Go to Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.photoButton]} onPress={onNavigateToPhotoPicker}>
          <Text style={styles.buttonText}>Go to Photo Picker</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#4CAF50",
  },
  apiKeysContainer: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  keyContainer: {
    marginBottom: 15,
  },
  keyLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  keyValue: {
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flex: 1,
    marginHorizontal: 5,
  },
  photoButton: {
    backgroundColor: "#34A853",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
