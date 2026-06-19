import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { LayoutDashboard, Columns3, Calendar, UserPlus, Archive, Settings, Menu, PhoneCall, X } from "lucide-react";
import { Logo, LogoMark } from "./Logo";
import { DailyTracker } from "./DailyTracker";
import { Button } from "@/components/ui/button";
import { CallCompletedModal } from "./CallCompletedModal";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/pipeline", label: "Pipeline", icon: Columns3 },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/save-lead", label: "Save Lead", icon: UserPlus },
  { to: "/archive", label: "Archive", icon: Archive },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo className="h-7" />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "gradient-brand text-white glow-brand"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4">
          <Button className="gradient-brand w-full text-white" onClick={() => setCallOpen(true)}>
            <PhoneCall className="mr-2 h-4 w-4" /> Call Completed
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo className="h-7" />
              <Button size="icon" variant="ghost" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active ? "gradient-brand text-white" : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-60">
        {/* Top bar with tracker */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="flex items-center gap-2 px-4 py-3 lg:px-8">
            <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="lg:hidden">
              <LogoMark size={28} />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:block min-w-[280px]">
                <DailyTracker compact />
              </div>
              <Button className="gradient-brand text-white" size="sm" onClick={() => setCallOpen(true)}>
                <PhoneCall className="mr-1.5 h-4 w-4" /> Call Done
              </Button>
            </div>
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <DailyTracker compact />
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 pb-24 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {nav.slice(0, 5).map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <CallCompletedModal open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}
