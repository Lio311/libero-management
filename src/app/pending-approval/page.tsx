import { Clock } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PendingApprovalPage() {
  const user = await currentUser();
  
  if (user) {
    const adminEmail = process.env.admin_email || 'lior31197@gmail.com';
    const email = user.emailAddresses[0]?.emailAddress;
    
    // Auto-approve the admin
    if (email === adminEmail) {
      await (await clerkClient()).users.updateUserMetadata(user.id, {
        publicMetadata: { isApproved: true }
      });
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-zinc-800 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-zinc-900 rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
      
      <div className="z-10 w-full max-w-md p-8">
        <div className="backdrop-blur-2xl bg-zinc-950/40 border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-inner">
              <Clock className="text-white w-8 h-8" />
            </div>
            
            <div className="relative h-16 w-36 overflow-hidden mb-6">
              <Image src="/libero-d.png" alt="Libero Logo" fill className="object-cover object-center brightness-0 invert opacity-90" priority />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">ממתין לאישור</h1>
            <p className="text-zinc-400 text-sm tracking-wide leading-relaxed mb-8">
              החשבון שלך נוצר בהצלחה. עם זאת, הוא דורש אישור של מנהל המערכת לפני שתוכל לגשת אליו. אנא המתן בסבלנות.
            </p>

            <SignOutButton>
              <button className="w-full bg-zinc-900/50 border border-white/10 hover:bg-white/10 hover:border-white/30 rounded-xl py-3 text-white transition-all duration-300">
                התנתק
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  );
}
