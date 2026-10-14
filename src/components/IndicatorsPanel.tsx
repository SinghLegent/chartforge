"use client";

import { X, Search, Plus, Check } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const BUILTIN = [
  { key: "SMA", name: "Simple Moving Average", category: "Moving Averages" },
  { key: "EMA", name: "Exponential Moving Average", category: "Moving Averages" },
  { key: "RSI", name: "Relative Strength Index", category: "Oscillators" },
  { key: "MACD", name: "MACD", category: "Oscillators" },
  { key: "BB", name: "Bollinger Bands", category: "Volatility" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  activeKeys: string[];
  onToggle: (key: string) => void;
};

export default function IndicatorsPanel({ open, onClose, activeKeys, onToggle }: Props) {
  const [query, setQuery] = useState("");
  if (!open) return null;
  const filtered = BUILTIN.filter(
    (i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.key.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/60">
      <div className="w-full max-w-md bg-surface-elevated border border-border rounded-lg shadow-pop overflow-hidden">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border">
          <h2 className="text-sm font-semibold text-strong">Indicators</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-text"><X size={16} /></button>
        </div>
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search size={14} className="text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="flex-1 h-10 bg-transparent text-sm outline-none" autoFocus />
        </div>
        <div className="max-h-96 overflow-y-auto py-2">
          {filtered.map((ind) => {
            const isActive = activeKeys.includes(ind.key);
            return (
              <button key={ind.key} onClick={() => onToggle(ind.key)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface text-left">
                <div>
                  <div className="text-sm text-strong">{ind.name}</div>
                  <div className="text-xs text-muted">{ind.key}</div>
                </div>
                <span className={clsx("w-6 h-6 rounded flex items-center justify-center", isActive ? "bg-accent text-on-accent" : "bg-surface text-muted")}>
                  {isActive ? <Check size={14} /> : <Plus size={14} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
