import { getProcessingOrders } from "@/app/actions/scanner-actions";
import ScannerListClient from "./scanner-list-client";

export default async function ShippingScannerPage() {
  const orders = await getProcessingOrders();
  
  return <ScannerListClient orders={orders} />;
}
