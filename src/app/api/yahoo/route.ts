import { NextRequest, NextResponse } from "next/server";

const YAHOO_MAP: Record<string, string> = {
  AAPL: "AAPL",
  TSLA: "TSLA",
  MSFT: "MSFT",
  GOOGL: "GOOGL",
  AMZN: "AMZN",
  NVDA: "NVDA",
  META: "META",
  NFLX: "NFLX",
  SPX: "^GSPC",
  NDX: "^NDX",
  DJI: "^DJI",
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  AUDUSD: "AUDUSD=X",
  USDCAD: "USDCAD=X",
  USDCHF: "USDCHF=X",
  XAUUSD: "GC=F",
  OIL: "CL=F",
};

const INTERVAL_MAP: Record<string, { interval: string; range: string }> = {
  "1m": { interval: "1m", range: "1d" },
  "5m": { interval: "5m", range: "5d" },
  "15m": { interval: "15m", range: "5d" },
  "1H": { interval: "60m", range: "1mo" },
  "4H": { interval: "60m", range: "3mo" },
  "1D": { interval: "1d", range: "1y" },
  "1W": { interval: "1wk", range: "5y" },
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ticker = (sp.get("symbol") || "AAPL").toUpperCase();
  const ourInterval = sp.get("interval") || "1D";
  const yahooSymbol = YAHOO_MAP[ticker] || ticker;
  const { interval, range } = INTERVAL_MAP[ourInterval] || INTERVAL_MAP["1D"];

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?interval=${interval}&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo ${res.status}` },
        { status: res.status }
      );
    }
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      return NextResponse.json({ error: "No data" }, { status: 404 });
    }
    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const opens: (number | null)[] = quote.open || [];
    const highs: (number | null)[] = quote.high || [];
    const lows: (number | null)[] = quote.low || [];
    const closes: (number | null)[] = quote.close || [];
    const volumes: (number | null)[] = quote.volume || [];

    const bars = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null || opens[i] == null) continue;
      bars.push({
        time: timestamps[i],
        open: opens[i]!,
        high: highs[i] ?? closes[i]!,
        low: lows[i] ?? closes[i]!,
        close: closes[i]!,
        volume: volumes[i] ?? 0,
      });
    }
    return NextResponse.json(bars);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
