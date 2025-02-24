import { BleManager } from "react-native-ble-plx";
import { Platform } from "react-native";

const bleManager = new BleManager();

export const startAdvertising = async () => {
  if (Platform.OS !== "android") {
    console.warn("BLE Advertising is only supported on Android.");
    return;
  }

  try {
    await bleManager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        console.error("BLE Scan Error:", error);
        return;
      }
      console.log(`Discovered Device: ${device.name} - ${device.id}`);
    });

    console.log("Started BLE Advertising...");
  } catch (error) {
    console.error("BLE Advertising Error:", error);
  }
};

export const startScanning = async () => {
  try {
    bleManager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
      if (error) {
        console.error("BLE Scan Error:", error);
        return;
      }
      console.log(`Scanned Device: ${device.name || "Unknown"} - ${device.id}`);
    });

    console.log("Started BLE Scanning...");
  } catch (error) {
    console.error("BLE Scanning Error:", error);
  }
};

export const stopScanning = () => {
  bleManager.stopDeviceScan();
  console.log("Stopped BLE Scanning.");
};
