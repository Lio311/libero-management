const fetch = require('node-fetch');
async function run() {
  const res = await fetch('https://members.lionwheel.com/tasks/print_public_label.pdf?public_id=MRNBTZQHSO');
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  const body = await res.text();
  console.log('Body starts with:', body.substring(0, 50));
}
run();
