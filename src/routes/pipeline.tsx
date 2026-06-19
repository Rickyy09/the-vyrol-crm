import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PIPELINE_COLUMNS, useCrm, type PipelineStatus } from "@/lib/crm-store";
import { LeadCard } from "@/components/crm/LeadCard";
import { LeadDetail } from "@/components/crm/LeadDetail";

export const Route = createFileRoute("/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — THE VYROL CRM" }] }),
  component: Pipeline,
});

function Pipeline() {
  const { state, updateLead, archiveLead } = useCrm();
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const active = state.leads.filter((l) => !l.archived);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Drag leads between columns to update their status.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {PIPELINE_COLUMNS.map((col) => {
          const items = active.filter((l) => l.pipeline_status === col.id);
          const isOver = dragOver === col.id;
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) updateLead(id, { pipeline_status: col.id as PipelineStatus });
                setDragOver(null);
              }}
              className={`rounded-2xl border p-3 transition ${
                isOver ? "border-primary bg-primary/5 glow-brand" : "border-border bg-muted/20"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium tabular-nums">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Drop here
                  </div>
                ) : (
                  items.map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                      onOpen={() => setOpenLead(l.id)}
                      onArchive={() => archiveLead(l.id)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetail leadId={openLead} open={!!openLead} onOpenChange={(v) => !v && setOpenLead(null)} />
    </div>
  );
}
