
import { NextResponse } from "next/server";
import { BRAND_CONFIG } from "@/lib/wc-config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const store = (url.searchParams.get("store") || "velour") as 'velour' | 'labura' | 'libero';
  const config = BRAND_CONFIG[store];
  const search = url.searchParams.get("search");
  
  if (!config.ck || !config.cs) return NextResponse.json({ error: "No creds" });

  let wcUrl = `${config.baseUrl}/wp-json/wc/v3/orders?per_page=5&consumer_key=${config.ck}&consumer_secret=${config.cs}`;
  if (search) {
     wcUrl += `&search=${search}`;
  }
  
  try {
    const res = await fetch(wcUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
