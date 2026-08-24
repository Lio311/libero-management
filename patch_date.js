const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  // In scanner-list-client.tsx, we have mounted.
  if (code.includes('mounted ?')) return; // already patched?
  
  if (file.includes('scanner-list-client')) {
    code = code.replace(
      /<span>\{format\(new Date\(order\.dateCreated\), 'dd\/MM\/yyyy HH:mm', \{ locale: he \}\)\}<\/span>/g,
      "<span>{mounted ? format(new Date(order.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he }) : ''}</span>"
    );
  }
  
  if (file.includes('[orderId]/scanner-client.tsx')) {
    code = code.replace(
      /<span>\{format\(new Date\(order\.dateCreated\), 'dd\/MM\/yyyy HH:mm', \{ locale: he \}\)\}<\/span>/g,
      "<span>{mounted ? format(new Date(order.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he }) : ''}</span>"
    );
    // wait, does scanner-client have mounted? Let's check!
  }
  
  fs.writeFileSync(file, code);
}

patchFile('src/app/shipping-scanner/scanner-list-client.tsx');
