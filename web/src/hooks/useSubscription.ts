import { useEffect, useState, useCallback } from "react";

export type Plan = "free" | "premium";

export interface SubscriptionState {
  plan: Plan;
  startedAt: string | null;
  renewsAt: string | null;
}

interface DailyMessageState {
  date: string;
  count: number;
}

const PLAN_KEY = "letsdate.subscription";
const MESSAGES_KEY = "letsdate.dailyMessages";
export const FREE_DAILY_MESSAGE_LIMIT = 5;

function readPlan(): SubscriptionState {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.plan === "free" || parsed.plan === "premium")) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  return { plan: "free", startedAt: null, renewsAt: null };
}

function writePlan(state: SubscriptionState) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(state));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readDaily(): DailyMessageState {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyMessageState;
      if (parsed.date === todayKey()) return parsed;
    }
  } catch {
    /* ignore */
  }
  return { date: todayKey(), count: 0 };
}

function writeDaily(state: DailyMessageState) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(state));
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(() => readPlan());
  const [daily, setDaily] = useState<DailyMessageState>(() => readDaily());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PLAN_KEY) setState(readPlan());
      if (e.key === MESSAGES_KEY) setDaily(readDaily());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const subscribe = useCallback(() => {
    const now = new Date();
    const renews = new Date(now);
    renews.setMonth(renews.getMonth() + 1);
    const next: SubscriptionState = {
      plan: "premium",
      startedAt: now.toISOString(),
      renewsAt: renews.toISOString(),
    };
    writePlan(next);
    setState(next);
  }, []);

  const cancel = useCallback(() => {
    const next: SubscriptionState = { plan: "free", startedAt: null, renewsAt: null };
    writePlan(next);
    setState(next);
  }, []);

  const isPremium = state.plan === "premium";
  const todays = daily.date === todayKey() ? daily : { date: todayKey(), count: 0 };
  const messagesUsedToday = todays.count;
  const messagesLeftToday = isPremium
    ? Infinity
    : Math.max(0, FREE_DAILY_MESSAGE_LIMIT - messagesUsedToday);
  const canSendMessage = isPremium || messagesUsedToday < FREE_DAILY_MESSAGE_LIMIT;

  const recordMessage = useCallback(() => {
    const current = readDaily();
    const next: DailyMessageState = {
      date: todayKey(),
      count: current.date === todayKey() ? current.count + 1 : 1,
    };
    writeDaily(next);
    setDaily(next);
  }, []);

  return {
    state,
    isPremium,
    subscribe,
    cancel,
    messagesUsedToday,
    messagesLeftToday,
    canSendMessage,
    recordMessage,
    freeDailyLimit: FREE_DAILY_MESSAGE_LIMIT,
  };
}
