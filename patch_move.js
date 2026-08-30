const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldEffect = `  useEffect(() => {
    if (searchTerm && !archivedLoaded && !isLoadingArchived) {
      setIsLoadingArchived(true);
      getArchivedCompletedOrders(store as any, 20)
        .then(archived => {
          setOrders(prev => {
            const existingIds = new Set(prev.map(o => o.id));
            const newOrders = archived.filter(o => !existingIds.has(o.id));
            return [...prev, ...newOrders];
          });
          setArchivedLoaded(true);
        })
        .catch(console.error)
        .finally(() => setIsLoadingArchived(false));
    }
  }, [searchTerm, archivedLoaded, isLoadingArchived, store]);
`;

code = code.replace(oldEffect, '');
code = code.replace(
  /const \[searchTerm, setSearchTerm\] = useState\(''\);/,
  `const [searchTerm, setSearchTerm] = useState('');\n${oldEffect}`
);

fs.writeFileSync(file, code);
