import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CALL_RESULT_LABELS, pipelineFromResult, useCrm, type CallResult } from "@/lib/crm-store";
import { SaveLeadForm } from "./SaveLeadForm";
import { Check } from "lucide-react";
import { toast } from "sonner";

export function CallCompletedModal({
  open,
  onOpenChange,
  leadId = null,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
}) {
  const { logCall, state } = useCrm();
  const [result, setResult] = useState<CallResult | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [nextDate, setNextDate] = useState<string>("");
  const [notes, setNotes] = useState("");

  const lead = leadId ? state.leads.find((l) => l.id === leadId) ?? null : null;

  useEffect(() => {
    if (!open) {
      setResult(null);
      setShowSaveForm(false);
      setNextDate("");
      setNotes("");
    }
  }, [open]);

  const reset = () => {
    setResult(null);
    setShowSaveForm(false);
    setNextDate("");
    setNotes("");
  };

  const finalize = async (saved_lead_id: string | null = null) => {
    if (!result) return;
    const targetLeadId = saved_lead_id ?? leadId ?? null;
    await logCall({
      lead_id: targetLeadId,
      call_result: result,
      call_notes: notes,
      // When logging against an existing lead: clear overdue date unless user sets a new one
      ...(targetLeadId
        ? nextDate
          ? { next_call_date: nextDate }
          : { clear_next_call: true }
        : {}),
    });
    toast.success("Call logged");
    reset();
    onOpenChange(false);
  };

  // Path 1: logging against an existing lead — never show "save lead" prompt
  if (lead) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log call · {lead.business_name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map((k) => (
              <button
                key={k}
                onClick={() => setResult(k)}
                className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                  result === k
                    ? "border-transparent gradient-brand text-white glow-brand"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                {CALL_RESULT_LABELS[k]}
                {result === k && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          {result && (
            <div className="mt-2 space-y-3">
              <div>
                <Label className="text-xs">Call notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Short note…" />
              </div>
              <div>
                <Label className="text-xs">Next follow-up date (leave blank to clear)</Label>
                <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Saving without a date removes this lead from your overdue list.
                </p>
              </div>
              <Button className="gradient-brand w-full text-white" onClick={() => finalize()}>
                Save call
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Path 2: untracked call — original flow with optional "save as lead"
  if (showSaveForm && result) {
    return (
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Save lead</DialogTitle>
          </DialogHeader>
          <SaveLeadForm
            initialPipelineStatus={pipelineFromResult(result)}
            onSaved={(savedId) => finalize(savedId)}
            onCancel={() => setShowSaveForm(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Call result</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map((k) => (
            <button
              key={k}
              onClick={() => setResult(k)}
              className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${
                result === k
                  ? "border-transparent gradient-brand text-white glow-brand"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {CALL_RESULT_LABELS[k]}
              {result === k && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
        {result && (
          <div className="mt-2 space-y-2">
            <p className="text-sm text-muted-foreground">Save this business as a lead?</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => finalize()}>
                No, just count call
              </Button>
              <Button className="gradient-brand text-white" onClick={() => setShowSaveForm(true)}>
                Yes, save lead
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
