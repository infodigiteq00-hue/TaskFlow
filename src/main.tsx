import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker so reminders can show system notifications when tab is in background or closed
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);
