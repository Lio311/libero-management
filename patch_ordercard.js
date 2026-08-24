const fs = require('fs');

const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /function OrderCard\(\{ order, statusLabel, statusColor, store, isSelected, onToggle, showCheckbox \}: \{/g,
  `function OrderCard({ order, statusLabel, statusColor, store, isSelected, onToggle, showCheckbox }: {`
);

// We need to add mounted to OrderCard
code = code.replace(
  /function OrderCard\(\{(.+?)\{ order: any, (.+?)\}\) \{/s,
  `function OrderCard({$1{ order: any, $2}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);`
);

fs.writeFileSync(file, code);
