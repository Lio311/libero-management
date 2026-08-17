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

  const paths = [
    "img/catalog/thumbnail/24599.jpg",
    "img/catalog/24599.jpg",
    "images/catalog/thumbnail/24599.jpg",
    "images/catalog/24599.jpg",
    "catalog/images/24599.jpg",
    "images/24599.jpg",
    "uploads/24599.jpg"
  ];
  
  const results = [];
  
  for (const path of paths) {
     const imgRes = await fetch(`https://elvis.lindo.co.il/${path}`, {
        headers: { "Cookie": cookieStr },
        redirect: "manual",
     });
     results.push({
         path,
         status: imgRes.status,
         location: imgRes.headers.get("location")
     });
  }

  return NextResponse.json(results);
}
