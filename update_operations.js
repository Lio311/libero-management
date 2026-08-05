const fs = require('fs');
let code = fs.readFileSync('src/app/operations/operations-client.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  'import { updateWholesaleCustomer } from "@/app/actions/operations";',
  'import { updateWholesaleCustomer, createWholesaleCustomer, deleteWholesaleCustomer } from "@/app/actions/operations";\nimport { Trash2, Plus } from "lucide-react";'
);

// 2. Modify EditableWholesaleRow
let rowCode = `
function EditableWholesaleRow({ customer, onCancelNew }: { customer: any, onCancelNew?: () => void }) {
  const [isEditing, setIsEditing] = useState(customer.isNew || false);
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState({
    storeName: customer.storeName || '',
    city: customer.city || '',
    address: customer.address || '',
    phoneCall: customer.phoneCall || '',
    visit: customer.visit || '',
    potential: customer.potential || '',
    interest: customer.interest || '',
    notes: customer.notes || ''
  });

  const handleSave = () => {
    startTransition(async () => {
      if (customer.isNew) {
        await createWholesaleCustomer(data);
        if (onCancelNew) onCancelNew();
      } else {
        await updateWholesaleCustomer(customer.id, data);
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
        address: customer.address || '',
        phoneCall: customer.phoneCall || '',
        visit: customer.visit || '',
        potential: customer.potential || '',
        interest: customer.interest || '',
        notes: customer.notes || ''
      });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק שורה זו?')) {
      startTransition(async () => {
        await deleteWholesaleCustomer(customer.id);
      });
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/30 transition-colors">
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.storeName} onChange={(e) => setData({ ...data, storeName: e.target.value })} autoFocus /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.phoneCall} onChange={(e) => setData({ ...data, phoneCall: e.target.value })} /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.visit} onChange={(e) => setData({ ...data, visit: e.target.value })} /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.potential} onChange={(e) => setData({ ...data, potential: e.target.value })} /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.interest} onChange={(e) => setData({ ...data, interest: e.target.value })} /></td>
        <td className="py-2 px-4"><input className="w-full text-right p-1 border rounded" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} /></td>
        <td className="py-2 px-4 text-left whitespace-nowrap">
          <button onClick={handleSave} disabled={isPending} className="p-1 text-green-600 hover:bg-green-50 rounded mx-1"><Check className="h-4 w-4" /></button>
          <button onClick={handleCancel} disabled={isPending} className="p-1 text-red-600 hover:bg-red-50 rounded mx-1"><X className="h-4 w-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4 font-medium whitespace-nowrap">{customer.storeName || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{customer.city || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{customer.address || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{customer.phoneCall || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{customer.visit || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap">{customer.potential || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap"><Badge variant="outline" className="text-[10px]">{customer.interest || '-'}</Badge></td>
      <td className="py-3 px-4 text-muted-foreground">{customer.notes || '-'}</td>
      <td className="py-3 px-4 whitespace-nowrap text-left">
        <button onClick={() => setIsEditing(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mx-1"><Edit2 className="h-4 w-4" /></button>
        <button onClick={handleDelete} className="p-1 text-red-600 hover:bg-red-50 rounded mx-1"><Trash2 className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}`;

const regex = /function EditableWholesaleRow.*?<\/tr>\n  \);\n}/s;
code = code.replace(regex, rowCode);

// 3. Add states for isAddingCustomer in OperationsClient
code = code.replace(
  'const [viewMode, setViewMode] = useState<\'kanban\' | \'table\'>(\'kanban\');',
  'const [viewMode, setViewMode] = useState<\'kanban\' | \'table\'>(\'kanban\');\n  const [isAddingCustomer, setIsAddingCustomer] = useState(false);'
);

// 4. Update Header and Body
code = code.replace(
  '<CardTitle>נתוני לקוחות סיטונאיים (גולמי)</CardTitle>',
  `<div className="flex items-center justify-between">
            <CardTitle>נתוני לקוחות סיטונאיים (גולמי)</CardTitle>
            <button onClick={() => setIsAddingCustomer(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
              <Plus className="w-4 h-4" /> הוסף חדש
            </button>
          </div>`
);

code = code.replace(
  '{rawWholesaleCustomers && rawWholesaleCustomers.length > 0 ? (',
  `{isAddingCustomer && <EditableWholesaleRow customer={{ isNew: true }} onCancelNew={() => setIsAddingCustomer(false)} />}\n                {rawWholesaleCustomers && rawWholesaleCustomers.length > 0 ? (`
);
code = code.replace(
  '<th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">פעולות</th>',
  '<th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap text-left">פעולות</th>'
);

fs.writeFileSync('src/app/operations/operations-client.tsx', code);
console.log('Operations client updated successfully');
