import { getOrderById, getScannerSettings } from "@/app/actions/scanner-actions";
import { notFound } from "next/navigation";
import ScannerClient from "./scanner-client";
import { currentUser } from "@clerk/nextjs/server";

export default async function OrderScannerPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ store?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const store = (resolvedSearch.store === "velour" ? "velour" : resolvedSearch.store === "labura" ? "labura" : "libero") as "libero" | "velour" | "labura";
  
  const orderId = parseInt(resolvedParams.orderId, 10);
  
  if (isNaN(orderId)) {
    notFound();
  }

  const order = await getOrderById(orderId, store);

  if (!order) {
    notFound();
  }

  const manualKeywords = await getScannerSettings();
  
  const user = await currentUser();
  const adminEmail = process.env.admin_mail || process.env.admin_email || 'lior31197@gmail.com';
  const currentUserEmail = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = currentUserEmail === adminEmail;

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 h-[100dvh] overflow-y-auto w-full pb-32">
      <ScannerClient order={order} manualKeywords={manualKeywords} store={store} isAdmin={isAdmin} currentUserEmail={currentUserEmail} />
    </div>
  );
}
