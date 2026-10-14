import { NextRequest, NextResponse } from "next/server";

const INTERVAL_MAP: Record<string, string> = {
  "1m": "1m", "5m": "5m", "15m": "15m",
  "1H": "1h", "4H": "4h", "1D": "1d", "1W": "1w",
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = sp.get("symbol") || "BTCUSDT";
  const interval = INTERVAL_MAP[sp.get("interval") || "1D"] || "1d";
  const limit = Math.min(Number(sp.get("limit") || 300), 1000);

  const url = `https://api.binance.com/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`;

  try {
    const res = await fetch(url, { next: { revalidate: 15 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Binance ${res.status}` }, { status: res.status });
    }
    const raw = await res.json();
    const bars = raw.map((k: unknown[]) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
    return NextResponse.json(bars);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
