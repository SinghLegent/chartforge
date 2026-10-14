import type { Alert } from "@/components/AlertsPanel";
import { getHistory } from "./datafeed";

/** Check active alerts against the latest bar close. Returns newly triggered alert ids. */
export function evaluateAlerts(alerts: Alert[]): string[] {
  const triggered: string[] = [];
  const bySymbol = new Map<string, number>();

  for (const a of alerts) {
    if (a.status !== "active") continue;
    let last = bySymbol.get(a.symbol);
    if (last == null) {
      const bars = getHistory(a.symbol, "1D", 5);
      last = bars[bars.length - 1]?.close ?? 0;
      bySymbol.set(a.symbol, last);
    }
    const hit =
      (a.condition === "above" && last >= a.price) ||
      (a.condition === "below" && last <= a.price) ||
      (a.condition === "cross" && Math.abs(last - a.price) / a.price < 0.002);
    if (hit) triggered.push(a.id);
  }
  return triggered;
}
