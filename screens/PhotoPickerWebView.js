import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import GoogleApiService from "../services/googleApiService";

const { width, height } = Dimensions.get("window");

export default function PhotoPickerWebView({ onPhotosSelected, onClose, userInfo }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickerConfig, setPickerConfig] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    initializePicker();
  }, []);

  const initializePicker = () => {
    try {
      const config = GoogleApiService.getPhotoPickerConfig();
      setPickerConfig(config);
      setLoading(false);
    } catch (error) {
      console.error("Error initializing picker:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Received message from WebView:", data);

      if (data.type === "photos_selected" && data.photoIds) {
        console.log("Photos selected:", data.photoIds);

        // Process the selected photos
        const photos = await GoogleApiService.processSelectedPhotos(data.photoIds);

        if (photos.length > 0) {
          Alert.alert("Success", `Selected ${photos.length} photos!`, [
            {
              text: "OK",
              onPress: () => onPhotosSelected(photos),
            },
          ]);
        } else {
          Alert.alert("Info", "No photos were selected or processed.");
        }
      } else if (data.type === "picker_cancelled") {
        console.log("Picker was cancelled");
        onClose();
      } else if (data.type === "picker_error") {
        console.error("Picker error:", data.error);
        Alert.alert("Error", "Failed to load photo picker. Please try again.");
        onClose();
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
    }
  };

  // No need for complex JavaScript injection since we're using a proper HTML page
  const injectJavaScript = `
    // Simple script to ensure ReactNativeWebView is available
    console.log('WebView loaded with Google Photos Picker');
  `;

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
    setError("Failed to load photo picker. Please check your internet connection.");
  };

  const handleWebViewLoadEnd = () => {
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#4285F4' />
        <Text style={styles.loadingText}>Loading Photo Picker...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializePicker}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Photos</Text>
        <View style={styles.placeholder} />
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: pickerConfig.url }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        onError={handleWebViewError}
        onLoadEnd={handleWebViewLoadEnd}
        injectedJavaScript={injectJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode='compatibility'
        allowsBackForwardNavigationGestures={false}
        userAgent='Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      />
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
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#4285F4",
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 50,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
