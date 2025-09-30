import { AppRegistry } from "react-native";
import App from "./App";
import TestApp from "./TestApp";
import { name as appName } from "./app.json";

// Register the main component
AppRegistry.registerComponent(appName, () => App);

// For web, we need to run the app
if (typeof document !== "undefined") {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      AppRegistry.runApplication(appName, {
        initialProps: {},
        rootTag: document.getElementById("root"),
      });
    });
  } else {
    AppRegistry.runApplication(appName, {
      initialProps: {},
      rootTag: document.getElementById("root"),
    });
  }
}
