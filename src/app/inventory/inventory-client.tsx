"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageSearch, AlertTriangle, Truck, Archive, Search, Edit2, Trash2, Plus, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from "./actions";
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
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Extract unique brands for the filter
  const uniqueBrands = Array.from(new Set(inventoryItems.map(i => i.brand))).filter(Boolean);

  // Filter items
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = (item.modelName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === "all" || item.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const valueByBrand = inventoryItems.reduce((acc, item) => {
    const brand = item.brand || 'אחר';
    const current = Number(item.currentStock || 0);
    const cost = Number(item.costPrice || 0);
    acc[brand] = (acc[brand] || 0) + (current * cost);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(valueByBrand)
    .filter(([_, value]) => (value as number) > 0)
    .map(([brand, value]) => ({
      name: brand,
      value
    }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

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
            <CardTitle className="text-sm font-medium">מק"טים פעילים</CardTitle>
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
                <BarChart data={stockHealthData} margin={{ top: 20, right: 20, left: 100, bottom: 20 }}>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader>
            <CardTitle>התפלגות ערך מלאי</CardTitle>
            <CardDescription>ערך כולל לפי מותג (ב-₪)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => `₪${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
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

            {/* Brands Tabs */}
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
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">מזהה (Index)</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">שם הדגם</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מותג / קטגוריה</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מלאי נוכחי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הוזמנו</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">הזמנה קודמת</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">רמת מלאי (%)</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">מחיר עלות</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.slice(0, 100).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{item.itemIndex || '-'}</td>
                    <td className="py-3 px-4 font-medium whitespace-nowrap">{item.modelName}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {item.brand}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold whitespace-nowrap">{item.currentStock || '0'}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{item.orderedQuantity || '0'}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{item.lastOrderQuantity || '0'}</td>
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
                    <td className="py-3 px-4 font-medium whitespace-nowrap">₪{item.costPrice || '0'}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-left">
                      <div className="flex items-center justify-end gap-2">
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
            {filteredItems.length > 100 && (
              <div className="py-4 text-center text-xs text-muted-foreground bg-gray-50/50 border-t">
                מציג 100 תוצאות ראשונות (מתוך {filteredItems.length})
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
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50/80 text-muted-foreground">
                <tr>
                  <th className="py-3 px-4 font-medium rounded-tr-md rounded-br-md whitespace-nowrap">מותג</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סטטוס מלאי</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סטטוס תכנון</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">סטטוס קשר</th>
                  <th className="py-3 px-4 font-medium rounded-tl-md rounded-bl-md whitespace-nowrap">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers && suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium whitespace-nowrap">{supplier.brandName || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {supplier.inventoryStatus || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {supplier.planningStatus || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {supplier.contactStatus || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{supplier.notes || '-'}</td>
                    </tr>
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
                      <input
                        type="text"
                        required
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className="w-full px-3 py-2 border rounded-md"
                      />
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
