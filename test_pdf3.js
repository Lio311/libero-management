const { PDFDocument } = require('pdf-lib');

async function run() {
  const base64 = "JVBERi0xLjcKJYGBgYEKCjUgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL1R5cGUgL09ialN0bQovTiA0Ci9GaXJzdCAyMAovTGVuZ3RoIDI2MQo+PgpzdHJlYW0KeJzVUk1LxDAQvedXzFFPnaRp2kopaD8uIiyLJ2UPYRuWgmykH6D/3pdmVTyIZwmPfLw3yUzeSGJSpDWllBekKUsVVZVIHt9fHSU7e3KzSO7HYaZnsEx7Ooik8et5ISnqWnxrG7vYF38SMYhkEH8qdpMf1qObqOq7vmfOmdlowDCrFnMDlIDCHpwqsAZyfQHO8pQ5vQXXR5g8xgR+02aX+A4ztCZo2qjVRdx/vRve6uId6q98ylokD35o7eLoqr1RrAyXMpNSGV0+XeM7JmcX/3+L2/If/fnXCn/4HOwNJk8u9MDmcrJ3s1+nI2yHrg7/5YbR3vk3dA1jSAYyRu+A/ABKdI3jCmVuZHN0cmVhbQplbmRvYmoKCjYgMCBvYmoKPDwKL1NpemUgNwovUm9vdCAyIDAgUgovSW5mbyAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQovVHlwZSAvWFJlZgovTGVuZ3RoIDM0Ci9XIFsgMSAyIDIgXQovSW5kZXggWyAwIDcgXQo+PgpzdHJlYW0KeJwVxDEOACAIBLAext3/+ngIHYructmy1XbikXwGQ4wCrwplbmRzdHJlYW0KZW5kb2JqCgpzdGFydHhyZWYKMzc5CiUlRU9G";
  try {
    const pdfBuffer = Buffer.from(base64, 'base64');
    const doc = await PDFDocument.load(pdfBuffer);
    
    const pages = doc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const scale = 0.82;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const x = ((width - scaledWidth) / 2) + 40;
      const y = (height - scaledHeight) / 2;
      
      // Instead of embedPdf, try scaling and translating the content directly
      page.scaleContent(scale, scale);
      page.translateContent(x, y);
    }
    
    await doc.saveAsBase64();
    console.log("Success with direct manipulation");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
