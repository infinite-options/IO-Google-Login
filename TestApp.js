import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TestApp() {
  console.log("TestApp is rendering!");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 React Native Web is Working!</Text>
      <Text style={styles.subtitle}>If you can see this, the web setup is working correctly.</Text>
      <Text style={styles.info}>Platform: Web</Text>
      <Text style={styles.info}>Time: {new Date().toLocaleTimeString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 5,
  },
});
