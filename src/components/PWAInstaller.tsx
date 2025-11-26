"use client";

import { useCallback, useEffect, useState } from "react";

export default function PWAInstaller({ ...props }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // PWA install web component'i sadece client-side'da import et
    import("@khmyznikov/pwa-install").then(() => {
      setIsClient(true);
    });
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    // @ts-ignore
    <pwa-install id="pwa-install" {...props}></pwa-install>
  );
}

export type PWAInstallerMethods = {
  install: (force?: boolean) => void;
  isListening?: boolean;
  showDialog: (force?: boolean) => void;
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
};

export function usePWAInstaller() {
  const [installer, setInstaller] = useState<PWAInstallerMethods | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = document.getElementById("pwa-install") as
      | PWAInstallerMethods
      | null;

    if (!el) return;

    setInstaller(el);

    if (!el.isListening) {
      el.isListening = true;

      el.addEventListener("pwa-install-success-event", (e) => {
        console.log("[installer] installation success:", e);
      });

      el.addEventListener("pwa-install-fail-event", (e) => {
        console.error("[installer] installation failed:", e);
      });

      el.addEventListener("pwa-install-available-event", (e) => {
        console.log("[installer] installation available:", e);
      });

      el.addEventListener("pwa-user-choice-result-event", (e) => {
        console.log("[installer] user choice result:", e);
      });

      el.addEventListener("pwa-install-how-to-event", (e) => {
        console.log("[installer] installation how to:", e);
      });

      el.addEventListener("pwa-install-gallery-event", (e) => {
        console.log("[installer] installation gallery:", e);
      });
    }
  }, []);

  const install = useCallback(
    (force?: boolean) => {
      if (!installer) return;
      installer.showDialog(force);

      console.log(
        `[installer] ${force ? "forced" : "prompted"} installation to:`,
        installer,
      );
    },
    [installer],
  );

  return { install };
}
