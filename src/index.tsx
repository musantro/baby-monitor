import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from "./App";
import './index.css';
import i18n, { translate } from "./i18n";

document.documentElement.lang = i18n.resolvedLanguage ?? "en-EN";
document.title = translate("app.title");

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
          const accepted = confirm(translate("app.update"));
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
