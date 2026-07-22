import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from "./App";
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");
      await navigator.serviceWorker.ready;
      console.log("Service Worker Registered!");

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data === "UPDATED") {
          const accepted = confirm("New update has been applied!\nReload the app now?");
          if (accepted) window.location.reload();
          return;
        }
        console.log("Message From SW:", event.data);
      });

      const controller = navigator.serviceWorker.controller ?? registration.active;
      controller?.postMessage("CHECK-UPDATE");
    }
    catch (err) { console.error("Service Worker Error:", err); }
  });
}
