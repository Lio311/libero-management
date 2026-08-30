const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

if (code.includes('const orders = initialOrders;')) {
    code = code.replace(
        /const orders = initialOrders;/,
        `const [orders, setOrders] = useState<ScannerOrder[]>(initialOrders);\n  useEffect(() => {\n    setOrders(initialOrders);\n    setArchivedLoaded(false);\n  }, [initialOrders]);\n  const [archivedLoaded, setArchivedLoaded] = useState(false);\n  const [isLoadingArchived, setIsLoadingArchived] = useState(false);`
    );
}

// Add ChevronDown to lucide-react imports if not present
if (!code.includes('ChevronDown')) {
    code = code.replace(
        /import { Package, CalendarIcon, User, Truck, Store, PlayCircle, CheckCircle2, ListTodo, Printer, Search } from "lucide-react";/,
        'import { Package, CalendarIcon, User, Truck, Store, PlayCircle, CheckCircle2, ListTodo, Printer, Search, ChevronDown, Loader2 } from "lucide-react";'
    );
}

// Add the import for getArchivedCompletedOrders
if (!code.includes('getArchivedCompletedOrders')) {
    code = code.replace(
        /import { ScannerOrder, createOrderLabel/g,
        'import { ScannerOrder, createOrderLabel, getArchivedCompletedOrders'
    );
}

// Add the accordion logic at the end of completedOrders section
if (!code.includes('archivedLoaded')) {
    code = code.replace(
        /<\/div>\n        <\/div>\n      \)}\n      <CreateLabelModal isOpen=\{isLabelModalOpen\} onClose=\{\(\) => setIsLabelModalOpen\(false\)\} \/>\n    <\/div>\n  \);\n}/,
        `</div>
          
          {!archivedLoaded ? (
            <button
              onClick={async () => {
                setIsLoadingArchived(true);
                try {
                  const archived = await getArchivedCompletedOrders(store as any, 20);
                  setOrders(prev => [...prev, ...archived]);
                  setArchivedLoaded(true);
                } catch(err) {
                  console.error(err);
                } finally {
                  setIsLoadingArchived(false);
                }
              }}
              className="mt-6 w-full py-4 bg-secondary/50 hover:bg-secondary rounded-xl border border-border/50 text-muted-foreground flex items-center justify-center gap-2 transition-all font-medium"
            >
              {isLoadingArchived ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  טוען היסטוריית הזמנות...
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  הצג את כל היסטוריית ההזמנות ({stats.completedToday} סה"כ)
                </>
              )}
            </button>
          ) : (
            <div className="mt-6 text-center text-sm text-muted-foreground pb-8">
              כל היסטוריית ההזמנות נטענה בהצלחה.
            </div>
          )}
        </div>
      )}
      <CreateLabelModal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} />
    </div>
  );
}`
    );
}

fs.writeFileSync(file, code);
