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
  import('fs').then(fs => fs.writeFileSync('ws-order.html', html));
  console.log("Saved ws-order.html");
}
test();
