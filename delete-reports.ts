import { db } from "./src/lib/db";
import { qcReports } from "./src/lib/db/schema";
import { eq, like } from "drizzle-orm";

async function run() {
  const reports = await db.select({ id: qcReports.id, date: qcReports.reportDate, total: qcReports.totalInspected }).from(qcReports);
  console.log("Current reports:", reports);
  
  // Optionally delete all reports to clean up, or just print them.
  // We'll just print them for now to see what's there.
}
run().catch(console.error).then(() => process.exit(0));
