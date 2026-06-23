import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { LayoutDashboard, Columns3, Calendar, UserPlus, Archive, Settings, Menu, PhoneCall, X, LogOut } from "lucide-react";
import { Logo, LogoMark } from "./Logo";
import { DailyTracker } from "./DailyTracker";
import { Button } from "@/components/ui/button";
import { CallCompletedModal } from "./CallCompletedModal";
import { useAuth } from "@/hooks/use-auth";
import { emailUsername } from "@/lib/crm-store";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/pipeline", label: "Pipeline", icon: Columns3 },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/save-lead", label: "Save Lead", icon: UserPlus },
  { to: "/archive", label: "Archive", icon: Archive },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

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
                to={item.to as never}
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
        <div className="space-y-2 p-4">
          <Button className="gradient-brand w-full text-white" onClick={() => setCallOpen(true)}>
            <PhoneCall className="mr-2 h-4 w-4" /> Call Completed
          </Button>
          {user && (
            <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
              <div className="text-[10px] uppercase text-muted-foreground">Signed in</div>
              <div className="truncate text-xs font-medium">{emailUsername(user.email)}</div>
              <Button variant="ghost" size="sm" className="mt-1 h-7 w-full justify-start px-2 text-xs" onClick={handleSignOut}>
                <LogOut className="mr-2 h-3 w-3" /> Sign out
              </Button>
            </div>
          )}
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
                    to={item.to as never}
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
            {user && (
              <div className="mt-4 rounded-lg border border-border bg-card/40 px-3 py-2">
                <div className="text-[10px] uppercase text-muted-foreground">Signed in</div>
                <div className="truncate text-xs font-medium">{emailUsername(user.email)}</div>
                <Button variant="ghost" size="sm" className="mt-1 h-7 w-full justify-start px-2 text-xs" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-3 w-3" /> Sign out
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-60">
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
              <Button size="icon" variant="ghost" className="hidden lg:inline-flex" onClick={handleSignOut} title="Sign out">
                <LogOut className="h-4 w-4" />
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
              to={item.to as never}
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
