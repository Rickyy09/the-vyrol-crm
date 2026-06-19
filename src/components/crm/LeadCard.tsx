import { Star, Phone, Globe, MapPin, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Lead, isSafeUrl } from "@/lib/crm-store";

const wqColor: Record<string, string> = {
  bad: "bg-destructive/15 text-destructive border-destructive/30",
  okay: "bg-warning/15 text-warning-foreground border-warning/30",
  good: "bg-success/15 text-success border-success/30",
  none: "bg-muted text-muted-foreground border-border",
};
const wqLabel: Record<string, string> = {
  bad: "Bad Site",
  okay: "Okay Site",
  good: "Good Site",
  none: "No Site",
};
const lqColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-500",
  high: "bg-purple-500/15 text-purple-500",
  hot: "gradient-brand text-white",
};

export function LeadCard({
  lead,
  onOpen,
  onArchive,
  draggable,
  onDragStart,
}: {
  lead: Lead;
  onOpen: () => void;
  onArchive: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className="card-elevated group cursor-pointer p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:glow-brand"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-sm font-semibold">{lead.business_name}</h3>
          {lead.category && (
            <Badge variant="outline" className="mt-1 text-[10px] font-normal">
              {lead.category}
            </Badge>
          )}
        </div>
        {lead.rating != null && (
          <div className="flex items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-xs">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="font-medium">{lead.rating}</span>
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {lead.phone && (
          <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {lead.phone}</div>
        )}
        {lead.address && (
          <div className="flex items-center gap-1.5 truncate"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.address}</span></div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${wqColor[lead.website_quality]}`}>
          {wqLabel[lead.website_quality]}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${lqColor[lead.lead_quality]}`}>
          {lead.lead_quality}
        </span>
        {lead.next_call_date && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
            📅 {lead.next_call_date}
          </span>
        )}
      </div>

      {lead.notes && (
        <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground/90 italic">{lead.notes}</p>
      )}

      <div className="mt-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
        {lead.phone && (
          <Button asChild size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={(e) => e.stopPropagation()}>
            <a href={`tel:${lead.phone}`}><Phone className="mr-1 h-3 w-3" /> Call</a>
          </Button>
        )}
        {isSafeUrl(lead.website_url) && (
          <Button asChild size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => e.stopPropagation()}>
            <a href={lead.website_url} target="_blank" rel="noreferrer noopener"><Globe className="h-3 w-3" /></a>
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
        >
          <Archive className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
