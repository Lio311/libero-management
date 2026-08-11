import * as fs from 'fs';

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
  
  let cookieStr = "";
  if (cookies) {
    cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
  }
  
  const wsRes = await fetch('https://elvis.lindo.co.il/apps/wholesale/ws-catalog.php', {
    method: 'POST',
    headers: {
      'Cookie': cookieStr,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'comax_price_list_id=2'
  });
  
  const text = await wsRes.text();
  console.log("Length:", text.length);
  fs.writeFileSync('catalog.json', text);
}
test();
