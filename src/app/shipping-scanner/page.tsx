import { getProcessingOrders, getScannerStats } from "@/app/actions/scanner-actions";
import ScannerListClient from "./scanner-list-client";

export default async function ShippingScannerPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const resolvedParams = await searchParams;
  const store = (resolvedParams.store === "velour" ? "velour" : "libero") as "libero" | "velour";
  
  const [orders, stats] = await Promise.all([
    getProcessingOrders(store),
    getScannerStats(store)
  ]);
  
  return <ScannerListClient initialOrders={orders} initialStats={stats} initialStore={store} />;
}
