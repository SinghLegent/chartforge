// Datafeed: multi-source crypto + Yahoo stocks/forex. Realistic synthetic fallback.

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

/** Seeded PRNG for stable-looking synthetic series */
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function syntheticHistory(ticker: string, interval: string, bars: number): Bar[] {
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = mulberry32(seed * 9973 + bars);

  let price = 100 + (seed % 400);
  if (ticker.includes("BTC")) price = 82000;
  else if (ticker.includes("ETH")) price = 2400;
  else if (ticker.includes("SOL")) price = 145;
  else if (ticker.includes("EUR") || ticker.includes("GBP") || ticker.includes("AUD"))
    price = 1.08;
  else if (ticker.includes("JPY")) price = 149;
  else if (ticker === "AAPL") price = 230;
  else if (ticker === "TSLA") price = 250;
  else if (ticker === "NVDA") price = 130;
  else if (ticker === "SPX") price = 5800;
  else if (ticker === "XAUUSD") price = 2650;
  else if (ticker === "OIL") price = 72;

  const now = Math.floor(Date.now() / 1000);
  const stepMap: Record<string, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1H": 3600,
    "4H": 14400,
    "1D": 86400,
    "1W": 604800,
  };
  const step = stepMap[interval] || 86400;
  const result: Bar[] = [];
  let t = now - bars * step;
  let drift = 0;

  for (let i = 0; i < bars; i++) {
    // random walk + mild trend
    drift += (rnd() - 0.48) * 0.0004;
    const vol = price * (0.004 + rnd() * 0.008);
    const change = (rnd() - 0.5 + drift) * vol * 2;
    const open = price;
    const close = Math.max(price * 0.5, price + change);
    const wickUp = rnd() * vol;
    const wickDn = rnd() * vol;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDn;
    result.push({
      time: t,
      open: +open.toFixed(ticker.includes("USD") && price < 10 ? 5 : 2),
      high: +high.toFixed(ticker.includes("USD") && price < 10 ? 5 : 2),
      low: +low.toFixed(ticker.includes("USD") && price < 10 ? 5 : 2),
      close: +close.toFixed(ticker.includes("USD") && price < 10 ? 5 : 2),
      volume: Math.round(500 + rnd() * 20000),
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

async function fetchBinance(
  binanceSymbol: string,
  interval: string,
  limit: number
): Promise<Bar[]> {
  const url = `/api/klines?symbol=${encodeURIComponent(binanceSymbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
  if (!Array.isArray(data) || data.length === 0) throw new Error("empty");
  return data as Bar[];
}

async function fetchYahoo(ticker: string, interval: string): Promise<Bar[]> {
  const url = `/api/yahoo?symbol=${encodeURIComponent(ticker)}&interval=${encodeURIComponent(interval)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
  if (!Array.isArray(data) || data.length === 0) throw new Error("empty");
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
    return { bars: hit.bars, source: hit.source as "binance" | "yahoo" | "synthetic" };
  }

  const info = getSymbol(ticker);

  if (info?.binanceSymbol) {
    try {
      const data = await fetchBinance(info.binanceSymbol, interval, bars);
      cache.set(key, { bars: data, ts: Date.now(), source: "binance" });
      return { bars: data, source: "binance" };
    } catch (e) {
      console.warn("Crypto API failed:", e);
    }
  }

  if (info?.yahoo) {
    try {
      const data = await fetchYahoo(ticker, interval);
      cache.set(key, { bars: data, ts: Date.now(), source: "yahoo" });
      return { bars: data, source: "yahoo" };
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
