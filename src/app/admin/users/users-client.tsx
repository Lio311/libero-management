'use client';

import { useState, useTransition } from 'react';
import { toggleUserApproval } from './actions';
import { toast } from 'sonner';
import { UserCheck, UserX, ShieldAlert, Mail, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

type UserData = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: number;
  isApproved: boolean;
};

export default function UsersClient({ users, adminEmail }: { users: UserData[], adminEmail: string }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      try {
        await toggleUserApproval(userId, !currentStatus);
        toast.success(currentStatus ? 'הרשאת משתמש בוטלה' : 'המשתמש אושר בהצלחה');
      } catch (e) {
        toast.error('שגיאה בעדכון הרשאות המשתמש');
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">ניהול משתמשים</h1>
          <p className="text-muted-foreground">נהל הרשאות וגישה למערכת</p>
        </div>
        <div className="bg-primary/10 p-3 rounded-full">
          <ShieldAlert className="w-6 h-6 text-primary" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-6">
              {user.imageUrl ? (
                <img src={user.imageUrl} alt={user.firstName || 'User'} className="w-12 h-12 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">
                  {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}` : 'משתמש חדש'}
                </p>
                <div className="flex items-center text-sm text-muted-foreground truncate mt-1">
                  <Mail className="w-3.5 h-3.5 mr-1.5 ml-1" />
                  <span className="truncate" dir="ltr">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto">
              <span className="text-xs text-muted-foreground">
                הצטרף ב: {format(new Date(user.createdAt), 'dd/MM/yyyy')}
              </span>
              
              <button
                onClick={() => handleToggle(user.id, user.isApproved)}
                disabled={isPending || user.email === adminEmail}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  user.email === adminEmail 
                    ? 'bg-primary/10 text-primary cursor-not-allowed opacity-70'
                    : user.isApproved 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                }`}
              >
                {user.email === adminEmail ? (
                  <>מנהל מערכת</>
                ) : user.isApproved ? (
                  <>
                    <UserX className="w-4 h-4" />
                    הסר הרשאה
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    אשר משתמש
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            לא נמצאו משתמשים במערכת
          </div>
        )}
      </div>
    </div>
  );
}
