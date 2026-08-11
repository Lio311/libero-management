import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { qcReports } from '@/lib/db/schema';
import { getQcProducts } from '@/app/actions/qc-actions';

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
    
    // Filter products inspected in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInspections = allProducts.filter(p => p.lastInspection && new Date(p.lastInspection) >= yesterday);

    const reportDateStr = new Date().toISOString().split('T')[0];

    await db.insert(qcReports).values({
      reportDate: reportDateStr,
      totalInspected: recentInspections.length,
      reportData: recentInspections,
    });

    return NextResponse.json({
      success: true,
      reportDate: reportDateStr,
      totalInspected: recentInspections.length,
    });
  } catch (error: any) {
    console.error('Generate QC Report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate QC report' },
      { status: 500 }
    );
  }
}
