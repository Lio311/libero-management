"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, Users, DollarSign, Megaphone, Briefcase, CheckSquare, Menu, X, BarChart, Award, Ticket, ChevronDown, ChevronUp, ClipboardCheck, UserCog, ShoppingBag, FileText, CalendarDays } from "lucide-react";
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
  { 
    name: "קופונים", 
    icon: Ticket, 
    subItems: [
      { name: "ליברו", href: "/coupons/libero" },
      { name: "וולור", href: "/coupons/velour" },
      { name: "לה בורה", href: "/coupons/labura" },
    ]
  },
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
    ]
  },
  { name: "כספים", href: "/finance", icon: DollarSign },
  { name: "בעלי תפקידים", href: "/team", icon: Users },
  { name: "מעקב בונוסים", href: "/bonus", icon: Award },
  { name: "לוח משמרות", href: "/shifts", icon: CalendarDays },
];

export function Sidebar({ children, isAuthenticated = true }: { children?: React.ReactNode; isAuthenticated?: boolean }) {
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
      <div className="md:hidden flex h-[calc(5rem_+_env(safe-area-inset-top))] pt-[calc(1.5rem_+_env(safe-area-inset-top))] pb-2 items-center px-4 border-b border-border/50 glass-panel shrink-0 relative z-50 justify-center">
        {isAuthenticated ? (
          <>
            <button onClick={toggleSidebar} className="p-1 text-foreground absolute right-4">
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative h-16 w-44 overflow-hidden mx-auto">
              <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center" priority />
            </div>
            <div className="absolute left-4">{children}</div>
          </>
        ) : (
          <>
            <button onClick={toggleSidebar} className="p-1 text-foreground absolute right-4">
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative h-16 w-44 overflow-hidden mx-auto">
              <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center" priority />
            </div>
          </>
        )}
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 flex h-full w-64 flex-col glass-panel text-card-foreground shadow-sm transition-transform duration-300 md:relative md:translate-x-0 print:hidden",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center px-6 border-b border-border/50 relative justify-center">
          <div className="relative h-16 w-44 overflow-hidden mx-auto">
            <Image src="/libero-d.png" alt="Libero Logo" fill className="object-contain object-center" priority />
          </div>
          
          {isAuthenticated ? (
            <div className="absolute left-6 flex items-center gap-2">
              <div className="hidden md:block">{children}</div>
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
          "flex-1 space-y-0 px-2 py-2 overflow-y-auto",
          !isAuthenticated && "blur-sm pointer-events-none select-none opacity-50"
        )}>
          {navigation.map((item) => {
            const hasSubItems = !!item.subItems;
            const isDropdownOpen = openDropdowns.includes(item.name);
            const isActive = item.href ? pathname === item.href : item.subItems?.some(sub => pathname === sub.href);

            return (
              <div key={item.name}>
                {hasSubItems ? (
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={cn(
                      "w-full group flex justify-between items-center px-3 py-1.5 text-sm font-medium rounded-lg hover-scale",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={cn(
                          "ml-3 flex-shrink-0 h-5 w-5 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-secondary-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isDropdownOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={closeSidebar}
                    className={cn(
                      "group flex items-center px-3 py-1.5 text-sm font-medium rounded-lg hover-scale",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "ml-3 flex-shrink-0 h-5 w-5 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-secondary-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
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
                            "group flex items-center pr-9 pl-3 py-1 text-sm font-medium rounded-lg hover-scale",
                            isSubActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
                          )}
                        >
                          <span className="truncate">{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className={cn(
          "p-4 border-t border-border/50",
          !isAuthenticated && "blur-sm opacity-50"
        )}>
          <div className="flex items-center px-3 py-2 text-xs text-muted-foreground">
            <span>ניהול עסקי - B2B/B2C</span>
          </div>
        </div>
      </div>
    </>
  );
}
