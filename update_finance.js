 
 
/* eslint-disable @typescript-eslint/no-require-imports */
 
const fs = require('fs');
let code = fs.readFileSync('src/app/finance/finance-client.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  'import { updateImportPayment } from "@/app/actions/finance";',
  'import { updateImportPayment, createImportPayment, deleteImportPayment, createChinaOrder, updateChinaOrder, deleteChinaOrder } from "@/app/actions/finance";\nimport { Trash2, Plus } from "lucide-react";'
);

// 2. Add ChinaOrder row component and fix ImportPayment row
const editableChinaOrderRow = `
function EditableChinaOrderRow({ order, onCancelNew }: { order: any, onCancelNew?: () => void }) {
  const [isEditing, setIsEditing] = useState(order.isNew || false);
  const [formData, setFormData] = useState({
    products: order.products || '',
    arrivalDate: order.arrivalDate || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (order.isNew) {
      await createChinaOrder({
        products: formData.products,
        arrivalDate: formData.arrivalDate,
      });
      if (onCancelNew) onCancelNew();
    } else {
      await updateChinaOrder(order.id, {
        products: formData.products,
        arrivalDate: formData.arrivalDate,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (order.isNew && onCancelNew) {
      onCancelNew();
    } else {
      setFormData({
        products: order.products || '',
        arrivalDate: order.arrivalDate || ''
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם למחוק שורה זו?')) {
      await deleteChinaOrder(order.id);
    }
  };

  if (!isEditing) {
    return (
      <tr onClick={() => setIsEditing(true)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
        <td className="p-3 text-gray-700">{formData.products || '-'}</td>
        <td className="p-3 text-gray-700">{formData.arrivalDate || '-'}</td>
        <td className="p-3 text-left whitespace-nowrap">
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded mx-1">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={handleDelete} className="p-1 text-red-600 hover:bg-red-50 rounded mx-1">
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50/30 transition-colors">
      <td className="p-2"><input name="products" value={formData.products} onChange={handleChange} autoFocus className="w-full p-1 border rounded text-sm text-right" dir="rtl" /></td>
      <td className="p-2"><input name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} className="w-full p-1 border rounded text-sm text-right" dir="rtl" /></td>
      <td className="p-2 text-left whitespace-nowrap">
        <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded mx-1"><Check className="h-4 w-4" /></button>
        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded mx-1"><X className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}
`;

// Modify EditablePaymentRow
let paymentRow = `function EditablePaymentRow({ payment, onCancelNew }: { payment: any, onCancelNew?: () => void }) {
  const [isEditing, setIsEditing] = useState(payment.isNew || false);
  const [formData, setFormData] = useState({
    brand: payment.brand || '',
    orderAmountForeign: payment.orderAmountForeign || 0,
    orderAmountNis: payment.orderAmountNis || 0,
    vat: payment.vat || 0,
    shippingCost: payment.shippingCost || 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (payment.isNew) {
      await createImportPayment({
        brand: formData.brand,
        orderAmountForeign: formData.orderAmountForeign.toString(),
        orderAmountNis: formData.orderAmountNis.toString(),
        vat: formData.vat.toString(),
        shippingCost: formData.shippingCost.toString(),
      });
      if (onCancelNew) onCancelNew();
    } else {
      await updateImportPayment(payment.id, {
        brand: formData.brand,
        orderAmountForeign: formData.orderAmountForeign.toString(),
        orderAmountNis: formData.orderAmountNis.toString(),
        vat: formData.vat.toString(),
        shippingCost: formData.shippingCost.toString(),
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (payment.isNew && onCancelNew) {
      onCancelNew();
    } else {
      setFormData({
        brand: payment.brand || '',
        orderAmountForeign: payment.orderAmountForeign || 0,
        orderAmountNis: payment.orderAmountNis || 0,
        vat: payment.vat || 0,
        shippingCost: payment.shippingCost || 0
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('האם למחוק שורה זו?')) {
      await deleteImportPayment(payment.id);
    }
  };

  if (!isEditing) {
    return (
      <tr onClick={() => setIsEditing(true)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
        <td className="p-3 text-gray-700">{formData.brand || '-'}</td>
        <td className="p-3 text-gray-700">{Number(formData.orderAmountForeign || 0).toLocaleString()}</td>
        <td className="p-3 text-gray-700">₪{Number(formData.orderAmountNis || 0).toLocaleString()}</td>
        <td className="p-3 text-gray-700">₪{Number(formData.vat || 0).toLocaleString()}</td>
        <td className="p-3 text-gray-700">₪{Number(formData.shippingCost || 0).toLocaleString()}</td>
        <td className="p-3 text-left whitespace-nowrap">
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded mx-1"><Edit2 className="h-4 w-4" /></button>
          <button onClick={handleDelete} className="p-1 text-red-600 hover:bg-red-50 rounded mx-1"><Trash2 className="h-4 w-4" /></button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50/30 transition-colors">
      <td className="p-2"><input name="brand" value={formData.brand} onChange={handleChange} autoFocus className="w-full p-1 border rounded text-sm text-right" dir="rtl" /></td>
      <td className="p-2"><input type="number" name="orderAmountForeign" value={formData.orderAmountForeign} onChange={handleChange} className="w-full p-1 border rounded text-sm text-right" dir="ltr" /></td>
      <td className="p-2"><input type="number" name="orderAmountNis" value={formData.orderAmountNis} onChange={handleChange} className="w-full p-1 border rounded text-sm text-right" dir="ltr" /></td>
      <td className="p-2"><input type="number" name="vat" value={formData.vat} onChange={handleChange} className="w-full p-1 border rounded text-sm text-right" dir="ltr" /></td>
      <td className="p-2"><input type="number" name="shippingCost" value={formData.shippingCost} onChange={handleChange} className="w-full p-1 border rounded text-sm text-right" dir="ltr" /></td>
      <td className="p-2 text-left whitespace-nowrap">
        <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded mx-1"><Check className="h-4 w-4" /></button>
        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded mx-1"><X className="h-4 w-4" /></button>
      </td>
    </tr>
  );
}`;

const paymentRegex = /function EditablePaymentRow.*?\n    <\/tr>\n  \);\n}/s;
code = code.replace(paymentRegex, paymentRow + '\n\n' + editableChinaOrderRow);

// 3. Add states for isAddingPayment and isAddingChinaOrder in FinanceClient
code = code.replace(
  'const [mounted, setMounted] = useState(false);',
  'const [mounted, setMounted] = useState(false);\n  const [isAddingPayment, setIsAddingPayment] = useState(false);\n  const [isAddingChinaOrder, setIsAddingChinaOrder] = useState(false);'
);

// 4. Update the tables
// Import Payments Table Header
code = code.replace(
  '<h4 className="text-lg font-semibold mb-4 text-primary">תשלומי יבוא</h4>',
  `<div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-primary">תשלומי יבוא</h4>
            <button onClick={() => setIsAddingPayment(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
              <Plus className="w-4 h-4" /> הוסף חדש
            </button>
          </div>`
);
// Import payments table body
code = code.replace(
  '{allPayments.map((p, i) => (',
  '{isAddingPayment && <EditablePaymentRow payment={{ isNew: true }} onCancelNew={() => setIsAddingPayment(false)} />}\n              {allPayments.map((p, i) => ('
);

// China Orders Table Header
code = code.replace(
  '<h4 className="text-lg font-semibold mb-4 text-primary">הזמנות מסין</h4>',
  `<div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-primary">הזמנות מסין</h4>
            <button onClick={() => setIsAddingChinaOrder(true)} className="flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">
              <Plus className="w-4 h-4" /> הוסף חדש
            </button>
          </div>`
);
// China orders table body
code = code.replace(
  '<th className="p-3 font-medium text-gray-600">תאריך הגעה</th>',
  '<th className="p-3 font-medium text-gray-600">תאריך הגעה</th>\n                <th className="p-3 font-medium text-left text-gray-500 rounded-tl-md w-16">פעולות</th>'
);
code = code.replace(
  /\{allChinaOrders\.map\(\(o, i\) => \(\s*<tr key=\{o\.id \|\| i\}.*?<\/tr>\s*\)\)}/s,
  `{isAddingChinaOrder && <EditableChinaOrderRow order={{ isNew: true }} onCancelNew={() => setIsAddingChinaOrder(false)} />}\n              {allChinaOrders.map((o, i) => (\n                <EditableChinaOrderRow key={o.id || i} order={o} />\n              ))}`
);

fs.writeFileSync('src/app/finance/finance-client.tsx', code);
console.log('Finance client updated successfully');
