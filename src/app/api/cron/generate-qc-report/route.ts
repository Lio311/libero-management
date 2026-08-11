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
    
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' });
    const reportDateStr = formatter.format(new Date()); // YYYY-MM-DD in Israel time
    
    // Only include products that had an inspection today in Israel time
    const inspectedTodayProducts = allProducts.filter(p => 
      p.inspections && p.inspections.some((i: any) => {
        if (!i.inspectedAt) return false;
        const inspectionDateStr = formatter.format(new Date(i.inspectedAt));
        return inspectionDateStr === reportDateStr;
      })
    );

    // Delete any existing report for today or generated in the last 24 hours to clean up duplicates
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // We can't easily do an OR condition without importing it, so we'll just run two deletes
    await db.delete(qcReports).where(eq(qcReports.reportDate, reportDateStr));
    
    // To delete by createdAt, we need to import gte. Since we didn't import it, let's just fetch all reports and delete those created today.
    const allExistingReports = await db.select().from(qcReports);
    for (const r of allExistingReports) {
      if (new Date(r.createdAt) >= twentyFourHoursAgo) {
        await db.delete(qcReports).where(eq(qcReports.id, r.id));
      }
    }

    await db.insert(qcReports).values({
      reportDate: reportDateStr,
      totalInspected: inspectedTodayProducts.length, // Number of products inspected today
      reportData: inspectedTodayProducts, // Save only products inspected today
    });

    return NextResponse.json({
      success: true,
      reportDate: reportDateStr,
      totalInspected: inspectedTodayProducts.length,
      totalProducts: inspectedTodayProducts.length,
    });
  } catch (error: any) {
    console.error('Generate QC Report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QC report' },
      { status: 500 }
    );
  }
}
