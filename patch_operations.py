import re

with open('src/app/operations/operations-client.tsx', 'r') as f:
    content = f.read()

# Add EditableB2BCard component
b2b_card_code = """
function EditableB2BCard({ customer, onCancelNew }: { customer: any, onCancelNew?: () => void }) {
  const [isEditing, setIsEditing] = useState(customer.isNew || false);
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState({
    storeName: customer.storeName || '',
    city: customer.city || '',
    contact: customer.contact || '', // Not in schema directly, we use city for this usually
    interest: customer.interest || '',
    lastOrderDate: customer.lastOrderDate || '',
    totalAmountNis: customer.totalAmountNis || ''
  });

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        storeName: data.storeName,
        city: data.city,
        interest: data.interest,
        lastOrderDate: data.lastOrderDate,
        totalAmountNis: data.totalAmountNis ? parseFloat(data.totalAmountNis as string) : null
      };
      
      if (customer.isNew) {
        await createWholesaleCustomer(payload as any);
        if (onCancelNew) onCancelNew();
      } else {
        await updateWholesaleCustomer(customer.id, payload as any);
        setIsEditing(false);
      }
    });
  };

  const handleCancel = () => {
    if (customer.isNew && onCancelNew) {
      onCancelNew();
    } else {
      setData({
        storeName: customer.storeName || '',
        city: customer.city || '',
        contact: customer.contact || '',
        interest: customer.interest || '',
        lastOrderDate: customer.lastOrderDate || '',
        totalAmountNis: customer.totalAmountNis || ''
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) {
      startTransition(async () => {
        await deleteWholesaleCustomer(customer.id);
      });
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-blue-50/30 rounded-lg border border-blue-100 shadow-sm relative">
        <input className="w-full text-right p-2 border rounded-lg bg-white/80 font-semibold" placeholder="שם חנות" value={data.storeName} onChange={(e) => setData({ ...data, storeName: e.target.value })} autoFocus />
        <div className="grid grid-cols-2 gap-2">
          <input className="w-full text-right p-2 border rounded-lg bg-white/80 text-sm" placeholder="עיר / אזור" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} />
          <input className="w-full text-right p-2 border rounded-lg bg-white/80 text-sm" placeholder="רמת עניין" value={data.interest} onChange={(e) => setData({ ...data, interest: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="w-full text-right p-2 border rounded-lg bg-white/80 text-sm" placeholder="תאריך הזמנה אחרונה" value={data.lastOrderDate} onChange={(e) => setData({ ...data, lastOrderDate: e.target.value })} />
          <input className="w-full text-right p-2 border rounded-lg bg-white/80 text-sm" placeholder="סכום הזמנות כולל (ש״ח)" type="number" value={data.totalAmountNis} onChange={(e) => setData({ ...data, totalAmountNis: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <button onClick={handleSave} disabled={isPending} className="flex justify-center items-center p-2 text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"><Check className="h-5 w-5" /></button>
          <button onClick={handleCancel} disabled={isPending} className="flex justify-center items-center p-2 text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-border/50 relative group">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="font-semibold text-sm text-gray-900">{customer.storeName || 'ללא שם'}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Contact className="w-3 h-3 ml-1" />
            {customer.city || 'לא צוין'}
          </div>
          {customer.lastOrderDate && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3 ml-1" />
              הזמנה אחרונה: {customer.lastOrderDate}
            </div>
          )}
          {customer.totalAmountNis && (
            <div className="flex items-center text-xs font-medium text-green-600 mt-1">
              סה״כ הכנסות: ₪{customer.totalAmountNis}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="text-[10px] bg-white">{customer.interest || 'לא צוין'}</Badge>
          <div className="flex gap-1 mt-2">
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="ערוך"><Edit2 className="h-3.5 w-3.5" /></button>
            <button onClick={handleDelete} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="מחק"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

"""

content = content.replace("function EditableWholesaleRow", b2b_card_code + "function EditableWholesaleRow")

# Update EditableWholesaleRow data state
content = content.replace(
    "interest: customer.interest || '',\n    notes: customer.notes || ''",
    "interest: customer.interest || '',\n    notes: customer.notes || '',\n    lastOrderDate: customer.lastOrderDate || '',\n    totalAmountNis: customer.totalAmountNis || ''"
)

# Update EditableWholesaleRow inputs
row_inputs_before = '<td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">הערות</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} /></td>'
row_inputs_after = row_inputs_before + '\n        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">תאריך הזמנה</span><input className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.lastOrderDate} onChange={(e) => setData({ ...data, lastOrderDate: e.target.value })} /></td>\n        <td className="p-0 md:p-2 flex flex-col md:table-cell gap-1"><span className="md:hidden font-medium text-xs text-gray-500 uppercase tracking-wider">סכום בש"ח</span><input type="number" className="w-full text-right p-2 md:p-1 border rounded-lg md:rounded bg-white/80" value={data.totalAmountNis} onChange={(e) => setData({ ...data, totalAmountNis: e.target.value })} /></td>'
content = content.replace(row_inputs_before, row_inputs_after)

# Update EditableWholesaleRow display columns
row_display_before = '<td className="py-2 px-4 md:py-3 flex justify-between items-center md:table-cell text-sm">\n        <span className="md:hidden text-gray-500 text-xs uppercase tracking-wider">הערות</span>\n        <span className="text-gray-600 truncate max-w-[200px] text-left md:text-right" dir="auto">{customer.notes || \'-\'}</span>\n      </td>'
row_display_after = row_display_before + '\n      <td className="hidden md:table-cell py-3 px-4 text-sm">{customer.lastOrderDate || \'-\'}</td>\n      <td className="hidden md:table-cell py-3 px-4 text-sm font-medium text-green-600">{customer.totalAmountNis ? `₪${customer.totalAmountNis}` : \'-\'}</td>'
content = content.replace(row_display_before, row_display_after)

# Update table headers
thead_before = '<th className="py-3 px-4 font-medium whitespace-nowrap">הערות</th>'
thead_after = thead_before + '\n                  <th className="py-3 px-4 font-medium whitespace-nowrap">תאריך הזמנה</th>\n                  <th className="py-3 px-4 font-medium whitespace-nowrap">סכום ש"ח</th>'
content = content.replace(thead_before, thead_after)

# Update the 'לא נמצאו לקוחות.' colSpan
content = content.replace('colSpan={9}', 'colSpan={11}')

# Update B2B Cards container to use rawWholesaleCustomers and EditableB2BCard
cards_section_before = """        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>לקוחות סיטונאות (B2B)</CardTitle>
            <CardDescription>רשימת לקוחות ומתעניינים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wholesaleClients.slice(0, 8).map((client, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-border/50">
                <div className="space-y-1">
                  <div className="font-semibold text-sm">{client.name}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Contact className="w-3 h-3 ml-1" />
                    {client.contact}
                  </div>
                </div>
                <div className="text-left">
                  <Badge variant="outline" className="text-[10px]">{client.interest}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>"""

cards_section_after = """        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>לקוחות סיטונאות (B2B)</CardTitle>
                <CardDescription>רשימת לקוחות ומתעניינים</CardDescription>
              </div>
              <button onClick={() => setIsAddingCustomerTop(true)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> הוסף לקוח
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAddingCustomerTop && <EditableB2BCard customer={{ isNew: true }} onCancelNew={() => setIsAddingCustomerTop(false)} />}
            {rawWholesaleCustomers.map((customer) => (
              <EditableB2BCard key={customer.id} customer={customer} />
            ))}
            {rawWholesaleCustomers.length === 0 && !isAddingCustomerTop && (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                לא נמצאו לקוחות. לחץ על "הוסף לקוח" כדי להתחיל.
              </div>
            )}
          </CardContent>
        </Card>"""

content = content.replace(cards_section_before, cards_section_after)

# Add isAddingCustomerTop state
content = content.replace(
    "const [isAddingCustomer, setIsAddingCustomer] = useState(false);",
    "const [isAddingCustomer, setIsAddingCustomer] = useState(false);\n  const [isAddingCustomerTop, setIsAddingCustomerTop] = useState(false);"
)

with open('src/app/operations/operations-client.tsx', 'w') as f:
    f.write(content)

