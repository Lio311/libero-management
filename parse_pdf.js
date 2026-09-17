const { PDFDocument } = require('pdf-lib');
const pako = require('pako');
const fs = require('fs');

async function run(file) {
  const doc = await PDFDocument.load(fs.readFileSync(file));
  const page = doc.getPages()[0];
  const contents = page.node.Contents();
  for (let ref of contents.array) {
    const s = doc.context.lookup(ref);
    let str = "";
    try {
      str = pako.inflate(s.contents, { to: 'string' });
    } catch(e) {
      str = Buffer.from(s.contents).toString('utf-8');
    }
    console.log(str.trim());
  }
}
console.log("Scale then Translate:");
run('test_scale_translate.pdf');
console.log("Translate then Scale:");
run('test_translate_scale.pdf');
