"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignaturePadProps {
  label: string;
  value?: string;
  typedValue?: string;
  onChange: (dataUrl: string) => void;
  onTypedChange?: (text: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
  prefillText?: string;
}

export function SignaturePad({
  label,
  value,
  typedValue = "",
  onChange,
  onTypedChange,
  required = false,
  error,
  className,
  prefillText,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [useTypedSignature, setUseTypedSignature] = useState(!!prefillText);
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

    if (value && !useTypedSignature) {
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
  }, [value, useTypedSignature]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      if (hasSignature && !useTypedSignature) {
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
  }, [initCanvas, hasSignature, useTypedSignature]);

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
    onChange("");
    if (onTypedChange) onTypedChange("");
    setLiveRegionMessage("Signature cleared");
  };

  const handleTypedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (onTypedChange) {
      onTypedChange(text);
    }
    setHasSignature(text.length > 0);
    setLiveRegionMessage(text ? `Typed signature entered: ${text}` : "Typed signature cleared");
  };

  const toggleSignatureMode = () => {
    const newMode = !useTypedSignature;
    setUseTypedSignature(newMode);
    if (newMode) {
      setLiveRegionMessage("Switched to typed signature. Type your full name.");
    } else {
      setLiveRegionMessage("Switched to drawn signature. Use mouse or touch to draw.");
    }
  };

  const fieldId = label.replace(/\s/g, "").toLowerCase();

  return (
    <div className={cn("w-full", className)}>
      <fieldset className="border-0 p-0 m-0">
        <legend className="sr-only">{label}</legend>

        {onTypedChange && (
          <div className="mb-3">
            <button
              type="button"
              onClick={toggleSignatureMode}
              className="text-sm text-[#087E8B] hover:text-[#087E8B]/80 underline focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:ring-offset-2 rounded px-2 py-1"
              aria-label={useTypedSignature ? "Switch to drawn signature" : "Switch to typed signature"}
            >
              {useTypedSignature ? "Switch to drawn signature" : "Type your name instead"}
            </button>
          </div>
        )}

        {useTypedSignature && onTypedChange ? (
          <div>
            <Label htmlFor={`typed-${fieldId}`} className="text-[#1E1E1E] font-medium mb-2 block">
              Type your full name as signature <span className="text-red-600" aria-hidden="true">*</span>
            </Label>
            <Input
              id={`typed-${fieldId}`}
              type="text"
              value={typedValue}
              onChange={handleTypedChange}
              placeholder="Type your full name"
              className={cn(
                "w-full rounded-md border border-[#D9D9D9] bg-white px-3 py-2 text-[#1E1E1E] text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087E8B] focus-visible:ring-offset-2",
                error && "border-red-500 focus-visible:ring-red-500"
              )}
              required={required}
              aria-required={required}
              aria-invalid={!!error}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
            {typedValue && (
              <p className="text-sm text-[#525A61] mt-2 italic">
                Typed signature: {typedValue}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div
              ref={containerRef}
              className={cn(
                "relative w-full h-32 sm:h-40 border-2 rounded-md bg-white",
                error ? "border-red-500" : "border-[#D9D9D9]",
                "focus-within:ring-2 focus-within:ring-[#087E8B] focus-within:border-[#087E8B]"
              )}
              role="img"
              aria-label={`${label} area - use mouse or touch to draw your signature`}
            >
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[#525A61] text-sm italic">
                    Draw signature here with mouse or finger
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
                aria-hidden="true"
              />
            </div>

            <p id={`signature-help-${fieldId}`} className="sr-only">
              Use your mouse or finger to draw your signature in the box above.
            </p>
          </div>
        )}

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
          <p id={`${fieldId}-error`} className="text-sm text-red-600 mt-1" role="alert">
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
