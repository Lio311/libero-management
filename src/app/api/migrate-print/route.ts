import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "print_jobs" (
        "id" serial PRIMARY KEY NOT NULL,
        "store" varchar(50) NOT NULL,
        "order_ids" jsonb NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
