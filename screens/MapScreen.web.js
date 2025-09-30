import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";

export default function MapScreen({ onLogout, onError }) {
  const mapRef = useRef(null);

  useEffect(() => {
    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Load the Google Maps API
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        if (onError) onError("Failed to load Google Maps API");
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
          zoom: 10,
          mapTypeId: "roadmap",
        });

        // Add a marker
        new window.google.maps.Marker({
          position: { lat: 37.7749, lng: -122.4194 },
          map: map,
          title: "San Francisco",
        });

        console.log("Google Maps initialized successfully");
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        if (onError) onError("Error initializing Google Maps: " + error.message);
      }
    };

    loadGoogleMaps();

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      scripts.forEach((script) => script.remove());
    };
  }, [onError]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map Screen (Web Version)</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <div ref={mapRef} style={styles.map} id='google-map' />
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
  logoutButton: {
    padding: 10,
    backgroundColor: "#dc3545",
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
    height: 400,
  },
  map: {
    width: "100%",
    height: "100%",
    minHeight: 400,
  },
});
