import { getProcessingOrders, getScannerStats } from "@/app/actions/scanner-actions";
import ScannerListClient from "./scanner-list-client";

export default async function ShippingScannerPage() {
  const [orders, stats] = await Promise.all([
    getProcessingOrders(),
    getScannerStats()
  ]);
  
  return <ScannerListClient orders={orders} stats={stats} />;
}
