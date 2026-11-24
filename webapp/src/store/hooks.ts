import { useEffect, useMemo, useState } from "react";
import { useDB } from "./db";
import { useSession } from "./session";
import { coverageFor, contributionsFor, equityFor } from "@/data/generate";
import type { AppNotification, Member } from "@/data/types";

/* Selector hooks. Each selects a stable slice, then derives with useMemo. */

export function useMember(id: string | undefined): Member | undefined {
  const members = useDB((s) => s.members);
  return useMemo(() => members.find((m) => m.id === id), [members, id]);
}

/** The signed-in member (falls back to the demo member so previews never crash). */
export function useCurrentMember(): Member {
  const user = useSession((s) => s.user);
  const members = useDB((s) => s.members);
  return useMemo(() => members.find((m) => m.id === (user?.scope ?? "PSM-2012-004512")) ?? members.find((m) => m.id === "PSM-2012-004512")!, [members, user]);
}

export function useLoansFor(memberId: string) {
  const loans = useDB((s) => s.loans);
  return useMemo(() => loans.filter((l) => l.memberId === memberId), [loans, memberId]);
}

export function useClaimsFor(memberId: string) {
  const claims = useDB((s) => s.claims);
  return useMemo(() => claims.filter((c) => c.memberId === memberId), [claims, memberId]);
}

export function usePayoutsFor(memberId: string) {
  const payouts = useDB((s) => s.payouts);
  return useMemo(() => payouts.filter((p) => p.memberId === memberId), [payouts, memberId]);
}

export function useNotificationsFor(audience: AppNotification["audience"], targetId: string) {
  const notifications = useDB((s) => s.notifications);
  return useMemo(() => notifications.filter((n) => n.audience === audience && n.targetId === targetId), [notifications, audience, targetId]);
}

export function useEquity(member: Member | undefined) {
  return useMemo(() => (member ? equityFor(member) : null), [member]);
}
export function useContributions(member: Member | undefined) {
  return useMemo(() => (member ? contributionsFor(member) : []), [member]);
}
export function useCoverage(member: Member | undefined) {
  return useMemo(() => (member ? coverageFor(member) : []), [member]);
}

/**
 * Simulated network state so every data view shows its loading state, and its error
 * state when the URL carries ?demo=error (R-27). Resolves after `ms`.
 */
export function useSimulatedLoad(ms = 450) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    setState("loading");
    const wantsError = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "error" && nonce === 0;
    const t = window.setTimeout(() => setState(wantsError ? "error" : "ready"), ms);
    return () => window.clearTimeout(t);
  }, [ms, nonce]);
  return { loading: state === "loading", error: state === "error", ready: state === "ready", retry: () => setNonce((n) => n + 1) };
}
