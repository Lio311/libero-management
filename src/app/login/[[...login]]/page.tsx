import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl mb-6 inline-block">
            <div className="relative h-20 w-52 mx-auto">
              <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.7] brightness-0 invert" priority />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            ברוכים הבאים למערכת ההנהלה
          </h1>
          <p className="text-zinc-400 text-sm">
            היכנסו עם החשבון שלכם כדי להמשיך
          </p>
        </div>

        <div className="w-full max-w-sm [&_.cl-rootBox]:w-full [&_.cl-card]:w-full [&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-card]:!border-0 [&_.cl-card]:!p-0 [&_.cl-header]:!hidden [&_.cl-footer]:!hidden [&_.cl-dividerRow]:!hidden [&_.cl-logoBox]:!hidden [&_.cl-main]:!flex [&_.cl-main]:!flex-col [&_.cl-main]:!items-center [&_.cl-socialButtons]:!w-full [&_.cl-socialButtons]:!flex [&_.cl-socialButtons]:!justify-center flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full !bg-transparent !shadow-none !border-0 !p-0 flex flex-col items-center justify-center",
                formButtonPrimary: "hidden",
                socialButtonsBlockButton: "!bg-white border border-zinc-200 hover:!bg-zinc-100 transition-all !text-black h-12 rounded-xl shadow-lg w-full max-w-xs mx-auto flex !justify-center !items-center !gap-3",
                socialButtonsBlockButtonText: "!text-black font-bold",
                footerAction: "hidden",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                logoBox: "hidden",
                footer: "hidden",
                header: "hidden",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
