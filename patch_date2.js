const fs = require('fs');

const file = 'src/app/shipping-scanner/[orderId]/scanner-client.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('const [mounted, setMounted]')) {
  code = code.replace(
    /const \[deviceType, setDeviceType\] = useState<"mobile" | "desktop" | null>\(null\);/,
    `const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);\n  const [mounted, setMounted] = useState(false);`
  );
  
  code = code.replace(
    /setDeviceType\(\/Android\|iPhone\|iPad\|iPod\/i\.test\(navigator\.userAgent\) \? "mobile" : "desktop"\);/g,
    `setDeviceType(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop");\n    setMounted(true);`
  );
  
  code = code.replace(
    /<span>\{format\(new Date\(order\.dateCreated\), 'dd\/MM\/yyyy HH:mm', \{ locale: he \}\)\}<\/span>/g,
    "<span>{mounted ? format(new Date(order.dateCreated), 'dd/MM/yyyy HH:mm', { locale: he }) : ''}</span>"
  );
}

fs.writeFileSync(file, code);
