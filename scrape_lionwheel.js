const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Spoof mobile
  await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36');
  
  await page.goto("https://members.lionwheel.com/tasks/print_public_label.pdf?public_id=JFPEXNZ5ER", { waitUntil: 'networkidle2' });
  
  const content = await page.content();
  const fs = require('fs');
  fs.writeFileSync('lionwheel_rendered.html', content);
  console.log("Wrote rendered HTML");
  
  await browser.close();
}
run();
