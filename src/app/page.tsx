"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Chart from "@/components/Chart";
import SymbolSearch from "@/components/SymbolSearch";
import DrawingToolbar, { type DrawingTool } from "@/components/DrawingToolbar";
import DrawingOverlay, { type Drawing } from "@/components/DrawingOverlay";
import IndicatorsPanel from "@/components/IndicatorsPanel";
import ReplayControls from "@/components/ReplayControls";
import AlertsPanel, { type Alert } from "@/components/AlertsPanel";
import Watchlist from "@/components/Watchlist";
import LayoutManager, { type SavedLayout } from "@/components/LayoutManager";
import CommandPalette from "@/components/CommandPalette";
import { getHistory } from "@/lib/datafeed";
import {
  CandlestickChart, LineChart, AreaChart, Clock, Bell,
  LayoutGrid, Settings, BarChart3, Star, Play, Search,
} from "lucide-react";
import clsx from "clsx";

const INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
const CHART_TYPES = [
  { id: "candlestick" as const, label: "Candles", icon: CandlestickChart },
  { id: "hollow" as const, label: "Hollow", icon: CandlestickChart },
  { id: "heikin_ashi" as const, label: "Heikin Ashi", icon: CandlestickChart },
  { id: "line" as const, label: "Line", icon: LineChart },
  { id: "area" as const, label: "Area", icon: AreaChart },
  { id: "renko" as const, label: "Renko", icon: BarChart3 },
];

export default function SuperchartsPage() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [interval, setInterval] = useState("1D");
  const [chartType, setChartType] = useState<"candlestick" | "hollow" | "heikin_ashi" | "line" | "area" | "renko">("candlestick");
  const [tool, setTool] = useState<DrawingTool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [indicatorsOpen, setIndicatorsOpen] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(["BTCUSD", "ETHUSD", "AAPL", "EURUSD"]);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [grid, setGrid] = useState(1);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dataSource, setDataSource] = useState<"binance" | "yahoo" | "synthetic">("synthetic");
  const [extraSymbols] = useState(["ETHUSD", "AAPL", "EURUSD"]);

  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });

  useEffect(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [replayActive, setReplayActive] = useState(false);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(2);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replayBars, setReplayBars] = useState<{ time: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const bars = getHistory(symbol, interval, 300);
    setReplayBars(bars);
    setReplayIdx(Math.floor(bars.length * 0.7));
    setReplayActive(false);
    setReplayPlaying(false);
  }, [symbol, interval]);

  useEffect(() => {
    if (replayPlaying && replayActive) {
      timerRef.current = setInterval(() => {
        setReplayIdx((i) => {
          if (i >= replayBars.length - 1) { setReplayPlaying(false); return i; }
          return i + 1;
        });
      }, 400 / replaySpeed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [replayPlaying, replayActive, replaySpeed, replayBars.length]);

  const replayCutoff = replayActive && replayBars[replayIdx] ? replayBars[replayIdx].time : null;
  const replayProgress = replayBars.length > 0 ? (replayIdx / (replayBars.length - 1)) * 100 : 0;

  const toggleIndicator = useCallback((key: string) => {
    setActiveIndicators((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }, []);

  const chartSymbols = grid === 1 ? [symbol] : grid === 2 ? [symbol, extraSymbols[0]] : [symbol, ...extraSymbols.slice(0, 3)];

  const commands = [
    { id: "ind", label: "Open Indicators", group: "Panels", icon: BarChart3, action: () => setIndicatorsOpen(true) },
    { id: "alert", label: "Open Alerts", group: "Panels", icon: Bell, action: () => setAlertsOpen(true) },
    { id: "wl", label: "Open Watchlist", group: "Panels", icon: Star, action: () => setWatchlistOpen(true) },
    { id: "layout", label: "Open Layouts", group: "Panels", icon: LayoutGrid, action: () => setLayoutOpen(true) },
    { id: "replay", label: "Start Bar Replay", group: "Chart", icon: Play, action: () => { setReplayActive(true); setReplayIdx(Math.floor(replayBars.length * 0.6)); } },
    ...CHART_TYPES.map((ct) => ({ id: ct.id, label: `Chart: ${ct.label}`, group: "Chart", icon: ct.icon, action: () => setChartType(ct.id) })),
    ...INTERVALS.map((iv) => ({ id: `iv-${iv}`, label: `Interval: ${iv}`, group: "Interval", icon: Clock, action: () => setInterval(iv) })),
  ];

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <header className="h-[40px] flex items-center gap-2 px-2 border-b border-border bg-surface shrink-0">
        <span className="text-sm font-semibold text-strong tracking-tight px-2">ChartForge</span>
        <div className="w-px h-5 bg-border" />
        <SymbolSearch current={symbol} onSelect={setSymbol} />
        <div className="flex items-center gap-0.5 ml-1">
          {INTERVALS.map((iv) => (
            <button key={iv} onClick={() => setInterval(iv)} className={clsx("px-2 h-7 rounded text-xs font-medium", interval === iv ? "bg-accent text-on-accent" : "text-muted hover:text-text hover:bg-surface-elevated")}>{iv}</button>
          ))}
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-0.5">
          {CHART_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <button key={ct.id} onClick={() => setChartType(ct.id)} title={ct.label} className={clsx("p-1.5 rounded", chartType === ct.id ? "bg-accent/20 text-accent" : "text-muted hover:text-text hover:bg-surface-elevated")}>
                <Icon size={16} />
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <button onClick={() => setCmdOpen(true)} className="flex items-center gap-1.5 px-2.5 h-7 rounded text-xs text-muted hover:text-text hover:bg-surface-elevated" title="Cmd+K">
          <Search size={14} /><span className="hidden sm:inline">Commands</span>
        </button>
        <button onClick={() => setIndicatorsOpen(true)} className={clsx("flex items-center gap-1.5 px-2.5 h-7 rounded text-xs", activeIndicators.length > 0 ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-surface-elevated")}>
          <BarChart3 size={14} /><span>Indicators{activeIndicators.length > 0 ? ` (${activeIndicators.length})` : ""}</span>
        </button>
        <button onClick={() => setAlertsOpen(true)} className="flex items-center gap-1.5 px-2.5 h-7 rounded text-xs text-muted hover:text-text hover:bg-surface-elevated">
          <Bell size={14} /><span>Alert</span>
        </button>
        <button onClick={() => setWatchlistOpen(true)} className="flex items-center gap-1.5 px-2.5 h-7 rounded text-xs text-muted hover:text-text hover:bg-surface-elevated">
          <Star size={14} /><span>Watchlist</span>
        </button>
        <ReplayControls
          active={replayActive} playing={replayPlaying} speed={replaySpeed} progress={replayProgress}
          onStart={() => { setReplayActive(true); setReplayIdx(Math.floor(replayBars.length * 0.6)); }}
          onPlay={() => setReplayPlaying(true)} onPause={() => setReplayPlaying(false)}
          onStep={() => setReplayIdx((i) => Math.min(i + 1, replayBars.length - 1))}
          onSpeedChange={setReplaySpeed}
          onExit={() => { setReplayActive(false); setReplayPlaying(false); }}
        />
        <button onClick={() => setLayoutOpen(true)} className={clsx("p-1.5 rounded", grid > 1 ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-surface-elevated")} title="Layouts">
          <LayoutGrid size={16} />
        </button>
        <button className="p-1.5 rounded text-muted hover:text-text hover:bg-surface-elevated" title="Settings"><Settings size={16} /></button>
      </header>

      <div className="flex flex-1 min-h-0">
        <DrawingToolbar active={tool} onSelect={setTool} onClear={() => setDrawings([])} />
        <main ref={chartAreaRef} className="flex-1 relative min-h-0">
          {grid === 1 ? (
            <>
              <Chart symbol={symbol} interval={interval} chartType={chartType} indicators={activeIndicators} replayCutoff={replayCutoff} onSourceChange={setDataSource} />
              <DrawingOverlay tool={tool} drawings={drawings} onAdd={(d) => setDrawings((p) => [...p, d])} onClear={() => setDrawings([])} width={size.w} height={size.h} />
            </>
          ) : (
            <div className={clsx("w-full h-full grid gap-px bg-border", grid === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2")}>
              {chartSymbols.map((sym, i) => (
                <div key={sym + i} className="relative bg-bg min-h-0">
                  <div className="absolute top-1 left-2 z-20 text-xs font-medium text-muted bg-surface/80 px-1.5 py-0.5 rounded">{sym}</div>
                  <Chart symbol={sym} interval={interval} chartType={chartType} indicators={i === 0 ? activeIndicators : []} replayCutoff={i === 0 ? replayCutoff : null} onSourceChange={i === 0 ? setDataSource : undefined} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="h-6 flex items-center px-3 border-t border-border bg-surface text-xs text-muted shrink-0">
        <span className="flex items-center gap-1"><Clock size={11} /> {new Date().toLocaleString()}</span>
        <span className="mx-2">·</span><span>{symbol}</span>
        <span className="mx-2">·</span><span>{interval}</span>
        {activeIndicators.length > 0 && (<><span className="mx-2">·</span><span className="text-accent">{activeIndicators.join(", ")}</span></>)}
        {replayActive && (<><span className="mx-2">·</span><span className="text-warning">Replay {Math.round(replayProgress)}%</span></>)}
        <span className="mx-2">·</span>
        <span className={dataSource === "synthetic" ? "text-warning" : "text-up"}>
          {dataSource === "binance" ? "Live · Binance" : dataSource === "yahoo" ? "Live · Yahoo" : "Demo data"}
        </span>
        <span className="mx-2">·</span><span className="text-muted">⌘K</span>
      </footer>

      <IndicatorsPanel open={indicatorsOpen} onClose={() => setIndicatorsOpen(false)} activeKeys={activeIndicators} onToggle={toggleIndicator} />
      <AlertsPanel open={alertsOpen} onClose={() => setAlertsOpen(false)} symbol={symbol} alerts={alerts}
        onAdd={(a) => setAlerts((prev) => [...prev, { ...a, id: crypto.randomUUID(), status: "active", createdAt: new Date().toISOString() }])}
        onDelete={(id) => setAlerts((prev) => prev.filter((x) => x.id !== id))} />
      <Watchlist open={watchlistOpen} onClose={() => setWatchlistOpen(false)} symbols={watchlist}
        onAdd={(t) => setWatchlist((prev) => prev.includes(t) ? prev : [...prev, t])}
        onRemove={(t) => setWatchlist((prev) => prev.filter((x) => x !== t))} onSelect={setSymbol} current={symbol} />
      <LayoutManager open={layoutOpen} onClose={() => setLayoutOpen(false)}
        current={{ symbol, interval, chartType, indicators: activeIndicators }}
        onLoad={(l) => { setSymbol(l.symbol); setInterval(l.interval); setChartType(l.chartType as any); setActiveIndicators(l.indicators); }}
        grid={grid} onGridChange={setGrid} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} commands={commands} />
    </div>
  );
}
