"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, Users, DollarSign, Megaphone, Briefcase, CheckSquare, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "לוז חודשי", href: "/", icon: Calendar },
  { name: "כספים", href: "/finance", icon: DollarSign },
  { name: "בנק משימות", href: "/tasks", icon: CheckSquare },
  { name: "שיווק ומשפיענים", href: "/marketing", icon: Megaphone },
  { name: "מלאי וספקים", href: "/inventory", icon: Package },
  { name: "תפעול וסיטונאות", href: "/operations", icon: Briefcase },
  { name: "בעלי תפקידים", href: "/team", icon: Users },
];

export function Sidebar({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex h-16 items-center justify-between px-4 border-b border-border/50 glass-panel shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="p-1 -mr-1 text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-primary">Libero</h1>
        </div>
        <div>{children}</div>
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
        <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
          <h1 className="text-xl font-semibold tracking-tight text-primary">Libero</h1>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">{children}</div>
            <button onClick={closeSidebar} className="md:hidden p-2 -ml-2 text-foreground">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
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
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center px-3 py-2 text-xs text-muted-foreground">
            <span>ניהול עסקי - B2B/B2C</span>
          </div>
        </div>
      </div>
    </>
  );
}
