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
  // Find lines with product names or IDs
  const matches = html.match(/<tr[^>]*>.*?<\/tr>/gs);
  if (matches) {
     console.log(`Found ${matches.length} rows`);
     console.log(matches.slice(0, 5).join('\n'));
  } else {
     console.log("No table rows found, maybe it uses JS to load data?");
     console.log(html.substring(0, 1000));
  }
}
test();
