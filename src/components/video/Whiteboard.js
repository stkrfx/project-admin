/*
 * File: src/components/video/Whiteboard.js
 * ROLE: Shared Whiteboard (Expert Side)
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
  // Use passed ref or internal fallback
  const canvas = canvasRef || internalRef;

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pen"); // pen | eraser

  // --- DRAWING LOGIC ---
  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    setIsDrawing(true);
    drawLine(offsetX, offsetY, offsetX, offsetY, true); // Dot
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(e);
    const { lastX, lastY } = canvas.current;
    
    drawLine(lastX, lastY, offsetX, offsetY, true);
    
    // Save current pos
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

    // Drawing settings
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : 2;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    if (emit && socket) {
      // Normalize coordinates (0-1) for responsiveness
      socket.emit("wb-draw", {
        roomId,
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: ctx.strokeStyle,
        width: ctx.lineWidth
      });
    }
  };

  // Helper: Get Touch/Mouse Coordinates
  const getCoordinates = (e) => {
    // Mobile Touch Support
    if (e.nativeEvent.touches && e.nativeEvent.touches.length > 0) {
      const rect = canvas.current.getBoundingClientRect();
      return {
        offsetX: e.nativeEvent.touches[0].clientX - rect.left,
        offsetY: e.nativeEvent.touches[0].clientY - rect.top
      };
    }
    // Desktop Mouse Support
    return { 
        offsetX: e.nativeEvent.offsetX || 0, 
        offsetY: e.nativeEvent.offsetY || 0 
    };
  };

  // --- RESIZE HANDLER ---
  useEffect(() => {
    const handleResize = () => {
        if (canvas.current && containerRef.current) {
            // 1. Save image data
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            tempCanvas.width = canvas.current.width;
            tempCanvas.height = canvas.current.height;
            tempCtx.drawImage(canvas.current, 0, 0);

            // 2. Resize
            canvas.current.width = containerRef.current.offsetWidth;
            canvas.current.height = containerRef.current.offsetHeight;

            // 3. Restore & White BG
            const ctx = canvas.current.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
            ctx.drawImage(tempCanvas, 0, 0, canvas.current.width, canvas.current.height);
        }
    };

    window.addEventListener("resize", handleResize);
    setTimeout(handleResize, 100); // Initial sizing
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const clearBoard = () => {
    const ctx = canvas.current.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);
    if (socket) socket.emit("wb-clear", roomId);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white cursor-crosshair touch-none overflow-hidden rounded-xl border border-zinc-200">
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

      {/* FLOATING TOOLBAR */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur border border-zinc-200 shadow-lg rounded-full p-1.5 flex items-center gap-1 sm:gap-2 z-10">
        
        {/* Colors */}
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { setColor(c); setTool("pen"); }}
            className={cn(
              "w-6 h-6 rounded-full border transition-transform hover:scale-110",
              color === c && tool === "pen" ? "ring-2 ring-offset-1 ring-zinc-400 scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {/* Tools */}
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
          className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={clearBoard}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}