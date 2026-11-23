import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bank, Bell, Gavel, House, Lifebuoy, MapPin, PiggyBank, Question, Receipt, SignOut, SquaresFour, UserCircle, Wallet } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import { Lockup } from "@/components/brand/Emblem";
import { Avatar } from "@/components/ui/Avatar";
import { LangToggle, TextSizeControl, ThemeToggle } from "@/components/layout/Toggles";
import { HelpProvider, useHelp } from "./parts/Help";
import { DemoPanel } from "./parts/DemoPanel";
import { Switch } from "@/components/ui/Choice";
import { usePrefs } from "@/store/prefs";
import { SampleDataBadge } from "@/components/layout/SampleData";
import { PageFade } from "@/components/motion/PageFade";
import { useBladeNavigate } from "@/components/motion/BladeWipe";
import { useCurrentMember, useNotificationsFor } from "@/store/hooks";
import { useSession } from "@/store/session";

export interface MemberNavItem {
  to: string;
  en: string;
  fil: string;
  icon: Icon;
  end?: boolean;
}

export const MEMBER_NAV: MemberNavItem[] = [
  { to: "/member", en: "Home", fil: "Home", icon: House, end: true },
  { to: "/member/equity", en: "Equity Value", fil: "Equity Value", icon: PiggyBank },
  { to: "/member/loans", en: "Loans", fil: "Loans", icon: Bank },
  { to: "/member/claims", en: "Claims", fil: "Claims", icon: Lifebuoy },
  { to: "/member/payouts", en: "Payouts", fil: "Payouts", icon: Wallet },
  { to: "/member/assist", en: "Legal & Travel", fil: "Legal at Travel", icon: Gavel },
  { to: "/member/branches", en: "Branches", fil: "Mga sangay", icon: MapPin },
  { to: "/member/profile", en: "My profile", fil: "Aking profile", icon: UserCircle },
];

const TABS: MemberNavItem[] = [
  MEMBER_NAV[0],
  { ...MEMBER_NAV[1], en: "Equity", fil: "Equity" },
  MEMBER_NAV[2],
  MEMBER_NAV[3],
  { to: "/member/more", en: "More", fil: "Iba pa", icon: SquaresFour },
];

export function MemberShell() {
  return (
    <HelpProvider>
      <MemberShellInner />
    </HelpProvider>
  );
}

function HelpButton({ className }: { className?: string }) {
  const t = useT();
  const open = useHelp();
  return (
    <button type="button" onClick={() => open()} className={cn("btn btn-tonal btn-sm gap-1.5 px-3", className)}>
      <span className="btn-label inline-flex items-center gap-[inherit]">
        <Question size={20} weight="bold" aria-hidden />
        {t("Help", "Tulong")}
      </span>
    </button>
  );
}

function MemberShellInner() {
  const t = useT();
  const textSize = usePrefs((s) => s.textSize);
  const member = useCurrentMember();
  const notes = useNotificationsFor("member", member.id);
  const unread = notes.filter((n) => !n.read).length;
  const signOut = useSession((s) => s.signOut);
  const wipe = useBladeNavigate();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const name = `${member.firstName} ${member.lastName}`;

  return (
    <div className="min-h-dvh bg-bg">
      <a href="#main" className="skip-link">{t("Skip to content", "Lumaktaw sa nilalaman")}</a>

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-surface px-4 pb-5 pt-5 shadow-e1 lg:flex">
        <Lockup to="/member" />
        <nav aria-label={t("Member portal", "Member portal")} className="mt-8 flex flex-col gap-0.5">
          {MEMBER_NAV.map((item) => (
            <RailLink key={item.to} item={item} label={t(item.en, item.fil)} />
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.85rem] font-semibold text-ink-2">{t("Theme", "Tema")}</span>
            <ThemeToggle />
          </div>
          <button type="button" onClick={() => { signOut(); wipe("/"); }} className="btn btn-ghost btn-sm w-full justify-start">
            <span className="btn-label inline-flex items-center gap-[inherit]"><SignOut size={17} weight="bold" /> {t("Sign out", "Mag-sign out")}</span>
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-bg/85 pt-[var(--safe-top)] backdrop-blur-md lg:ml-[264px] lg:bg-bg/80">
        <div className="mx-auto flex h-[4.25rem] max-w-[1100px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <div className="lg:hidden">
            <Lockup to="/member" compact wordmark={textSize === "standard"} />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <SampleDataBadge className="hidden md:inline-flex" />
            <div className="hidden sm:block"><LangToggle /></div>
            <HelpButton />
            <button
              type="button"
              onClick={() => navigate("/member/notifications")}
              className="btn btn-ghost btn-icon relative"
              aria-label={unread ? t(`Notifications, ${unread} unread`, `Mga abiso, ${unread} hindi pa nababasa`) : t("Notifications", "Mga abiso")}
            >
              <span className="btn-label"><Bell size={24} weight={pathname.startsWith("/member/notifications") ? "fill" : "regular"} /></span>
              {unread > 0 && <span aria-hidden className="absolute right-2 top-2 grid size-[18px] place-items-center rounded-full bg-red-700 text-[0.66rem] font-bold text-white ring-2 ring-bg tnum">{unread}</span>}
            </button>
            <NavLink to="/member/profile" aria-label={t("My profile", "Aking profile")} className="rounded-full">
              <Avatar name={name} size={40} />
            </NavLink>
          </div>
        </div>
      </header>

      <main id="main" className="lg:ml-[264px]">
        <div className="mx-auto max-w-[1100px] px-4 pb-[calc(8rem+var(--safe-bottom))] pt-2 sm:px-6 lg:px-10 lg:pb-16">
          <PageFade>
            <Outlet />
          </PageFade>
        </div>
      </main>

      <DemoPanel />

      {/* Phone tab bar: floating glass */}
      <nav aria-label={t("Main", "Pangunahin")} className="fixed inset-x-3 bottom-[calc(0.75rem+var(--safe-bottom))] z-30 lg:hidden">
        <ul className="glass mx-auto flex max-w-lg items-stretch justify-between rounded-[24px] p-1.5">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <TabLink item={tab} label={t(tab.en, tab.fil)} />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function RailLink({ item, label }: { item: MemberNavItem; label: string }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn("group relative flex h-12 items-center gap-3 rounded-[12px] px-3 text-[1rem] font-semibold transition-colors duration-200", isActive ? "text-ink" : "text-ink-2 hover:bg-sunken hover:text-ink")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="member-rail" transition={SPRING} className="absolute inset-0 rounded-[12px] bg-primary-soft" />}
          <Icon size={22} weight={isActive ? "duotone" : "regular"} className={cn("relative", isActive && "text-primary")} />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function TabLink({ item, label }: { item: MemberNavItem; label: string }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => cn("relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-[18px] text-[0.82rem] font-bold transition-colors duration-200", isActive ? "text-primary" : "text-ink-2")}
    >
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId="member-tab" transition={SPRING} className="absolute inset-0 rounded-[16px] bg-surface/90 shadow-e1 dark:bg-white/10" />}
          <Icon size={25} weight={isActive ? "duotone" : "regular"} className="relative" />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/** Mobile "More" page: the rest of the destinations plus settings. */
export function MemberMore() {
  const t = useT();
  const signOut = useSession((s) => s.signOut);
  const wipe = useBladeNavigate();
  const rest = MEMBER_NAV.slice(4);
  return (
    <div className="pt-2">
      <h1 className="font-display text-[1.9rem] font-extrabold [font-stretch:84%]">{t("More", "Iba pa")}</h1>
      <ul className="mt-5 overflow-hidden rounded-lg bg-surface shadow-e1">
        {[...rest, { to: "/member/notifications", en: "Notifications", fil: "Mga abiso", icon: Bell }, { to: "/member/equity", en: "Contribution statement", fil: "Statement ng kontribusyon", icon: Receipt }].map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.en} className="shadow-[inset_0_-1px_0_var(--line)] last:shadow-none">
              <NavLink to={item.to} className="flex min-h-[3.75rem] items-center gap-3.5 px-4 text-[1.05rem] font-semibold text-ink transition-colors active:bg-sunken">
                <Icon size={26} weight="duotone" className="text-primary" />
                {t(item.en, item.fil)}
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div className="mt-5 space-y-4 rounded-lg bg-surface p-4 shadow-e1">
        <div>
          <p className="mb-2.5 font-semibold">{t("Text size", "Laki ng letra")}</p>
          <TextSizeControl />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{t("Language", "Wika")}</span>
          <LangToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{t("Theme", "Tema")}</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">{t("Data", "Data")}</span>
          <SampleDataBadge />
        </div>
        <PresenterSwitch />
      </div>
      <button type="button" onClick={() => { signOut(); wipe("/"); }} className="btn btn-quiet btn-block mt-5">
        <span className="btn-label inline-flex items-center gap-[inherit]"><SignOut size={18} weight="bold" /> {t("Sign out", "Mag-sign out")}</span>
      </button>
    </div>
  );
}

/** Opt-in presenter tools for demos (simulates PSMBFI processing). */
function PresenterSwitch() {
  const t = useT();
  const on = usePrefs((s) => s.presenter);
  const setOn = usePrefs((s) => s.setPresenter);
  return (
    <Switch
      checked={on}
      onCheckedChange={setOn}
      label={t("Presenter tools", "Presenter tools")}
      description={t("For demos: move a loan or claim to its next step, as PSMBFI would.", "Para sa demo: ilipat ang loan o claim sa susunod na hakbang, gaya ng gagawin ng PSMBFI.")}
    />
  );
}
