"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

type Command = { id: string; label: string; group: string; icon: React.ElementType; action: () => void };

type Props = { open: boolean; onClose: () => void; commands: Command[] };

export default function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.group.toLowerCase().includes(query.toLowerCase()))
    : commands;
  useEffect(() => { if (open) { setQuery(""); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  if (!open) return null;
  const groups = [...new Set(filtered.map((c) => c.group))];
  let flatIdx = -1;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg bg-surface-elevated border border-border rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search size={16} className="text-muted" />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setSelected((i) => Math.min(i + 1, filtered.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter" && filtered[selected]) { filtered[selected].action(); onClose(); }
              else if (e.key === "Escape") onClose();
            }}
            placeholder="Type a command…" className="flex-1 h-12 bg-transparent text-sm outline-none" />
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-xs font-medium text-muted uppercase">{group}</div>
              {filtered.filter((c) => c.group === group).map((cmd) => {
                flatIdx++;
                const idx = flatIdx;
                const Icon = cmd.icon;
                return (
                  <button key={cmd.id} onClick={() => { cmd.action(); onClose(); }} onMouseEnter={() => setSelected(idx)}
                    className={clsx("w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left", selected === idx ? "bg-accent/15 text-accent" : "text-text hover:bg-surface")}>
                    <Icon size={16} className="opacity-70" /><span>{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
