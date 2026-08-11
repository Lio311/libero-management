import fetch from 'node:fetch';
async function test() {
  const loginRes = await fetch('https://elvis.lindo.co.il/my-account/login-process.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'email_address=liberoperfume%40gmail.com&password=123456789&remember_me=yes',
    redirect: 'manual'
  });
  
  const cookies = loginRes.headers.getSetCookie();
  const cookieStr = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
  
  const jsRes = await fetch('https://elvis.lindo.co.il/assets/js/wholesale.js', {
    headers: { 'Cookie': cookieStr }
  });
  
  const js = await jsRes.text();
  import('fs').then(fs => fs.writeFileSync('wholesale.js', js));
  console.log("Saved wholesale.js. Length:", js.length);
}
test();
