async function test() {
  const loginRes = await fetch('https://elvis.lindo.co.il/my-account/login-process.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'email_address=liberoperfume%40gmail.com&password=123456789&remember_me=yes',
    redirect: 'manual'
  });
  
  const cookies = loginRes.headers.getSetCookie();
  console.log("Cookies:", cookies);
  
  let cookieStr = "";
  if (cookies) {
    cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
  }
  
  console.log("Cookie string:", cookieStr);
  
  const wsRes = await fetch('https://elvis.lindo.co.il/apps/wholesale/ws-order.php', {
    headers: {
      'Cookie': cookieStr
    }
  });
  
  const html = await wsRes.text();
  console.log("HTML length:", html.length);
  console.log("Title:", html.match(/<title>(.*?)<\/title>/)?.[1]);
  console.log("Includes login form?", html.includes('login-process.php'));
}
test();
