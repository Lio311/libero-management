"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Save, X, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchProducts, saveTierSamples } from './actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SAMPLE_TIERS = [
  { tier: 1, label: "2 דוגמיות דיזיינר", defaultNum: 2 },
  { tier: 2, label: "2 דוגמיות דיזיינר", defaultNum: 2 },
  { tier: 3, label: "2 דוגמיות נישה אחד זול אחד יקר", defaultNum: 2 },
  { tier: 4, label: "3 דוגמיות נישה אחד יקר שניים זול", defaultNum: 3 },
  { tier: 5, label: "3 דוגמיות נישה 2 יקרים אחד זול", defaultNum: 3 },
  { tier: 6, label: "3 דוגמיות נישה 2 יקרים אחת רשמית", defaultNum: 3 },
  { tier: 7, label: "4 דוגמיות 3 חדשים", defaultNum: 4 },
  { tier: 8, label: "4 דוגמיות 3 חדשים", defaultNum: 4 },
  { tier: 9, label: "מנהל", defaultNum: 2 }, // flexible
  { tier: 10, label: "מנהל", defaultNum: 2 }, // flexible
];

function ProductAutocomplete({ 
  value, 
  onChange,
  placeholder = "חיפוש דוגמית..." 
}: { 
  value: any, 
  onChange: (val: any) => void,
  placeholder?: string 
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await searchProducts(query);
          setResults(res);
          setIsOpen(true);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-md bg-secondary/20">
        <div className="flex-1 text-sm truncate">
          <span className="font-medium">{value.name}</span>
          {value.sku && <span className="text-xs text-muted-foreground ml-2">({value.sku})</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChange(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          className="pr-9"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Search className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((product) => (
            <div
              key={product.id}
              className="px-3 py-2 cursor-pointer hover:bg-muted text-sm border-b last:border-0"
              onClick={() => {
                onChange(product);
                setQuery("");
                setIsOpen(false);
              }}
            >
              <div className="font-medium">{product.name}</div>
              {product.sku && <div className="text-xs text-muted-foreground">{product.sku}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SamplesTrackingClient({ initialData }: { initialData: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthData, setMonthData] = useState<Record<number, any[]>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const d = new Date();
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    const currentMonthData = initialData.filter(d => d.monthYear === selectedMonth);
    const newMonthData: Record<number, any[]> = {};
    
    SAMPLE_TIERS.forEach(t => {
      const found = currentMonthData.find(d => d.tier === t.tier);
      if (found && found.samples) {
        newMonthData[t.tier] = Array.isArray(found.samples) ? found.samples : [];
      } else {
        newMonthData[t.tier] = Array(t.defaultNum).fill(null);
      }
    });
    setMonthData(newMonthData);
  }, [selectedMonth, initialData]);

  const handleSaveTier = async (tier: number) => {
    setSaving(p => ({ ...p, [tier]: true }));
    try {
      await saveTierSamples(selectedMonth, tier, monthData[tier] || []);
      toast.success(`שמרת בהצלחה דוגמיות לדירוג ${tier}`);
    } catch (error) {
      console.error(error);
      toast.error('שגיאה בשמירה');
    } finally {
      setSaving(p => ({ ...p, [tier]: false }));
    }
  };

  const handleAddSample = (tier: number) => {
    setMonthData(prev => ({
      ...prev,
      [tier]: [...(prev[tier] || []), null]
    }));
  };

  const handleRemoveSample = (tier: number, index: number) => {
    setMonthData(prev => {
      const newArr = [...(prev[tier] || [])];
      newArr.splice(index, 1);
      return { ...prev, [tier]: newArr };
    });
  };

  const handlePrevMonth = () => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthLabel = (val: string) => {
    if (!val) return "";
    const [year, month] = val.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return `${d.toLocaleString('he-IL', { month: 'long' })} ${d.getFullYear()}`;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">מעקב דוגמיות חודשי</h1>
          <p className="text-muted-foreground mt-1">בחירת דוגמיות לכל דירוג לקוח מתוך מלאי ליברו.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="w-32 text-center font-medium">
            {getMonthLabel(selectedMonth)}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {SAMPLE_TIERS.map((tierInfo) => {
          const samples = monthData[tierInfo.tier] || [];
          const isManagerTier = tierInfo.tier === 9 || tierInfo.tier === 10;
          
          return (
            <Card key={tierInfo.tier} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-colors">
              <CardHeader className="bg-secondary/30 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                      {tierInfo.tier}
                    </div>
                    <div>
                      <CardTitle className="text-lg">דירוג {tierInfo.tier}</CardTitle>
                      <p className="text-sm text-muted-foreground font-medium mt-1">{tierInfo.label}</p>
                    </div>
                  </div>
                  {!isManagerTier && (
                    <Button 
                      onClick={() => handleSaveTier(tierInfo.tier)} 
                      disabled={saving[tierInfo.tier]}
                      size="sm"
                    >
                      {saving[tierInfo.tier] ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                      שמור
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {isManagerTier ? (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border text-center text-muted-foreground font-medium">
                    לקרוא למנהל
                  </div>
                ) : (
                  <div className="space-y-4">
                    {samples.map((sample, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <ProductAutocomplete 
                            value={sample} 
                            onChange={(val) => {
                              setMonthData(prev => {
                                const newArr = [...prev[tierInfo.tier]];
                                newArr[idx] = val;
                                return { ...prev, [tierInfo.tier]: newArr };
                              });
                            }} 
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveSample(tierInfo.tier, idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="pl-11 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleAddSample(tierInfo.tier)} className="text-xs">
                        <Plus className="h-3 w-3 ml-1" />
                        הוסף דוגמית
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
