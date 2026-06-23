import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  parseGmbLink,
  PIPELINE_LABELS,
  useCrm,
  type LeadQuality,
  type PipelineStatus,
  type WebsiteQuality,
} from "@/lib/crm-store";
import { Sparkles } from "lucide-react";

export function SaveLeadForm({
  initialPipelineStatus = "call_back",
  onSaved,
  onCancel,
}: {
  initialPipelineStatus?: PipelineStatus;
  onSaved: (id: string) => void;
  onCancel?: () => void;
}) {
  const { saveLead } = useCrm();
  const [gmbLink, setGmbLink] = useState("");
  const [form, setForm] = useState({
    business_name: "",
    phone: "",
    address: "",
    website_url: "",
    google_maps_url: "",
    category: "",
    rating: "" as string,
    review_count: "" as string,
    website_quality: "bad" as WebsiteQuality,
    lead_quality: "medium" as LeadQuality,
    pipeline_status: initialPipelineStatus,
    notes: "",
    next_call_date: "",
    next_call_time: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleImport = () => {
    if (!gmbLink) return;
    const parsed = parseGmbLink(gmbLink);
    setForm((f) => ({
      ...f,
      business_name: parsed.business_name ?? f.business_name,
      google_maps_url: gmbLink,
    }));
  };

  const handleSave = async () => {
    if (!form.business_name.trim()) return;
    const lead = await saveLead({
      ...form,
      rating: form.rating ? Number(form.rating) : null,
      review_count: form.review_count ? Number(form.review_count) : null,
      next_call_date: form.next_call_date || null,
      next_call_time: form.next_call_time || null,
    });
    if (lead) onSaved(lead.id);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
        <Label className="text-xs">Paste Google Maps / GMB link</Label>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="https://www.google.com/maps/place/..."
            value={gmbLink}
            onChange={(e) => setGmbLink(e.target.value)}
          />
          <Button onClick={handleImport} variant="outline" className="shrink-0">
            <Sparkles className="mr-1.5 h-4 w-4" /> Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Business name *">
          <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Website URL">
          <Input value={form.website_url} onChange={(e) => set("website_url", e.target.value)} />
        </Field>
        <Field label="Google Maps URL">
          <Input value={form.google_maps_url} onChange={(e) => set("google_maps_url", e.target.value)} />
        </Field>
        <Field label="Category">
          <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rating">
            <Input value={form.rating} onChange={(e) => set("rating", e.target.value)} />
          </Field>
          <Field label="Reviews">
            <Input value={form.review_count} onChange={(e) => set("review_count", e.target.value)} />
          </Field>
        </div>
        <Field label="Website quality">
          <Select value={form.website_quality} onValueChange={(v) => set("website_quality", v as WebsiteQuality)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bad">Bad Website</SelectItem>
              <SelectItem value="okay">Okay Website</SelectItem>
              <SelectItem value="good">Good Website</SelectItem>
              <SelectItem value="none">No Website</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Lead quality">
          <Select value={form.lead_quality} onValueChange={(v) => set("lead_quality", v as LeadQuality)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Pipeline status">
          <Select value={form.pipeline_status} onValueChange={(v) => set("pipeline_status", v as PipelineStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PIPELINE_LABELS).filter(([k]) => k !== "archived").map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Next call date">
            <Input type="date" value={form.next_call_date} onChange={(e) => set("next_call_date", e.target.value)} />
          </Field>
          <Field label="Time">
            <Input type="time" value={form.next_call_time} onChange={(e) => set("next_call_time", e.target.value)} />
          </Field>
        </div>
      </div>

      <Field label="Notes (required for context)">
        <Textarea
          rows={4}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Owner mentioned they need a new site. Call back Tuesday morning..."
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Back</Button>
        )}
        <Button className="gradient-brand text-white" onClick={handleSave} disabled={!form.business_name.trim()}>
          Save Lead
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
