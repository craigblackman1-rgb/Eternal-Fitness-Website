"use client";

import { useEffect, useState } from "react";

const TEXT_KEY = "ef-doc-text";
const CONTRAST_KEY = "ef-doc-contrast";

type TextSet = "normal" | "large" | "xlarge";

function getInitialText(): TextSet {
  if (typeof document === "undefined") return "normal";
  const v = document.documentElement.getAttribute("data-text");
  return v === "large" || v === "xlarge" ? v : "normal";
}

function getInitialContrast(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.getAttribute("data-contrast") === "high";
}

/**
 * Real accessibility controls for client documents: text size (Normal/Larger/
 * Largest) and a high-contrast toggle, persisted to localStorage. These are
 * genuine features for EF's clinical / visually-impaired client population,
 * ported from the brand-staging reference's inline script into a React effect.
 */
export function DocumentAccessibilityControls() {
  const [text, setText] = useState<TextSet>("normal");
  const [contrast, setContrast] = useState(false);

  // Hydrate from saved state on first mount.
  useEffect(() => {
    try {
      const savedText = localStorage.getItem(TEXT_KEY) as TextSet | null;
      const savedContrast = localStorage.getItem(CONTRAST_KEY);
      if (savedText) setText(savedText);
      if (savedContrast === "high") setContrast(true);
    } catch {
      /* localStorage unavailable — degrade gracefully */
    }
  }, []);

  // Reflect state onto <html> data attributes, which the CSS consumes.
  useEffect(() => {
    const root = document.documentElement;
    if (text === "normal") root.removeAttribute("data-text");
    else root.setAttribute("data-text", text);
    if (contrast) root.setAttribute("data-contrast", "high");
    else root.removeAttribute("data-contrast");
  }, [text, contrast]);

  const chooseText = (next: TextSet) => {
    setText(next);
    try {
      localStorage.setItem(TEXT_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const toggleContrast = () => {
    const next = !contrast;
    setContrast(next);
    try {
      localStorage.setItem(CONTRAST_KEY, next ? "high" : "normal");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="doc-toolbar no-print">
      <div className="doc-toolbar__inner">
        <div className="doc-toolbar__group" role="group" aria-labelledby="textsize-label">
          <span className="doc-toolbar__label" id="textsize-label">
            Text size
          </span>
          <button
            type="button"
            className="ctrl"
            aria-pressed={text === "normal"}
            onClick={() => chooseText("normal")}
          >
            Normal
          </button>
          <button
            type="button"
            className="ctrl"
            aria-pressed={text === "large"}
            onClick={() => chooseText("large")}
          >
            Larger
          </button>
          <button
            type="button"
            className="ctrl"
            aria-pressed={text === "xlarge"}
            onClick={() => chooseText("xlarge")}
          >
            Largest
          </button>
        </div>
        <div className="doc-toolbar__group">
          <button type="button" className="ctrl" aria-pressed={contrast} onClick={toggleContrast}>
            High contrast
          </button>
        </div>
        <div className="doc-toolbar__group doc-toolbar__spacer">
          <button type="button" className="ctrl" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
