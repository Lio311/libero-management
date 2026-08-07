import { getQcProducts, getQcStats } from "@/app/actions/qc-actions";
import QcClient from "./qc-client";

export default async function QcPage() {
  const [products, stats] = await Promise.all([
    getQcProducts(),
    getQcStats(),
  ]);

  return <QcClient products={products} stats={stats} />;
}
