import { createFileRoute } from "@tanstack/react-router";
import { useCrm } from "@/lib/crm-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/crm/Logo";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — THE VYROL CRM" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setTheme, setDefaultGoal, setApiKey } = useCrm();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
      </div>

      <Card title="Appearance">
        <div className="flex gap-2">
          <Button
            variant={state.settings.theme === "dark" ? "default" : "outline"}
            className={state.settings.theme === "dark" ? "gradient-brand text-white" : ""}
            onClick={() => setTheme("dark")}
          >
            <Moon className="mr-2 h-4 w-4" /> Dark
          </Button>
          <Button
            variant={state.settings.theme === "light" ? "default" : "outline"}
            className={state.settings.theme === "light" ? "gradient-brand text-white" : ""}
            onClick={() => setTheme("light")}
          >
            <Sun className="mr-2 h-4 w-4" /> Light
          </Button>
        </div>
      </Card>

      <Card title="Daily goal">
        <Label className="text-xs">Default daily call goal</Label>
        <Input
          type="number"
          className="mt-1 max-w-xs"
          value={state.settings.default_goal}
          onChange={(e) => setDefaultGoal(Number(e.target.value))}
        />
        <p className="mt-1 text-xs text-muted-foreground">Used as the starting goal each new day.</p>
      </Card>

      <Card title="Brand">
        <div className="flex items-center gap-4">
          <Logo className="h-8" />
          <div>
            <div className="font-display font-semibold">THE VYROL CRM</div>
            <div className="text-xs text-muted-foreground">Cold-calling command center</div>
          </div>
        </div>
      </Card>

      <Card title="Google Places API (optional, future)">
        <Label className="text-xs">API key</Label>
        <Input
          type="password"
          className="mt-1"
          placeholder="Paste your API key…"
          value={state.settings.google_places_api_key}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Reserved for auto-fetching business details from Google Maps links. Not used yet.
        </p>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-5">
      <h3 className="mb-3 font-display text-base font-semibold">{title}</h3>
      {children}
    </div>
  );
}
