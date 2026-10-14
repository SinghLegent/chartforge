"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  type IChartApi,
  type CandlestickData,
  type LineData,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import { getHistoryAsync, getHistory, type Bar } from "@/lib/datafeed";
import { type ChartTypeId, toHeikinAshi, toRenko } from "@/lib/chartTypes";

type Props = {
  symbol: string;
  interval: string;
  chartType?: ChartTypeId;
  indicators?: string[];
  replayCutoff?: number | null;
  onSourceChange?: (source: "binance" | "yahoo" | "synthetic") => void;
};

function calcSMA(bars: Bar[], length: number): LineData[] {
  const out: LineData[] = [];
  for (let i = length - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = 0; j < length; j++) sum += bars[i - j].close;
    out.push({ time: bars[i].time as CandlestickData["time"], value: +(sum / length).toFixed(4) });
  }
  return out;
}

function calcEMA(bars: Bar[], length: number): LineData[] {
  const out: LineData[] = [];
  const k = 2 / (length + 1);
  let ema = bars[0]?.close ?? 0;
  for (let i = 0; i < bars.length; i++) {
    ema = bars[i].close * k + ema * (1 - k);
    if (i >= length - 1) {
      out.push({ time: bars[i].time as CandlestickData["time"], value: +ema.toFixed(4) });
    }
  }
  return out;
}

function calcRSI(bars: Bar[], length = 14): LineData[] {
  const out: LineData[] = [];
  if (bars.length < length + 1) return out;
  let gains = 0,
    losses = 0;
  for (let i = 1; i <= length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / length,
    avgLoss = losses / length;
  for (let i = length; i < bars.length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    avgGain = (avgGain * (length - 1) + (diff > 0 ? diff : 0)) / length;
    avgLoss = (avgLoss * (length - 1) + (diff < 0 ? -diff : 0)) / length;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push({
      time: bars[i].time as CandlestickData["time"],
      value: +(100 - 100 / (1 + rs)).toFixed(2),
    });
  }
  return out;
}

function transformBars(bars: Bar[], chartType: ChartTypeId): Bar[] {
  if (chartType === "heikin_ashi") return toHeikinAshi(bars);
  if (chartType === "renko") return toRenko(bars, 0.004);
  return bars;
}

/** Ensure ascending unique unix-second timestamps for lightweight-charts */
function sanitizeBars(bars: Bar[]): Bar[] {
  if (!bars.length) return bars;
  const sorted = [...bars].sort((a, b) => a.time - b.time);
  const out: Bar[] = [];
  let last = -1;
  for (const b of sorted) {
    let t = Math.floor(b.time);
    if (t <= last) t = last + 1;
    out.push({ ...b, time: t });
    last = t;
  }
  return out;
}

export default function Chart({
  symbol,
  interval,
  chartType = "candlestick",
  indicators = [],
  replayCutoff = null,
  onSourceChange,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barsRef = useRef<Bar[]>([]);

  const paint = useCallback(
    (allBars: Bar[]) => {
      const el = containerRef.current;
      if (!el) return;

      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 10 || h < 10) return;

      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      let bars = sanitizeBars(allBars);
      if (replayCutoff != null) bars = bars.filter((b) => b.time <= replayCutoff);
      if (bars.length === 0) {
        setError("No bars to display");
        return;
      }
      setError(null);

      const displayBars = transformBars(bars, chartType);
      const chart = createChart(el, {
        layout: {
          background: { type: ColorType.Solid, color: "#0b0e11" },
          textColor: "#d1d4dc",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "#2a2e39" },
          horzLines: { color: "#2a2e39" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "#758696", width: 1, style: 2, labelBackgroundColor: "#2962ff" },
          horzLine: { color: "#758696", width: 1, style: 2, labelBackgroundColor: "#2962ff" },
        },
        rightPriceScale: {
          borderColor: "#2a2e39",
          scaleMargins: { top: 0.08, bottom: 0.12 },
        },
        timeScale: {
          borderColor: "#2a2e39",
          timeVisible: true,
          secondsVisible: false,
        },
        width: w,
        height: h,
        handleScroll: { vertTouchDrag: false },
      });
      chartRef.current = chart;

      const data: CandlestickData[] = displayBars.map((b) => ({
        time: b.time as CandlestickData["time"],
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }));

      if (chartType === "line") {
        chart
          .addLineSeries({ color: "#2962ff", lineWidth: 2 })
          .setData(data.map((d) => ({ time: d.time, value: d.close })));
      } else if (chartType === "area") {
        chart
          .addAreaSeries({
            lineColor: "#2962ff",
            topColor: "rgba(41,98,255,0.35)",
            bottomColor: "rgba(41,98,255,0)",
            lineWidth: 2,
          })
          .setData(data.map((d) => ({ time: d.time, value: d.close })));
      } else if (chartType === "hollow") {
        chart
          .addCandlestickSeries({
            upColor: "transparent",
            downColor: "#f23645",
            borderUpColor: "#089981",
            borderDownColor: "#f23645",
            wickUpColor: "#089981",
            wickDownColor: "#f23645",
          })
          .setData(data);
      } else {
        chart
          .addCandlestickSeries({
            upColor: "#089981",
            downColor: "#f23645",
            borderUpColor: "#089981",
            borderDownColor: "#f23645",
            wickUpColor: "#089981",
            wickDownColor: "#f23645",
          })
          .setData(data);
      }

      const indBars = chartType === "renko" ? bars : displayBars;
      if (indicators.includes("SMA")) {
        chart.addLineSeries({ color: "#f5a623", lineWidth: 1 }).setData(calcSMA(indBars, 20));
      }
      if (indicators.includes("EMA")) {
        chart.addLineSeries({ color: "#2962ff", lineWidth: 1 }).setData(calcEMA(indBars, 20));
      }
      if (indicators.includes("RSI")) {
        const s = chart.addLineSeries({
          color: "#e040fb",
          lineWidth: 1,
          priceScaleId: "rsi",
        });
        chart.priceScale("rsi").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        s.setData(calcRSI(indBars, 14));
      }

      chart.timeScale().fitContent();
    },
    [chartType, indicators, replayCutoff]
  );

  // Load data: show synthetic immediately, then upgrade to live
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const syn = getHistory(symbol, interval, 300);
    barsRef.current = syn;
    // paint after layout
    requestAnimationFrame(() => {
      if (!cancelled) paint(syn);
      if (!cancelled) setLoading(false);
    });

    getHistoryAsync(symbol, interval, 300)
      .then(({ bars, source }) => {
        if (cancelled) return;
        onSourceChange?.(source);
        if (bars.length > 0) {
          barsRef.current = bars;
          paint(bars);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, interval, paint, onSourceChange]);

  // Re-paint on chart type / indicators / replay
  useEffect(() => {
    if (barsRef.current.length) paint(barsRef.current);
  }, [chartType, indicators, replayCutoff, paint]);

  // ResizeObserver — critical for correct candle size on mobile
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (barsRef.current.length) paint(barsRef.current);
      else if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [paint]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full min-h-0">
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/50 text-muted text-sm z-10 pointer-events-none">
          Loading…
        </div>
      )}
      {error && (
        <div className="absolute top-2 left-2 right-2 z-10 px-2 py-1 rounded bg-danger/20 text-danger text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
