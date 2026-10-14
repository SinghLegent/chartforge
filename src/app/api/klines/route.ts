import { NextRequest, NextResponse } from "next/server";

const INTERVAL_MAP: Record<string, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1H": "1h",
  "4H": "4h",
  "1D": "1d",
  "1W": "1w",
};

/** Binance.com is geo-blocked on many hosts; try unrestricted mirrors first */
const ENDPOINTS = [
  "https://data-api.binance.vision/api/v3/klines",
  "https://api.binance.us/api/v3/klines",
  "https://api.binance.com/api/v3/klines",
];

function parseKlines(raw: unknown): Array<{
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((k: unknown) => {
      if (!Array.isArray(k) || k.length < 6) return null;
      return {
        time: Math.floor(Number(k[0]) / 1000),
        open: parseFloat(String(k[1])),
        high: parseFloat(String(k[2])),
        low: parseFloat(String(k[3])),
        close: parseFloat(String(k[4])),
        volume: parseFloat(String(k[5])),
      };
    })
    .filter(Boolean) as Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = (sp.get("symbol") || "BTCUSDT").toUpperCase();
  const interval = INTERVAL_MAP[sp.get("interval") || "1D"] || "1d";
  const limit = Math.min(Number(sp.get("limit") || 300), 1000);

  const errors: string[] = [];

  for (const base of ENDPOINTS) {
    const url = `${base}?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 20 },
      });
      if (!res.ok) {
        errors.push(`${base}: ${res.status}`);
        continue;
      }
      const raw = await res.json();
      // Geo-block returns JSON error object instead of array
      if (!Array.isArray(raw)) {
        errors.push(`${base}: ${JSON.stringify(raw).slice(0, 80)}`);
        continue;
      }
      const bars = parseKlines(raw);
      if (bars.length > 0) {
        return NextResponse.json(bars, {
          headers: { "x-data-source": base },
        });
      }
    } catch (e) {
      errors.push(`${base}: ${String(e)}`);
    }
  }

  return NextResponse.json(
    { error: "All crypto endpoints failed", details: errors },
    { status: 502 }
  );
}
