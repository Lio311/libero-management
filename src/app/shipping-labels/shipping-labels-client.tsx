"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ExternalLink, Download, Trash2, Loader2, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { deleteShippingLabel } from "./actions";
import { useConfirm } from "@/hooks/useConfirm";

export default function ShippingLabelsClient({ initialLabels, initialStatuses = {} }: { initialLabels: any[], initialStatuses?: Record<string, string> }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const filteredLabels = initialLabels.filter((label) => 
    label.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLabels = initialLabels.length;
  const pendingShipments = initialLabels.filter(l => {
    const status = initialStatuses[l.barcode];
    return !status || status === 'UNASSIGNED' || status === 'ASSIGNED' || status === 'NEW';
  }).length;
  
  const inTransitShipments = initialLabels.filter(l => {
    const status = initialStatuses[l.barcode];
    return status === 'IN_TRANSIT' || status === 'ON_THE_WAY';
  }).length;

  const completedShipments = initialLabels.filter(l => {
    const status = initialStatuses[l.barcode];
    return status === 'DELIVERED';
  }).length;

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: "מחיקת מדבקה",
      message: "האם אתה בטוח שברצונך למחוק מדבקה זו? (פעולה זו תמחק את הרשומה מהמערכת בלבד)",
      confirmText: "מחק מדבקה"
    });
    
    if (isConfirmed) {
      setDeletingId(id);
      startTransition(async () => {
        await deleteShippingLabel(id);
        setDeletingId(null);
      });
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download PDF, opening in new tab instead:", error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">מדבקות למשלוח</h1>
          <p className="text-gray-500 mt-2">צפייה ומעקב אחר המדבקות שהופקו מ-LionWheel</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מדבקות</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLabels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ממתינים לאיסוף</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingShipments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">במשלוח / במעבר</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inTransitShipments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">נמסרו בהצלחה</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedShipments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם, מזהה הזמנה או ברקוד..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-center font-semibold">תאריך הפקה</TableHead>
                <TableHead className="text-center font-semibold">שם לקוח</TableHead>
                <TableHead className="text-center font-semibold">מספר הזמנה</TableHead>
                <TableHead className="text-center font-semibold">ברקוד / מעקב</TableHead>
                <TableHead className="text-center font-semibold">סטטוס</TableHead>
                <TableHead className="text-center font-semibold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLabels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    לא נמצאו תוצאות לחיפוש
                  </TableCell>
                </TableRow>
              ) : (
                filteredLabels.map((label) => (
                  <TableRow key={label.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium text-center">
                      {format(new Date(label.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-center">{label.customerName}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {label.orderId}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{label.barcode || "N/A"}</TableCell>
                    <TableCell className="text-center">
                      {initialStatuses[label.barcode] ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          {initialStatuses[label.barcode]}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {label.labelUrl && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs" 
                            onClick={() => handleDownload(label.labelUrl, `label-${label.orderId}.pdf`)}
                          >
                            <Download className="h-3.5 w-3.5 ml-1" />
                            הורד מדבקה
                          </Button>
                        )}
                        {label.trackingUrl && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 text-xs" 
                            onClick={() => window.open(label.trackingUrl, '_blank')}
                          >
                            <ExternalLink className="h-3.5 w-3.5 ml-1" />
                            מעקב
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isPending && deletingId === label.id}
                          onClick={() => handleDelete(label.id)}
                        >
                          {isPending && deletingId === label.id ? (
                            <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 ml-1" />
                          )}
                          מחק
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
