import { db } from './src/lib/db';
import { qcReports } from './src/lib/db/schema';
import { getQcProducts } from './src/app/actions/qc-actions';

async function main() {
  try {
    const allProducts = await getQcProducts();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInspections = allProducts.filter(p => p.lastInspection && new Date(p.lastInspection) >= yesterday);
    console.log(`Found ${recentInspections.length} products inspected in the last 24h.`);

    const reportDateStr = new Date().toISOString().split('T')[0];

    const result = await db.insert(qcReports).values({
      reportDate: reportDateStr,
      totalInspected: recentInspections.length,
      reportData: recentInspections,
    }).returning();
    
    console.log("Successfully inserted qcReport:", result[0].id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
