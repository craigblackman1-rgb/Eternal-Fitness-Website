"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export function SignaturePad({
  label,
  value,
  onChange,
  required = false,
  error,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [liveRegionMessage, setLiveRegionMessage] = useState("");

  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = "#1E1E1E";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }

    if (value) {
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        }
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      if (hasSignature) {
        const currentData = canvasRef.current?.toDataURL();
        initCanvas();
        if (currentData) {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            const container = containerRef.current;
            if (canvas && ctx && container) {
              const rect = container.getBoundingClientRect();
              ctx.drawImage(img, 0, 0, rect.width, rect.height);
            }
          };
          img.src = currentData;
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas, hasSignature]);

  const getRelativePos = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getRelativePos(e);
    lastPoint.current = pos;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const pos = getRelativePos(e);
    const container = containerRef.current;
    if (!container) return;

    ctx.beginPath();
    if (lastPoint.current) {
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    }
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPoint.current = pos;

    if (!hasSignature) {
      setHasSignature(true);
      setLiveRegionMessage("Signature started");
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null;
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    setLiveRegionMessage("Signature saved");
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    const rect = container.getBoundingClientRect();
    if (ctx) {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setHasSignature(false);
    setIsDrawingMode(false);
    onChange("");
    setLiveRegionMessage("Signature cleared");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isDrawingMode) {
        setIsDrawingMode(true);
        setLiveRegionMessage(
          "Drawing mode enabled. Use arrow keys to draw. Press Escape to exit."
        );
      }
    }
    if (e.key === "Escape" && isDrawingMode) {
      setIsDrawingMode(false);
      saveSignature();
      setLiveRegionMessage("Drawing mode exited. Signature saved.");
    }
  };

  const handleArrowDraw = (dx: number, dy: number) => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;

    if (!lastPoint.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      lastPoint.current = { x: rect.width / 2, y: rect.height / 2 };
    }

    const pos = {
      x: lastPoint.current.x + dx,
      y: lastPoint.current.y + dy,
    };

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPoint.current = pos;
    setHasSignature(true);
  };

  useEffect(() => {
    if (!isDrawingMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 5;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          handleArrowDraw(0, -step);
          break;
        case "ArrowDown":
          e.preventDefault();
          handleArrowDraw(0, step);
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleArrowDraw(-step, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleArrowDraw(step, 0);
          break;
        case "Escape":
          setIsDrawingMode(false);
          saveSignature();
          setLiveRegionMessage("Drawing mode exited. Signature saved.");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawingMode]);

  return (
    <div className={cn("w-full", className)}>
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">{label}</legend>

        <div
          ref={containerRef}
          className={cn(
            "relative w-full h-32 sm:h-40 border-2 rounded-md bg-white",
            error ? "border-red-500" : "border-[#D9D9D9]",
            isDrawingMode && "ring-2 ring-[#087E8B] border-[#087E8B]",
            "focus-within:ring-2 focus-within:ring-[#087E8B] focus-within:border-[#087E8B]"
          )}
          role="application"
          aria-label={`${label} - draw your signature`}
          aria-describedby={`signature-help-${label.replace(/\s/g, "")}`}
        >
          {!hasSignature && !isDrawingMode && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[#525A61] text-sm italic">
                Draw signature here
              </span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            aria-hidden="true"
          />

          {isDrawingMode && (
            <div className="absolute top-2 right-2 bg-[#087E8B] text-white text-xs px-2 py-1 rounded">
              Arrow key mode
            </div>
          )}
        </div>

        <div
          id={`signature-help-${label.replace(/\s/g, "")}`}
          className="sr-only"
        >
          {isDrawingMode
            ? "Use arrow keys to draw. Press Escape to finish."
            : "Press Enter or Space to enable arrow key drawing mode, or use mouse or touch to draw directly."}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={clearSignature}
            className="text-sm text-[#525A61] hover:text-[#1E1E1E] underline focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:ring-offset-2 rounded px-2 py-1"
            aria-label={`Clear ${label}`}
          >
            Clear
          </button>
          {hasSignature && (
            <span className="text-sm text-green-700" aria-live="polite">
              Signature captured
            </span>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-1" role="alert">
            {error}
          </p>
        )}
      </fieldset>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveRegionMessage}
      </div>
    </div>
  );
}
