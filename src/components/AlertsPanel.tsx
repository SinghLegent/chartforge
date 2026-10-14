"use client";

import { useState } from "react";
import { X, Bell, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";

export type Alert = {
  id: string;
  symbol: string;
  condition: "above" | "below" | "cross";
  price: number;
  status: "active" | "triggered";
  createdAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  symbol: string;
  alerts: Alert[];
  onAdd: (a: Omit<Alert, "id" | "createdAt" | "status">) => void;
  onDelete: (id: string) => void;
};

export default function AlertsPanel({ open, onClose, symbol, alerts, onAdd, onDelete }: Props) {
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below" | "cross">("above");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40">
      <div className="w-full max-w-sm h-full bg-surface-elevated border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 border-b border-border">
          <h2 className="text-sm font-semibold text-strong flex items-center gap-2"><Bell size={16} /> Alerts</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-text"><X size={16} /></button>
        </div>
        <div className="p-4 border-b border-border space-y-3">
          <div className="text-xs text-muted">Symbol: <span className="text-strong">{symbol}</span></div>
          <div className="flex gap-2">
            {(["above", "below", "cross"] as const).map((c) => (
              <button key={c} onClick={() => setCondition(c)} className={clsx("flex-1 h-8 rounded text-xs capitalize", condition === c ? "bg-accent text-on-accent" : "bg-surface text-muted")}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" className="flex-1 h-9 px-3 rounded-md bg-surface border border-border-input text-sm outline-none" />
            <button onClick={() => { const p = parseFloat(price); if (!isNaN(p) && p > 0) { onAdd({ symbol, condition, price: p }); setPrice(""); } }} className="h-9 px-3 rounded-md bg-accent text-on-accent text-sm flex items-center gap-1"><Plus size={14} /> Add</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 && <div className="px-4 py-12 text-center text-muted text-sm">No alerts yet</div>}
          {alerts.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="text-sm text-strong">{a.symbol} <span className="text-muted font-normal">{a.condition} {a.price}</span></div>
              <button onClick={() => onDelete(a.id)} className="p-1.5 text-muted hover:text-danger"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
