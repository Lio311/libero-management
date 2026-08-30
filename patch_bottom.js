const fs = require('fs');
const file = 'src/app/shipping-scanner/scanner-list-client.tsx';
let code = fs.readFileSync(file, 'utf8');

const target = `          </div>
        </div>
      )}
      <CreateLabelModal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} />
    </div>
  );
}`;

const replacement = `          </div>
          
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
                  הצג את כל היסטוריית ההזמנות
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
}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync(file, code);
  console.log("Patched successfully.");
} else {
  console.log("Target not found!");
}
