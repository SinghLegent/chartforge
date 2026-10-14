// Datafeed: Binance (crypto) + Yahoo Finance (stocks/forex/indices). Synthetic fallback.

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type SymbolInfo = {
  ticker: string;
  name: string;
  exchange: string;
  assetClass: string;
  binanceSymbol?: string;
  yahoo?: boolean;
};

const SYMBOLS: SymbolInfo[] = [
  { ticker: "BTCUSD", name: "Bitcoin / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "BTCUSDT" },
  { ticker: "ETHUSD", name: "Ethereum / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "ETHUSDT" },
  { ticker: "SOLUSD", name: "Solana / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "SOLUSDT" },
  { ticker: "BNBUSD", name: "BNB / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "BNBUSDT" },
  { ticker: "XRPUSD", name: "XRP / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "XRPUSDT" },
  { ticker: "DOGEUSD", name: "Dogecoin / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "DOGEUSDT" },
  { ticker: "ADAUSD", name: "Cardano / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "ADAUSDT" },
  { ticker: "AVAXUSD", name: "Avalanche / USD", exchange: "BINANCE", assetClass: "crypto", binanceSymbol: "AVAXUSDT" },
  { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "MSFT", name: "Microsoft", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "GOOGL", name: "Alphabet", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "AMZN", name: "Amazon", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "NVDA", name: "NVIDIA", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "META", name: "Meta Platforms", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "NFLX", name: "Netflix", exchange: "NASDAQ", assetClass: "stock", yahoo: true },
  { ticker: "SPX", name: "S&P 500", exchange: "CBOE", assetClass: "index", yahoo: true },
  { ticker: "NDX", name: "Nasdaq 100", exchange: "NASDAQ", assetClass: "index", yahoo: true },
  { ticker: "DJI", name: "Dow Jones", exchange: "DJ", assetClass: "index", yahoo: true },
  { ticker: "EURUSD", name: "Euro / US Dollar", exchange: "FX", assetClass: "forex", yahoo: true },
  { ticker: "GBPUSD", name: "British Pound / US Dollar", exchange: "FX", assetClass: "forex", yahoo: true },
  { ticker: "USDJPY", name: "US Dollar / Japanese Yen", exchange: "FX", assetClass: "forex", yahoo: true },
  { ticker: "AUDUSD", name: "Australian Dollar / US Dollar", exchange: "FX", assetClass: "forex", yahoo: true },
  { ticker: "USDCAD", name: "US Dollar / Canadian Dollar", exchange: "FX", assetClass: "forex", yahoo: true },
  { ticker: "USDCHF", name: "US Dollar / Swiss Franc", exchange: "FX", assetClass: "forex", yahoo: true },
  { ticker: "XAUUSD", name: "Gold", exchange: "COMEX", assetClass: "commodity", yahoo: true },
  { ticker: "OIL", name: "Crude Oil", exchange: "NYMEX", assetClass: "commodity", yahoo: true },
];

export function searchSymbols(query: string): SymbolInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return SYMBOLS.slice(0, 12);
  return SYMBOLS.filter(
    (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

export function getSymbol(ticker: string): SymbolInfo | undefined {
  return SYMBOLS.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
}

function syntheticHistory(ticker: string, interval: string, bars: number): Bar[] {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let price = 100 + (seed % 400);
  if (ticker.includes("BTC")) price = 82000;
  if (ticker.includes("ETH")) price = 2400;
  if (ticker.includes("EUR") || ticker.includes("GBP")) price = 1.08;
  const now = Math.floor(Date.now() / 1000);
  const stepMap: Record<string, number> = {
    "1m": 60, "5m": 300, "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400, "1W": 604800,
  };
  const step = stepMap[interval] || 86400;
  const result: Bar[] = [];
  let t = now - bars * step;
  for (let i = 0; i < bars; i++) {
    const vol = price * 0.008;
    const change = (Math.sin(i * 0.3 + seed) + Math.cos(i * 0.17) * 0.6) * vol;
    const open = price;
    const close = price + change;
    result.push({
      time: t,
      open: +open.toFixed(4),
      high: +(Math.max(open, close) + Math.abs(change) * 0.4).toFixed(4),
      low: +(Math.min(open, close) - Math.abs(change) * 0.4).toFixed(4),
      close: +close.toFixed(4),
      volume: 1000 + Math.abs(Math.sin(i + seed)) * 5000,
    });
    price = close;
    t += step;
  }
  return result;
}

const cache = new Map<string, { bars: Bar[]; ts: number; source: string }>();
const CACHE_TTL_MS = 30_000;

export function getHistory(ticker: string, interval = "1D", bars = 200): Bar[] {
  const key = `${ticker}|${interval}|${bars}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.bars;
  return syntheticHistory(ticker, interval, bars);
}

async function fetchBinance(binanceSymbol: string, interval: string, limit: number): Promise<Bar[]> {
  const url = `/api/klines?symbol=${encodeURIComponent(binanceSymbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as Bar[];
}

async function fetchYahoo(ticker: string, interval: string): Promise<Bar[]> {
  const url = `/api/yahoo?symbol=${encodeURIComponent(ticker)}&interval=${encodeURIComponent(interval)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as Bar[];
}

export async function getHistoryAsync(
  ticker: string,
  interval = "1D",
  bars = 200
): Promise<{ bars: Bar[]; source: "binance" | "yahoo" | "synthetic" }> {
  const key = `${ticker}|${interval}|${bars}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) {
    return { bars: hit.bars, source: hit.source as any };
  }

  const info = getSymbol(ticker);

  if (info?.binanceSymbol) {
    try {
      const data = await fetchBinance(info.binanceSymbol, interval, bars);
      if (data.length > 0) {
        cache.set(key, { bars: data, ts: Date.now(), source: "binance" });
        return { bars: data, source: "binance" };
      }
    } catch (e) {
      console.warn("Binance failed:", e);
    }
  }

  if (info?.yahoo) {
    try {
      const data = await fetchYahoo(ticker, interval);
      if (data.length > 0) {
        cache.set(key, { bars: data, ts: Date.now(), source: "yahoo" });
        return { bars: data, source: "yahoo" };
      }
    } catch (e) {
      console.warn("Yahoo failed:", e);
    }
  }

  const syn = syntheticHistory(ticker, interval, bars);
  cache.set(key, { bars: syn, ts: Date.now(), source: "synthetic" });
  return { bars: syn, source: "synthetic" };
}

export function clearDataCache() {
  cache.clear();
}
