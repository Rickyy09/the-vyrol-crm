import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PipelineStatus =
  | "no_answer"
  | "call_back"
  | "meeting_booked"
  | "no_show"
  | "archived";

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
  next_call_date: string | null; // ISO date
  next_call_time: string | null; // HH:mm
  last_contacted_at: string | null;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string | null;
  call_result: CallResult;
  call_notes: string;
  call_date: string;
  created_at: string;
}

export interface DailyGoal {
  date: string; // YYYY-MM-DD
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
  calls: CallLog[];
  goals: Record<string, DailyGoal>;
  settings: Settings;
}

const STORAGE_KEY = "vyrol_crm_v1";

const defaultState: State = {
  leads: [],
  calls: [],
  goals: {},
  settings: { default_goal: 50, theme: "dark", google_places_api_key: "" },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): State {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

interface Ctx {
  state: State;
  todayGoal: DailyGoal;
  setGoal: (amount: number) => void;
  incrementCalls: (delta: number) => void;
  logCall: (input: { lead_id?: string | null; call_result: CallResult; call_notes?: string }) => void;
  saveLead: (lead: Partial<Lead>) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  archiveLead: (id: string) => void;
  restoreLead: (id: string) => void;
  setTheme: (theme: "dark" | "light") => void;
  setDefaultGoal: (n: number) => void;
  setApiKey: (s: string) => void;
}

const CrmContext = createContext<Ctx | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    if (state.settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [state.settings.theme, hydrated]);

  const todayGoal = useMemo<DailyGoal>(() => {
    const key = todayKey();
    return (
      state.goals[key] ?? {
        date: key,
        goal_amount: state.settings.default_goal,
        calls_made: 0,
      }
    );
  }, [state.goals, state.settings.default_goal]);

  const ctx: Ctx = {
    state,
    todayGoal,
    setGoal: (amount) =>
      setState((s) => ({
        ...s,
        goals: { ...s.goals, [todayKey()]: { ...todayGoal, goal_amount: Math.max(1, amount) } },
      })),
    incrementCalls: (delta) =>
      setState((s) => {
        const key = todayKey();
        const current = s.goals[key] ?? { date: key, goal_amount: s.settings.default_goal, calls_made: 0 };
        return {
          ...s,
          goals: { ...s.goals, [key]: { ...current, calls_made: Math.max(0, current.calls_made + delta) } },
        };
      }),
    logCall: ({ lead_id = null, call_result, call_notes = "" }) =>
      setState((s) => {
        const now = new Date().toISOString();
        const key = todayKey();
        const current = s.goals[key] ?? { date: key, goal_amount: s.settings.default_goal, calls_made: 0 };
        const call: CallLog = {
          id: crypto.randomUUID(),
          lead_id,
          call_result,
          call_notes,
          call_date: now,
          created_at: now,
        };
        return {
          ...s,
          calls: [call, ...s.calls],
          goals: { ...s.goals, [key]: { ...current, calls_made: current.calls_made + 1 } },
          leads: lead_id
            ? s.leads.map((l) => (l.id === lead_id ? { ...l, last_contacted_at: now, updated_at: now } : l))
            : s.leads,
        };
      }),
    saveLead: (lead) => {
      const now = new Date().toISOString();
      const newLead: Lead = {
        id: crypto.randomUUID(),
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
      return newLead;
    },
    updateLead: (id, patch) =>
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) =>
          l.id === id ? { ...l, ...patch, updated_at: new Date().toISOString() } : l,
        ),
      })),
    deleteLead: (id) =>
      setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== id) })),
    archiveLead: (id) =>
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) =>
          l.id === id
            ? {
                ...l,
                archived: true,
                archived_at: new Date().toISOString(),
                pipeline_status: "archived",
                updated_at: new Date().toISOString(),
              }
            : l,
        ),
      })),
    restoreLead: (id) =>
      setState((s) => ({
        ...s,
        leads: s.leads.map((l) =>
          l.id === id
            ? { ...l, archived: false, archived_at: null, pipeline_status: "call_back", updated_at: new Date().toISOString() }
            : l,
        ),
      })),
    setTheme: (theme) => setState((s) => ({ ...s, settings: { ...s.settings, theme } })),
    setDefaultGoal: (n) => setState((s) => ({ ...s, settings: { ...s.settings, default_goal: Math.max(1, n) } })),
    setApiKey: (k) => setState((s) => ({ ...s, settings: { ...s.settings, google_places_api_key: k } })),
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

// Map a call result -> pipeline status (used when saving lead)
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

export function parseGmbLink(url: string): Partial<Lead> {
  // Best-effort name extraction from Google Maps URL: /place/<Name>/...
  const out: Partial<Lead> = { google_maps_url: url };
  try {
    const m = url.match(/\/place\/([^/]+)/);
    if (m) {
      out.business_name = decodeURIComponent(m[1]).replace(/\+/g, " ");
    }
  } catch {
    /* ignore */
  }
  return out;
}
