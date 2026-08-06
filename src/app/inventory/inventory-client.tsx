/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, AlertTriangle, Truck, Archive, Search, Edit2, Trash2, Plus, X, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { addInventoryItem, updateInventoryItem, deleteInventoryItem, updateSupplier, deleteSupplier } from "./actions";
import { AnimatePresence, motion } from "framer-motion";

interface InventoryClientProps {
  totalInventoryValue: number;
  itemsAtRisk: number;
  goodsOnTheWay: number;
  activeSkus: number;
  stockHealthData: { brand: string; current: number; target: number; status: string; color: string }[];
  lowStockItems: { name: string; brand: string; current: number; target: number }[];
  inventoryItems: any[];
  suppliers: any[];
}

const getInventoryStatusColor = (status: string | null) => {
  if (status === 'יש מלאי') return 'bg-emerald-100 text-emerald-800';
  if (status === 'מלאי חלקי') return 'bg-amber-100 text-amber-800';
  if (status === 'אין מלאי') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const getAccountStatusColor = (status: string | null) => {
  if (status === 'שולם') return 'bg-emerald-100 text-emerald-800';
  if (status === 'ממתין לחשבונית') return 'bg-amber-100 text-amber-800';
  if (status === 'טרם שולם') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

const getContactStatusColor = (status: string | null) => {
  if (status === 'נשלחה הודעה') return 'bg-emerald-100 text-emerald-800';
  if (status === 'לא נשלחה הודעה') return 'bg-red-100 text-red-800';
  if (status === 'נשלחה הודעה שנייה') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

function EditableSupplierRow({ supplier, uniqueBrands = [] }: { supplier: any, uniqueBrands?: string[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState({
    brandName: supplier.brandName || '',
    inventoryStatus: supplier.inventoryStatus || '',
    planningStatus: supplier.planningStatus || '',
    contactStatus: supplier.contactStatus || '',
    notes: supplier.notes || ''
  });

  const handleSave = () => {
    startTransition(async () => {
      await updateSupplier(supplier.id, data);
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setData({
      brandName: supplier.brandName || '',
      inventoryStatus: supplier.inventoryStatus || '',
      planningStatus: supplier.planningStatus || '',
      contactStatus: supplier.contactStatus || '',
      notes: supplier.notes || ''
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('האם אתה בטוח שברצונך למחוק ספק זה?')) {
      startTransition(async () => {
        await deleteSupplier(supplier.id);
      });
    }
  };

  if (isEditing) {
    return (
      <>
        {/* Mobile View */}
        <tr className="md:hidden">
          <td className="p-0">
            <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 space-y-3">
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">מותג</span>
                <select
                  className="w-full text-right p-2 border rounded-md"
                  value={data.brandName}
                  onChange={(e) => setData({ ...data, brandName: e.target.value })}
                  dir="rtl"
                >
                  <option value="">בחר מותג</option>
                  {uniqueBrands.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">סטטוס מלאי</span>
                <select
                  className="w-full text-right p-2 border rounded-md"
                  value={data.inventoryStatus}
                  onChange={(e) => setData({ ...data, inventoryStatus: e.target.value })}
                  dir="rtl"
                >
                  <option value="">-</option>
                  <option value="יש מלאי">יש מלאי</option>
                  <option value="מלאי חלקי">מלאי חלקי</option>
                  <option value="אין מלאי">אין מלאי</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">סטטוס חשבון</span>
                <select
                  className="w-full text-right p-2 border rounded-md"
                  value={data.planningStatus}
                  onChange={(e) => setData({ ...data, planningStatus: e.target.value })}
                  dir="rtl"
                >
                  <option value="">-</option>
                  <option value="שולם">שולם</option>
                  <option value="ממתין לחשבונית">ממתין לחשבונית</option>
                  <option value="טרם שולם">טרם שולם</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">סטטוס קשר</span>
                <select
                  className="w-full text-right p-2 border rounded-md"
                  value={data.contactStatus}
                  onChange={(e) => setData({ ...data, contactStatus: e.target.value })}
                  dir="rtl"
                >
                  <option value="">-</option>
                  <option value="נשלחה הודעה">נשלחה הודעה</option>
                  <option value="לא נשלחה הודעה">לא נשלחה הודעה</option>
                  <option value="נשלחה הודעה שנייה">נשלחה הודעה שנייה</option>
                  <option value="סטטוס">סטטוס</option>
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-gray-500">הערות</span>
                <input
                  className="w-full text-right p-2 border rounded-md"
                  value={data.notes}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t mt-2">
                <button onClick={handleSave} disabled={isPending} className="p-2 text-green-600 hover:bg-green-50 rounded-md bg-green-50 transition-colors">
                  <Check className="h-5 w-5" />
                </button>
                <button onClick={handleCancel} disabled={isPending} className="p-2 text-red-600 hover:bg-red-50 rounded-md bg-red-50 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </td>
        </tr>

        {/* Desktop View */}
        <tr className="hidden md:table-row hover:bg-gray-50/50 transition-colors">
          <td className="py-2 px-4">
            <select
              className="w-full text-right p-1.5 border rounded"
              value={data.brandName}
              onChange={(e) => setData({ ...data, brandName: e.target.value })}
              dir="rtl"
            >
              <option value="">בחר מותג</option>
              {uniqueBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </td>
          <td className="py-2 px-4">
            <select
              className="w-full text-right p-1.5 border rounded"
              value={data.inventoryStatus}
              onChange={(e) => setData({ ...data, inventoryStatus: e.target.value })}
              dir="rtl"
            >
              <option value="">-</option>
              <option value="יש מלאי">יש מלאי</option>
              <option value="מלאי חלקי">מלאי חלקי</option>
              <option value="אין מלאי">אין מלאי</option>
            </select>
          </td>
          <td className="py-2 px-4">
            <select
              className="w-full text-right p-1.5 border rounded"
              value={data.planningStatus}
              onChange={(e) => setData({ ...data, planningStatus: e.target.value })}
              dir="rtl"
            >
              <option value="">-</option>
              <option value="שולם">שולם</option>
              <option value="ממתין לחשבונית">ממתין לחשבונית</option>
              <option value="טרם שולם">טרם שולם</option>
            </select>
          </td>
          <td className="py-2 px-4">
            <select
              className="w-full text-right p-1.5 border rounded"
              value={data.contactStatus}
              onChange={(e) => setData({ ...data, contactStatus: e.target.value })}
              dir="rtl"
            >
              <option value="">-</option>
              <option value="נשלחה הודעה">נשלחה הודעה</option>
              <option value="לא נשלחה הודעה">לא נשלחה הודעה</option>
              <option value="נשלחה הודעה שנייה">נשלחה הודעה שנייה</option>
              <option value="סטטוס">סטטוס</option>
            </select>
          </td>
          <td className="py-2 px-4">
            <input className="w-full text-right p-1.5 border rounded" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} />
          </td>
          <td className="py-2 px-4 text-left">
            <div className="flex justify-end gap-2">
              <button onClick={handleSave} disabled={isPending} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} disabled={isPending} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <tr className="md:hidden">
        <td colSpan={6} className="p-0">
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500">מותג</div>
                <div className="font-medium text-base">{supplier.brandName || '-'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md bg-blue-50 transition-colors" title="ערוך">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} disabled={isPending} className="p-2 text-red-600 hover:bg-red-50 rounded-md bg-red-50 transition-colors" title="מחק">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">סטטוס מלאי</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInventoryStatusColor(supplier.inventoryStatus)}`}>
                  {supplier.inventoryStatus || '-'}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">סטטוס חשבון</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAccountStatusColor(supplier.planningStatus)}`}>
                  {supplier.planningStatus || '-'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">סטטוס קשר</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getContactStatusColor(supplier.contactStatus)}`}>
                  {supplier.contactStatus || '-'}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500">הערות</div>
                <div className="text-sm mt-1">{supplier.notes || '-'}</div>
              </div>
            </div>
          </div>
        </td>
      </tr>

      {/* Desktop View */}
      <tr className="hidden md:table-row hover:bg-gray-50/50 transition-colors group border-b">
        <td className="py-3 px-4 font-medium whitespace-nowrap">
          {supplier.brandName || '-'}
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getInventoryStatusColor(supplier.inventoryStatus)}`}>
            {supplier.inventoryStatus || '-'}
          </span>
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAccountStatusColor(supplier.planningStatus)}`}>
            {supplier.planningStatus || '-'}
          </span>
        </td>
        <td className="py-3 px-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getContactStatusColor(supplier.contactStatus)}`}>
            {supplier.contactStatus || '-'}
          </span>
        </td>
        <td className="py-3 px-4 text-muted-foreground">
          {supplier.notes || '-'}
        </td>
        <td className="py-3 px-4 text-left whitespace-nowrap transition-opacity">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="ערוך ספק"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="מחק ספק"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    </>
  );
}

const getCurrencySymbol = (brand: string | null) => {
  if (!brand) return '₪';
  const name = brand.toLowerCase();
  
  if (name.includes('farmacia') || name.includes('birkholz') || name.includes('comporta') || name.includes('bohoboco') || name.includes('fomowa') || name.includes('bergamoss') || name.includes('dudar milano') || name.includes('piccirilli') || name.includes('sora dora') || name.includes('elisire')) {
    return '€';
  }
  if (name.includes('memoirs')) {
    return '£';
  }
  
  return '₪';
};

export default function InventoryClient({
  totalInventoryValue,
  itemsAtRisk,
  goodsOnTheWay,
  activeSkus,
  stockHealthData,
  lowStockItems,
  inventoryItems,
  suppliers
}: InventoryClientProps) {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemIndex: '',
    modelName: '',
    brand: '',
    currentStock: '',
    orderedQuantity: '',
    targetStockLevel: '',
    costPrice: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand]);


  const handleOpenModal = (mode: 'add' | 'edit', item?: any) => {
    setModalMode(mode);
    if (mode === 'edit' && item) {
      setEditingId(item.id);
      setFormData({
        itemIndex: item.itemIndex?.toString() || '',
        modelName: item.modelName || '',
        brand: item.brand || '',
        currentStock: item.currentStock?.toString() || '',
        orderedQuantity: item.orderedQuantity?.toString() || '',
        targetStockLevel: item.targetStockLevel?.toString() || '',
        costPrice: item.costPrice?.toString() || ''
      });
    } else {
      setEditingId(null);
      setFormData({ itemIndex: '', modelName: '', brand: '', currentStock: '', orderedQuantity: '', targetStockLevel: '', costPrice: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (modalMode === 'add') {
      await addInventoryItem(formData);
    } else if (modalMode === 'edit' && editingId) {
      await updateInventoryItem(editingId, formData);
    }
    setIsSubmitting(false);
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      await deleteInventoryItem(id);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const uniqueBrands = Array.from(new Set(inventoryItems.map(i => i.brand))).filter(Boolean);

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = (item.modelName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  return (
    <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen" dir="rtl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">מלאי וספקים</h2>
        <p className="text-muted-foreground mt-2">בריאות המלאי, פריטים חסרים והזמנות רכש.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ערך מלאי נוכחי</CardTitle>
            <Archive className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">מוערך לפי מחיר עלות</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פריטים בסיכון (מלאי נמוך)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{itemsAtRisk}</div>
            <p className="text-xs text-muted-foreground">מתחת ל-20% מיעד המלאי</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פריטים בדרך / הוזמנו</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goodsOnTheWay}</div>
            <p className="text-xs text-muted-foreground">יחידות בסטטוס הזמנה</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מק&quot;טים פעילים</CardTitle>
            <PackageSearch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSkus}</div>
            <p className="text-xs text-muted-foreground">מנוהלים במערכת</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>בריאות מלאי לפי מותג</CardTitle>
            <CardDescription>מלאי קיים לעומת יעד (Target Stock Level)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 h-[350px]">
            <div dir="ltr" className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockHealthData} margin={{ top: 40, right: 20, left: 100, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="brand" axisLine={false} tickLine={false} tickMargin={10} />
                  <YAxis axisLine={false} tickLine={false} width={100} tickMargin={10} orientation="left" />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="current" name="מלאי נוכחי" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {stockHealthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertTriangle className="w-5 h-5 ml-2" />
              התראות חוסר מלאי
            </CardTitle>
            <CardDescription>פריטים שדורשים הזמנה מיידית (טופ 5)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">אין חוסרים קריטיים במלאי</p>
            ) : (
              lowStockItems.map((item, i) => {
                const target = item.target || 1;
                const percentage = Math.min(100, Math.round((item.current / target) * 100));
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name} <span className="text-xs text-muted-foreground">({item.brand})</span></span>
                      <span className="font-bold text-red-600">{item.current} / {item.target}</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>


      {/* Inventory Table */}
      <Card className="bg-white border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle>טבלת מלאי לפי מותגים</CardTitle>
                  <CardDescription>בחירת מותג תציג את כל הדגמים הרלוונטיים</CardDescription>
                </div>
                <button
                  onClick={() => handleOpenModal('add')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף פריט
                </button>
              </div>
              
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="חיפוש דגם..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-9 py-2 border rounded-md text-sm w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setSelectedBrand("all")}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedBrand === "all" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                כל המותגים
              </button>
              {uniqueBrands.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedBrand(b as string)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedBrand === b
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {b as string}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">מזהה (Index)</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">שם הדגם</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מותג / קטגוריה</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מלאי נוכחי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הוזמנו</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הזמנה קודמת</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">רמת מלאי (%)</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מחיר עלות</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.map((item) => (
                  <React.Fragment key={item.id}>
                    {/* Mobile View */}
                    <tr className="md:hidden">
                      <td colSpan={9} className="p-0">
                        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-lg">{item.modelName}</div>
                              <div className="text-sm text-gray-500 mt-1">מזהה: {item.itemIndex || '-'} | מותג: <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 ml-1">{item.brand}</span></div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal('edit', item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md bg-blue-50 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-md bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div>
                              <div className="text-sm text-gray-500">מלאי נוכחי</div>
                              <div className="font-semibold text-lg">{item.currentStock || '0'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">רמת מלאי (%)</div>
                              <div>
                                {item.targetStockLevel ? (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                    Number(item.targetStockLevel) < 0.20 
                                      ? 'bg-red-100 text-red-800' 
                                      : Number(item.targetStockLevel) >= 0.70
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {Math.round(Number(item.targetStockLevel) * 100)}%
                                  </span>
                                ) : '0%'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">הוזמנו</div>
                              <div>{item.orderedQuantity || '0'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">הזמנה קודמת</div>
                              <div>{item.lastOrderQuantity || '0'}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">מחיר עלות</div>
                              <div className="font-medium">{getCurrencySymbol(item.brand)}{item.costPrice || '0'}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Desktop View */}
                    <tr className="hidden md:table-row hover:bg-gray-50/50 transition-colors border-b">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {item.itemIndex || '-'}
                      </td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {item.modelName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {item.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold whitespace-nowrap">
                        {item.currentStock || '0'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {item.orderedQuantity || '0'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {item.lastOrderQuantity || '0'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {item.targetStockLevel ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            Number(item.targetStockLevel) < 0.20 
                              ? 'bg-red-100 text-red-800' 
                              : Number(item.targetStockLevel) >= 0.70
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {Math.round(Number(item.targetStockLevel) * 100)}%
                          </span>
                        ) : '0%'}
                      </td>
                      <td className="py-3 px-4 font-medium whitespace-nowrap">
                        {getCurrencySymbol(item.brand)}{item.costPrice || '0'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal('edit', item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="ערוך"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      לא נמצאו פריטים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  מציג {(currentPage - 1) * itemsPerPage + 1} עד {Math.min(currentPage * itemsPerPage, filteredItems.length)} מתוך {filteredItems.length} תוצאות
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    הבא
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-gray-50 border'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    הקודם
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      <Card className="bg-white border-none shadow-sm mt-8">
        <CardHeader>
          <CardTitle>טבלת ספקים</CardTitle>
          <CardDescription>רשימת הספקים והסטטוס שלהם</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-50/80 text-muted-foreground hidden md:table-header-group">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">מותג</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סטטוס מלאי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סטטוס חשבון</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סטטוס קשר</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הערות</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers && suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <EditableSupplierRow key={supplier.id} supplier={supplier} uniqueBrands={uniqueBrands as string[]} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      לא נמצאו ספקים.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-bold">
                  {modalMode === 'add' ? 'הוספת פריט למלאי' : 'עריכת פריט'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">שם הדגם</label>
                      <input
                        type="text"
                        required
                        value={formData.modelName}
                        onChange={e => setFormData({...formData, modelName: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">מותג / קטגוריה</label>
                      <select
                        required
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md bg-white"
                        dir="rtl"
                      >
                        <option value="">בחר מותג</option>
                        {uniqueBrands.map((b, i) => (
                          <option key={i} value={b as string}>{b as string}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">מזהה (Index)</label>
                      <input
                        type="number"
                        value={formData.itemIndex}
                        onChange={e => setFormData({...formData, itemIndex: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">מחיר עלות</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.costPrice}
                        onChange={e => setFormData({...formData, costPrice: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">מלאי נוכחי</label>
                      <input
                        type="number"
                        required
                        value={formData.currentStock}
                        onChange={e => setFormData({...formData, currentStock: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">רמת מלאי רצויה</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.targetStockLevel}
                        onChange={e => setFormData({...formData, targetStockLevel: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="לדוגמה: 0.5 ל-50%"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">הוזמנו</label>
                      <input
                        type="number"
                        value={formData.orderedQuantity}
                        onChange={e => setFormData({...formData, orderedQuantity: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'שומר...' : 'שמור פריט'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
