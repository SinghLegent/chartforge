import type { Bar } from "./datafeed";

export type ChartTypeId =
  | "candlestick"
  | "hollow"
  | "heikin_ashi"
  | "line"
  | "area"
  | "renko";

export const CHART_TYPE_OPTIONS: { id: ChartTypeId; label: string }[] = [
  { id: "candlestick", label: "Candles" },
  { id: "hollow", label: "Hollow Candles" },
  { id: "heikin_ashi", label: "Heikin Ashi" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "renko", label: "Renko" },
];

/** Heikin Ashi transformation */
export function toHeikinAshi(bars: Bar[]): Bar[] {
  if (bars.length === 0) return [];
  const out: Bar[] = [];
  let prevHA = {
    open: (bars[0].open + bars[0].close) / 2,
    close: (bars[0].open + bars[0].high + bars[0].low + bars[0].close) / 4,
    high: bars[0].high,
    low: bars[0].low,
  };
  out.push({
    time: bars[0].time,
    open: prevHA.open,
    high: prevHA.high,
    low: prevHA.low,
    close: prevHA.close,
    volume: bars[0].volume,
  });
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i];
    const haClose = (b.open + b.high + b.low + b.close) / 4;
    const haOpen = (prevHA.open + prevHA.close) / 2;
    const haHigh = Math.max(b.high, haOpen, haClose);
    const haLow = Math.min(b.low, haOpen, haClose);
    prevHA = { open: haOpen, close: haClose, high: haHigh, low: haLow };
    out.push({
      time: b.time,
      open: +haOpen.toFixed(6),
      high: +haHigh.toFixed(6),
      low: +haLow.toFixed(6),
      close: +haClose.toFixed(6),
      volume: b.volume,
    });
  }
  return out;
}

/** Simple Renko bricks based on fixed brick size */
export function toRenko(bars: Bar[], brickPct = 0.005): Bar[] {
  if (bars.length === 0) return [];
  const out: Bar[] = [];
  let brickSize = bars[0].close * brickPct;
  let lastClose = bars[0].close;
  let direction = 0;
  let t = bars[0].time;

  for (const b of bars) {
    brickSize = Math.max(b.close * brickPct, brickSize * 0.99);
    while (true) {
      if (direction >= 0 && b.close >= lastClose + brickSize) {
        const open = lastClose;
        const close = lastClose + brickSize;
        out.push({
          time: t++,
          open: +open.toFixed(6),
          high: +close.toFixed(6),
          low: +open.toFixed(6),
          close: +close.toFixed(6),
          volume: b.volume,
        });
        lastClose = close;
        direction = 1;
      } else if (direction <= 0 && b.close <= lastClose - brickSize) {
        const open = lastClose;
        const close = lastClose - brickSize;
        out.push({
          time: t++,
          open: +open.toFixed(6),
          high: +open.toFixed(6),
          low: +close.toFixed(6),
          close: +close.toFixed(6),
          volume: b.volume,
        });
        lastClose = close;
        direction = -1;
      } else {
        break;
      }
    }
  }
  return out.length ? out : bars.slice(-1);
}

export function isHollowUp(bar: { open: number; close: number }) {
  return bar.close >= bar.open;
}
