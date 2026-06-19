import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CALL_RESULT_LABELS, pipelineFromResult, useCrm, type CallResult } from "@/lib/crm-store";
import { SaveLeadForm } from "./SaveLeadForm";
import { Check } from "lucide-react";
import { toast } from "sonner";

export function CallCompletedModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { logCall } = useCrm();
  const [result, setResult] = useState<CallResult | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);

  const reset = () => {
    setResult(null);
    setShowSaveForm(false);
  };

  const handleJustCount = () => {
    if (!result) return;
    logCall({ call_result: result });
    toast.success("Call logged");
    reset();
    onOpenChange(false);
  };

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
            onSaved={() => {
              logCall({ call_result: result });
              toast.success("Lead saved & call logged");
              reset();
              onOpenChange(false);
            }}
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
              <Button variant="outline" onClick={handleJustCount}>
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
