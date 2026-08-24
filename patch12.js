const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('const [deviceType, setDeviceType]')) {
  code = code.replace(
    /const \[mounted, setMounted\] = useState\(false\);/,
    `const [mounted, setMounted] = useState(false);\n  const [deviceType, setDeviceType] = useState<"mobile" | "desktop" | null>(null);\n\n  useEffect(() => {\n    setDeviceType(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop");\n  }, []);\n`
  );
}
fs.writeFileSync(file, code);
