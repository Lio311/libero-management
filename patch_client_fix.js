const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const importTarget = `import { getArchivedCompletedOrders } from "@/app/actions/scanner-actions";`;
const importReplacement = `import { getArchivedCompletedOrders, fixShippingLabelsDb } from "@/app/actions/scanner-actions";`;
code = code.replace(importTarget, importReplacement);

const effectTarget = `  useEffect(() => {
    setOrders(initialOrders);
    setArchivedLoaded(false);
  }, [initialOrders]);`;
const effectReplacement = `  useEffect(() => {
    setOrders(initialOrders);
    setArchivedLoaded(false);
    
    // Silently fix DB in background
    fixShippingLabelsDb().catch(console.error);
  }, [initialOrders]);`;
code = code.replace(effectTarget, effectReplacement);

fs.writeFileSync(file, code);
