const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const importTarget = `import { ScannerOrder, createOrderLabel, getArchivedCompletedOrders, fixShippingLabelsDb } from "@/app/actions/scanner-actions";`;
const importReplacement = `import { ScannerOrder, createOrderLabel, getArchivedCompletedOrders, fixShippingLabelsDb, searchScannerOrders } from "@/app/actions/scanner-actions";`;
code = code.replace(importTarget, importReplacement);

const targetEffect = `const [searchTerm, setSearchTerm] = useState("");`;
const replacementEffect = `const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (searchTerm.trim().length >= 3) {
      const term = searchTerm.trim().replace(/[\\[\\]*]/g, '');
      const timer = setTimeout(() => {
        searchScannerOrders(store as any, term).then(newOrders => {
           if (newOrders.length > 0) {
             setOrders(prev => {
               const existingIds = new Set(prev.map(o => o.id));
               const toAdd = newOrders.filter(o => !existingIds.has(o.id));
               if (toAdd.length > 0) {
                 return [...prev, ...toAdd];
               }
               return prev;
             });
           }
        });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, store]);`;
code = code.replace(targetEffect, replacementEffect);

fs.writeFileSync(file, code);
