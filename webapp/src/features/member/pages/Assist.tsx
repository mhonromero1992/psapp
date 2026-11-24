import { useMemo, useState } from "react";
import { AirplaneTilt, CheckCircle, Gavel, House, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { date } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import type { AssistRequest } from "@/data/types";
import { useDB } from "@/store/db";
import { useCurrentMember, useSimulatedLoad } from "@/store/hooks";
import { Button, ButtonLink } from "@/components/ui/Button";
import { RadioCards } from "@/components/ui/Choice";
import { Sheet } from "@/components/ui/Dialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { CardNote, FieldError, GroupLabel, MField } from "../parts/Form";
import { HelpLink } from "../parts/Help";
import { Empty, LoadError, PageHead, PageSkeleton, SectionHead, StatusBadge, WRAP_BTN } from "../parts/Page";
import { ASSIST_STATUS, assistText, nowMs } from "../parts/text";

type Kind = AssistRequest["kind"];

const TOPICS: Record<Kind, [string, string][]> = {
  legal: [
    ["Help with an administrative case", "Tulong sa administrative case"],
    ["Help with a case connected to my duty", "Tulong sa kasong may kinalaman sa tungkulin"],
    ["Affidavits and notarized papers", "Affidavit at mga papel na kailangang notaryo"],
    ["Family or property matter", "Usaping pampamilya o ari-arian"],
    ["Something else", "Iba pa"],
  ],
  travel: [
    ["Travel to a court hearing", "Biyahe papunta sa court hearing"],
    ["Official mission or new assignment", "Opisyal na misyon o bagong assignment"],
    ["Emergency family travel", "Biyahe dahil sa emergency ng pamilya"],
    ["Something else", "Iba pa"],
  ],
};
const TOPIC_FIL = Object.fromEntries([...TOPICS.legal, ...TOPICS.travel]);

const localDay = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Assist() {
  const t = useT();
  const member = useCurrentMember();
  const all = useDB((s) => s.assist);
  const load = useSimulatedLoad();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<Kind | "">("");
  const requests = useMemo(() => all.filter((a) => a.memberId === member.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [all, member.id]);

  const start = (k: Kind | "") => {
    setPreset(k);
    setOpen(true);
  };

  const requestsSection = (
    <section aria-labelledby="requests-title">
      <SectionHead id="requests-title" title={t("Your requests", "Ang iyong mga request")} count={requests.length} />
      {requests.length === 0 ? (
        <div className="rounded-lg bg-surface shadow-e1">
          <Empty title={t("No requests yet", "Wala pang request")} body={t("When you ask for legal or travel help, you can follow it here.", "Kapag humingi ka ng legal o travel na tulong, masusubaybayan mo ito rito.")} helpTopic="Something else" />
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <RequestCard r={r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
  const servicesSection = (
    <section aria-label={t("What the desk can help with", "Ano ang maitutulong ng desk")} className="grid gap-3 md:grid-cols-2">
      <ServiceCard
        icon={<Gavel size="1.9rem" weight="duotone" aria-hidden />}
        title={t("Legal assistance", "Legal assistance")}
        body={t("Advice and help with cases connected with your duty, administrative cases, affidavits and other legal papers.", "Payo at tulong sa mga kasong may kinalaman sa tungkulin, administrative case, affidavit at iba pang legal na papel.")}
        examples={TOPICS.legal.slice(0, 3)}
        onPick={() => start("legal")}
        pickLabel={t("Ask for legal help", "Humingi ng legal na tulong")}
      />
      <ServiceCard
        icon={<AirplaneTilt size="1.9rem" weight="duotone" aria-hidden />}
        title={t("Travel assistance", "Travel assistance")}
        body={t("Help with travel for court hearings, official missions and family emergencies, including bookings.", "Tulong sa biyahe para sa court hearing, opisyal na misyon at emergency ng pamilya, kasama ang booking.")}
        examples={TOPICS.travel.slice(0, 3)}
        onPick={() => start("travel")}
        pickLabel={t("Ask for travel help", "Humingi ng tulong sa biyahe")}
      />
    </section>
  );

  return (
    <div>
      <PageHead
        title={t("Legal & Travel Assistance", "Legal at Travel Assistance")}
        helper={t("Help from PSMBFI's Legal & Travel Desk. Since 29 Sept 2026 it is part of this app, so you use the same login.", "Tulong mula sa Legal & Travel Desk ng PSMBFI. Mula 29 Set 2026, bahagi na ito ng app na ito kaya pareho ang iyong login.")}
        action={
          <Button size="lg" icon={<PaperPlaneTilt size="1.25rem" weight="bold" />} onClick={() => start("")}>
            {t("Request assistance", "Humingi ng tulong")}
          </Button>
        }
      />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Something else" />
      ) : load.loading ? (
        <PageSkeleton shape="cards" />
      ) : (
        <div className="flex flex-col gap-10">
          {/* An open request is what a returning member checks first; otherwise the services lead. */}
          {requests.length > 0 ? (
            <>
              {requestsSection}
              {servicesSection}
            </>
          ) : (
            <>
              {servicesSection}
              {requestsSection}
            </>
          )}
          <HelpLink topic="Something else" />
        </div>
      )}

      <RequestSheet open={open} onOpenChange={setOpen} preset={preset} />
    </div>
  );
}

function ServiceCard({ icon, title, body, examples, onPick, pickLabel }: { icon: React.ReactNode; title: string; body: string; examples: [string, string][]; onPick: () => void; pickLabel: string }) {
  const t = useT();
  return (
    <article className="flex h-full flex-col rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
      <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">{icon}</span>
      <h2 className="mt-4 font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{title}</h2>
      <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-2">{body}</p>
      <p className="mt-4 text-[1rem] font-semibold text-ink">{t("For example", "Halimbawa")}</p>
      <ul className="mt-1.5 space-y-1.5">
        {examples.map(([en, fil]) => (
          <li key={en} className="flex items-start gap-2 text-[1rem] text-ink-2">
            <CheckCircle size="1.15rem" weight="fill" className="mt-0.5 shrink-0 text-positive" aria-hidden />
            {t(en, fil)}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <Button variant="quiet" size="lg" block className={WRAP_BTN} onClick={onPick}>
          {pickLabel}
        </Button>
      </div>
    </article>
  );
}

function RequestCard({ r }: { r: AssistRequest }) {
  const t = useT();
  const lang = useLang();
  const s = ASSIST_STATUS[r.status];
  const I = r.kind === "travel" ? AirplaneTilt : Gavel;
  const topic = lang === "fil" ? TOPIC_FIL[r.topic] ?? assistText(r.topic, lang) : r.topic;
  return (
    <article className="rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sunken text-ink-2">
          <I size="1.5rem" weight="duotone" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h3 className="text-[1.125rem] font-bold leading-snug text-ink">{topic}</h3>
            <StatusBadge tone={s.tone}>{t(s.en, s.fil)}</StatusBadge>
          </div>
          <p className="mt-0.5 text-[0.9375rem] text-ink-2 tnum">
            {r.id} · {r.kind === "legal" ? t("Legal", "Legal") : t("Travel", "Travel")} · {t(`sent ${date(r.createdAt)}`, `ipinadala ${date(r.createdAt)}`)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink">{assistText(r.details, lang)}</p>
      {r.nextStep && (
        <div className="mt-4 rounded-md bg-sunken px-4 py-3">
          <p className="text-[0.9375rem] font-semibold text-ink-2">{t("Next step", "Susunod na hakbang")}</p>
          <p className="mt-0.5 text-[1.0625rem] leading-relaxed text-ink">{assistText(r.nextStep, lang)}</p>
        </div>
      )}
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[1rem] text-ink-2">
        {r.preferredDate && <span>{t(`Preferred date: ${date(r.preferredDate)}`, `Gustong petsa: ${date(r.preferredDate)}`)}</span>}
        <span>{r.handler ? t(`Handled by: ${assistText(r.handler, lang)}`, `Humahawak: ${assistText(r.handler, lang)}`) : t("Waiting for a handler", "Hinihintay ang hahawak")}</span>
      </p>
    </article>
  );
}

function RequestSheet({ open, onOpenChange, preset }: { open: boolean; onOpenChange: (v: boolean) => void; preset: Kind | "" }) {
  const t = useT();
  const lang = useLang();
  const member = useCurrentMember();
  const createAssist = useDB((s) => s.createAssist);
  const today = localDay(nowMs());
  const [kind, setKind] = useState<Kind | "">(preset);
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [when, setWhen] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"kind" | "topic" | "details" | "when", string>>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<AssistRequest | null>(null);
  const [lastPreset, setLastPreset] = useState(preset);

  // Opening from a service card preselects its kind.
  if (preset !== lastPreset) {
    setLastPreset(preset);
    setKind(preset);
    setTopic("");
  }

  const reset = () => {
    setKind("");
    setTopic("");
    setDetails("");
    setWhen("");
    setErrors({});
    setSent(null);
    setLastPreset("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!kind) errs.kind = t("Choose legal or travel help.", "Piliin kung legal o travel na tulong.");
    if (!topic) errs.topic = t("Choose what it is about.", "Piliin kung tungkol saan.");
    if (details.trim().length < 15) errs.details = t("Tell us a little more (at least 15 letters) so the right person calls you.", "Magkuwento pa nang kaunti (hindi bababa sa 15 letra) para tamang tao ang tumawag sa iyo.");
    if (when && when < today) errs.when = t("Choose today or a later date.", "Pumili ng petsa ngayon o sa susunod.");
    setErrors(errs);
    if (Object.keys(errs).length || !kind) return;
    setBusy(true);
    window.setTimeout(() => {
      const req = createAssist({ memberId: member.id, kind, topic, details: details.trim(), preferredDate: when || null });
      setBusy(false);
      setSent(req);
      toast.success(t("Request sent", "Naipadala ang request"), { description: req.id });
    }, 800);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) window.setTimeout(reset, 300);
      }}
      title={sent ? t("Request sent", "Naipadala ang request") : t("Request assistance", "Humingi ng tulong")}
      footer={
        sent ? undefined : (
          <>
            <Button variant="quiet" size="lg" className={WRAP_BTN} onClick={() => onOpenChange(false)}>
              {t("Cancel", "Kanselahin")}
            </Button>
            <Button size="lg" className={WRAP_BTN} type="submit" form="assist-form" loading={busy} loadingLabel={t("Sending", "Ipinapadala")} icon={<PaperPlaneTilt size="1.2rem" weight="bold" />}>
              {t("Send request", "Ipadala ang request")}
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div role="status" className="pb-2">
          <span className="grid size-14 place-items-center rounded-full bg-positive-soft text-positive">
            <CheckCircle size="2rem" weight="fill" aria-hidden />
          </span>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink">{t("We received your request.", "Natanggap namin ang iyong request.")}</p>
          <div className="mt-4 rounded-lg bg-sunken p-4">
            <p className="text-[0.9375rem] font-semibold text-ink-2">{t("Your reference number", "Ang iyong reference number")}</p>
            <p className="mt-1 font-display text-[1.6rem] font-bold leading-tight tnum [font-stretch:90%]">{sent.id}</p>
          </div>
          <h3 className="mt-6 text-[1.125rem] font-bold">{t("What happens next", "Ano ang susunod")}</h3>
          <p className="mt-1.5 text-[1.0625rem] leading-relaxed text-ink-2">{sent.nextStep ? assistText(sent.nextStep, lang) : ""}</p>
          <div className="mt-6 flex flex-col gap-3 [&>*]:h-auto [&>*]:min-h-[var(--btn-h)] [&>*]:whitespace-normal [&>*]:py-2.5">
            <ButtonLink to="/member" size="lg" icon={<House size="1.25rem" weight="bold" />} onClick={() => onOpenChange(false)}>
              {t("Back to Home", "Bumalik sa Home")}
            </ButtonLink>
            <Button variant="quiet" size="lg" onClick={() => onOpenChange(false)}>
              {t("Done", "Tapos na")}
            </Button>
          </div>
        </div>
      ) : (
        <form id="assist-form" onSubmit={submit} noValidate className="space-y-5">
          <div>
            <GroupLabel>{t("What do you need?", "Ano ang kailangan mo?")}</GroupLabel>
            <RadioCards
              ariaLabel={t("What do you need?", "Ano ang kailangan mo?")}
              value={kind}
              onValueChange={(v) => {
                setKind(v);
                setTopic("");
                setErrors((x) => ({ ...x, kind: undefined }));
              }}
              options={[
                { value: "legal", icon: <Gavel size="1.5rem" weight="duotone" />, label: <span className="text-[1.0625rem]">{t("Legal assistance", "Legal assistance")}</span>, description: <CardNote>{t("Cases, affidavits, legal papers", "Kaso, affidavit, legal na papel")}</CardNote> },
                { value: "travel", icon: <AirplaneTilt size="1.5rem" weight="duotone" />, label: <span className="text-[1.0625rem]">{t("Travel assistance", "Travel assistance")}</span>, description: <CardNote>{t("Hearings, missions, emergencies", "Hearing, misyon, emergency")}</CardNote> },
              ]}
            />
            {errors.kind && <div className="mt-2"><FieldError>{errors.kind}</FieldError></div>}
          </div>
          <MField label={t("What is it about?", "Tungkol saan?")} error={errors.topic}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} value={topic} onChange={(e) => setTopic(e.target.value)} aria-describedby={describedBy} invalid={invalid} disabled={!kind} className="text-[1.0625rem]">
                <option value="">{kind ? t("Choose one", "Pumili ng isa") : t("Choose legal or travel first", "Piliin muna kung legal o travel")}</option>
                {(kind ? TOPICS[kind] : []).map(([en, fil]) => (
                  <option key={en} value={en}>
                    {t(en, fil)}
                  </option>
                ))}
              </Select>
            )}
          </MField>
          <MField label={t("Tell us what happened or what you need", "Ikuwento ang nangyari o ang kailangan mo")} error={errors.details} hint={t("Include the place and date of a hearing if there is one.", "Isama ang lugar at petsa ng hearing kung mayroon.")}>
            {({ id, describedBy, invalid }) => <Textarea id={id} rows={4} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.0625rem]" />}
          </MField>
          <MField label={t("Preferred date", "Gustong petsa")} optional error={errors.when} hint={t("When you need the help, for example the day you travel.", "Kailan mo kailangan ang tulong, halimbawa ang araw ng biyahe.")}>
            {({ id, describedBy, invalid }) => <Input id={id} type="date" min={today} value={when} onChange={(e) => setWhen(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.0625rem]" />}
          </MField>
        </form>
      )}
    </Sheet>
  );
}
