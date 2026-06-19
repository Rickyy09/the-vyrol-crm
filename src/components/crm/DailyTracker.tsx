import { useState } from "react";
import { ChevronLeft, ChevronRight, Target, Pencil } from "lucide-react";
import { useCrm } from "@/lib/crm-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DailyTracker({ compact = false }: { compact?: boolean }) {
  const { todayGoal, incrementCalls, setGoal } = useCrm();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(todayGoal.goal_amount);
  const pct = Math.min(100, (todayGoal.calls_made / todayGoal.goal_amount) * 100);

  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "card-elevated p-3"}`}>
      <div className="gradient-brand grid h-9 w-9 place-items-center rounded-lg text-white">
        <Target className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-[140px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground font-medium">Today's Calls</span>
          <span className="text-sm font-display font-semibold tabular-nums">
            <span className="gradient-text">{todayGoal.calls_made}</span>
            <span className="text-muted-foreground"> / {todayGoal.goal_amount}</span>
          </span>
        </div>
        <Progress value={pct} className="mt-1.5 h-1.5" />
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => incrementCalls(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => incrementCalls(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Popover open={editing} onOpenChange={setEditing}>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              <label className="text-xs font-medium">Daily goal</label>
              <Input
                type="number"
                value={val}
                onChange={(e) => setVal(Number(e.target.value))}
                min={1}
              />
              <Button
                className="gradient-brand w-full text-white"
                onClick={() => {
                  setGoal(val);
                  setEditing(false);
                }}
              >
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
