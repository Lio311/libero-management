import { db } from "@/lib/db";
import { qcReports } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import QCReportsClient from "./reports-client";

export const dynamic = 'force-dynamic';

export default async function QCReportsPage() {
  const reports = await db
    .select({
      id: qcReports.id,
      createdAt: qcReports.createdAt,
      reportDate: qcReports.reportDate,
      totalInspected: qcReports.totalInspected,
      reportData: qcReports.reportData
    })
    .from(qcReports)
    .orderBy(desc(qcReports.createdAt));

  return <QCReportsClient initialReports={reports} priceChanges={[]} />;
}
