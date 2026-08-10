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
import { Search, ExternalLink, Download, Trash2, Loader2 } from "lucide-react";
import { deleteShippingLabel } from "./actions";

export default function ShippingLabelsClient({ initialLabels }: { initialLabels: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredLabels = initialLabels.filter((label) => 
    label.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    label.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("האם אתה בטוח שברצונך למחוק מדבקה זו? (פעולה זו תמחק את הרשומה מהמערכת בלבד)")) {
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
          <p className="text-gray-500 mt-2">צפייה בכל המדבקות שהופקו מ-LionWheel</p>
        </div>
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
                <TableHead className="text-right font-semibold">תאריך הפקה</TableHead>
                <TableHead className="text-right font-semibold">שם לקוח</TableHead>
                <TableHead className="text-right font-semibold">מספר הזמנה</TableHead>
                <TableHead className="text-right font-semibold">ברקוד / מעקב</TableHead>
                <TableHead className="text-right font-semibold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLabels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    לא נמצאו תוצאות לחיפוש
                  </TableCell>
                </TableRow>
              ) : (
                filteredLabels.map((label) => (
                  <TableRow key={label.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium">
                      {format(new Date(label.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{label.customerName}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                        {label.orderId}
                      </span>
                    </TableCell>
                    <TableCell>{label.barcode || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
