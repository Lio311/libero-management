"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, Users, DollarSign, Megaphone, Briefcase, CheckSquare, Menu, X, BarChart, Award, Ticket, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, ClipboardCheck, UserCog, ShoppingBag, FileText, CalendarDays, UserCheck, ScanBarcode, Settings, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { influencersConfig } from "@/config/influencers";

type NavItem = {
  name: string;
  href?: string;
  icon: any;
  subItems?: { name: string; href: string }[];
};

const navigation: NavItem[] = [
  { name: "לוח שנה", href: "/", icon: Calendar },
  { name: "לוח משמרות", href: "/shifts", icon: CalendarDays },
  { name: "בנק משימות", href: "/tasks", icon: CheckSquare },
  { name: "שיווק ומשפיענים", icon: Megaphone, subItems: [
    { name: "לוח שיווק", href: "/marketing" },
    ...Object.values(influencersConfig)
      .sort((a, b) => a.name > b.name ? 1 : -1)
      .map(inf => ({
      name: inf.name,
      href: inf.id === 'oded' ? '/marketing/oded' : `/marketing/influencers/${inf.id}`
    }))
  ] },
  { name: "קופונים", 
    icon: Ticket, 
    subItems: [
      { name: "ליברו", href: "/coupons/libero" },
      { name: "וולור", href: "/coupons/velour" },
      { name: "לה בורה", href: "/coupons/labura" },
    ]
  },
  { name: "סריקת משלוחים", href: "/shipping-scanner", icon: ScanBarcode },
  { name: "הזמנות וספקים", href: "/inventory", icon: Package },
  { name: "תפעול וסיטונאות", href: "/operations", icon: Briefcase },
  { name: "ניתוח מלאי חכם", href: "/inventory-analysis", icon: BarChart },
  { 
    name: "בקרת איכות", 
    icon: ClipboardCheck,
    subItems: [
      { name: "בקרת מוצרים", href: "/qc" },
      { name: "היסטוריית דוחות בקרה", href: "/qc/reports" },
    ]
  },
  { 
    name: "בקרת מלאי", 
    icon: ClipboardCheck,
    subItems: [
      { name: "בקרת מלאי כללי", href: "/qc-inventory" },
      { name: "ספירת מלאי לה בורה", href: "/inventory/labura-count" },
    ]
  },
  { name: "מוצרי לינדו", href: "/lindo-products", icon: ShoppingBag },
  { 
    name: "לקוחות", 
    icon: UserCog,
    subItems: [
      { name: "מאגר לקוחות", href: "/customer-control" },
      { name: "מדבקות למשלוח", href: "/shipping-labels" },
      { name: "מעקב דוגמיות", href: "/samples-tracking" },
    ]
  },
  { name: "כספים", href: "/finance", icon: DollarSign },
  { name: "בעלי תפקידים", href: "/team", icon: Users },
  { name: "מעקב בונוסים", href: "/bonus", icon: Award },
];

export function Sidebar({ children, isAuthenticated = true, isAdmin = false, isWarehouse = false }: { children?: React.ReactNode; isAuthenticated?: boolean; isAdmin?: boolean; isWarehouse?: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<NavItem | null>(null);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => {
    setIsOpen(false);
    // Don't reset activeSubMenu here so it remembers where you were if you open it on mobile again
  };

  return (
    <>
      {/* Mobile Header */}
      {!isWarehouse && (
        <div className="md:hidden print:hidden flex h-[calc(5rem_+_env(safe-area-inset-top))] pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-2 items-center px-4 border-b border-border/20 glass-panel text-white shrink-0 relative z-50 justify-center">
          {isAuthenticated ? (
            <>
              <button onClick={toggleSidebar} className="p-1 text-foreground absolute right-4 z-10">
                <Menu className="h-6 w-6" />
              </button>
              <div className="relative h-20 w-52 md:w-12 mx-auto transition-all duration-300 pointer-events-none">
                <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.7] brightness-0 invert" priority />
              </div>
            </>
          ) : (
            <>
              <button onClick={toggleSidebar} className="p-1 text-foreground absolute right-4 z-10">
                <Menu className="h-6 w-6" />
              </button>
              <div className="relative h-20 w-52 md:w-10 mx-auto transition-all duration-300 pointer-events-none">
                <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.7] brightness-0 invert" priority />
              </div>
            </>
          )}
        </div>
      )}

      {/* Desktop Layout Spacer */}
      <div className="hidden md:block w-[130px] shrink-0 pointer-events-none transition-all duration-300" />

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className={cn(
        "fixed top-4 right-4 z-50 flex h-fit max-h-[calc(100vh-2rem)] flex-col rounded-xl glass-panel text-white shadow-xl transition-all duration-300 print:hidden overflow-visible",
        isOpen ? "translate-x-0 w-64" : "translate-x-[calc(100%+1rem)] md:translate-x-0 w-64 md:w-[110px]"
      )}>
        <div className="flex h-16 items-center px-2 border-b border-border/50 relative justify-center overflow-hidden shrink-0">
          <div className="relative h-12 w-full mx-auto pointer-events-none flex items-center justify-center">
            <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.5] brightness-0 invert" priority />
          </div>
          <button onClick={closeSidebar} className="md:hidden p-2 text-foreground absolute left-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden scrollbar-none",
          !isAuthenticated && "blur-sm pointer-events-none select-none opacity-50"
        )}>
          <div className={cn(
            "grid gap-2 px-3 py-4 transition-transform duration-300",
            isOpen ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
          )}>
            {(() => {
              let allNavigation = [...navigation];
              if (isAdmin) {
                allNavigation.push({
                  name: "אישור משתמשים",
                  href: "/admin/users",
                  icon: UserCheck
                });
              }
              if (isWarehouse) {
                allNavigation = allNavigation.filter(item => item.name === "סריקת משלוחים");
              }

              if (activeSubMenu) {
                return (
                  <>
                    <div className="col-span-full border-b border-border/50 pb-2 mb-1 flex items-center justify-center relative group/navitem">
                      <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden md:group-hover/navitem:flex z-[60] pointer-events-none items-center">
                        <div className="bg-slate-800/95 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-white/10">
                          חזור לתפריט הראשי
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveSubMenu(null)}
                        className="flex items-center justify-center p-2 w-full text-sm font-medium rounded-lg hover-scale text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        {isOpen && <span className="mr-2 md:hidden">חזור</span>}
                      </button>
                    </div>
                    {activeSubMenu.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      const Icon = activeSubMenu.icon; 
                      return (
                        <div key={subItem.name} className="relative group/navitem flex justify-center w-full col-span-full">
                          <Link
                            href={subItem.href}
                            onClick={() => { closeSidebar(); }}
                            className={cn(
                              "flex items-center justify-center p-2 w-full h-auto min-h-[3.5rem] text-sm font-medium rounded-lg hover-scale",
                              isSubActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground",
                              !isOpen && "flex-col gap-1 text-[10.5px] leading-tight text-center",
                              isOpen && "justify-start px-4"
                            )}
                          >
                            <Icon className={cn("flex-shrink-0 h-5 w-5 transition-colors", isSubActive ? "text-primary-foreground" : "text-slate-200 group-hover/navitem:text-secondary-foreground")} aria-hidden="true" />
                            <span className={cn(isOpen ? "mr-3 font-medium md:hidden" : "")}>{subItem.name}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </>
                );
              }

              return allNavigation.map((item) => {
                const hasSubItems = !!item.subItems;
                const isActive = item.href ? pathname === item.href : item.subItems?.some(sub => pathname === sub.href);

                return (
                  <div key={item.name} className="relative group/navitem flex justify-center w-full">
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden md:group-hover/navitem:flex z-[60] pointer-events-none items-center">
                      <div className="bg-slate-800/95 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap border border-white/10">
                        {item.name}
                      </div>
                    </div>
                    
                    {hasSubItems ? (
                    <button
                      onClick={() => setActiveSubMenu(item)}
                      className={cn(
                        "relative flex items-center justify-center p-3 w-11 h-11 text-sm font-medium rounded-lg hover-scale",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground",
                        isOpen && "md:w-11 md:h-11 w-full justify-start px-4"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0 h-5 w-5 transition-colors", isActive ? "text-primary" : "text-slate-200 group-hover/navitem:text-secondary-foreground")} aria-hidden="true" />
                      <ChevronLeft className={cn("absolute bottom-0.5 left-0.5 w-3.5 h-3.5 opacity-60", isActive ? "text-primary" : "text-slate-300")} />
                      {isOpen && <span className="mr-3 font-medium md:hidden text-right line-clamp-1">{item.name}</span>}
                    </button>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={closeSidebar}
                      className={cn(
                        "flex items-center justify-center p-3 w-11 h-11 text-sm font-medium rounded-lg hover-scale",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground",
                        isOpen && "md:w-11 md:h-11 w-full justify-start px-4"
                      )}
                    >
                      <item.icon className={cn("flex-shrink-0 h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-slate-200 group-hover/navitem:text-secondary-foreground")} aria-hidden="true" />
                      {isOpen && <span className="mr-3 font-medium md:hidden text-right line-clamp-1">{item.name}</span>}
                    </Link>
                  )}
                </div>
                );
              });
            })()}
          </div>
        </div>
        <div className={cn(
          "p-4 border-t border-border/50 flex flex-col gap-2 overflow-hidden shrink-0",
          !isAuthenticated && "blur-sm opacity-50"
        )}>
          <div className="flex items-center justify-center gap-2 w-full overflow-hidden">
            <div className="flex justify-center scale-90">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
