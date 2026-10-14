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
import { getHistoryAsync, type Bar } from "@/lib/datafeed";
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
    out.push({ time: bars[i].time as any, value: +(sum / length).toFixed(4) });
  }
  return out;
}

function calcEMA(bars: Bar[], length: number): LineData[] {
  const out: LineData[] = [];
  const k = 2 / (length + 1);
  let ema = bars[0]?.close ?? 0;
  for (let i = 0; i < bars.length; i++) {
    ema = bars[i].close * k + ema * (1 - k);
    if (i >= length - 1) out.push({ time: bars[i].time as any, value: +ema.toFixed(4) });
  }
  return out;
}

function calcRSI(bars: Bar[], length = 14): LineData[] {
  const out: LineData[] = [];
  if (bars.length < length + 1) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / length, avgLoss = losses / length;
  for (let i = length; i < bars.length; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    avgGain = (avgGain * (length - 1) + (diff > 0 ? diff : 0)) / length;
    avgLoss = (avgLoss * (length - 1) + (diff < 0 ? -diff : 0)) / length;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push({ time: bars[i].time as any, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  }
  return out;
}

function transformBars(bars: Bar[], chartType: ChartTypeId): Bar[] {
  if (chartType === "heikin_ashi") return toHeikinAshi(bars);
  if (chartType === "renko") return toRenko(bars, 0.004);
  return bars;
}

export default function Chart({
  symbol, interval, chartType = "candlestick", indicators = [], replayCutoff = null, onSourceChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);

  const renderWithBars = useCallback((allBars: Bar[]) => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    let bars = allBars;
    if (replayCutoff != null) bars = bars.filter((b) => b.time <= replayCutoff);
    const displayBars = transformBars(bars, chartType);

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0e11" },
        textColor: "#d1d4dc",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
      },
      grid: { vertLines: { color: "#2a2e39" }, horzLines: { color: "#2a2e39" } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#758696", width: 1, style: 2 },
        horzLine: { color: "#758696", width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: "#2a2e39" },
      timeScale: { borderColor: "#2a2e39", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const data: CandlestickData[] = displayBars.map((b) => ({
      time: b.time as any, open: b.open, high: b.high, low: b.low, close: b.close,
    }));

    if (chartType === "line") {
      chart.addLineSeries({ color: "#2962ff", lineWidth: 2 })
        .setData(data.map((d) => ({ time: d.time, value: d.close })));
    } else if (chartType === "area") {
      chart.addAreaSeries({
        lineColor: "#2962ff", topColor: "rgba(41,98,255,0.35)", bottomColor: "rgba(41,98,255,0)", lineWidth: 2,
      }).setData(data.map((d) => ({ time: d.time, value: d.close })));
    } else if (chartType === "hollow") {
      chart.addCandlestickSeries({
        upColor: "transparent", downColor: "#f23645",
        borderUpColor: "#089981", borderDownColor: "#f23645",
        wickUpColor: "#089981", wickDownColor: "#f23645",
      }).setData(data);
    } else {
      chart.addCandlestickSeries({
        upColor: "#089981", downColor: "#f23645",
        borderUpColor: "#089981", borderDownColor: "#f23645",
        wickUpColor: "#089981", wickDownColor: "#f23645",
      }).setData(data);
    }

    const indBars = chartType === "renko" ? bars : displayBars;
    if (indicators.includes("SMA")) {
      chart.addLineSeries({ color: "#f5a623", lineWidth: 1 }).setData(calcSMA(indBars, 20));
    }
    if (indicators.includes("EMA")) {
      chart.addLineSeries({ color: "#2962ff", lineWidth: 1 }).setData(calcEMA(indBars, 20));
    }
    if (indicators.includes("RSI")) {
      const s = chart.addLineSeries({ color: "#e040fb", lineWidth: 1, priceScaleId: "rsi" });
      chart.priceScale("rsi").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      s.setData(calcRSI(indBars, 14));
    }

    chart.timeScale().fitContent();
  }, [chartType, indicators, replayCutoff]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistoryAsync(symbol, interval, 300).then(({ bars, source }) => {
      if (cancelled) return;
      onSourceChange?.(source);
      renderWithBars(bars);
      setLoading(false);
    }).catch(() => setLoading(false));

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
  }, [symbol, interval, chartType, indicators, replayCutoff, renderWithBars, onSourceChange]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 400 }}>
      <div ref={containerRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/60 text-muted text-sm">
          Loading market data…
        </div>
      )}
    </div>
  );
}
