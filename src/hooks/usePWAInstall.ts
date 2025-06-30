import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    // Kiểm tra xem app đã được cài đặt chưa
    const checkStandalone = () => {
      const isInStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as typeof window.navigator & { standalone?: boolean })
          .standalone ||
        document.referrer.includes("android-app://");
      setIsStandalone(isInStandaloneMode);
    };

    // Detect device type
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);

      if (isIOS) {
        setDeviceType("ios");
        setIsInstallable(true); // iOS luôn có thể cài đặt PWA thủ công
      } else if (isAndroid) {
        setDeviceType("android");
      } else {
        setDeviceType("desktop");
      }
    };

    // Lắng nghe sự kiện beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Lắng nghe sự kiện app được cài đặt
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    checkStandalone();
    detectDevice();

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Install failed:", error);
      return false;
    }
  };

  const canInstall = isInstallable && !isStandalone;

  return {
    canInstall,
    isStandalone,
    deviceType,
    install,
    deferredPrompt: !!deferredPrompt,
  };
};
