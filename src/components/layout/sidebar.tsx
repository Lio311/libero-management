"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, Users, DollarSign, Megaphone, Briefcase, CheckSquare, Menu, X, BarChart, Award, Ticket, ChevronDown, ChevronUp, ClipboardCheck, UserCog, ShoppingBag, FileText, CalendarDays, UserCheck, ScanBarcode, Settings, Printer } from "lucide-react";
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
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
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
              <div className="relative h-20 w-52 md:w-12 md:group-hover/sidebar:w-52 mx-auto transition-all duration-300 pointer-events-none">
                <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.7] brightness-0 invert" priority />
              </div>
              
            </>
          ) : (
            <>
              <button onClick={toggleSidebar} className="p-1 text-foreground absolute right-4 z-10">
                <Menu className="h-6 w-6" />
              </button>
              <div className="relative h-20 w-52 md:w-10 md:group-hover/sidebar:w-52 mx-auto transition-all duration-300 pointer-events-none">
                <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.7] brightness-0 invert" priority />
              </div>
            </>
          )}
        </div>
      )}

      {/* Desktop Layout Spacer */}
      <div className="hidden md:block w-[88px] shrink-0 pointer-events-none transition-all duration-300" />

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className={cn(
        "fixed top-4 right-4 z-50 flex h-fit max-h-[calc(100vh-2rem)] flex-col rounded-xl glass-panel text-white shadow-xl transition-all duration-300 print:hidden overflow-hidden group/sidebar",
        isOpen ? "translate-x-0 w-64" : "translate-x-[calc(100%+1rem)] md:translate-x-0 w-64 md:w-[72px] md:hover:w-64"
      )}>
        <div className="flex h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center px-6 border-b border-border/50 relative justify-center">
          <div className="relative h-20 w-52 md:w-10 md:group-hover/sidebar:w-52 mx-auto transition-all duration-300 pointer-events-none">
            <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center scale-[1.7] brightness-0 invert" priority />
          </div>
          
          {isAuthenticated ? (
            <div className="absolute left-6 flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              
              <button onClick={closeSidebar} className="md:hidden p-2 -ml-2 text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>
          ) : (
            <button onClick={closeSidebar} className="md:hidden p-2 text-foreground absolute left-4">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        <nav className={cn(
          "flex-1 space-y-0 px-2 py-2 overflow-y-auto scrollbar-none",
          !isAuthenticated && "blur-sm pointer-events-none select-none opacity-50"
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
            return allNavigation.map((item) => {
              const hasSubItems = !!item.subItems;
              const isDropdownOpen = openDropdowns.includes(item.name);
              const isActive = item.href ? pathname === item.href : item.subItems?.some(sub => pathname === sub.href);

              return (
                <div key={item.name}>
                  {hasSubItems ? (
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={cn(
                      "w-full group flex justify-between items-center p-3 text-sm font-medium rounded-lg hover-scale",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          "ml-3 flex-shrink-0 h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-slate-200 group-hover:text-secondary-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.name}</span>
                    </div>
                    {isDropdownOpen ? (
                      <ChevronUp className="h-4 w-4 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300" />
                    ) : (
                      <ChevronDown className="h-4 w-4 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={closeSidebar}
                    className={cn(
                      "group flex items-center p-3 text-sm font-medium rounded-lg hover-scale",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "ml-3 flex-shrink-0 h-5 w-5 transition-colors",
                        isActive ? "text-primary-foreground" : "text-slate-200 group-hover:text-secondary-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{item.name}</span>
                  </Link>
                )}

                {hasSubItems && isDropdownOpen && (
                  <div className="mt-0 space-y-0 px-2 pb-0.5">
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={closeSidebar}
                          className={cn(
                            "group flex items-center pr-9 pl-3 py-0.5 text-sm font-medium rounded-lg hover-scale",
                            isSubActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-slate-200 hover:bg-secondary/80 hover:text-secondary-foreground"
                          )}
                        >
                          <span className="truncate opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })})()}
        </nav>
        <div className={cn(
          "p-4 border-t border-border/50 flex flex-col gap-2",
          !isAuthenticated && "blur-sm opacity-50"
        )}>
          <div className="flex items-center justify-center gap-2">
            <div className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300">
              {children}
            </div>
          </div>
          <div className="flex items-center justify-center px-3 text-xs text-slate-200">
            <span className="opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-opacity duration-300 whitespace-nowrap">ניהול עסקי - B2B/B2C</span>
          </div>
        </div>
      </div>
    </>
  );
}
