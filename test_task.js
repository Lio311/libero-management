const LIONWHEEL_API_KEY = "c_key_ea2313a9-c33a-436a-bd4b-ed2978e51a70";
async function run() {
  const url = `https://members.lionwheel.com/api/v1/tasks/by_order_id/44718-1786965587274?key=${LIONWHEEL_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
