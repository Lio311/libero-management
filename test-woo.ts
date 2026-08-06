const ck = "ck_50e2712ebe187cae81f5a2b6353c0a316067eefe";
const cs = "cs_fe5ad58ff939b47a0856f5a9c3478cefa5c74c04";
const auth = Buffer.from(ck + ":" + cs).toString('base64');
fetch("https://velour.co.il/wp-json/wc/v3/orders?per_page=1&status=processing,completed", {
  headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json' }
}).then(r => r.json()).then(data => console.log(data[0].date_created)).catch(console.error);
