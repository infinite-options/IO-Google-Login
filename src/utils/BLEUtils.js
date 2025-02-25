// import { BleManager } from "react-native-ble-plx";
// import BleAdvertiser from "react-native-ble-advertiser";

// // Initialize the BleManager for scanning
// const bleManager = new BleManager();

// // UUID for BLE broadcasting (replace with a valid one for your use case)
// const SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
// const CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

// // Start scanning for BLE devices
// export const startBluetoothScan = () => {
//   console.log("Utils: Starting BLE scan...");

//   bleManager.startDeviceScan(null, null, (error, device) => {
//     if (error) {
//       console.error("Utils: BLE Scan error:", error);
//       return;
//     }
//     console.log(`Utils: Discovered device: ${device.name} (${device.id})`);
//   });

//   // Stop scanning after 10 seconds to save battery
//   setTimeout(() => {
//     bleManager.stopDeviceScan();
//     console.log("Utils: Stopped BLE scan.");
//   }, 10000);
// };

// // Start broadcasting a BLE signal (Advertising)
// export const startBluetoothBroadcast = async () => {
//   console.log("Utils: Starting BLE broadcast...");

//   try {
//     // Start BLE advertising with the service UUID
//     await BleAdvertiser.startAdvertising(
//       SERVICE_UUID, // Service UUID for advertising
//       {
//         name: "MyApp BLE Device", // Device name to advertise
//         txPowerLevel: 0, // Transmission power level (optional)
//         isConnectable: true, // Set whether the device is connectable
//         services: [SERVICE_UUID], // Services being advertised
//       }
//     );
//     console.log("Utils: BLE Broadcast started.");
//   } catch (error) {
//     console.error("Utils: BLE Broadcast error:", error);
//   }
// };

// // Stop all BLE operations (scan and advertising)
// export const stopBluetooth = () => {
//   bleManager.stopDeviceScan();
//   console.log("Utils: Stopped BLE scanning.");

//   // Stop advertising (BLE broadcast)
//   BleAdvertiser.stopAdvertising()
//     .then(() => {
//       console.log("Utils: BLE Broadcast stopped.");
//     })
//     .catch((error) => {
//       console.error("Utils: Failed to stop BLE Broadcast:", error);
//     });
// };

import { BleManager } from "react-native-ble-plx";
import BleAdvertiser from "react-native-ble-advertiser";
import { Platform } from "react-native";

const bleManager = new BleManager();

// UUID for BLE broadcasting (replace with a valid one for your use case)
const SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";

// Start scanning for BLE devices using react-native-ble-plx
export const startBluetoothScan = () => {
  console.log("Utils: Starting BLE scan...");

  bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.error("Utils: BLE Scan error:", error);
      return;
    }
    console.log(`Utils: Discovered device: ${device.name || "Unknown"} (${device.id})`);
  });

  // Stop scanning after 10 seconds to save battery
  setTimeout(() => {
    bleManager.stopDeviceScan();
    console.log("Utils: Stopped BLE scan.");
  }, 10000);
};

// Start broadcasting a BLE signal (Advertising) using react-native-ble-advertiser
export const startBluetoothBroadcast = async () => {
  console.log("Utils: Starting BLE broadcast...");

  try {
    if (!BleAdvertiser) {
      console.error("Utils: BleAdvertiser is not available.");
      return;
    }

    await BleAdvertiser.setCompanyId(0x004c) // Apple Company ID (Use a valid one)
      .then(() => {
        console.log("Utils: Set Company ID successfully.");
      })
      .catch((error) => {
        console.error("Utils: Error setting Company ID:", error);
      });

    await BleAdvertiser.startAdvertising(SERVICE_UUID, CHARACTERISTIC_UUID, {
      advertiseMode: BleAdvertiser.ADVERTISE_MODE_BALANCED,
      txPowerLevel: BleAdvertiser.ADVERTISE_TX_POWER_MEDIUM,
      includeDeviceName: true,
      connectable: true, // Must be true for peripheral mode
    })
      .then(() => console.log("Utils: BLE Advertising started in Peripheral Mode"))
      .catch((error) => {
        console.error("Utils: BLE Advertising error:", error);
      });
  } catch (error) {
    console.error("Utils: BLE Broadcast error:", error);
  }
};

// Stop BLE advertising
export const stopBluetoothBroadcast = () => {
  console.log("Utils: Stopping BLE broadcast...");
  BleAdvertiser.stopAdvertising()
    .then(() => console.log("Utils: BLE Broadcast stopped."))
    .catch((error) => console.error("Utils: BLE Broadcast stop error:", error));
};

// Stop all BLE operations
export const stopBluetooth = () => {
  console.log("Utils: Stopping BLE scanning...");
  bleManager.stopDeviceScan();
};
