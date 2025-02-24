import { PermissionsAndroid, Platform } from "react-native";

export const requestBluetoothPermissions = async () => {
  if (Platform.OS === "android" && Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log("Bluetooth permissions granted");
        return true;
      } else {
        console.warn("Bluetooth permissions denied");
        return false;
      }
    } catch (error) {
      console.error("Error requesting Bluetooth permissions:", error);
      return false;
    }
  } else {
    return true; // No need to request on Android < 12
  }
};
