
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatedShippingLabels } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const labels = await db.select().from(generatedShippingLabels).orderBy(desc(generatedShippingLabels.id)).limit(10);
    return NextResponse.json(labels);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
