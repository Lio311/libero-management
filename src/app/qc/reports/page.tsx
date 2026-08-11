import { db } from "@/lib/db";
import { qcReports, priceHistory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import QCReportsClient from "./reports-client";

export const dynamic = 'force-dynamic';

export default async function QCReportsPage() {
  const reports = await db
    .select()
    .from(qcReports)
    .orderBy(desc(qcReports.createdAt));

  const allPriceChanges = await db
    .select()
    .from(priceHistory)
    .orderBy(desc(priceHistory.changedAt));

  return <QCReportsClient initialReports={reports} priceChanges={allPriceChanges} />;
}
