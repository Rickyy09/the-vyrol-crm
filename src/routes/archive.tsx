import { createFileRoute } from "@tanstack/react-router";
import { useCrm, PIPELINE_LABELS } from "@/lib/crm-store";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/archive")({
  head: () => ({ meta: [{ title: "Archive — THE VYROL CRM" }] }),
  component: ArchivePage,
});

function ArchivePage() {
  const { state, restoreLead, deleteLead } = useCrm();
  const archived = state.leads.filter((l) => l.archived);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Archive</h1>
        <p className="text-sm text-muted-foreground">Leads marked as not worth saving.</p>
      </div>

      {archived.length === 0 ? (
        <div className="card-elevated p-10 text-center text-sm text-muted-foreground">
          No archived leads.
        </div>
      ) : (
        <ul className="space-y-2">
          {archived.map((l) => (
            <li key={l.id} className="card-elevated flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-semibold">{l.business_name}</h3>
                <p className="text-xs text-muted-foreground">{l.phone} · {l.website_url}</p>
                {l.notes && <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground/90">{l.notes}</p>}
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>From: {PIPELINE_LABELS[l.pipeline_status]}</div>
                {l.archived_at && <div>{new Date(l.archived_at).toLocaleDateString()}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { restoreLead(l.id); toast.success("Restored"); }}>
                  <RotateCcw className="mr-1 h-3 w-3"/>Restore
                </Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (confirm("Delete permanently?")) { deleteLead(l.id); toast.success("Deleted"); } }}>
                  <Trash2 className="mr-1 h-3 w-3"/>Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
