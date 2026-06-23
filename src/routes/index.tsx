import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCrm, CALL_RESULT_LABELS, emailUsername } from "@/lib/crm-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { DailyTracker } from "@/components/crm/DailyTracker";
import { CallCompletedModal } from "@/components/crm/CallCompletedModal";
import { LeadDetail } from "@/components/crm/LeadDetail";
import { supabase } from "@/integrations/supabase/client";
import { PhoneCall, UserPlus, Columns3, Calendar, AlertTriangle, Clock, Phone, Trophy } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — THE VYROL CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { state, todayGoal } = useCrm();
  const { user } = useAuth();
  const [callOpen, setCallOpen] = useState(false);
  const [logLeadId, setLogLeadId] = useState<string | null>(null);
  const [openLead, setOpenLead] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const active = state.leads.filter((l) => !l.archived);
  const dueToday = active.filter((l) => l.next_call_date === today);
  const overdue = active.filter((l) => l.next_call_date && l.next_call_date < today);
  const upcoming = active
    .filter((l) => l.next_call_date && l.next_call_date > today)
    .sort((a, b) => (a.next_call_date! < b.next_call_date! ? -1 : 1))
    .slice(0, 10);

  // Per-user stats from today's call_logs (state.calls already covers all users today)
  const callsByUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of state.calls) map.set(c.user_id, (map.get(c.user_id) ?? 0) + 1);
    return map;
  }, [state.calls]);

  const myCalls = user ? callsByUser.get(user.id) ?? 0 : 0;
  const others = state.profiles.filter((p) => p.id !== user?.id);
  const combinedTotal = Array.from(callsByUser.values()).reduce((a, b) => a + b, 0);

  const todayCalls = user ? state.calls.filter((c) => c.user_id === user.id) : [];
  const leadsToday = state.leads.filter((l) => l.created_at.slice(0, 10) === today).length;
  const meetingsToday = todayCalls.filter((c) => c.call_result === "meeting_booked").length;
  const callbacksToday = todayCalls.filter((c) => c.call_result === "call_back").length;
  const noAnswersToday = todayCalls.filter((c) => c.call_result === "no_answer").length;

  // All-time leaderboard
  const [leaderboard, setLeaderboard] = useState<{ user_id: string; count: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("call_logs").select("user_id");
      if (cancelled || !data) return;
      const tally = new Map<string, number>();
      for (const row of data) tally.set(row.user_id, (tally.get(row.user_id) ?? 0) + 1);
      setLeaderboard(
        Array.from(tally.entries())
          .map(([user_id, count]) => ({ user_id, count }))
          .sort((a, b) => b.count - a.count),
      );
    })();
    return () => { cancelled = true; };
  }, [state.calls.length]);

  const profileEmail = (id: string) =>
    state.profiles.find((p) => p.id === id)?.email ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Today</h1>
        <p className="text-sm text-muted-foreground">Your cold-calling command center.</p>
      </div>

      <div className="card-elevated p-5">
        <DailyTracker compact />
      </div>

      {/* Per-user team stats */}
      <div className="card-elevated divide-y divide-border overflow-hidden">
        <StatRow label="My calls today" value={myCalls} accent />
        {others.map((p) => (
          <StatRow
            key={p.id}
            label={`${emailUsername(p.email)} calls today`}
            value={callsByUser.get(p.id) ?? 0}
          />
        ))}
        <StatRow label="Combined total today" value={combinedTotal} bold />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Leads saved today" value={leadsToday} />
        <Stat label="Meetings booked" value={meetingsToday} />
        <Stat label="Callbacks" value={callbacksToday} />
        <Stat label="No answers" value={noAnswersToday} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button className="gradient-brand text-white" onClick={() => { setLogLeadId(null); setCallOpen(true); }}>
          <PhoneCall className="mr-2 h-4 w-4" /> Call Completed
        </Button>
        <Button asChild variant="outline"><Link to="/save-lead"><UserPlus className="mr-2 h-4 w-4"/>Save Lead</Link></Button>
        <Button asChild variant="outline"><Link to="/pipeline"><Columns3 className="mr-2 h-4 w-4"/>Pipeline</Link></Button>
        <Button asChild variant="outline"><Link to="/calendar"><Calendar className="mr-2 h-4 w-4"/>Calendar</Link></Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Due today (${dueToday.length})`} icon={<Clock className="h-4 w-4 text-primary"/>}>
          <LeadList leads={dueToday} onOpen={setOpenLead} onLog={(id) => { setLogLeadId(id); setCallOpen(true); }} emptyText="Nothing due today." />
        </Panel>
        <Panel title={`Overdue (${overdue.length})`} icon={<AlertTriangle className="h-4 w-4 text-destructive"/>}>
          <LeadList leads={overdue} onOpen={setOpenLead} onLog={(id) => { setLogLeadId(id); setCallOpen(true); }} emptyText="No overdue follow-ups. Nice." />
        </Panel>
        <Panel title={`Upcoming 7 days (${upcoming.length})`} icon={<Calendar className="h-4 w-4 text-primary"/>}>
          <LeadList leads={upcoming} onOpen={setOpenLead} onLog={(id) => { setLogLeadId(id); setCallOpen(true); }} emptyText="No upcoming follow-ups scheduled." />
        </Panel>
        <Panel title="Team leaderboard (all-time)" icon={<Trophy className="h-4 w-4 text-warning"/>}>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No calls logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {leaderboard.map((row, idx) => (
                <li key={row.user_id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${idx === 0 ? "gradient-brand text-white" : "bg-muted text-muted-foreground"}`}>{idx + 1}</span>
                    <span className="font-medium">{emailUsername(profileEmail(row.user_id))}</span>
                    {row.user_id === user?.id && <span className="text-[10px] text-primary">(you)</span>}
                  </div>
                  <span className="font-display tabular-nums gradient-text">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent calls today">
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

      <CallCompletedModal open={callOpen} onOpenChange={setCallOpen} leadId={logLeadId} />
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

function StatRow({ label, value, accent, bold }: { label: string; value: number; accent?: boolean; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 ${bold ? "bg-muted/30" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`font-display text-xl font-bold tabular-nums ${accent ? "gradient-text" : ""}`}>{value}</span>
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
  onLog,
  emptyText,
}: {
  leads: ReturnType<typeof useCrm>["state"]["leads"];
  onOpen: (id: string) => void;
  onLog: (id: string) => void;
  emptyText: string;
}) {
  if (leads.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {leads.map((l) => (
        <li key={l.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm hover:border-primary/40">
          <div className="flex items-center gap-2">
            <button onClick={() => onOpen(l.id)} className="min-w-0 flex-1 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{l.business_name}</span>
                {l.next_call_date && <span className="shrink-0 text-xs text-primary">📅 {l.next_call_date}</span>}
              </div>
              {l.phone && <div className="text-xs text-muted-foreground">{l.phone}</div>}
            </button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={(e) => { e.stopPropagation(); onLog(l.id); }}
              title="Log call"
            >
              <Phone className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
