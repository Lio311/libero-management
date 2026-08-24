import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { printJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

// POST: Add new print job
export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { store, orderIds, jobType, metadata } = await req.json();

    if (!store || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    // Insert into db
    await db.insert(printJobs).values({
      store,
      orderIds,
      status: 'pending',
      jobType: jobType || 'mini-perfume',
      metadata
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding print job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Poll for pending jobs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const store = searchParams.get('store');

    if (!store) {
      return NextResponse.json({ error: 'Store is required' }, { status: 400 });
    }

    // Find pending jobs
    const jobs = await db.query.printJobs.findMany({
      where: (jobs, { eq, and }) => and(eq(jobs.store, store), eq(jobs.status, 'pending')),
      orderBy: (jobs, { asc }) => [asc(jobs.createdAt)],
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching print jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Mark job as completed
export async function PATCH(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    await db.update(printJobs)
      .set({ status: 'completed' })
      .where(eq(printJobs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating print job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
