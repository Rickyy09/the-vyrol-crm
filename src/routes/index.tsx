import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCrm, CALL_RESULT_LABELS } from "@/lib/crm-store";
import { Button } from "@/components/ui/button";
import { DailyTracker } from "@/components/crm/DailyTracker";
import { CallCompletedModal } from "@/components/crm/CallCompletedModal";
import { LeadDetail } from "@/components/crm/LeadDetail";
import { PhoneCall, UserPlus, Columns3, Calendar, AlertTriangle, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — THE VYROL CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { state, todayGoal } = useCrm();
  const [callOpen, setCallOpen] = useState(false);
  const [openLead, setOpenLead] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const active = state.leads.filter((l) => !l.archived);
  const dueToday = active.filter((l) => l.next_call_date === today);
  const overdue = active.filter((l) => l.next_call_date && l.next_call_date < today);
  const upcoming = active
    .filter((l) => l.next_call_date && l.next_call_date > today)
    .sort((a, b) => (a.next_call_date! < b.next_call_date! ? -1 : 1))
    .slice(0, 10);

  const todayCalls = state.calls.filter((c) => c.call_date.slice(0, 10) === today);
  const leadsToday = state.leads.filter((l) => l.created_at.slice(0, 10) === today).length;
  const meetingsToday = todayCalls.filter((c) => c.call_result === "meeting_booked").length;
  const callbacksToday = todayCalls.filter((c) => c.call_result === "call_back").length;
  const noAnswersToday = todayCalls.filter((c) => c.call_result === "no_answer").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Today</h1>
        <p className="text-sm text-muted-foreground">Your cold-calling command center.</p>
      </div>

      <div className="card-elevated p-5">
        <DailyTracker compact />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Calls today" value={todayCalls.length} accent />
        <Stat label="Leads saved" value={leadsToday} />
        <Stat label="Meetings booked" value={meetingsToday} />
        <Stat label="Callbacks" value={callbacksToday} />
        <Stat label="No answers" value={noAnswersToday} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="gradient-brand text-white" onClick={() => setCallOpen(true)}>
          <PhoneCall className="mr-2 h-4 w-4" /> Call Completed
        </Button>
        <Button asChild variant="outline"><Link to="/save-lead"><UserPlus className="mr-2 h-4 w-4"/>Save Lead</Link></Button>
        <Button asChild variant="outline"><Link to="/pipeline"><Columns3 className="mr-2 h-4 w-4"/>Pipeline</Link></Button>
        <Button asChild variant="outline"><Link to="/calendar"><Calendar className="mr-2 h-4 w-4"/>Calendar</Link></Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Due today (${dueToday.length})`} icon={<Clock className="h-4 w-4 text-primary"/>}>
          <LeadList leads={dueToday} onOpen={setOpenLead} emptyText="Nothing due today." />
        </Panel>
        <Panel title={`Overdue (${overdue.length})`} icon={<AlertTriangle className="h-4 w-4 text-destructive"/>}>
          <LeadList leads={overdue} onOpen={setOpenLead} emptyText="No overdue follow-ups. Nice." />
        </Panel>
        <Panel title={`Upcoming 7 days (${upcoming.length})`} icon={<Calendar className="h-4 w-4 text-primary"/>}>
          <LeadList leads={upcoming} onOpen={setOpenLead} emptyText="No upcoming follow-ups scheduled." />
        </Panel>
        <Panel title="Recent calls">
          {todayCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground">No calls logged today.</p>
          ) : (
            <ul className="space-y-2">
              {todayCalls.slice(0, 8).map((c) => {
                const lead = c.lead_id ? state.leads.find((l) => l.id === c.lead_id) : null;
                return (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium">{lead?.business_name ?? "Untracked call"}</div>
                      <div className="text-xs text-muted-foreground">{CALL_RESULT_LABELS[c.call_result]}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.call_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <CallCompletedModal open={callOpen} onOpenChange={setCallOpen} />
      <LeadDetail leadId={openLead} open={!!openLead} onOpenChange={(v) => !v && setOpenLead(null)} />

      <p className="text-center text-xs text-muted-foreground">
        Goal: {todayGoal.calls_made}/{todayGoal.goal_amount} — keep dialing.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent ? "gradient-text" : ""}`}>{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-5">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function LeadList({
  leads,
  onOpen,
  emptyText,
}: {
  leads: ReturnType<typeof useCrm>["state"]["leads"];
  onOpen: (id: string) => void;
  emptyText: string;
}) {
  if (leads.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {leads.map((l) => (
        <li key={l.id}>
          <button
            onClick={() => onOpen(l.id)}
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-sm hover:border-primary/40 hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{l.business_name}</span>
              {l.next_call_date && <span className="text-xs text-primary">📅 {l.next_call_date}</span>}
            </div>
            {l.phone && <div className="text-xs text-muted-foreground">{l.phone}</div>}
          </button>
        </li>
      ))}
    </ul>
  );
}
