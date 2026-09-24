const fs = require('fs');
const content = fs.readFileSync('src/app/shipping-scanner/scanner-list-client.tsx', 'utf8');

const regex = /(<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">\n\s*\{partialOrders\.map\(order => \(\n\s*<OrderCard[^\n]*\/>\n\s*\)\)\}\n\s*<\/div>\n\s*<\/div>\n\s*\)\})/;

const insertion = `$1

          {mounted && duplicateOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                הזמנות כפולות ({duplicateOrders.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {duplicateOrders.map((order, i) => {
                  const prevOrder = duplicateOrders[i-1];
                  const pPhone = prevOrder?.billing?.phone?.replace(/\\D/g, '');
                  const cPhone = order.billing?.phone?.replace(/\\D/g, '');
                  const isNewGroup = i === 0 || pPhone !== cPhone;
                  
                  return (
                    <React.Fragment key={order.id}>
                      {isNewGroup && i > 0 && <div className="col-span-full h-2"></div>}
                      <OrderCard 
                        store={store} 
                        order={order} 
                        statusLabel={readyIds.includes(order.id) ? "ממתין לסגירה" : partiallyScannedIds.includes(order.id) ? "בתהליך סריקה" : "בטיפול"} 
                        statusColor={readyIds.includes(order.id) ? "green" : partiallyScannedIds.includes(order.id) ? "purple" : "blue"} 
                        isSelected={selectedOrderIds.includes(order.id)} 
                        onToggle={(e) => toggleSelection(e, order.id)} 
                        showCheckbox={true} 
                      />
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}`;

const replaced = content.replace(regex, insertion);
fs.writeFileSync('src/app/shipping-scanner/scanner-list-client.tsx', replaced);
