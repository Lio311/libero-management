import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function test() {
  const newDoc = await PDFDocument.create();
  console.log("PDF-lib embed works conceptually.");
}
test();
