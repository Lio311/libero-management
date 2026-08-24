const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://members.lionwheel.com/tasks/print_public_label.pdf?public_id=4YIMODS3FX', { waitUntil: 'networkidle2' });
  await page.pdf({ path: 'test_label.pdf', width: '100mm', height: '150mm', printBackground: true });
  await browser.close();
  console.log("Done");
})();
