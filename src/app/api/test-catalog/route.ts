import { NextResponse } from "next/server";

export async function GET() {
  const lindoEmail = process.env.LINDO_EMAIL;
  const lindoPassword = process.env.LINDO_PASSWORD;

  const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `email_address=${encodeURIComponent(lindoEmail!)}&password=${encodeURIComponent(lindoPassword!)}&remember_me=yes`,
    redirect: "manual",
  });

  const cookies = loginRes.headers.getSetCookie();
  const cookieStr = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";

  const catalogRes = await fetch("https://elvis.lindo.co.il/apps/wholesale/ws-catalog.php", {
    method: "POST",
    headers: {
      "Cookie": cookieStr,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "comax_price_list_id=2",
  });

  const catalogData = await catalogRes.json();
  return NextResponse.json({
      product: catalogData.data[0],
      total: catalogData.data.length
  });
}
