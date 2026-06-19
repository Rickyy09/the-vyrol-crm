import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SaveLeadForm } from "@/components/crm/SaveLeadForm";
import { toast } from "sonner";

export const Route = createFileRoute("/save-lead")({
  head: () => ({ meta: [{ title: "Save Lead — THE VYROL CRM" }] }),
  component: SaveLeadPage,
});

function SaveLeadPage() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold">Save lead</h1>
        <p className="text-sm text-muted-foreground">Paste a Google Maps link or fill the form manually.</p>
      </div>
      <div className="card-elevated p-5">
        <SaveLeadForm
          onSaved={() => {
            toast.success("Lead saved");
            nav({ to: "/pipeline" });
          }}
        />
      </div>
    </div>
  );
}
