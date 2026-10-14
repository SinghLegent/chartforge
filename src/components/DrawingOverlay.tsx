"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { DrawingTool } from "./DrawingToolbar";

export type Point = { x: number; y: number };
export type Drawing = {
  id: string;
  type: DrawingTool;
  points: Point[];
  color: string;
  text?: string;
};

type Props = {
  tool: DrawingTool;
  drawings: Drawing[];
  onAdd: (d: Drawing) => void;
  onClear: () => void;
  width: number;
  height: number;
};

const COLORS: Record<string, string> = {
  trendline: "#2962ff", horizontal: "#f5a623", rectangle: "#26a69a",
  fib: "#e040fb", text: "#d1d4dc", measure: "#9598a1",
};

export default function DrawingOverlay({ tool, drawings, onAdd, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawAll = useCallback((ctx: CanvasRenderingContext2D, extra?: Point[]) => {
    ctx.clearRect(0, 0, width, height);
    const all = [...drawings];
    if (extra?.length) {
      all.push({ id: "temp", type: tool, points: extra, color: COLORS[tool] || "#2962ff" });
    }
    for (const d of all) {
      ctx.strokeStyle = d.color;
      ctx.fillStyle = d.color;
      ctx.lineWidth = 1.5;
      if (d.type === "trendline" && d.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        ctx.lineTo(d.points[1].x, d.points[1].y);
        ctx.stroke();
      } else if (d.type === "horizontal" && d.points.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(0, d.points[0].y);
        ctx.lineTo(width, d.points[0].y);
        ctx.stroke();
      } else if (d.type === "rectangle" && d.points.length >= 2) {
        const [a, b] = d.points;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
        ctx.globalAlpha = 1;
        ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
      }
    }
  }, [drawings, tool, width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) drawAll(ctx);
  }, [drawings, width, height, drawAll]);

  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10"
      style={{ pointerEvents: tool === "cursor" || tool === "eraser" ? "none" : "auto", cursor: tool === "cursor" ? "default" : "crosshair" }}
      onMouseDown={(e) => {
        if (tool === "cursor" || tool === "eraser") return;
        const p = getPos(e);
        setIsDrawing(true);
        if (tool === "horizontal" || tool === "text") {
          onAdd({ id: crypto.randomUUID(), type: tool, points: [p], color: COLORS[tool] || "#2962ff" });
          setIsDrawing(false);
        } else setCurrent([p]);
      }}
      onMouseMove={(e) => {
        if (!isDrawing || current.length === 0) return;
        const pts = [current[0], getPos(e)];
        setCurrent(pts);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) drawAll(ctx, pts);
      }}
      onMouseUp={(e) => {
        if (!isDrawing || current.length === 0) return;
        const pts = [current[0], getPos(e)];
        if (Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) > 4) {
          onAdd({ id: crypto.randomUUID(), type: tool, points: pts, color: COLORS[tool] || "#2962ff" });
        }
        setIsDrawing(false);
        setCurrent([]);
      }}
    />
  );
}
