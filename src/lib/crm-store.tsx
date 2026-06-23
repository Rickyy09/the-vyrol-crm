import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type PipelineStatus = "no_answer" | "call_back" | "meeting_booked" | "no_show" | "archived";

export type CallResult =
  | "no_answer"
  | "not_interested"
  | "bad_fit"
  | "interested"
  | "call_back"
  | "meeting_booked"
  | "no_show";

export type WebsiteQuality = "bad" | "okay" | "good" | "none";
export type LeadQuality = "low" | "medium" | "high" | "hot";

export interface Lead {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  address: string;
  website_url: string;
  google_maps_url: string;
  category: string;
  rating: number | null;
  review_count: number | null;
  website_quality: WebsiteQuality;
  lead_quality: LeadQuality;
  pipeline_status: PipelineStatus;
  notes: string;
  next_call_date: string | null;
  next_call_time: string | null;
  last_contacted_at: string | null;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  user_id: string;
  lead_id: string | null;
  call_result: CallResult;
  call_notes: string;
  call_date: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
}

export interface DailyGoal {
  date: string;
  goal_amount: number;
  calls_made: number;
}

interface Settings {
  default_goal: number;
  theme: "dark" | "light";
  google_places_api_key: string;
}

interface State {
  leads: Lead[];
  calls: CallLog[]; // today's calls across ALL users (for team stats)
  profiles: Profile[];
  goalAmount: number; // today's goal for current user
  settings: Settings;
  loading: boolean;
}

const defaultSettings: Settings = { default_goal: 50, theme: "dark", google_places_api_key: "" };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface Ctx {
  state: State;
  todayGoal: DailyGoal;
  myCallsToday: number;
  setGoal: (amount: number) => Promise<void>;
  incrementCalls: (delta: number) => Promise<void>;
  logCall: (input: {
    lead_id?: string | null;
    call_result: CallResult;
    call_notes?: string;
    next_call_date?: string | null;
    clear_next_call?: boolean;
  }) => Promise<void>;
  saveLead: (lead: Partial<Lead>) => Promise<Lead | null>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  archiveLead: (id: string) => Promise<void>;
  restoreLead: (id: string) => Promise<void>;
  setTheme: (theme: "dark" | "light") => Promise<void>;
  setDefaultGoal: (n: number) => Promise<void>;
  setApiKey: (s: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CrmContext = createContext<Ctx | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<State>({
    leads: [],
    calls: [],
    profiles: [],
    goalAmount: defaultSettings.default_goal,
    settings: defaultSettings,
    loading: true,
  });
  const themeRef = useRef(state.settings.theme);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    themeRef.current = state.settings.theme;
  }, [state.settings.theme]);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setState((s) => ({ ...s, leads: [], calls: [], profiles: [], loading: false }));
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const today = todayKey();
    const startOfDay = `${today}T00:00:00.000Z`;

    const [leadsRes, callsRes, profilesRes, goalRes, settingsRes] = await Promise.all([
      supabase.from("leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("call_logs").select("*").eq("user_id", userId).gte("call_date", startOfDay).order("call_date", { ascending: false }),
      supabase.from("profiles").select("id, email").eq("id", userId),
      supabase.from("daily_goals").select("*").eq("user_id", userId).eq("date", today).maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const settings: Settings = settingsRes.data
      ? {
          default_goal: settingsRes.data.default_goal ?? 50,
          theme: (settingsRes.data.theme as "dark" | "light") ?? "dark",
          google_places_api_key: settingsRes.data.google_places_api_key ?? "",
        }
      : defaultSettings;

    const goalAmount = goalRes.data?.goal_amount ?? settings.default_goal;

    setState({
      leads: (leadsRes.data ?? []) as Lead[],
      calls: (callsRes.data ?? []) as CallLog[],
      profiles: (profilesRes.data ?? []) as Profile[],
      goalAmount,
      settings,
      loading: false,
    });
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime: refresh today's call list when any call_log changes
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("call_logs_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "call_logs" }, () => {
        const today = todayKey();
        const startOfDay = `${today}T00:00:00.000Z`;
        supabase
          .from("call_logs")
          .select("*")
          .gte("call_date", startOfDay)
          .order("call_date", { ascending: false })
          .then(({ data }) => {
            if (data) setState((s) => ({ ...s, calls: data as CallLog[] }));
          });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const myCallsToday = useMemo(
    () => state.calls.filter((c) => c.user_id === userId).length,
    [state.calls, userId],
  );

  const todayGoal: DailyGoal = {
    date: todayKey(),
    goal_amount: state.goalAmount,
    calls_made: myCallsToday,
  };

  const upsertGoal = async (goal_amount: number) => {
    if (!userId) return;
    await supabase
      .from("daily_goals")
      .upsert({ user_id: userId, date: todayKey(), goal_amount }, { onConflict: "user_id,date" });
  };

  const ctx: Ctx = {
    state,
    todayGoal,
    myCallsToday,
    refresh: fetchAll,
    setGoal: async (amount) => {
      const n = Math.max(1, amount);
      setState((s) => ({ ...s, goalAmount: n }));
      await upsertGoal(n);
    },
    incrementCalls: async (delta) => {
      // Kept for compatibility: with cloud-backed calls, manual +/- now inserts/deletes
      // a "no_answer" placeholder call. Negative removes most recent today's call by this user.
      if (!userId) return;
      if (delta > 0) {
        const nowIso = new Date().toISOString();
        const row = {
          id: crypto.randomUUID(),
          user_id: userId,
          lead_id: null as string | null,
          call_result: "no_answer" as CallResult,
          call_notes: "",
          call_date: nowIso,
        };
        setState((s) => ({ ...s, calls: [{ ...row, created_at: nowIso }, ...s.calls] }));
        await supabase.from("call_logs").insert(row);
      } else if (delta < 0) {
        const mine = state.calls.filter((c) => c.user_id === userId);
        const target = mine[0];
        if (!target) return;
        setState((s) => ({ ...s, calls: s.calls.filter((c) => c.id !== target.id) }));
        await supabase.from("call_logs").delete().eq("id", target.id);
      }
    },
    logCall: async ({ lead_id = null, call_result, call_notes = "", next_call_date, clear_next_call }) => {
      if (!userId) return;
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const row = { id, user_id: userId, lead_id, call_result, call_notes, call_date: now };
      // optimistic
      setState((s) => ({
        ...s,
        calls: [{ ...row, created_at: now }, ...s.calls],
        leads: lead_id
          ? s.leads.map((l) =>
              l.id === lead_id
                ? {
                    ...l,
                    last_contacted_at: now,
                    next_call_date: clear_next_call ? null : next_call_date ?? l.next_call_date,
                    updated_at: now,
                  }
                : l,
            )
          : s.leads,
      }));
      const { error } = await supabase.from("call_logs").insert(row);
      if (error) toast.error("Failed to log call");
      if (lead_id) {
        const patch: Partial<Lead> = { last_contacted_at: now, updated_at: now };
        if (clear_next_call) patch.next_call_date = null;
        else if (next_call_date !== undefined) patch.next_call_date = next_call_date;
        await supabase.from("leads").update(patch).eq("id", lead_id);
      }
    },
    saveLead: async (lead) => {
      if (!userId) return null;
      const now = new Date().toISOString();
      const newLead: Lead = {
        id: crypto.randomUUID(),
        user_id: userId,
        business_name: lead.business_name ?? "Untitled",
        phone: lead.phone ?? "",
        address: lead.address ?? "",
        website_url: lead.website_url ?? "",
        google_maps_url: lead.google_maps_url ?? "",
        category: lead.category ?? "",
        rating: lead.rating ?? null,
        review_count: lead.review_count ?? null,
        website_quality: lead.website_quality ?? "bad",
        lead_quality: lead.lead_quality ?? "medium",
        pipeline_status: lead.pipeline_status ?? "call_back",
        notes: lead.notes ?? "",
        next_call_date: lead.next_call_date ?? null,
        next_call_time: lead.next_call_time ?? null,
        last_contacted_at: now,
        archived: false,
        archived_at: null,
        created_at: now,
        updated_at: now,
      };
      setState((s) => ({ ...s, leads: [newLead, ...s.leads] }));
      const { error } = await supabase.from("leads").insert(newLead);
      if (error) {
        toast.error("Failed to save lead");
        setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== newLead.id) }));
        return null;
      }
      return newLead;
    },
    updateLead: async (id, patch) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch, updated_at: now } : l)),
      }));
      const { error } = await supabase.from("leads").update({ ...patch, updated_at: now }).eq("id", id);
      if (error) toast.error("Update failed");
    },
    deleteLead: async (id) => {
      setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) }));
      await supabase.from("leads").delete().eq("id", id);
    },
    archiveLead: async (id) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) =>
          l.id === id
            ? { ...l, archived: true, archived_at: now, pipeline_status: "archived", updated_at: now }
            : l,
        ),
      }));
      await supabase
        .from("leads")
        .update({ archived: true, archived_at: now, pipeline_status: "archived", updated_at: now })
        .eq("id", id);
    },
    restoreLead: async (id) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) =>
          l.id === id
            ? { ...l, archived: false, archived_at: null, pipeline_status: "call_back", updated_at: now }
            : l,
        ),
      }));
      await supabase
        .from("leads")
        .update({ archived: false, archived_at: null, pipeline_status: "call_back", updated_at: now })
        .eq("id", id);
    },
    setTheme: async (theme) => {
      setState((s) => ({ ...s, settings: { ...s.settings, theme } }));
      if (!userId) return;
      await supabase.from("user_settings").upsert({ user_id: userId, theme }, { onConflict: "user_id" });
    },
    setDefaultGoal: async (n) => {
      const v = Math.max(1, n);
      setState((s) => ({ ...s, settings: { ...s.settings, default_goal: v } }));
      if (!userId) return;
      await supabase
        .from("user_settings")
        .upsert({ user_id: userId, default_goal: v }, { onConflict: "user_id" });
    },
    setApiKey: async (k) => {
      setState((s) => ({ ...s, settings: { ...s.settings, google_places_api_key: k } }));
      if (!userId) return;
      await supabase
        .from("user_settings")
        .upsert({ user_id: userId, google_places_api_key: k }, { onConflict: "user_id" });
    },
  };

  return <CrmContext.Provider value={ctx}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}

export const PIPELINE_COLUMNS: { id: Exclude<PipelineStatus, "archived">; label: string }[] = [
  { id: "no_answer", label: "No Answer" },
  { id: "call_back", label: "Call Back" },
  { id: "meeting_booked", label: "Meeting Booked" },
  { id: "no_show", label: "No Show" },
];

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  no_answer: "No Answer",
  not_interested: "Not Interested",
  bad_fit: "Bad Fit",
  interested: "Interested",
  call_back: "Call Back Later",
  meeting_booked: "Meeting Booked",
  no_show: "No Show",
};

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  no_answer: "No Answer",
  call_back: "Call Back",
  meeting_booked: "Meeting Booked",
  no_show: "No Show",
  archived: "Archived",
};

export function pipelineFromResult(r: CallResult): PipelineStatus {
  switch (r) {
    case "no_answer":
      return "no_answer";
    case "meeting_booked":
      return "meeting_booked";
    case "no_show":
      return "no_show";
    case "call_back":
    case "interested":
    default:
      return "call_back";
  }
}

export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function parseGmbLink(url: string): Partial<Lead> {
  const out: Partial<Lead> = {};
  if (isSafeUrl(url)) {
    out.google_maps_url = url;
    try {
      const m = url.match(/\/place\/([^/]+)/);
      if (m) out.business_name = decodeURIComponent(m[1]).replace(/\+/g, " ");
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function emailUsername(email: string | null | undefined): string {
  if (!email) return "user";
  return email.split("@")[0];
}
