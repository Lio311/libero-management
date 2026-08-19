async function run() {
  const email = process.env.LINDO_EMAIL;
  const password = process.env.LINDO_PASSWORD;

  const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `email_address=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&remember_me=yes`,
    redirect: "manual",
  });
  
  const cookies = loginRes.headers.getSetCookie();
  const cookieStr = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";

  const catalogRes = await fetch("https://elvis.lindo.co.il/apps/wholesale/ws-catalog.php", {
    method: "POST",
    headers: { "Cookie": cookieStr, "Content-Type": "application/x-www-form-urlencoded" },
    body: "comax_price_list_id=2",
  });

  const catalogText = await catalogRes.text();
  const data = JSON.parse(catalogText);
  console.log("Total items:", data.data.length);
  
  for (let i = 0; i < 5; i++) {
     const img = data.data[i].img;
     console.log("Trying img:", img);
     if (!img) continue;
     const imgRes = await fetch(`https://elvis.lindo.co.il/img/catalog/thumbnail/${img}`, {
        headers: { "Cookie": cookieStr, "Referer": "https://elvis.lindo.co.il/my-account/" },
        redirect: "manual",
     });
     console.log(` -> ${imgRes.status} ${imgRes.headers.get("location") || ""}`);
  }
}
run();
