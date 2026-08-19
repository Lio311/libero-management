require('dotenv').config({path: '.env'});
const { LINDO_EMAIL, LINDO_PASSWORD } = process.env;

async function test() {
    console.log("Email:", LINDO_EMAIL);
    
    const loginRes = await fetch("https://elvis.lindo.co.il/my-account/login-process.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: `email_address=${encodeURIComponent(LINDO_EMAIL)}&password=${encodeURIComponent(LINDO_PASSWORD)}&remember_me=yes`,
      redirect: "manual",
    });

    console.log("Login Status:", loginRes.status);
    console.log("Login Location:", loginRes.headers.get("location"));
    const cookies = loginRes.headers.getSetCookie();
    console.log("Set-Cookie:", cookies);
    
    let cachedCookie = "";
    if (cookies) {
      cachedCookie = cookies.map((c) => c.split(";")[0]).join("; ");
    }
    
    console.log("Cached Cookie:", cachedCookie);
    
    const imgRes = await fetch("https://elvis.lindo.co.il/img/catalog/thumbnail/30154.jpg", {
      headers: {
        "Cookie": cachedCookie,
        "Referer": "https://elvis.lindo.co.il/my-account/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      redirect: "manual",
    });
    
    console.log("Image Fetch Status:", imgRes.status);
    console.log("Image Fetch Location:", imgRes.headers.get("location"));
}

test();
