import { getQcInventoryProducts } from "@/app/actions/qc-inventory-actions";
import QcInventoryClient from "./qc-inventory-client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "בקרת מלאי | Libero",
};

export default async function QcInventoryPage() {
  const products = await getQcInventoryProducts();

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <QcInventoryClient products={products} />
    </Suspense>
  );
}
