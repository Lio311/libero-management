import { NextResponse } from "next/server";

let cachedCookie = "";
let cookieExpires = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const img = searchParams.get("img");

  if (!img) {
    return new NextResponse("Missing img", { status: 400 });
  }

  // Check if we need to login
  if (!cachedCookie || Date.now() > cookieExpires) {
    const lindoEmail = process.env.LINDO_EMAIL;
    const lindoPassword = process.env.LINDO_PASSWORD;

    if (!lindoEmail || !lindoPassword) {
      return new NextResponse("Missing credentials", { status: 500 });
    }

    const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `email_address=${encodeURIComponent(lindoEmail)}&password=${encodeURIComponent(lindoPassword)}&remember_me=yes`,
      redirect: "manual",
    });

    const cookies = loginRes.headers.getSetCookie();
    if (cookies) {
      cachedCookie = cookies.map((c) => c.split(";")[0]).join("; ");
      cookieExpires = Date.now() + 1000 * 60 * 60 * 2; // Cache for 2 hours
    }
  }

  // Fetch the image
  const imgRes = await fetch(`https://elvis.lindo.co.il/img/catalog/thumbnail/${img}`, {
    headers: {
      "Cookie": cachedCookie,
      "Referer": "https://elvis.lindo.co.il/my-account/",
    },
    redirect: "manual",
  });

  // If we got redirected (likely to login), it means the cookie expired or was invalid
  if (imgRes.status === 302 || imgRes.status === 301) {
     const debugInfo = {
       loginCookie: !!cachedCookie,
       imgStatus: imgRes.status,
       imgLocation: imgRes.headers.get("location"),
     };
     cachedCookie = "";
     cookieExpires = 0;
     return new NextResponse(`Unauthorized or Expired: ${JSON.stringify(debugInfo)}`, { status: 401 });
  }

  if (!imgRes.ok) {
    return new NextResponse("Failed to fetch image", { status: imgRes.status });
  }

  const buffer = await imgRes.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": imgRes.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
