const controller = new AbortController();
setTimeout(() => controller.abort(), 100);
fetch('https://velour.co.il/wp-json/wc/v3/products', { signal: controller.signal }).catch(e => console.log('Aborted!'));
