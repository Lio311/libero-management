async function test() {
  const loginRes = await fetch('https://elvis.lindo.co.il/my-account/login-process.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'email_address=liberoperfume%40gmail.com&password=123456789&remember_me=yes',
    redirect: 'manual'
  });
  
  const cookies = loginRes.headers.getSetCookie();
  const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
  
  const wsRes = await fetch('https://elvis.lindo.co.il/apps/wholesale/ws-order.php', {
    headers: { 'Cookie': cookieStr }
  });
  
  const html = await wsRes.text();
  
  // Find strings that look like URLs or endpoints inside script tags
  const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi);
  if (scriptTags) {
     scriptTags.forEach(t => {
       if (t.includes('ajax') || t.includes('fetch') || t.includes('url:')) {
          console.log("Script with network requests:\n", t.substring(0, 500));
       }
     });
  }
}
test();
