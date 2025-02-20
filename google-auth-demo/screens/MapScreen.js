import React, { useState, useRef } from "react";
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import config from "../config";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// San Francisco coordinates
const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

export default function MapScreen({ onLogout }) {
  const [region, setRegion] = useState(DEFAULT_LOCATION);
  const [markerLocation, setMarkerLocation] = useState(DEFAULT_LOCATION);
  const mapRef = useRef(null);

  const handlePlaceSelected = (data, details = null) => {
    console.log("Place selected:", data.description);
    if (details) {
      console.log("Place details:", details);
      const newLocation = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newLocation);
      setMarkerLocation(newLocation);

      // Animate map to new location
      mapRef.current?.animateToRegion(newLocation, 1000);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.container}>
        <GooglePlacesAutocomplete
          placeholder='Search for a location'
          minLength={2}
          autoFocus={false}
          returnKeyType={"search"}
          fetchDetails={true}
          enablePoweredByContainer={false}
          onPress={handlePlaceSelected}
          query={{
            key: config.googleMapsApiKey,
            language: "en",
            components: "country:us",
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInput: styles.autocompleteInput,
            listView: styles.autocompleteList,
            row: styles.autocompleteRow,
            description: styles.autocompleteDescription,
          }}
          textInputProps={{
            clearButtonMode: "while-editing",
          }}
          nearbyPlacesAPI='GooglePlacesSearch'
          debounce={300}
        />
        <MapView ref={mapRef} style={styles.map} region={region} onRegionChangeComplete={setRegion}>
          <Marker
            coordinate={{
              latitude: markerLocation.latitude,
              longitude: markerLocation.longitude,
            }}
          />
        </MapView>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  map: {
    flex: 1,
  },
  autocompleteContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
    elevation: 3,
  },
  autocompleteInput: {
    height: 44,
    fontSize: 16,
    backgroundColor: "white",
    borderRadius: 5,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  autocompleteList: {
    backgroundColor: "white",
    borderRadius: 5,
    marginTop: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  autocompleteRow: {
    padding: 13,
    height: 44,
    flexDirection: "row",
  },
  autocompleteDescription: {
    fontSize: 14,
  },
  logoutButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: "#f44336",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
