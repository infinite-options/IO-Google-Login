import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, TouchableOpacity, Text, View, Alert, ActivityIndicator, Image, Dimensions } from "react-native";
import GoogleApiService from "../services/googleApiService";
import { Platform } from "react-native";
import PhotoPickerWebView from "./PhotoPickerWebView";

// Use web-compatible WebView for web platform
const PhotoPickerWebViewComponent = Platform.OS === "web" ? require("./PhotoPickerWebView.web.js").default : PhotoPickerWebView;
import PhotoPickerTest from "./PhotoPickerTest";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 60) / 3; // 3 photos per row with margins

// Component to handle Google Photos URLs with authorization
function AuthorizedImage({ source, style, accessToken, ...props }) {
  const [imageUri, setImageUri] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!source?.uri || !accessToken) {
      setImageUri(source?.uri || null);
      setLoading(false);
      return;
    }

    // For Google Photos URLs, we need to fetch with authorization
    const fetchImageWithAuth = async () => {
      try {
        setLoading(true);
        console.log("Fetching image with auth:", source.uri);
        console.log("Using access token:", accessToken ? "Present" : "Missing");

        const response = await fetch(source.uri, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("Image fetch response:", response.status, response.statusText);

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          console.log("Image loaded successfully, blob URL created");
          setImageUri(url);
        } else {
          console.error("Failed to fetch image:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching image:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImageWithAuth();
  }, [source?.uri, accessToken]);

  if (loading) {
    return (
      <View style={[style, { backgroundColor: "#f8f9fa", justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: 16, color: "#666" }}>⏳</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[style, { backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: 12, color: "#666" }}>📷</Text>
      </View>
    );
  }

  return <Image source={{ uri: imageUri || source?.uri }} style={style} {...props} />;
}

export default function PhotoPickerScreen({ onBack, userInfo, onLogout }) {
  const [accessToken, setAccessToken] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoPickerLoading, setPhotoPickerLoading] = useState(false);
  const [showWebViewPicker, setShowWebViewPicker] = useState(false);
  const [showTestScreen, setShowTestScreen] = useState(false);

  useEffect(() => {
    // Get access token from GoogleApiService
    const initializeToken = async () => {
      const token = await GoogleApiService.retrieveAccessToken();
      if (token) {
        setAccessToken(token);
        console.log("Access token retrieved for Photo Picker:", token ? "Present" : "Missing");
      } else {
        console.log("No access token found, user needs to sign in again");
      }
    };

    initializeToken();
  }, []);

  const openPhotoPicker = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token available. Please sign in again.");
      return;
    }

    try {
      setPhotoPickerLoading(true);
      const photos = await GoogleApiService.openPhotoPicker();
      console.log("Photos received from Photo Picker:", photos);
      console.log("First photo structure:", photos[0]);
      setSelectedPhotos(photos);
      if (photos.length > 0) {
        Alert.alert("Success", `Loaded ${photos.length} sample photos! (Note: This is a demo with mock data)`);
      } else {
        Alert.alert("Info", "No photos were selected. Please try again.");
      }
    } catch (error) {
      console.error("Error opening Photo Picker:", error);
      Alert.alert("Error", "Failed to open Photo Picker");
    } finally {
      setPhotoPickerLoading(false);
    }
  };

  const openWebViewPicker = () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token available. Please sign in again.");
      return;
    }
    setShowWebViewPicker(true);
  };

  const handlePhotosSelected = (photos) => {
    console.log("Photos selected from WebView picker:", photos);
    setSelectedPhotos(photos);
    setShowWebViewPicker(false);
  };

  const handleCloseWebView = () => {
    setShowWebViewPicker(false);
  };

  const openTestScreen = () => {
    setShowTestScreen(true);
  };

  const closeTestScreen = () => {
    setShowTestScreen(false);
  };

  const fetchGooglePhotos = async () => {
    if (!accessToken) {
      Alert.alert("Error", "No access token available. Please sign in again.");
      return;
    }

    try {
      setLoading(true);
      const photos = await GoogleApiService.fetchGooglePhotos();
      setSelectedPhotos(photos);
      if (photos.length > 0) {
        Alert.alert("Success", `Loaded ${photos.length} photos from Google Photos API!`);
      } else {
        Alert.alert("Info", "No photos found in your Google Photos library.");
      }
    } catch (error) {
      console.error("Error fetching Google Photos:", error);
      Alert.alert("Error", "Failed to fetch photos from Google Photos");
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivePhotos = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const photos = await GoogleApiService.fetchDrivePhotos();
      setSelectedPhotos(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      Alert.alert("Error", "Failed to fetch photos");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (size) => {
    if (!size) return "";
    const bytes = parseInt(size);
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("folder")) return "📁";
    if (mimeType?.includes("image")) return "🖼️";
    if (mimeType?.includes("document")) return "📄";
    if (mimeType?.includes("spreadsheet")) return "📊";
    if (mimeType?.includes("presentation")) return "📽️";
    return "📄";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#4285F4' />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (showWebViewPicker) {
    return <PhotoPickerWebViewComponent onPhotosSelected={handlePhotosSelected} onClose={handleCloseWebView} userInfo={userInfo} />;
  }

  if (showTestScreen) {
    return <PhotoPickerTest onBack={closeTestScreen} userInfo={userInfo} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Photo Picker</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.welcomeText}>Welcome {userInfo?.user?.name || "User"}!</Text>

        {/* Photo Picker Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Photos</Text>
          <Text style={styles.sectionDescription}>Select photos from your Google Photos library or load images from Google Drive</Text>

          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity style={[styles.photoButton, styles.primaryButton]} onPress={openWebViewPicker}>
              <Text style={styles.photoButtonText}>📷 Pick Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButton} onPress={openPhotoPicker} disabled={photoPickerLoading}>
              {photoPickerLoading ? <ActivityIndicator color='white' size='small' /> : <Text style={styles.photoButtonText}>Demo Photos</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButton} onPress={fetchGooglePhotos} disabled={loading}>
              {loading ? <ActivityIndicator color='white' size='small' /> : <Text style={styles.photoButtonText}>Browse Photos</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButton} onPress={fetchDrivePhotos}>
              <Text style={styles.photoButtonText}>Drive Images</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.photoButton, styles.testButton]} onPress={openTestScreen}>
              <Text style={styles.photoButtonText}>🔧 Test APIs</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.noteText}>
            📋 Available Options:{"\n"}• "📷 Pick Photos" - Real Google Photos Picker with WebView{"\n"}• "Demo Photos" - Shows sample photos for testing{"\n"}• "Browse Photos" - Uses Google Photos
            Library API{"\n"}• "Drive Images" - Uses Google Drive API{"\n"}
            {"\n"}
            The "Pick Photos" button opens the real Google Photos Picker where you can select photos and they'll be displayed in your app.
          </Text>
        </View>

        {/* Photos Results */}
        {selectedPhotos.length > 0 && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Selected Photos ({selectedPhotos.length})</Text>
            <View style={styles.photosGrid}>
              {selectedPhotos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  {photo.thumbnails?.[0]?.url ? (
                    <AuthorizedImage source={{ uri: photo.thumbnails[0].url }} style={styles.photoImage} accessToken={accessToken} resizeMode='cover' />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoIcon}>📷</Text>
                    </View>
                  )}
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoName}>{photo.name}</Text>
                    {photo.width && photo.height && (
                      <Text style={styles.photoDimensions}>
                        📐 {photo.width}x{photo.height}
                      </Text>
                    )}
                    {photo.creationTime && <Text style={styles.photoDate}>📅 {formatDate(photo.creationTime)}</Text>}
                    {photo.size && <Text style={styles.photoSize}>💾 {formatFileSize(photo.size)}</Text>}
                    <Text style={styles.photoType}>
                      {getFileIcon(photo.mimeType)} {photo.mimeType?.includes("image") ? "Image" : "File"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4285F4",
    fontWeight: "600",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 50, // Same width as back button for centering
  },
  logoutButton: {
    padding: 8,
    backgroundColor: "#dc3545",
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  photoButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  photoButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: "#34A853",
    borderWidth: 2,
    borderColor: "#2E7D32",
  },
  testButton: {
    backgroundColor: "#FF9800",
  },
  photoButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  noteText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    lineHeight: 16,
  },
  resultsCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#34A853",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoItem: {
    width: PHOTO_SIZE,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  photoPlaceholder: {
    width: "100%",
    height: PHOTO_SIZE,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  photoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  photoImage: {
    width: "100%",
    height: PHOTO_SIZE,
  },
  photoInfo: {
    padding: 8,
  },
  photoName: {
    fontSize: 12,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  photoDimensions: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginBottom: 2,
  },
  photoDate: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginBottom: 2,
  },
  photoSize: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
    marginBottom: 2,
  },
  photoType: {
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
});
