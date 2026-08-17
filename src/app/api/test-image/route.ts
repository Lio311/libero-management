import { NextResponse } from "next/server";

export async function GET() {
  const lindoEmail = process.env.LINDO_EMAIL;
  const lindoPassword = process.env.LINDO_PASSWORD;

  const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `email_address=${encodeURIComponent(lindoEmail!)}&password=${encodeURIComponent(lindoPassword!)}&remember_me=yes`,
    redirect: "manual",
  });

  const cookies = loginRes.headers.getSetCookie();
  const cookieStr = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";

  const catalogRes = await fetch("https://elvis.lindo.co.il/apps/wholesale/ws-catalog.php", {
    method: "POST",
    headers: { "Cookie": cookieStr, "Content-Type": "application/x-www-form-urlencoded" },
    body: "comax_price_list_id=2",
  });

  const catalogData = await catalogRes.json();
  const results = [];
  
  for (let i = 0; i < Math.min(5, catalogData.data.length); i++) {
     const img = catalogData.data[i].img;
     if (!img) continue;
     const imgRes = await fetch(`https://elvis.lindo.co.il/img/catalog/thumbnail/${img}`, {
        headers: { "Cookie": cookieStr, "Referer": "https://elvis.lindo.co.il/my-account/" },
        redirect: "manual",
     });
     results.push({
         img,
         status: imgRes.status,
         location: imgRes.headers.get("location")
     });
  }

  return NextResponse.json(results);
}
