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
  trendline: "#2962ff",
  horizontal: "#f5a623",
  rectangle: "#26a69a",
  fib: "#e040fb",
  text: "#d1d4dc",
  measure: "#9598a1",
};

export default function DrawingOverlay({
  tool,
  drawings,
  onAdd,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const currentRef = useRef<Point[]>([]);

  const drawAll = useCallback(
    (ctx: CanvasRenderingContext2D, extra?: Point[]) => {
      ctx.clearRect(0, 0, width, height);
      const all = [...drawings];
      if (extra && extra.length) {
        all.push({
          id: "temp",
          type: tool,
          points: extra,
          color: COLORS[tool] || "#2962ff",
        });
      }

      for (const d of all) {
        ctx.strokeStyle = d.color;
        ctx.fillStyle = d.color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.setLineDash([]);

        if (d.type === "trendline" && d.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(d.points[0].x, d.points[0].y);
          ctx.lineTo(d.points[1].x, d.points[1].y);
          ctx.stroke();
          // endpoints
          for (const p of d.points) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (d.type === "horizontal" && d.points.length >= 1) {
          ctx.beginPath();
          ctx.moveTo(0, d.points[0].y);
          ctx.lineTo(width, d.points[0].y);
          ctx.stroke();
        } else if (d.type === "rectangle" && d.points.length >= 2) {
          const [a, b] = d.points;
          ctx.globalAlpha = 0.12;
          ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
          ctx.globalAlpha = 1;
          ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
        } else if (d.type === "fib" && d.points.length >= 2) {
          const [a, b] = d.points;
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          const dy = b.y - a.y;
          ctx.font = "11px Inter, sans-serif";
          for (const lv of levels) {
            const y = a.y + dy * lv;
            ctx.beginPath();
            ctx.setLineDash(lv === 0.5 ? [4, 4] : []);
            ctx.moveTo(Math.min(a.x, b.x), y);
            ctx.lineTo(Math.max(a.x, b.x) + 48, y);
            ctx.stroke();
            ctx.fillText(`${(lv * 100).toFixed(1)}%`, Math.max(a.x, b.x) + 6, y - 3);
          }
          ctx.setLineDash([]);
        } else if (d.type === "measure" && d.points.length >= 2) {
          const [a, b] = d.points;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const dist = Math.round(Math.hypot(b.x - a.x, b.y - a.y));
          ctx.fillStyle = "#0b0e11";
          ctx.fillRect(mid.x - 28, mid.y - 10, 56, 16);
          ctx.fillStyle = d.color;
          ctx.font = "11px Inter, sans-serif";
          ctx.fillText(`${dist}px`, mid.x - 16, mid.y + 3);
        } else if (d.type === "text" && d.points.length >= 1) {
          ctx.font = "13px Inter, sans-serif";
          ctx.fillText(d.text || "Note", d.points[0].x, d.points[0].y);
        }
      }
    },
    [drawings, tool, width, height]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext("2d");
    if (ctx) drawAll(ctx);
  }, [drawings, width, height, drawAll]);

  const getPos = (clientX: number, clientY: number): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (clientX: number, clientY: number) => {
    if (tool === "cursor" || tool === "eraser") return;
    const p = getPos(clientX, clientY);
    isDrawingRef.current = true;
    setIsDrawing(true);
    if (tool === "horizontal" || tool === "text") {
      onAdd({
        id: crypto.randomUUID(),
        type: tool,
        points: [p],
        color: COLORS[tool] || "#2962ff",
        text: tool === "text" ? "Note" : undefined,
      });
      isDrawingRef.current = false;
      setIsDrawing(false);
      currentRef.current = [];
      setCurrent([]);
    } else {
      currentRef.current = [p];
      setCurrent([p]);
    }
  };

  const moveDraw = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || currentRef.current.length === 0) return;
    const p = getPos(clientX, clientY);
    const pts = [currentRef.current[0], p];
    currentRef.current = pts;
    setCurrent(pts);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAll(ctx, pts);
  };

  const endDraw = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || currentRef.current.length === 0) return;
    const p = getPos(clientX, clientY);
    const pts = [currentRef.current[0], p];
    if (Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) > 6) {
      onAdd({
        id: crypto.randomUUID(),
        type: tool,
        points: pts,
        color: COLORS[tool] || "#2962ff",
      });
    }
    isDrawingRef.current = false;
    setIsDrawing(false);
    currentRef.current = [];
    setCurrent([]);
  };

  const active = tool !== "cursor" && tool !== "eraser";

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20"
      style={{
        pointerEvents: active ? "auto" : "none",
        cursor: active ? "crosshair" : "default",
        touchAction: active ? "none" : "auto",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        startDraw(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => moveDraw(e.clientX, e.clientY)}
      onMouseUp={(e) => endDraw(e.clientX, e.clientY)}
      onMouseLeave={() => {
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          setIsDrawing(false);
          currentRef.current = [];
          setCurrent([]);
          const ctx = canvasRef.current?.getContext("2d");
          if (ctx) drawAll(ctx);
        }
      }}
      onTouchStart={(e) => {
        if (!active) return;
        e.preventDefault();
        const t = e.touches[0];
        startDraw(t.clientX, t.clientY);
      }}
      onTouchMove={(e) => {
        if (!active) return;
        e.preventDefault();
        const t = e.touches[0];
        moveDraw(t.clientX, t.clientY);
      }}
      onTouchEnd={(e) => {
        if (!active) return;
        e.preventDefault();
        const t = e.changedTouches[0];
        endDraw(t.clientX, t.clientY);
      }}
    />
  );
}
