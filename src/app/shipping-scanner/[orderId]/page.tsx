import { getOrderById, getScannerSettings } from "@/app/actions/scanner-actions";
import { notFound } from "next/navigation";
import ScannerClient from "./scanner-client";

export default async function OrderScannerPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ store?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const store = (resolvedSearch.store === "velour" ? "velour" : "libero") as "libero" | "velour";
  
  const orderId = parseInt(resolvedParams.orderId, 10);
  
  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId, store);

  if (!order) {
    notFound();
  }

  const manualKeywords = await getScannerSettings();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 h-screen overflow-y-auto w-full">
      <ScannerClient order={order} manualKeywords={manualKeywords} store={store} />
    </div>
  );
}
