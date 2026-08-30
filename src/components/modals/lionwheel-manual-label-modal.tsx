"use client";

import { useState } from "react";
import { Loader2, Search, Truck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LionwheelManualLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LionwheelManualLabelModal({ isOpen, onClose }: LionwheelManualLabelModalProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    street: "",
    notes: "נוצר ידנית"
  });

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!phone.trim()) {
      toast.error("יש להזין מספר טלפון לחיפוש");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/lionwheel/search-phone?phone=${encodeURIComponent(phone.trim())}`);
      const result = await res.json();

      if (res.ok && result.data && Array.isArray(result.data) && result.data.length > 0) {
        // Take the most recent task (usually the first one or last one, assuming the first one is the most relevant)
        // LionWheel usually returns an array of tasks. Let's find one with valid destination data.
        const task = result.data.find((t: any) => t.destination_city && t.destination_street) || result.data[0];
        
        if (task) {
          setFormData({
            fullName: task.destination_recipient_name || "",
            city: task.destination_city || "",
            street: `${task.destination_street || ""} ${task.destination_number || ""}`.trim(),
            notes: "נוצר ידנית (שוחזר מנתוני עבר)"
          });
          toast.success("נמצאו פרטי משלוח קודמים!");
        } else {
          toast.info("לא נמצאו פרטים עבור מספר זה");
        }
      } else {
        toast.info("לא נמצאו משלוחים קודמים עבור מספר זה ב-LionWheel");
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בחיפוש ב-LionWheel");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.fullName.trim() || !formData.city.trim() || !formData.street.trim() || !phone.trim()) {
      toast.error("יש למלא שם, טלפון, עיר ורחוב");
      return;
    }

    setIsGenerating(true);
    try {
      const customerPayload = {
        id: `manual-${Date.now()}`,
        fullName: formData.fullName,
        phone: phone,
        email: "",
        city: formData.city,
        address_1: formData.street,
        latestOrderId: `MANUAL-${Date.now()}`,
        notes: formData.notes
      };

      const res = await fetch('/api/lionwheel/create-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: [customerPayload] })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.allSuccessful) {
        toast.error("שגיאה ביצירת המשלוח. אנא בדוק במערכת LionWheel.");
        console.error("LionWheel results:", data);
      } else {
        toast.success("מדבקת משלוח נוצרה בהצלחה!");
        router.refresh();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("שגיאה ביצירת המדבקה");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">הפקת מדבקת LionWheel ידנית</h2>
            <p className="text-sm text-gray-500 mt-1">יצירת משלוח לפי טלפון או הזנה ידנית</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">מספר טלפון לחיפוש ב-LionWheel</label>
            <div className="flex gap-2">
              <Input
                placeholder="לדוגמה: 0501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching} variant="secondary">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 ml-2" />}
                חפש
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-gray-700">שם הנמען</label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="שם מלא"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">עיר</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="עיר"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-gray-700">רחוב ומספר</label>
              <Input
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                placeholder="לדוגמה: הרצל 10"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium text-gray-700">הערות למשלוח</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="הערות לשליח..."
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            ביטול
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isSearching}
            className="flex-1 font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Truck className="w-4 h-4 ml-2" />}
            {isGenerating ? "מייצר..." : "הפק מדבקה"}
          </Button>
        </div>
      </div>
    </div>
  );
}
