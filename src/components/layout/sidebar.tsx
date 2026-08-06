"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, Users, DollarSign, Megaphone, Briefcase, CheckSquare, Menu, X, BarChart, Award, Ticket, ChevronDown, ChevronUp } from "lucide-react";
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
  { name: "לוז חודשי", href: "/", icon: Calendar },
  { name: "כספים", href: "/finance", icon: DollarSign },
  { name: "בנק משימות", href: "/tasks", icon: CheckSquare },
  { name: "שיווק ומשפיענים", icon: Megaphone, subItems: [
    { name: "לוח שיווק", href: "/marketing" },
    ...Object.values(influencersConfig).map(inf => ({
      name: inf.name,
      href: inf.id === 'oded' ? '/marketing/oded' : `/marketing/influencers/${inf.id}`
    }))
  ] },
  { name: "הזמנות וספקים", href: "/inventory", icon: Package },
  { name: "תפעול וסיטונאות", href: "/operations", icon: Briefcase },
  { name: "בעלי תפקידים", href: "/team", icon: Users },
  { name: "ניתוח מלאי חכם", href: "/inventory-analysis", icon: BarChart },
  { name: "מעקב בונוסים", href: "/bonus", icon: Award },
  { 
    name: "קופונים", 
    icon: Ticket, 
    subItems: [
      { name: "ליברו", href: "/coupons/libero" },
      { name: "וולור", href: "/coupons/velour" },
      { name: "לה בורה", href: "/coupons/labura" },
    ]
  },
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
      <div className={cn("md:hidden flex h-[calc(4rem+env(safe-area-inset-top))] pt-[calc(1.5rem+env(safe-area-inset-top))] pb-2 items-center px-4 border-b border-border/50 glass-panel shrink-0 relative z-50", isAuthenticated ? "justify-between" : "justify-center")}>
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} className="p-1 -mr-1 text-foreground">
                <Menu className="h-6 w-6" />
              </button>
              <div className="relative h-12 w-28 overflow-hidden -ml-2">
                <Image src="/libero-d.png" alt="Libero Logo" fill className="object-cover object-center" priority />
              </div>
            </div>
            <div>{children}</div>
          </>
        ) : (
          <>
            <button onClick={toggleSidebar} className="p-1 text-foreground absolute right-4">
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative h-12 w-28 overflow-hidden">
              <Image src="/libero-d.png" alt="Libero Logo" fill className="object-cover object-center" priority />
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
        "fixed inset-y-0 right-0 z-50 flex h-full w-64 flex-col glass-panel text-card-foreground shadow-sm transition-transform duration-300 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className={cn("flex h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] items-center px-6 border-b border-border/50 relative", isAuthenticated ? "justify-between" : "justify-center")}>
          <div className={cn("relative h-12 w-28 overflow-hidden", isAuthenticated && "-ml-2")}>
            <Image src="/libero-d.png" alt="Libero Logo" fill className="object-cover object-center" priority />
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
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
          "flex-1 space-y-1 px-3 py-4 overflow-y-auto",
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
                      "w-full group flex justify-between items-center px-3 py-2.5 text-sm font-medium rounded-lg hover-scale",
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
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg hover-scale",
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
                  <div className="mt-1 space-y-1 px-3 pb-2">
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={closeSidebar}
                          className={cn(
                            "group flex items-center pr-10 pl-3 py-2 text-sm font-medium rounded-lg hover-scale",
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
