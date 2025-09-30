import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import GoogleApiService from "../services/googleApiService";

export default function PhotoPickerTest({ onBack, userInfo }) {
  const [accessToken, setAccessToken] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeToken = async () => {
      const token = await GoogleApiService.retrieveAccessToken();
      if (token) {
        setAccessToken(token);
        console.log("Access token retrieved for testing:", token ? "Present" : "Missing");
      }
    };

    initializeToken();
  }, []);

  const addTestResult = (test, result, details = "") => {
    const timestamp = new Date().toLocaleTimeString();
    const testResult = { test, result, details, timestamp };

    // Log to console for debugging
    console.log(`[API Test] ${test}: ${result} - ${details} (${timestamp})`);
    if (result === "FAIL" && details) {
      console.error(`[API Test FAIL] ${test}:`, details);
    }

    setTestResults((prev) => [...prev, testResult]);
  };

  const testOAuthToken = async () => {
    if (!accessToken) {
      addTestResult("OAuth Token", "FAIL", "No access token available");
      return;
    }

    try {
      setLoading(true);
      addTestResult("OAuth Token", "TESTING", "Testing token validity...");
      console.log(`[OAuth Test] Testing token: ${accessToken.substring(0, 20)}...`);

      // Test basic OAuth
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`[OAuth Test] Success:`, data);
        addTestResult("OAuth Token", "PASS", `Valid token for user: ${data.email}`);

        // Test token info to see scopes
        try {
          const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
          if (tokenInfoResponse.ok) {
            const tokenInfo = await tokenInfoResponse.json();
            console.log(`[OAuth Test] Full token info:`, JSON.stringify(tokenInfo, null, 2));
            console.log(`[OAuth Test] Token audience:`, tokenInfo.audience);
            console.log(`[OAuth Test] Token issued to:`, tokenInfo.issued_to);

            const scopes = tokenInfo.scope?.split(" ") || [];
            console.log(`[OAuth Test] Token scopes (${scopes.length} total):`);
            scopes.forEach((scope, index) => {
              console.log(`[OAuth Test]   ${index + 1}. ${scope}`);
            });

            const hasPhotosScope = scopes.includes("https://www.googleapis.com/auth/photoslibrary.readonly");
            const hasDriveScope = scopes.includes("https://www.googleapis.com/auth/drive.readonly");
            const hasPickerScope = scopes.includes("https://www.googleapis.com/auth/photospicker.mediaitems.readonly");

            console.log(`[OAuth Test] Scope Analysis:`);
            console.log(`[OAuth Test] - Photos scope: ${hasPhotosScope ? "✅ PRESENT" : "❌ MISSING"}`);
            console.log(`[OAuth Test] - Drive scope: ${hasDriveScope ? "✅ PRESENT" : "❌ MISSING"}`);
            console.log(`[OAuth Test] - Picker scope: ${hasPickerScope ? "✅ PRESENT" : "❌ MISSING"}`);

            addTestResult("OAuth Token", "PASS", `Scopes: ${scopes.join(", ")}`);
            addTestResult("OAuth Token", hasPhotosScope ? "PASS" : "FAIL", `Photos scope: ${hasPhotosScope ? "✅ Present" : "❌ Missing"}`);
            addTestResult("OAuth Token", hasDriveScope ? "PASS" : "FAIL", `Drive scope: ${hasDriveScope ? "✅ Present" : "❌ Missing"}`);
            addTestResult("OAuth Token", hasPickerScope ? "PASS" : "FAIL", `Picker scope: ${hasPickerScope ? "✅ Present" : "❌ Missing"}`);
          }
        } catch (scopeError) {
          console.log(`[OAuth Test] Could not fetch token info:`, scopeError);
        }
      } else {
        const errorText = await response.text();
        console.error(`[OAuth Test] Failed:`, response.status, errorText);
        addTestResult("OAuth Token", "FAIL", `HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`[OAuth Test] Error:`, error);
      addTestResult("OAuth Token", "FAIL", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGooglePhotosAPI = async () => {
    if (!accessToken) {
      addTestResult("Google Photos API", "FAIL", "No access token available");
      return;
    }

    try {
      setLoading(true);
      addTestResult("Google Photos API", "TESTING", "Testing Google Photos API access...");
      console.log(`[Photos API Test] Testing with token: ${accessToken.substring(0, 20)}...`);

      // First, let's check what scopes are required by the Photos API
      console.log(`[Photos API Test] Required scope: https://www.googleapis.com/auth/photoslibrary.readonly`);
      console.log(`[Photos API Test] Alternative scope: https://www.googleapis.com/auth/photoslibrary`);

      const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Photos API Test] Success:`, data);
        addTestResult("Google Photos API", "PASS", `Found ${data.mediaItems?.length || 0} photos`);
      } else {
        const errorText = await response.text();
        console.error(`[Photos API Test] Failed:`, response.status, errorText);
        console.error(`[Photos API Test] This means your token is missing the required scope: https://www.googleapis.com/auth/photoslibrary.readonly`);
        addTestResult("Google Photos API", "FAIL", `HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`[Photos API Test] Error:`, error);
      addTestResult("Google Photos API", "FAIL", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGoogleDriveAPI = async () => {
    if (!accessToken) {
      addTestResult("Google Drive API", "FAIL", "No access token available");
      return;
    }

    try {
      setLoading(true);
      addTestResult("Google Drive API", "TESTING", "Testing Google Drive API access...");

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=mimeType contains 'image/'&pageSize=5`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult("Google Drive API", "PASS", `Found ${data.files?.length || 0} image files`);
      } else {
        const errorText = await response.text();
        addTestResult("Google Drive API", "FAIL", `HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      addTestResult("Google Drive API", "FAIL", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGooglePickerAPI = async () => {
    if (!accessToken) {
      addTestResult("Google Picker API", "FAIL", "No access token available");
      return;
    }

    try {
      setLoading(true);
      addTestResult("Google Picker API", "TESTING", "Testing Google Picker API availability...");

      // Test if we can load the Google Picker JavaScript library
      const response = await fetch("https://apis.google.com/js/api.js");

      if (response.ok) {
        addTestResult("Google Picker API", "PASS", "Google Picker JavaScript library is accessible");
      } else {
        addTestResult("Google Picker API", "FAIL", `Cannot access Google Picker library: HTTP ${response.status}`);
      }
    } catch (error) {
      addTestResult("Google Picker API", "FAIL", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inspectTokenScopes = async () => {
    if (!accessToken) {
      addTestResult("Scope Inspection", "FAIL", "No access token available");
      return;
    }

    try {
      setLoading(true);
      addTestResult("Scope Inspection", "TESTING", "Inspecting token scopes...");
      console.log("[Scope Inspection] Starting detailed scope analysis...");

      const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);

      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json();
        console.log("[Scope Inspection] Full token info:", JSON.stringify(tokenInfo, null, 2));

        const scopes = tokenInfo.scope?.split(" ") || [];
        console.log(`[Scope Inspection] All scopes (${scopes.length} total):`);
        scopes.forEach((scope, index) => {
          console.log(`[Scope Inspection]   ${index + 1}. ${scope}`);
        });

        // Check for specific scopes we need
        const requiredScopes = {
          "userinfo.email": "https://www.googleapis.com/auth/userinfo.email",
          "userinfo.profile": "https://www.googleapis.com/auth/userinfo.profile",
          "photoslibrary.readonly": "https://www.googleapis.com/auth/photoslibrary.readonly",
          "photospicker.mediaitems.readonly": "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
          "drive.readonly": "https://www.googleapis.com/auth/drive.readonly",
        };

        console.log("[Scope Inspection] Checking required scopes:");
        const scopeResults = {};

        Object.entries(requiredScopes).forEach(([name, scope]) => {
          const hasScope = scopes.includes(scope);
          scopeResults[name] = hasScope;
          console.log(`[Scope Inspection] ${name}: ${hasScope ? "✅ PRESENT" : "❌ MISSING"} (${scope})`);
        });

        const missingScopes = Object.entries(scopeResults)
          .filter(([_, hasScope]) => !hasScope)
          .map(([name, _]) => name);

        if (missingScopes.length > 0) {
          console.warn(`[Scope Inspection] ⚠️ MISSING SCOPES: ${missingScopes.join(", ")}`);
          addTestResult("Scope Inspection", "FAIL", `Missing scopes: ${missingScopes.join(", ")}`);
        } else {
          console.log("[Scope Inspection] ✅ All required scopes present!");
          addTestResult("Scope Inspection", "PASS", "All required scopes present");
        }

        addTestResult("Scope Inspection", "PASS", `Found ${scopes.length} scopes: ${scopes.join(", ")}`);
      } else {
        const errorText = await tokenInfoResponse.text();
        console.error("[Scope Inspection] Failed to get token info:", tokenInfoResponse.status, errorText);
        addTestResult("Scope Inspection", "FAIL", `HTTP ${tokenInfoResponse.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("[Scope Inspection] Error:", error);
      addTestResult("Scope Inspection", "FAIL", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testOAuthToken();
    await testGooglePhotosAPI();
    await testGoogleDriveAPI();
    await testGooglePickerAPI();
  };

  const forceReAuth = async () => {
    try {
      setLoading(true);
      addTestResult("Force Re-Auth", "TESTING", "Forcing complete re-authentication...");
      console.log("[Force Re-Auth] Starting complete re-authentication process...");

      // Clear all stored tokens
      await GoogleApiService.signOut();
      console.log("[Force Re-Auth] Cleared all stored tokens");

      // Force sign out from Google Sign-In
      try {
        await GoogleSignin.signOut();
        console.log("[Force Re-Auth] Signed out from Google Sign-In");
      } catch (signOutError) {
        console.log("[Force Re-Auth] No existing session to clear:", signOutError.message);
      }

      addTestResult("Force Re-Auth", "PASS", "Cleared all tokens. Please sign in again to get fresh scopes.");
      console.log("[Force Re-Auth] Complete. Please use the main app to sign in again.");
    } catch (error) {
      console.error("[Force Re-Auth] Error:", error);
      addTestResult("Force Re-Auth", "FAIL", `Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case "PASS":
        return "#4CAF50";
      case "FAIL":
        return "#F44336";
      case "TESTING":
        return "#FF9800";
      default:
        return "#666";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>API Tests</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.welcomeText}>Welcome {userInfo?.user?.name || "User"}!</Text>

        <Text style={styles.description}>This page tests various Google APIs to help diagnose the photo picker issue.</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.testButton} onPress={runAllTests} disabled={loading}>
            {loading ? <ActivityIndicator color='white' size='small' /> : <Text style={styles.testButtonText}>Run All Tests</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.testButton, styles.forceReAuthButton]} onPress={forceReAuth} disabled={loading}>
            <Text style={styles.testButtonText}>🔄 Force Re-Auth</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.smallButton} onPress={testOAuthToken} disabled={loading}>
            <Text style={styles.smallButtonText}>Test OAuth</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={testGooglePhotosAPI} disabled={loading}>
            <Text style={styles.smallButtonText}>Test Photos API</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={testGoogleDriveAPI} disabled={loading}>
            <Text style={styles.smallButtonText}>Test Drive API</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={testGooglePickerAPI} disabled={loading}>
            <Text style={styles.smallButtonText}>Test Picker API</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallButton, styles.scopeButton]} onPress={inspectTokenScopes} disabled={loading}>
            <Text style={styles.smallButtonText}>🔍 Inspect Scopes</Text>
          </TouchableOpacity>
        </View>

        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            {testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTest}>{result.test}</Text>
                  <Text style={[styles.resultStatus, { color: getResultColor(result.result) }]}>{result.result}</Text>
                </View>
                <Text style={styles.resultDetails}>{result.details}</Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Next Steps:</Text>
          <Text style={styles.instructionsText}>
            1. Run the tests above to see which APIs are working{"\n"}
            2. If Google Picker API fails, enable it in Google Cloud Console{"\n"}
            3. If OAuth fails, check your token scopes{"\n"}
            4. If Photos API fails, check your permissions
          </Text>
        </View>
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
    width: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },
  testButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  forceReAuthButton: {
    backgroundColor: "#FF9800",
  },
  testButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  smallButton: {
    backgroundColor: "#34A853",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    flex: 1,
    minWidth: 80,
  },
  scopeButton: {
    backgroundColor: "#9C27B0",
  },
  smallButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  resultsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  resultItem: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },
  resultDetails: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 10,
    color: "#999",
  },
  instructionsContainer: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbdefb",
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1976d2",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: "#1976d2",
    lineHeight: 16,
  },
});
