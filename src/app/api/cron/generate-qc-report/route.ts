import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qcReports } from '@/lib/db/schema';
import { getQcProducts } from '@/app/actions/qc-actions';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  // Verify authorization for cron jobs
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow if CRON_SECRET matches, or if no CRON_SECRET is set (dev mode), or if it's a manual trigger
  const url = new URL(request.url);
  const isManual = url.searchParams.get('manual') === 'true';

  if (cronSecret && !isManual && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all products with their metrics
    const allProducts = await getQcProducts();
    
    // Calculate how many products are currently in "ok" status (inspected in the last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const inspectedCount = allProducts.filter(p => 
      p.lastInspection && new Date(p.lastInspection) >= threeMonthsAgo
    ).length;

    const reportDateStr = new Date().toISOString().split('T')[0];

    // Delete any existing report for today to ensure only one report per day
    await db.delete(qcReports).where(eq(qcReports.reportDate, reportDateStr));

    await db.insert(qcReports).values({
      reportDate: reportDateStr,
      totalInspected: inspectedCount, // Number of products currently valid/inspected
      reportData: allProducts, // Save ALL products as requested
    });

    return NextResponse.json({
      success: true,
      reportDate: reportDateStr,
      totalInspected: inspectedCount,
      totalProducts: allProducts.length,
    });
  } catch (error: any) {
    console.error('Generate QC Report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QC report' },
      { status: 500 }
    );
  }
}
