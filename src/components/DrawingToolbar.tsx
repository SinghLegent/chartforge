"use client";

import type { ElementType } from "react";
import {
  MousePointer2,
  TrendingUp,
  Minus,
  Square,
  Circle,
  Type,
  Ruler,
  Trash2,
} from "lucide-react";
import clsx from "clsx";

export type DrawingTool =
  | "cursor"
  | "trendline"
  | "horizontal"
  | "rectangle"
  | "fib"
  | "text"
  | "measure"
  | "eraser";

type Props = {
  active: DrawingTool;
  onSelect: (tool: DrawingTool) => void;
  onClear?: () => void;
};

const TOOLS: { id: DrawingTool; label: string; icon: ElementType }[] = [
  { id: "cursor", label: "Cursor", icon: MousePointer2 },
  { id: "trendline", label: "Trend line", icon: TrendingUp },
  { id: "horizontal", label: "Horizontal", icon: Minus },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "fib", label: "Fibonacci", icon: Circle },
  { id: "text", label: "Text", icon: Type },
  { id: "measure", label: "Measure", icon: Ruler },
];

export default function DrawingToolbar({ active, onSelect, onClear }: Props) {
  return (
    <aside className="w-10 sm:w-12 flex flex-col items-center py-1.5 gap-0.5 border-r border-border bg-surface shrink-0 overflow-y-auto scrollbar-none">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            title={t.label}
            onClick={() => onSelect(t.id)}
            className={clsx(
              "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md transition-colors shrink-0",
              active === t.id
                ? "bg-accent/20 text-accent"
                : "text-muted hover:text-text hover:bg-surface-elevated"
            )}
          >
            <Icon size={15} />
          </button>
        );
      })}
      <div className="flex-1 min-h-2" />
      {onClear && (
        <button
          title="Clear all drawings"
          onClick={onClear}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-muted hover:text-danger hover:bg-surface-elevated transition-colors shrink-0"
        >
          <Trash2 size={15} />
        </button>
      )}
    </aside>
  );
}
