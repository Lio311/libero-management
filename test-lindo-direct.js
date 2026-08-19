const email = process.env.LINDO_EMAIL;
const password = process.env.LINDO_PASSWORD;

async function run() {
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
    body: `email_address=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&remember_me=yes`,
    redirect: "manual",
  });
  
  console.log("Login Status:", loginRes.status);
  console.log("Login Headers:");
  loginRes.headers.forEach((val, key) => console.log(key, ":", val));
}
run();
