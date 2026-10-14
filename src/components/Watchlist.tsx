"use client";

import { useState } from "react";
import { Plus, X, Star } from "lucide-react";
import { searchSymbols } from "@/lib/datafeed";
import clsx from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  symbols: string[];
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  onSelect: (ticker: string) => void;
  current: string;
};

export default function Watchlist({ open, onClose, symbols, onAdd, onRemove, onSelect, current }: Props) {
  const [query, setQuery] = useState("");
  const results = query ? searchSymbols(query).slice(0, 6) : [];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="w-full max-w-xs h-full bg-surface-elevated border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border">
          <h2 className="text-sm font-semibold text-strong flex items-center gap-2"><Star size={16} /> Watchlist</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-text"><X size={16} /></button>
        </div>
        <div className="p-3 border-b border-border">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add symbol…" className="w-full h-9 px-3 rounded-md bg-surface border border-border-input text-sm outline-none" />
          {results.map((s) => (
            <button key={s.ticker} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-surface" onClick={() => { onAdd(s.ticker); setQuery(""); }}>
              <span className="text-strong">{s.ticker}</span><Plus size={14} className="text-muted" />
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {symbols.map((t) => (
            <div key={t} className={clsx("flex items-center justify-between px-4 py-2.5 border-b border-border cursor-pointer hover:bg-surface", t === current && "bg-surface")} onClick={() => onSelect(t)}>
              <span className={clsx("text-sm font-medium", t === current ? "text-accent" : "text-strong")}>{t}</span>
              <button onClick={(e) => { e.stopPropagation(); onRemove(t); }} className="p-1 text-muted hover:text-danger"><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
