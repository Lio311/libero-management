import { getOrderById, getScannerSettings } from "@/app/actions/scanner-actions";
import { notFound } from "next/navigation";
import ScannerClient from "./scanner-client";

export default async function OrderScannerPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params;
  const orderId = parseInt(resolvedParams.orderId, 10);
  
  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const manualKeywords = await getScannerSettings();

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 h-screen overflow-y-auto w-full">
      <ScannerClient order={order} manualKeywords={manualKeywords} />
    </div>
  );
}
