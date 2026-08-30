
import { NextResponse } from "next/server";
import { BRAND_CONFIG } from "@/lib/wc-config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const store = (url.searchParams.get("store") || "velour") as 'velour' | 'labura' | 'libero';
  const config = BRAND_CONFIG[store];
  
  if (!config.ck || !config.cs) return NextResponse.json({ error: "No creds" });

  const newParams = new URLSearchParams();
  url.searchParams.forEach((val, key) => {
    if (key !== 'store') {
       newParams.append(key, val);
    }
  });
  newParams.append('consumer_key', config.ck);
  newParams.append('consumer_secret', config.cs);

  let wcUrl = `${config.baseUrl}/wp-json/wc/v3/orders?${newParams.toString()}`;
  
  try {
    const res = await fetch(wcUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
