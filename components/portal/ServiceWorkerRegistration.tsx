"use client";

import { useEffect } from "react";

let reloaded = false;

function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Event && error.target instanceof HTMLScriptElement) {
    const src = error.target.src || "";
    if (src.includes("/_next/static/chunks/") || src.includes("/_next/static/media/")) {
      return true;
    }
  }
  if (error instanceof Error) {
    const msg = error.message || "";
    if (
      msg.includes("ChunkLoadError") ||
      msg.includes("Loading chunk") ||
      msg.includes("Failed to fetch dynamically imported module")
    ) {
      return true;
    }
  }
  return false;
}

function handleChunkError() {
  if (typeof window === "undefined") return;
  try {
    const last = sessionStorage.getItem("chunk-reload-ts");
    if (last && Date.now() - Number(last) < 30000) return;
    sessionStorage.setItem("chunk-reload-ts", String(Date.now()));
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker.register("/portal/sw.js", { scope: "/portal/" }).then(function (reg) {
      reg.addEventListener("updatefound", function () {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", function () {
          if (newWorker.state === "activated" && !reloaded) {
            reloaded = true;
            window.location.reload();
          }
        });
      });
    }).catch(function (err) {
      console.error("Portal service worker registration failed:", err);
    });

    window.addEventListener("error", function (e) {
      if (isChunkLoadError(e)) handleChunkError();
    });
    window.addEventListener("unhandledrejection", function (e) {
      if (isChunkLoadError(e.reason)) handleChunkError();
    });
  }, []);

  return null;
}
