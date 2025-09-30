import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function PhotoPickerWebView({ onPhotosSelected, onClose, userInfo }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load Google Picker API
    const loadGooglePicker = () => {
      if (window.gapi && window.gapi.picker) {
        initializePicker();
        return;
      }

      // Load Google APIs
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load("picker", initializePicker);
      };
      script.onerror = () => {
        console.error("Failed to load Google Picker API");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializePicker = () => {
      if (!window.gapi || !window.gapi.picker) {
        console.error("Google Picker API not available");
        setIsLoading(false);
        return;
      }

      // Create and show the picker
      const picker = new window.gapi.picker.PickerBuilder()
        .addView(window.gapi.picker.ViewId.PHOTOS)
        .setOAuthToken(userInfo?.accessToken || "mock_token")
        .setDeveloperKey(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)
        .setCallback((data) => {
          if (data.action === window.gapi.picker.Action.PICKED) {
            const photos = data.docs.map((doc) => ({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              size: doc.sizeBytes?.toString(),
              width: doc.widthPixels,
              height: doc.heightPixels,
              creationTime: doc.lastEditedUtc,
              thumbnails: [
                {
                  url: doc.thumbnailUrl || doc.iconUrl,
                },
              ],
            }));
            console.log("Photos selected from Google Picker:", photos);
            onPhotosSelected(photos);
          } else if (data.action === window.gapi.picker.Action.CANCEL) {
            console.log("Picker cancelled");
            onClose();
          }
        })
        .build();

      picker.setVisible(true);
      setIsLoading(false);
    };

    setIsLoading(true);
    loadGooglePicker();

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="apis.google.com"]');
      scripts.forEach((script) => script.remove());
    };
  }, [onPhotosSelected, onClose, userInfo]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Google Photos Picker...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Photo Picker (Web Version)</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.message}>📷 Loading Google Photos Picker...</Text>
        <Text style={styles.subMessage}>This will open the real Google Photos Picker.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#6c757d",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  message: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  subMessage: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
    textAlign: "center",
  },
  note: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 30,
  },
  mockButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  mockButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});
