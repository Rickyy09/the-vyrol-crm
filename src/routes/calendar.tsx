import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCrm, PIPELINE_LABELS } from "@/lib/crm-store";
import { LeadDetail } from "@/components/crm/LeadDetail";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — THE VYROL CRM" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const { state } = useCrm();
  const [openLead, setOpenLead] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const active = state.leads.filter((l) => !l.archived && l.next_call_date);

  const groups = useMemo(() => ({
    today: active.filter((l) => l.next_call_date === today),
    tomorrow: active.filter((l) => l.next_call_date === tomorrow),
    week: active.filter((l) => l.next_call_date! > today && l.next_call_date! <= weekEnd),
    overdue: active.filter((l) => l.next_call_date! < today),
    all: active.slice().sort((a, b) => (a.next_call_date! < b.next_call_date! ? -1 : 1)),
  }), [active, today, tomorrow, weekEnd]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">All scheduled callbacks across your pipeline.</p>
      </div>

      <Tabs defaultValue="today">
        <TabsList className="flex-wrap">
          <TabsTrigger value="today">Today ({groups.today.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">Tomorrow ({groups.tomorrow.length})</TabsTrigger>
          <TabsTrigger value="week">This week ({groups.week.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({groups.overdue.length})</TabsTrigger>
          <TabsTrigger value="all">All ({groups.all.length})</TabsTrigger>
        </TabsList>
        {(["today","tomorrow","week","overdue","all"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <FollowupList leads={groups[k]} onOpen={setOpenLead} />
          </TabsContent>
        ))}
      </Tabs>

      <LeadDetail leadId={openLead} open={!!openLead} onOpenChange={(v) => !v && setOpenLead(null)} />
    </div>
  );
}

function FollowupList({ leads, onOpen }: { leads: ReturnType<typeof useCrm>["state"]["leads"]; onOpen: (id: string) => void }) {
  if (leads.length === 0) return <p className="text-sm text-muted-foreground">No follow-ups in this view.</p>;
  return (
    <ul className="space-y-2">
      {leads.map((l) => (
        <li key={l.id} className="card-elevated flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold">{l.business_name}</h3>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">{PIPELINE_LABELS[l.pipeline_status]}</span>
            </div>
            {l.phone && <p className="text-xs text-muted-foreground">{l.phone}</p>}
            {l.notes && <p className="mt-1 line-clamp-1 text-xs italic text-muted-foreground/90">{l.notes}</p>}
          </div>
          <div className="text-right text-xs">
            <div className="font-medium gradient-text">{l.next_call_date}{l.next_call_time ? ` · ${l.next_call_time}` : ""}</div>
          </div>
          <div className="flex gap-2">
            {l.phone && <Button asChild size="sm" variant="outline"><a href={`tel:${l.phone}`}><Phone className="mr-1 h-3 w-3"/>Call</a></Button>}
            <Button size="sm" className="gradient-brand text-white" onClick={() => onOpen(l.id)}>Open</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
