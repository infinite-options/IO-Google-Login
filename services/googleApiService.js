import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types for TypeScript-like documentation
/**
 * @typedef {Object} GoogleProfile
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} photo
 */

/**
 * @typedef {Object} PhotoItem
 * @property {string} id
 * @property {string} name
 * @property {string} mimeType
 * @property {string} size
 * @property {string} modifiedTime
 * @property {string} creationTime
 * @property {number} width
 * @property {number} height
 * @property {Array} thumbnails
 */

class GoogleApiService {
  constructor() {
    this.accessToken = null;
    this.baseUrl = "https://www.googleapis.com";
  }

  // Get the current access token
  getAccessToken() {
    return this.accessToken;
  }

  // Set the access token
  setAccessToken(token) {
    this.accessToken = token;
  }

  // Store access token in AsyncStorage
  async storeAccessToken(token) {
    try {
      await AsyncStorage.setItem("google_access_token", token);
      this.accessToken = token;
    } catch (error) {
      console.error("Error storing access token:", error);
    }
  }

  // Retrieve access token from AsyncStorage
  async retrieveAccessToken() {
    try {
      const token = await AsyncStorage.getItem("google_access_token");
      if (token) {
        this.accessToken = token;
      }
      return token;
    } catch (error) {
      console.error("Error retrieving access token:", error);
      return null;
    }
  }

  // Clear stored access token
  async clearAccessToken() {
    try {
      await AsyncStorage.removeItem("google_access_token");
      this.accessToken = null;
    } catch (error) {
      console.error("Error clearing access token:", error);
    }
  }

  // Authenticate with Google and get access token
  async authenticate() {
    try {
      console.log("Starting Google authentication...");

      // Check if Google Play Services are available (Android)
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices();
      }

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();
      console.log("Google Sign-In successful:", userInfo);

      // Get access tokens
      const tokens = await GoogleSignin.getTokens();
      console.log("Access tokens received:", tokens);

      if (tokens.accessToken) {
        await this.storeAccessToken(tokens.accessToken);
        console.log("Access token stored successfully");

        // Fetch user profile
        const profile = await this.fetchProfile();

        return {
          success: true,
          profile: profile,
          userInfo: userInfo,
        };
      } else {
        throw new Error("No access token received");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Sign out from Google
  async signOut() {
    try {
      await GoogleSignin.signOut();
      await this.clearAccessToken();
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }

  // Fetch user profile
  async fetchProfile() {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    try {
      const response = await fetch(`${this.baseUrl}/oauth2/v2/userinfo`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const profile = await response.json();
      console.log("Profile fetched:", profile);
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  // Open Google Photo Picker using the actual Google Photos Picker API
  // This method returns the picker configuration for use in a WebView
  getPhotoPickerConfig() {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    console.log("Preparing Google Photos Picker API configuration...");
    console.log("Using Web Client ID:", process.env.EXPO_PUBLIC_WEB_CLIENT_ID);
    console.log("Access Token available:", !!this.accessToken);

    // The Google Photos Picker API requires a custom HTML page that loads the picker library
    // We'll create a data URL with the HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Photos Picker</title>
    <script src="https://apis.google.com/js/api.js"></script>
</head>
<body>
    <div id="picker-container" style="width: 100%; height: 100vh; background: #f5f5f5;">
        <div style="text-align: center; padding: 20px;">
            <h2>Loading Google Photos Picker...</h2>
            <p>Please wait while we load your photos.</p>
            <div id="debug-info" style="margin-top: 20px; font-size: 12px; color: #666;">
                <p>Debug Info:</p>
                <p id="debug-status">Initializing...</p>
            </div>
        </div>
    </div>

    <script>
        let pickerApiLoaded = false;
        let oauthToken = '${this.accessToken}';
        let clientId = '${process.env.EXPO_PUBLIC_WEB_CLIENT_ID}';
        
        // Test the token and client ID
        console.log('OAuth Token (first 20 chars):', oauthToken.substring(0, 20) + '...');
        console.log('Client ID:', clientId);

        function updateDebugStatus(message) {
            const debugStatus = document.getElementById('debug-status');
            if (debugStatus) {
                debugStatus.textContent = message;
            }
            console.log('Debug:', message);
        }

        function onApiLoad() {
            console.log('Google API loaded');
            updateDebugStatus('Google API loaded');
            pickerApiLoaded = true;
            createPicker();
        }

        function onPickerApiLoad() {
            console.log('Picker API loaded');
            updateDebugStatus('Picker API loaded');
            createPicker();
        }

        function createPicker() {
            if (!pickerApiLoaded || !window.gapi || !window.gapi.picker) {
                console.log('API not ready yet');
                return;
            }

            console.log('Creating picker...');
            console.log('Client ID:', clientId);
            console.log('OAuth Token available:', !!oauthToken);
            
            try {
                // Try Google Photos Picker first
                let view;
                try {
                    view = new window.gapi.picker.PhotosView();
                    view.setIncludeFolders(true);
                    view.setMimeTypes('image/jpeg,image/png,image/gif,image/webp');
                    console.log('PhotosView created successfully');
                } catch (photosError) {
                    console.log('PhotosView not available, trying DocsView:', photosError);
                    // Fallback to Google Drive Picker for images
                    view = new window.gapi.picker.DocsView();
                    view.setIncludeFolders(true);
                    view.setMimeTypes('image/jpeg,image/png,image/gif,image/webp');
                    console.log('DocsView created as fallback');
                }
                
                const picker = new window.gapi.picker.PickerBuilder()
                    .enableFeature(window.gapi.picker.Feature.NAV_HIDDEN)
                    .enableFeature(window.gapi.picker.Feature.MULTISELECT_ENABLED)
                    .setAppId(clientId)
                    .setOAuthToken(oauthToken)
                    .addView(view)
                    .setCallback(pickerCallback)
                    .build();
                
                picker.setVisible(true);
                console.log('Picker created and set visible');
            } catch (error) {
                console.error('Error creating picker:', error);
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'picker_error',
                        error: error.message
                    }));
                }
            }
        }

        function pickerCallback(data) {
            console.log('Picker callback:', data);
            
            if (data.action === window.gapi.picker.Action.PICKED) {
                const selectedPhotos = data.docs || [];
                const photoIds = selectedPhotos.map(photo => photo.id);
                
                console.log('Selected photos:', photoIds);
                
                // Send the selected photo IDs back to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'photos_selected',
                        photoIds: photoIds
                    }));
                }
            } else if (data.action === window.gapi.picker.Action.CANCEL) {
                console.log('Picker cancelled');
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'picker_cancelled'
                    }));
                }
            }
        }

        // Load the Google API with proper error handling
        function loadGoogleAPI() {
            console.log('Loading Google API...');
            updateDebugStatus('Loading Google API...');
            
            if (window.gapi) {
                console.log('gapi already available, loading picker...');
                updateDebugStatus('gapi available, loading picker...');
                window.gapi.load('picker', onPickerApiLoad);
            } else {
                console.log('gapi not available, loading script...');
                updateDebugStatus('gapi not available, loading script...');
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = function() {
                    console.log('Google API script loaded');
                    updateDebugStatus('Google API script loaded');
                    onApiLoad();
                };
                script.onerror = function() {
                    console.error('Failed to load Google API script');
                    updateDebugStatus('Failed to load Google API script');
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'picker_error',
                            error: 'Failed to load Google API script'
                        }));
                    }
                };
                document.head.appendChild(script);
            }
        }
        
        // Test if we can access Google APIs at all
        function testGoogleAPIs() {
            console.log('Testing Google APIs...');
            updateDebugStatus('Testing Google APIs...');
            
            // Test if we can make a simple API call
            fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + oauthToken)
                .then(response => {
                    if (response.ok) {
                        console.log('OAuth token is valid');
                        updateDebugStatus('OAuth token is valid');
                        return response.json();
                    } else {
                        throw new Error('OAuth token invalid: ' + response.status);
                    }
                })
                .then(data => {
                    console.log('User info:', data);
                    updateDebugStatus('OAuth token valid, user: ' + data.email);
                })
                .catch(error => {
                    console.error('OAuth test failed:', error);
                    updateDebugStatus('OAuth test failed: ' + error.message);
                });
        }

        // Start loading the API
        loadGoogleAPI();
        
        // Test OAuth token validity
        testGoogleAPIs();
        
        // Also try loading after a short delay in case of timing issues
        setTimeout(() => {
            if (!pickerApiLoaded && window.gapi) {
                console.log('Retry loading picker after delay...');
                window.gapi.load('picker', onPickerApiLoad);
            }
        }, 2000);
        
        // Timeout after 10 seconds if picker doesn't load
        setTimeout(() => {
            if (!pickerApiLoaded) {
                console.error('Picker failed to load after 10 seconds');
                updateDebugStatus('Picker failed to load after 10 seconds');
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'picker_error',
                        error: 'Picker failed to load. Please check your internet connection and try again.'
                    }));
                }
            }
        }, 10000);
        
        // Test if Google Picker API is available
        setTimeout(() => {
            if (window.gapi && window.gapi.picker) {
                updateDebugStatus('Google Picker API is available');
                console.log('Google Picker API is available');
            } else {
                updateDebugStatus('Google Picker API not available - may need to enable in Google Cloud Console');
                console.log('Google Picker API not available - may need to enable in Google Cloud Console');
                
                // Try to test the API directly
                if (window.gapi) {
                    console.log('gapi is available, testing picker...');
                    try {
                        window.gapi.load('picker', function() {
                            console.log('Picker loaded successfully');
                            updateDebugStatus('Picker loaded successfully');
                        });
                    } catch (e) {
                        console.error('Error loading picker:', e);
                        updateDebugStatus('Error loading picker: ' + e.message);
                    }
                } else {
                    console.log('gapi is not available');
                    updateDebugStatus('gapi is not available');
                }
            }
        }, 5000);
    </script>
</body>
</html>`;

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

    console.log("Google Photos Picker HTML generated");

    return {
      url: dataUrl,
      accessToken: this.accessToken,
      clientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    };
  }

  // Process selected photos from the picker callback
  async processSelectedPhotos(selectedPhotoIds) {
    if (!this.accessToken || !selectedPhotoIds || selectedPhotoIds.length === 0) {
      return [];
    }

    try {
      console.log("Processing selected photos:", selectedPhotoIds);

      // Fetch photo details for each selected photo ID
      const photoPromises = selectedPhotoIds.map(async (photoId) => {
        try {
          const response = await fetch(`${this.baseUrl}/photoslibrary/v1/mediaItems/${photoId}`, {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
            },
          });

          if (response.ok) {
            const photoData = await response.json();
            return {
              id: photoData.id,
              name: photoData.filename || `Photo ${photoData.id}`,
              mimeType: photoData.mimeType,
              size: photoData.size,
              creationTime: photoData.mediaMetadata?.creationTime,
              width: photoData.mediaMetadata?.width ? parseInt(photoData.mediaMetadata.width) : undefined,
              height: photoData.mediaMetadata?.height ? parseInt(photoData.mediaMetadata.height) : undefined,
              thumbnails: [
                {
                  url: photoData.baseUrl + "=w300-h200", // Small thumbnail
                },
              ],
              baseUrl: photoData.baseUrl,
            };
          } else {
            console.error(`Failed to fetch photo ${photoId}:`, response.status);
            return null;
          }
        } catch (error) {
          console.error(`Error fetching photo ${photoId}:`, error);
          return null;
        }
      });

      const photos = await Promise.all(photoPromises);
      const validPhotos = photos.filter((photo) => photo !== null);

      console.log(`Successfully processed ${validPhotos.length} photos`);
      return validPhotos;
    } catch (error) {
      console.error("Error processing selected photos:", error);
      throw error;
    }
  }

  // Legacy method for backward compatibility (returns mock photos)
  async openPhotoPicker() {
    console.log("Using legacy openPhotoPicker - returning mock photos");
    return this.getMockPhotos();
  }

  // Mock photos for demonstration (replace with real implementation)
  getMockPhotos() {
    return [
      {
        id: "mock_photo_1",
        name: "Sample Photo 1",
        mimeType: "image/jpeg",
        size: "1024000",
        creationTime: new Date().toISOString(),
        width: 1920,
        height: 1080,
        thumbnails: [
          {
            url: "https://picsum.photos/300/200?random=1",
          },
        ],
      },
      {
        id: "mock_photo_2",
        name: "Sample Photo 2",
        mimeType: "image/jpeg",
        size: "2048000",
        creationTime: new Date().toISOString(),
        width: 1920,
        height: 1080,
        thumbnails: [
          {
            url: "https://picsum.photos/300/200?random=2",
          },
        ],
      },
      {
        id: "mock_photo_3",
        name: "Sample Photo 3",
        mimeType: "image/jpeg",
        size: "1536000",
        creationTime: new Date().toISOString(),
        width: 1920,
        height: 1080,
        thumbnails: [
          {
            url: "https://picsum.photos/300/200?random=3",
          },
        ],
      },
    ];
  }

  // Fetch photos from Google Photos API (NOT the Picker API - this is for browsing photos)
  // Note: This is different from the Google Photos Picker API
  async fetchGooglePhotos() {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    try {
      console.log("Fetching photos from Google Photos API (not Picker API)...");

      // This uses the Google Photos Library API to browse photos
      // This is NOT the same as the Google Photos Picker API
      const response = await fetch(`${this.baseUrl}/photoslibrary/v1/mediaItems`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        console.log("Google Photos API response:", response.status, response.statusText);
        // If the API call fails, return mock data for demonstration
        console.log("Falling back to mock photos due to API limitations");
        return this.getMockPhotos();
      }

      const data = await response.json();
      console.log("Google Photos API data:", data);
      return data.mediaItems || [];
    } catch (error) {
      console.error("Error fetching Google Photos:", error);
      // Return mock data as fallback
      console.log("Falling back to mock photos due to error");
      return this.getMockPhotos();
    }
  }

  // Fetch photos from Google Drive
  async fetchDrivePhotos() {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    try {
      const response = await fetch(`${this.baseUrl}/drive/v3/files?q=mimeType contains 'image/'&orderBy=modifiedTime desc&pageSize=20`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error("Error fetching Drive photos:", error);
      throw error;
    }
  }

  // Fetch Drive files
  async fetchDriveFiles() {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    try {
      const response = await fetch(`${this.baseUrl}/drive/v3/files?orderBy=modifiedTime desc&pageSize=10`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching Drive files:", error);
      throw error;
    }
  }

  // Fetch Calendar events
  async fetchCalendarEvents(date) {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    try {
      const timeMin = `${date}T00:00:00Z`;
      const timeMax = `${date}T23:59:59Z`;

      const response = await fetch(`${this.baseUrl}/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching Calendar events:", error);
      throw error;
    }
  }
}

export default new GoogleApiService();
