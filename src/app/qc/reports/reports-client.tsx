'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, Package, Clock, CalendarDays, CheckCircle, AlertCircle, XCircle, Printer, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import { he } from 'date-fns/locale';

interface QCReport {
  id: string;
  createdAt: Date;
  reportDate: string;
  totalInspected: number;
  reportData: any;
}

interface PriceChange {
  id: string;
  wooProductId: number;
  productName: string;
  oldPrice: string | null;
  newPrice: string | null;
  changedAt: Date;
}

function getRatingStyle(rating: number | undefined) {
  if (rating === undefined) return { text: "text-gray-400", bg: "bg-gray-50/70 hover:bg-gray-100/70", border: "border-r-gray-200" };
  if (rating >= 8.5) return { text: "text-emerald-600 font-medium", bg: "bg-emerald-50/70 hover:bg-emerald-100/70", border: "border-r-emerald-400" };
  if (rating >= 7) return { text: "text-green-500 font-medium", bg: "bg-green-50/70 hover:bg-green-100/70", border: "border-r-green-400" };
  if (rating >= 5) return { text: "text-yellow-600 font-medium", bg: "bg-yellow-50/70 hover:bg-yellow-100/70", border: "border-r-yellow-400" };
  if (rating >= 3.5) return { text: "text-orange-500 font-medium", bg: "bg-orange-50/70 hover:bg-orange-100/70", border: "border-r-orange-400" };
  if (rating >= 2) return { text: "text-red-500 font-medium", bg: "bg-red-50/70 hover:bg-red-100/70", border: "border-r-red-400" };
  return { text: "text-rose-600 font-medium", bg: "bg-rose-50/70 hover:bg-rose-100/70", border: "border-r-rose-500" };
}

function getProductStatus(lastInspection: string | Date | null): "never" | "ok" | "warning" {
  if (!lastInspection) return "never";
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return new Date(lastInspection) < threeMonthsAgo ? "warning" : "ok";
}

function getStatusBadge(status: "never" | "ok" | "warning") {
  switch (status) {
    case "ok":
      return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/50"><CheckCircle className="w-3.5 h-3.5" /><span className="text-xs font-medium">תקין</span></div>;
    case "warning":
      return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/50"><AlertCircle className="w-3.5 h-3.5" /><span className="text-xs font-medium">עבר זמן</span></div>;
    case "never":
    default:
      return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-200/50"><XCircle className="w-3.5 h-3.5" /><span className="text-xs font-medium">לא נבדק</span></div>;
  }
}

export default function QCReportsClient({ initialReports, priceChanges = [] }: { initialReports: QCReport[]; priceChanges?: PriceChange[] }) {
  const [selectedReport, setSelectedReport] = useState<QCReport | null>(null);

  const reportPriceChanges = useMemo(() => {
    if (!selectedReport) return [];
    const reportDate = selectedReport.reportDate; // YYYY-MM-DD
    return priceChanges.filter(pc => {
      const changeDate = new Date(pc.changedAt);
      const changeDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(changeDate);
      return changeDateStr === reportDate;
    });
  }, [selectedReport, priceChanges]);

  const reportDataProcessed = useMemo(() => {
    if (!selectedReport) return [];
    
    const rawData = selectedReport.reportData as any[];
    
    return rawData.map(p => {
      const pc = reportPriceChanges.find(c => c.wooProductId === p.wooProductId);
      return { 
        ...p,
        oldPrice: pc?.oldPrice || null,
        newPrice: pc?.newPrice || p.currentPrice || null,
        priceChangeDate: pc?.changedAt || null
      };
    });
  }, [selectedReport, reportPriceChanges]);

  if (selectedReport) {
    const handlePrint = () => {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (!printWindow) return;
      
      const html = `
        <html dir="rtl" lang="he">
          <head>
            <title>דוח בקרת איכות - ${format(new Date(selectedReport.reportDate), 'dd/MM/yyyy')}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
              table { border-collapse: collapse; width: 100%; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 14px; }
              th { background-color: #f8f9fa; font-weight: bold; }
              a { color: #2563eb; text-decoration: underline; }
              h1 { font-size: 24px; margin-bottom: 20px; text-align: center; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; }
              .badge-ok { background-color: #d1fae5; color: #047857; }
              .badge-warning { background-color: #fef3c7; color: #b45309; }
              .badge-never { background-color: #f3f4f6; color: #4b5563; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>דוח בקרת מוצרים - ${format(new Date(selectedReport.reportDate), 'dd/MM/yyyy')}</h1>
            <table>
              <thead>
                <tr>
                  <th style="width: 25%">שם המוצר</th>
                  <th style="width: 25%">הערות לבדיקה</th>
                  <th style="width: 15%">תמחור</th>
                  <th style="width: 12%">מחיר לפני</th>
                  <th style="width: 12%">מחיר אחרי</th>
                </tr>
              </thead>
              <tbody>
                ${reportDataProcessed.map(p => {
                  return `
                  <tr>
                    <td>
                      <strong><a href="https://libero-il.co.il/?p=${p.wooProductId}" target="_blank">${p.productName}</a></strong>
                      ${p.productSku ? '<br><small style="color: #666" dir="ltr">' + p.productSku + '</small>' : ''}
                    </td>
                    <td style="white-space: pre-wrap;">${p.notes || ''}</td>
                    <td style="text-align: center; font-size: 13px;">
                      ${p.priceStatus ? `<strong>${p.priceStatus}</strong>${p.priceStatusDate ? `<br><span style="color:#666;font-size:11px;" dir="ltr">,${format(new Date(p.priceStatusDate), 'd.M.yyyy')}<br>${format(new Date(p.priceStatusDate), 'HH:mm')}</span>` : ''}` : '-'}
                    </td>
                    <td style="text-align: center; color: #666; text-decoration: line-through;">${p.oldPrice ? '₪' + parseFloat(p.oldPrice).toFixed(0) : '-'}</td>
                    <td style="text-align: center; font-weight: bold;">${p.newPrice ? '₪' + parseFloat(p.newPrice).toFixed(0) : '-'}</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    };

    return (
      <div className="px-6 py-4 md:px-12 md:py-8 max-w-[1600px] mx-auto space-y-6 bg-gray-50/50 min-h-screen print:hidden" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedReport(null)}
              className="p-2 hover:bg-secondary/80 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">
              דוח בקרת מוצרים - {format(new Date(selectedReport.reportDate), 'dd/MM/yyyy')}
            </h1>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            הדפס דוח
          </button>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">סה״כ מוצרים מבוקרים</p>
              <p className="text-xl font-bold">{selectedReport.totalInspected}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">שעת הפקה</p>
              <p className="text-xl font-bold">
                {format(new Date(selectedReport.createdAt), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium min-w-[200px]">שם המוצר</th>
                <th className="px-4 py-3 font-medium min-w-[250px]">הערות לבדיקה</th>
                <th className="px-4 py-3 font-medium text-center">תמחור</th>
                <th className="px-4 py-3 font-medium text-center">מחיר לפני</th>
                <th className="px-4 py-3 font-medium text-center">מחיר אחרי</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportDataProcessed.map((item, idx) => {
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <a 
                        href={`https://libero-il.co.il/?p=${item.wooProductId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                      >
                        {item.productName}
                      </a>
                      {item.productSku && (
                        <div className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                          {item.productSku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600 whitespace-pre-wrap max-w-xs text-sm">
                      {item.notes || '-'}
                    </td>
                    <td className="px-4 py-2 text-center text-sm">
                      {item.priceStatus ? (
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-gray-900">{item.priceStatus}</span>
                          {item.priceStatusDate && (
                            <span className="text-gray-500 text-xs mt-1 text-center" dir="ltr">
                              ,{format(new Date(item.priceStatusDate), 'd.M.yyyy')}<br/>
                              {format(new Date(item.priceStatusDate), 'HH:mm')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500 line-through">
                      {item.oldPrice ? `₪${parseFloat(item.oldPrice).toFixed(0)}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-center font-semibold text-gray-900">
                      {item.newPrice ? `₪${parseFloat(item.newPrice).toFixed(0)}` : '-'}
                    </td>
                  </tr>
                );
              })}
              {reportDataProcessed.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    לא נמצאו בקרות בדוח זה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Price Changes Section */}
        {reportPriceChanges.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">שינויי תמחור ({reportPriceChanges.length})</h2>
            </div>
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-medium min-w-[200px]">שם המוצר</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-center">מחיר ישן</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-center"></th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-center">מחיר חדש</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-center">שינוי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportPriceChanges.map((pc) => {
                  const oldP = parseFloat(pc.oldPrice || '0');
                  const newP = parseFloat(pc.newPrice || '0');
                  const diff = newP - oldP;
                  const pctChange = oldP > 0 ? ((diff / oldP) * 100).toFixed(1) : '—';
                  const isUp = diff > 0;
                  return (
                    <tr key={pc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{pc.productName}</td>
                      <td className="px-4 py-3 text-center text-gray-500 line-through">₪{oldP.toFixed(0)}</td>
                      <td className="px-4 py-3 text-center">
                        {isUp ? <TrendingUp className="w-4 h-4 text-red-500 mx-auto" /> : <TrendingDown className="w-4 h-4 text-emerald-500 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">₪{newP.toFixed(0)}</td>
                      <td className={`px-4 py-3 text-center font-medium ${isUp ? 'text-red-500' : 'text-emerald-600'}`}>
                        {isUp ? '+' : ''}{pctChange}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-6 py-4 md:px-12 md:py-8 max-w-[1600px] mx-auto space-y-6 bg-gray-50/50 min-h-screen print:hidden" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">היסטוריית דוחות בקרה</h1>
        <p className="text-muted-foreground mt-1">
          צפייה בדוחות קודמים של בקרת מוצרים
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialReports.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500 shadow-sm">
            לא קיימים דוחות במערכת
          </div>
        ) : (
          initialReports.map((report) => (
            <div 
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 p-2.5 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div className="text-left" dir="ltr">
                  <span className="text-xs font-medium text-gray-500 block">
                    {format(new Date(report.createdAt), 'HH:mm')}
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                דוח בקרות {format(new Date(report.reportDate), 'dd/MM/yyyy')}
              </h3>
              
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                <span>{report.totalInspected} מוצרים מבוקרים</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
