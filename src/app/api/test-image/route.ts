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

  const imgRes = await fetch(`https://elvis.lindo.co.il/img/catalog/thumbnail/24599.jpg`, {
    headers: {
      "Cookie": cookieStr,
      "Referer": "https://elvis.lindo.co.il/my-account/",
    },
    redirect: "manual",
  });

  return NextResponse.json({
      status: imgRes.status,
      location: imgRes.headers.get('location'),
      cookieUsed: cookieStr,
  });
}
