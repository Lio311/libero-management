import { NextResponse } from "next/server";

export async function GET() {
  const initRes = await fetch("https://elvis.lindo.co.il/");
  const initCookies = initRes.headers.getSetCookie();
  const initCookieStr = initCookies.map((c) => c.split(';')[0]).join('; ');

  const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": initCookieStr,
      "User-Agent": "Mozilla/5.0",
    },
    body: `email_address=${encodeURIComponent(process.env.LINDO_EMAIL!)}&password=${encodeURIComponent(process.env.LINDO_PASSWORD!)}&remember_me=yes`,
    redirect: "manual",
  });

  return NextResponse.json({
      initCookies: initCookies,
      loginStatus: loginRes.status,
      loginLocation: loginRes.headers.get('location'),
      loginCookies: loginRes.headers.getSetCookie(),
  });
}
