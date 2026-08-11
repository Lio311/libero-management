import { db } from './src/lib/db';
import { qcReports } from './src/lib/db/schema';

async function main() {
  const reports = await db.select().from(qcReports);
  console.log('Reports found:', reports.length);
  for (const r of reports) {
    console.log(`- ID: ${r.id}, Date: ${r.reportDate}, Total: ${r.totalInspected}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
