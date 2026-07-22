import { useState, useEffect } from "react";

export function usePWAInstaller(PWA_KEY) {
    if (typeof PWA_KEY !== "string") PWA_KEY = "app-name";

    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        function checkPWAInstallation() {
            try {
                let isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
                if ('getInstalledRelatedApps' in navigator) navigator.getInstalledRelatedApps().then(apps => {
                    isInstalled = apps.length > 0 || isInstalled;
                    setIsPWAInstalled(isInstalled);
                });
                isInstalled = !!localStorage.getItem(PWA_KEY) || isInstalled;
                setIsPWAInstalled(isInstalled);
            } catch (error) { console.error(error); }
        };

        function captureBrowserPrompt(event) {
            event.preventDefault();
            event.userChoice.then(choice => {
                console.log("PWA installation is " + choice.outcome + "!");
                if (choice.outcome === "accepted") localStorage.setItem(PWA_KEY, choice.outcome);
            });
            localStorage.removeItem(PWA_KEY);
            setIsPWAInstalled(false);
            setInstallPrompt(event);
        }

        checkPWAInstallation();
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener("change", checkPWAInstallation);
        window.addEventListener("beforeinstallprompt", captureBrowserPrompt);

        return () => {
            mediaQuery.removeEventListener("change", checkPWAInstallation);
            window.removeEventListener("beforeinstallprompt", captureBrowserPrompt);
        };
    }, [PWA_KEY]);

    return [isPWAInstalled, installPrompt];
}
