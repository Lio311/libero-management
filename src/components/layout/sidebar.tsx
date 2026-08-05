"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "לוז חודשי", href: "/", icon: Calendar },
  { name: "מלאי", href: "/inventory", icon: Package },
  { name: "בעלי תפקידים", href: "/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-l border-border/50 text-card-foreground shadow-sm">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <h1 className="text-xl font-semibold tracking-tight text-primary">Libero</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
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
  );
}
