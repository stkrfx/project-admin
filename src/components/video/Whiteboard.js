/*
 * File: src/components/video/Whiteboard.js
 *
 * EXPERT SIDE – FINAL VERSION
 * ----------------------------------------
 * FEATURES:
 * - Realtime drawing sync (wb-draw)
 * - Throttled cursor emission (~30fps)
 * - Cursor visible even when hovering (not drawing)
 * - Clean cursor hide on mouse leave / touch end
 * - Local expert watermark follows cursor instantly (no socket delay)
 * - Resize-safe redraw
 * - White background preserved
 * - Matches User-side behavior exactly
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ----------------------------------------
 * Config
 * -------------------------------------- */

const COLORS = ["#000000", "#e11d48", "#2563eb", "#16a34a", "#d97706"];
const EXPERT_WATERMARK_URL = "https://github.com/shadcn.png"; // replace with your logo

/* ----------------------------------------
 * Component
 * -------------------------------------- */

export default function Whiteboard({ socket, roomId, canvasRef }) {
  const containerRef = useRef(null);
  const internalRef = useRef(null);
  const cursorRef = useRef(null);
  const canvas = canvasRef || internalRef;

  const lastEmitRef = useRef(0);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pen");

  /* ----------------------------------------
   * Drawing Start
   * -------------------------------------- */

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    setIsDrawing(true);

    canvas.current.lastX = offsetX;
    canvas.current.lastY = offsetY;

    updateLocalCursor(offsetX, offsetY, true);
    drawLine(offsetX, offsetY, offsetX, offsetY, true);
    emitCursor(offsetX, offsetY);
  };

  /* ----------------------------------------
   * Pointer Move
   * -------------------------------------- */

  const handleMove = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);

    // Local visual cursor (instant)
    updateLocalCursor(offsetX, offsetY, true);

    // Network cursor (throttled)
    emitCursor(offsetX, offsetY);

    if (!isDrawing) return;

    const { lastX, lastY } = canvas.current;
    if (lastX == null || lastY == null) return;

    drawLine(lastX, lastY, offsetX, offsetY, true);
    canvas.current.lastX = offsetX;
    canvas.current.lastY = offsetY;
  };

  /* ----------------------------------------
   * Stop / Leave
   * -------------------------------------- */

  const stopDrawing = () => {
    setIsDrawing(false);
    canvas.current.lastX = null;
    canvas.current.lastY = null;
  };

  const handleLeave = () => {
    stopDrawing();
    hideLocalCursor();

    socket?.emit("wb-cursor", {
      roomId,
      hidden: true,
    });
  };

  /* ----------------------------------------
   * Drawing Core
   * -------------------------------------- */

  const drawLine = (x0, y0, x1, y1, emit) => {
    const ctx = canvas.current.getContext("2d");
    const w = canvas.current.width;
    const h = canvas.current.height;

    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : 2;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    if (emit && socket) {
      socket.emit("wb-draw", {
        roomId,
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: ctx.strokeStyle,
        width: ctx.lineWidth,
      });
    }
  };

  /* ----------------------------------------
   * Cursor Emit (Network)
   * -------------------------------------- */

  const emitCursor = (x, y) => {
    if (!socket || !canvas.current) return;

    const now = Date.now();
    if (now - lastEmitRef.current < 30) return;

    const w = canvas.current.width;
    const h = canvas.current.height;

    socket.emit("wb-cursor", {
      roomId,
      x: x / w,
      y: y / h,
    });

    lastEmitRef.current = now;
  };

  /* ----------------------------------------
   * Local Cursor (DOM)
   * -------------------------------------- */

  const updateLocalCursor = (x, y, visible) => {
    if (!cursorRef.current) return;

    if (!visible) {
      cursorRef.current.style.opacity = "0";
      return;
    }

    cursorRef.current.style.opacity = "0.7";
    cursorRef.current.style.transform = `translate(${x + 10}px, ${y + 10}px)`;
  };

  const hideLocalCursor = () => {
    if (cursorRef.current) {
      cursorRef.current.style.opacity = "0";
    }
  };

  /* ----------------------------------------
   * Coordinates Helper
   * -------------------------------------- */

  const getCoordinates = (e) => {
    if (e.nativeEvent?.touches?.length) {
      const rect = canvas.current.getBoundingClientRect();
      return {
        offsetX: e.nativeEvent.touches[0].clientX - rect.left,
        offsetY: e.nativeEvent.touches[0].clientY - rect.top,
      };
    }

    if (e.changedTouches?.length) {
      const rect = canvas.current.getBoundingClientRect();
      return {
        offsetX: e.changedTouches[0].clientX - rect.left,
        offsetY: e.changedTouches[0].clientY - rect.top,
      };
    }

    return {
      offsetX: e.nativeEvent?.offsetX ?? 0,
      offsetY: e.nativeEvent?.offsetY ?? 0,
    };
  };

  /* ----------------------------------------
   * Resize Safe Redraw
   * -------------------------------------- */

  useEffect(() => {
    const handleResize = () => {
      if (!canvas.current || !containerRef.current) return;

      const temp = document.createElement("canvas");
      temp.width = canvas.current.width;
      temp.height = canvas.current.height;
      temp.getContext("2d").drawImage(canvas.current, 0, 0);

      canvas.current.width = containerRef.current.offsetWidth;
      canvas.current.height = containerRef.current.offsetHeight;

      const ctx = canvas.current.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
      ctx.drawImage(temp, 0, 0, canvas.current.width, canvas.current.height);
    };

    window.addEventListener("resize", handleResize);
    setTimeout(handleResize, 100);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ----------------------------------------
   * Clear Board
   * -------------------------------------- */

  const clearBoard = () => {
    const ctx = canvas.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
    socket?.emit("wb-clear", roomId);
  };

  /* ----------------------------------------
   * UI
   * -------------------------------------- */

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white cursor-crosshair touch-none overflow-hidden rounded-xl border border-zinc-200"
    >
      <canvas
        ref={canvas}
        onMouseDown={startDrawing}
        onMouseMove={handleMove}
        onMouseUp={stopDrawing}
        onMouseOut={handleLeave}
        onTouchStart={startDrawing}
        onTouchMove={handleMove}
        onTouchEnd={handleLeave}
        className="block w-full h-full touch-none"
      />

      {/* LOCAL EXPERT WATERMARK */}
      <img
        ref={cursorRef}
        src={EXPERT_WATERMARK_URL}
        alt="Expert Cursor"
        className="absolute w-8 h-8 rounded-full border-2 border-indigo-500 shadow-md pointer-events-none transition-opacity duration-150 z-50 opacity-0"
        style={{ top: 0, left: 0, willChange: "transform" }}
      />

      {/* TOOLBAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-zinc-200 shadow-lg rounded-full p-2 flex items-center gap-2 z-10">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setTool("pen");
            }}
            className={cn(
              "w-6 h-6 rounded-full transition-transform hover:scale-110",
              color === c &&
                tool === "pen" &&
                "ring-2 ring-offset-2 ring-zinc-400"
            )}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        <Button
          size="icon"
          variant={tool === "eraser" ? "secondary" : "ghost"}
          className="h-8 w-8 rounded-full"
          onClick={() => setTool("eraser")}
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50"
          onClick={clearBoard}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
