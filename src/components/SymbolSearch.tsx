"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { searchSymbols, type SymbolInfo } from "@/lib/datafeed";
import clsx from "clsx";

type Props = { current: string; onSelect: (ticker: string) => void };

export default function SymbolSearch({ current, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymbolInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setResults(searchSymbols(query));
      inputRef.current?.focus();
    }
  }, [open, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 h-8 rounded-md bg-surface-elevated border border-border text-strong hover:border-border-input transition-colors"
      >
        <span className="font-medium">{current}</span>
        <Search size={14} className="text-muted" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60">
          <div className="w-full max-w-lg bg-surface-elevated border border-border rounded-lg shadow-pop overflow-hidden" role="dialog">
            <div className="flex items-center gap-2 px-4 border-b border-border">
              <Search size={16} className="text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker or name…"
                className="flex-1 h-12 bg-transparent text-text placeholder:text-muted outline-none text-sm"
              />
              <button onClick={() => setOpen(false)} className="p-1 text-muted hover:text-text" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-muted text-sm">No symbols found</li>
              )}
              {results.map((s) => (
                <li key={s.ticker}>
                  <button
                    className={clsx(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface transition-colors",
                      s.ticker === current && "bg-surface"
                    )}
                    onClick={() => { onSelect(s.ticker); setOpen(false); setQuery(""); }}
                  >
                    <div>
                      <div className="font-medium text-strong">{s.ticker}</div>
                      <div className="text-xs text-muted">{s.name}</div>
                    </div>
                    <span className="text-xs text-muted uppercase">{s.assetClass}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
