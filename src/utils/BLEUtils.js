import { BleManager } from "react-native-ble-plx";

const bleManager = new BleManager();

// UUID for BLE broadcasting (replace with a valid one for your use case)
const SERVICE_UUID = "0000xxxx-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000yyyy-0000-1000-8000-00805f9b34fb";

// Start scanning for BLE devices
export const startBluetoothScan = () => {
  console.log("Starting BLE scan...");

  bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error("BLE Scan error:", error);
      return;
    }
    console.log(`Discovered device: ${device.name} (${device.id})`);
  });

  // Stop scanning after 10 seconds to save battery
  setTimeout(() => {
    bleManager.stopDeviceScan();
    console.log("Stopped BLE scan.");
  }, 10000);
};

// Start broadcasting a BLE signal
export const startBluetoothBroadcast = async () => {
  console.log("Starting BLE broadcast...");

  try {
    const device = await bleManager.connectedDevices([SERVICE_UUID]);

    if (device.length === 0) {
      console.warn("No connected device found to broadcast.");
      return;
    }

    const connectedDevice = device[0];

    // Send some data as a characteristic write (example payload)
    await connectedDevice.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CHARACTERISTIC_UUID,
      "48656c6c6f" // Hex encoded "Hello"
    );

    console.log("BLE Broadcast sent.");
  } catch (error) {
    console.error("BLE Broadcast error:", error);
  }
};

// Stop all BLE operations
export const stopBluetooth = () => {
  bleManager.stopDeviceScan();
  console.log("Stopped BLE scanning.");
};
