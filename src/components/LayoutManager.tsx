"use client";

import { useState, useEffect } from "react";
import { X, LayoutGrid, Save, Trash2 } from "lucide-react";
import clsx from "clsx";

export type SavedLayout = {
  id: string; name: string; symbol: string; interval: string; chartType: string; indicators: string[]; createdAt: string;
};

type Props = {
  open: boolean; onClose: () => void;
  current: { symbol: string; interval: string; chartType: string; indicators: string[] };
  onLoad: (layout: SavedLayout) => void;
  grid: number; onGridChange: (n: number) => void;
};

const STORAGE_KEY = "chartforge-layouts";

export default function LayoutManager({ open, onClose, current, onLoad, grid, onGridChange }: Props) {
  const [layouts, setLayouts] = useState<SavedLayout[]>([]);
  const [name, setName] = useState("");
  useEffect(() => {
    if (open) {
      try { setLayouts(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setLayouts([]); }
    }
  }, [open]);
  if (!open) return null;
  const handleSave = () => {
    if (!name.trim()) return;
    const layout: SavedLayout = { id: crypto.randomUUID(), name: name.trim(), ...current, createdAt: new Date().toISOString() };
    const next = [layout, ...layouts];
    setLayouts(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setName("");
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/60">
      <div className="w-full max-w-md bg-surface-elevated border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border">
          <h2 className="text-sm font-semibold text-strong flex items-center gap-2"><LayoutGrid size={16} /> Layouts</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-text"><X size={16} /></button>
        </div>
        <div className="px-4 py-3 border-b border-border flex gap-2">
          {[1, 2, 4].map((n) => (
            <button key={n} onClick={() => onGridChange(n)} className={clsx("flex-1 h-9 rounded text-sm", grid === n ? "bg-accent text-on-accent" : "bg-surface text-muted")}>{n === 4 ? "2×2" : n}</button>
          ))}
        </div>
        <div className="px-4 py-3 border-b border-border flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Layout name…" className="flex-1 h-9 px-3 rounded-md bg-surface border border-border-input text-sm outline-none" />
          <button onClick={handleSave} className="h-9 px-3 rounded-md bg-accent text-on-accent text-sm flex items-center gap-1"><Save size={14} /> Save</button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {layouts.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button className="text-left flex-1" onClick={() => { onLoad(l); onClose(); }}>
                <div className="text-sm text-strong">{l.name}</div>
                <div className="text-xs text-muted">{l.symbol} · {l.interval}</div>
              </button>
              <button onClick={() => { const next = layouts.filter((x) => x.id !== l.id); setLayouts(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }} className="p-1.5 text-muted hover:text-danger"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
