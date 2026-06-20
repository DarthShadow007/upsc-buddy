import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, ClipboardList, BookMarked,
  Layers, FileText, Newspaper, TrendingUp, Calendar,
  Info, GraduationCap, Menu, X, Moon, Sun
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/practice", label: "Practice", icon: BookOpen },
  { path: "/mock-test", label: "Mock Tests", icon: ClipboardList },
  { path: "/vocabulary", label: "Vocabulary", icon: BookMarked },
  { path: "/flashcards", label: "Flashcards", icon: Layers },
  { path: "/notes", label: "Notes", icon: FileText },
  { path: "/current-affairs", label: "Current Affairs", icon: Newspaper },
  { path: "/calendar", label: "Study Calendar", icon: Calendar },
  { path: "/about", label: "About", icon: Info },
];

interface SidebarProps {
  dark: boolean;
  onToggleDark: () => void;
}

export default function Sidebar({ dark, onToggleDark }: SidebarProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sidebar-foreground text-sm leading-none">UPSC Buddy</p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Civil Services Prep</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link key={path} href={path} onClick={() => setMobileOpen(false)}>
              <div
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <button
          onClick={onToggleDark}
          data-testid="button-toggle-dark"
          className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-sidebar text-sidebar-foreground p-2 rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        data-testid="button-mobile-menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 bg-sidebar z-40 transition-transform duration-300",
          "md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
