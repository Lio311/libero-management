const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('captured.pdf');
pdf(dataBuffer).then(function(data) {
  console.log('Text:', data.text);
}).catch(console.error);
