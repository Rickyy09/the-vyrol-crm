import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CALL_RESULT_LABELS,
  PIPELINE_LABELS,
  useCrm,
  type CallResult,
  type Lead,
  type PipelineStatus,
  isSafeUrl,
} from "@/lib/crm-store";
import { Phone, Globe, MapPin, Copy, Archive, Star, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function LeadDetail({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { state, updateLead, archiveLead, logCall } = useCrm();
  const lead = state.leads.find((l) => l.id === leadId);

  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [callResult, setCallResult] = useState<CallResult>("no_answer");
  const [callNotes, setCallNotes] = useState("");

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes);
      setDate(lead.next_call_date ?? "");
      setTime(lead.next_call_time ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  if (!lead) return null;

  const calls = state.calls.filter((c) => c.lead_id === lead.id);

  const setStatus = (s: PipelineStatus) => {
    if (s === "archived") archiveLead(lead.id);
    else updateLead(lead.id, { pipeline_status: s });
    toast.success(`Moved to ${PIPELINE_LABELS[s]}`);
  };

  const handleLogCall = () => {
    logCall({ lead_id: lead.id, call_result: callResult, call_notes: callNotes });
    setCallNotes("");
    toast.success("Call logged");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold">{lead.business_name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {lead.category && <Badge variant="outline">{lead.category}</Badge>}
                  {lead.rating != null && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {lead.rating} {lead.review_count != null && <span className="text-muted-foreground">({lead.review_count})</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {lead.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{lead.phone}</div>}
              {lead.address && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{lead.address}</div>}
              {lead.website_url && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" />{lead.website_url}</div>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {lead.phone && (
                <Button asChild size="sm" className="gradient-brand text-white"><a href={`tel:${lead.phone}`}><Phone className="mr-1.5 h-3.5 w-3.5"/>Call</a></Button>
              )}
              {isSafeUrl(lead.website_url) && (
                <Button asChild size="sm" variant="outline"><a href={lead.website_url} target="_blank" rel="noreferrer noopener"><Globe className="mr-1.5 h-3.5 w-3.5"/>Website</a></Button>
              )}
              {isSafeUrl(lead.google_maps_url) && (
                <Button asChild size="sm" variant="outline"><a href={lead.google_maps_url} target="_blank" rel="noreferrer noopener"><MapPin className="mr-1.5 h-3.5 w-3.5"/>Maps</a></Button>
              )}
              {lead.phone && (
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(lead.phone); toast.success("Copied"); }}>
                  <Copy className="mr-1.5 h-3.5 w-3.5"/>Copy #
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => { archiveLead(lead.id); toast.success("Archived"); onOpenChange(false); }}>
                <Archive className="mr-1.5 h-3.5 w-3.5"/>Archive
              </Button>
            </div>
          </div>

          {/* Pipeline */}
          <Section title="Pipeline status">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(PIPELINE_LABELS) as PipelineStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    lead.pipeline_status === s
                      ? "border-transparent gradient-brand text-white"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {PIPELINE_LABELS[s]}
                </button>
              ))}
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes" subtitle={`Updated ${new Date(lead.updated_at).toLocaleString()}`}>
            <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button
              className="mt-2 gradient-brand text-white"
              size="sm"
              onClick={() => { updateLead(lead.id, { notes }); toast.success("Notes saved"); }}
            >
              Save notes
            </Button>
          </Section>

          {/* Next call */}
          <Section title="Next call">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <Button
                size="sm"
                className="gradient-brand text-white"
                onClick={() => {
                  updateLead(lead.id, { next_call_date: date || null, next_call_time: time || null });
                  toast.success("Next call updated");
                }}
              >
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5"/>Save
              </Button>
            </div>
          </Section>

          {/* Log a call */}
          <Section title="Log a call to this lead">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={callResult} onValueChange={(v) => setCallResult(v as CallResult)}>
                <SelectTrigger className="sm:w-56"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CALL_RESULT_LABELS) as CallResult[]).map((k) => (
                    <SelectItem key={k} value={k}>{CALL_RESULT_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Call notes…" value={callNotes} onChange={(e) => setCallNotes(e.target.value)} />
              <Button className="gradient-brand text-white" onClick={handleLogCall}>Log call</Button>
            </div>
          </Section>

          {/* History */}
          <Section title={`Call history (${calls.length})`}>
            {calls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calls logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {calls.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{CALL_RESULT_LABELS[c.call_result]}</span>
                      <span className="text-xs text-muted-foreground">{new Date(c.call_date).toLocaleString()}</span>
                    </div>
                    {c.call_notes && <p className="mt-1 text-muted-foreground">{c.call_notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h4 className="font-display text-sm font-semibold">{title}</h4>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

// alias for unused import
export type { Lead };
