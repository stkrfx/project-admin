/*
 * File: src/components/video/Whiteboard.js
 * FIX: "Line from top-left" bug solved by saving initial coordinates
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = ["#000000", "#e11d48", "#2563eb", "#16a34a", "#d97706"];

export default function Whiteboard({ socket, roomId, canvasRef }) {
  const containerRef = useRef(null);
  const internalRef = useRef(null);
  const canvas = canvasRef || internalRef;

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pen"); // pen | eraser

  /* ---------------- DRAWING ---------------- */

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    setIsDrawing(true);

    // ✅ CRITICAL FIX
    canvas.current.lastX = offsetX;
    canvas.current.lastY = offsetY;

    // Optional: dot on click
    drawLine(offsetX, offsetY, offsetX, offsetY, true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = getCoordinates(e);
    const { lastX, lastY } = canvas.current;

    if (lastX == null || lastY == null) return;

    drawLine(lastX, lastY, offsetX, offsetY, true);

    canvas.current.lastX = offsetX;
    canvas.current.lastY = offsetY;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvas.current.lastX = null;
    canvas.current.lastY = null;
  };

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

  /* ---------------- HELPERS ---------------- */

  const getCoordinates = (e) => {
    if (e.nativeEvent.touches?.length) {
      const rect = canvas.current.getBoundingClientRect();
      return {
        offsetX: e.nativeEvent.touches[0].clientX - rect.left,
        offsetY: e.nativeEvent.touches[0].clientY - rect.top,
      };
    }

    return {
      offsetX: e.nativeEvent.offsetX ?? 0,
      offsetY: e.nativeEvent.offsetY ?? 0,
    };
  };

  /* ---------------- RESIZE ---------------- */

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

  const clearBoard = () => {
    const ctx = canvas.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
    socket?.emit("wb-clear", roomId);
  };

  /* ---------------- UI ---------------- */

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-white cursor-crosshair touch-none overflow-hidden rounded-xl border border-zinc-200"
    >
      <canvas
        ref={canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="block w-full h-full touch-none"
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
              color === c && tool === "pen" && "ring-2 ring-offset-2 ring-zinc-400"
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
