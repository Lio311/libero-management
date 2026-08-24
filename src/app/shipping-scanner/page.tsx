import { getProcessingOrders, getScannerStats } from "@/app/actions/scanner-actions";
import ScannerListClient from "./scanner-list-client";
import { currentUser } from "@clerk/nextjs/server";

export default async function ShippingScannerPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const resolvedParams = await searchParams;
  const store = (resolvedParams.store === "velour" ? "velour" : resolvedParams.store === "labura" ? "labura" : "libero") as "libero" | "velour" | "labura";
  
  const user = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  const isAdmin = user?.emailAddresses[0]?.emailAddress === adminEmail;

  const [orders, stats] = await Promise.all([
    getProcessingOrders(store),
    getScannerStats(store)
  ]);
  
  return <ScannerListClient initialOrders={orders} initialStats={stats} initialStore={store} isAdmin={isAdmin} />;
}
