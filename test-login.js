const email = process.env.LINDO_EMAIL;
const password = process.env.LINDO_PASSWORD;

async function test() {
    const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `email_address=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&remember_me=yes`,
      redirect: "manual",
    });

    console.log("Login Location:", loginRes.headers.get("location"));
    const cookies = loginRes.headers.getSetCookie();
    const cookieStr = cookies ? cookies.map((c) => c.split(";")[0]).join("; ") : "";
    
    const imgRes = await fetch("https://elvis.lindo.co.il/img/catalog/thumbnail/30154.jpg", {
      headers: {
        "Cookie": cookieStr,
        "Referer": "https://elvis.lindo.co.il/my-account/",
      },
      redirect: "manual",
    });
    console.log("Image Fetch Status:", imgRes.status);
    console.log("Image Fetch Location:", imgRes.headers.get("location"));
}
test();
