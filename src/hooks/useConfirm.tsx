"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (resolver) resolver.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver) resolver.resolve(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
          <Card className="w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 border-none">
            <h2 className="text-xl font-semibold mb-2 text-foreground">{options.title || 'אישור פעולה'}</h2>
            <p className="text-muted-foreground mb-6 text-sm">{options.message}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                {options.cancelText || 'ביטול'}
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                {options.confirmText || 'אישור'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
