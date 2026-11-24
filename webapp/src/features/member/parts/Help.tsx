import { createContext, useContext, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Lifebuoy, MapPin, PhoneCall, Lightbulb } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";
import { Sheet } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { RadioCards } from "@/components/ui/Choice";
import { useDB } from "@/store/db";
import { useCurrentMember } from "@/store/hooks";
import { useSession } from "@/store/session";
import { OFFICE_BY_ID } from "@/data/reference";

/**
 * Help is always one tap away. Most members are older, so the first option is a
 * person: request a call back. Then the member's own branch, then short tips.
 */
const HelpCtx = createContext<(topic?: string) => void>(() => {});

export function useHelp() {
  return useContext(HelpCtx);
}

const TOPICS = [
  ["Loans", "Loans"],
  ["Claims", "Claims"],
  ["Equity Value and contributions", "Equity Value at kontribusyon"],
  ["Payouts", "Payouts"],
  ["Signing in or my PIN", "Pag-sign in o PIN"],
  ["Something else", "Iba pa"],
] as const;

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<string>(TOPICS[0][0]);
  return (
    <HelpCtx.Provider
      value={(t) => {
        if (t) setTopic(t);
        setOpen(true);
      }}
    >
      {children}
      <HelpSheet open={open} onOpenChange={setOpen} topic={topic} setTopic={setTopic} />
    </HelpCtx.Provider>
  );
}

/** A plain-text link that opens Help; put it at the end of flows. */
export function HelpLink({ topic, className }: { topic?: string; className?: string }) {
  const t = useT();
  const open = useHelp();
  return (
    <button type="button" onClick={() => open(topic)} className={`inline-flex min-h-12 items-center gap-2 rounded-sm px-1 text-[1rem] font-semibold text-primary ${className ?? ""}`}>
      <Lifebuoy size={22} weight="duotone" aria-hidden />
      <span className="underline decoration-[1.5px] underline-offset-4">{t("Need help? Ask us to call you", "Kailangan ng tulong? Tatawagan ka namin")}</span>
    </button>
  );
}

function HelpSheet({ open, onOpenChange, topic, setTopic }: { open: boolean; onOpenChange: (v: boolean) => void; topic: string; setTopic: (t: string) => void }) {
  const t = useT();
  const signedIn = !!useSession((s) => s.user);
  const fallback = useCurrentMember();
  const member = signedIn ? fallback : null;
  const requestCallback = useDB((s) => s.requestCallback);
  const office = OFFICE_BY_ID[member?.officeId ?? "HO"] ?? OFFICE_BY_ID.HO;
  const [when, setWhen] = useState<"morning" | "afternoon" | "">("");
  const [mobile, setMobile] = useState(member?.mobile ?? "");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<{ when?: string; mobile?: string; name?: string }>({});
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!when) errs.when = t("Choose a time for our call.", "Pumili ng oras para sa tawag.");
    if (!member && name.trim().length < 3) errs.name = t("Enter your full name.", "Ilagay ang iyong buong pangalan.");
    if (mobile.replace(/\D/g, "").length !== 11) errs.mobile = t("Enter an 11-digit mobile number, like 0917 123 4567.", "Ilagay ang 11-digit na mobile number, gaya ng 0917 123 4567.");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    window.setTimeout(() => {
      const whenLabel = when === "morning" ? t("Tomorrow morning", "Bukas ng umaga") : t("This afternoon", "Mamayang hapon");
      requestCallback({ memberId: member?.id ?? null, name: member ? `${member.firstName} ${member.lastName}` : name.trim(), mobile, topic, when: whenLabel });
      setBusy(false);
      setSent(whenLabel);
      toast.success(t("Call back requested", "Na-request na ang tawag"), { description: `${whenLabel} · ${mobile}` });
    }, 700);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) window.setTimeout(() => { setSent(null); setWhen(""); setErrors({}); }, 300);
      }}
      title={t("Need help?", "Kailangan ng tulong?")}
      description={t("We can call you, or you can visit your branch.", "Maaari ka naming tawagan, o bumisita sa iyong sangay.")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="rounded-lg bg-positive-soft p-5" role="status">
            <CheckCircle size={36} weight="fill" className="text-positive" aria-hidden />
            <p className="mt-3 font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{t("We'll call you", "Tatawagan ka namin")}</p>
            <p className="mt-2 text-[1rem] leading-relaxed text-ink">
              {sent}, {t("on", "sa")} <span className="font-semibold tnum">{mobile}</span>. {t("A PSMBFI member services officer will call about", "Tatawag ang isang member services officer ng PSMBFI tungkol sa")} {topic.toLowerCase()}.
            </p>
            <Button variant="quiet" size="lg" block className="mt-5" onClick={() => onOpenChange(false)}>
              {t("Close", "Isara")}
            </Button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <section aria-labelledby="help-call">
              <h3 id="help-call" className="flex items-center gap-2.5 text-[1.15rem] font-bold [font-stretch:92%]">
                <PhoneCall size={24} weight="duotone" className="text-primary" aria-hidden />
                {t("Ask us to call you", "Hilingin na tawagan ka")}
              </h3>
              <form onSubmit={submit} noValidate className="mt-4 space-y-4">
                <Field label={t("What is it about?", "Tungkol saan?")}>
                  {({ id }) => (
                    <Select id={id} value={topic} onChange={(e) => setTopic(e.target.value)} className="text-[1rem]">
                      {TOPICS.map(([en, fil]) => (
                        <option key={en} value={en}>
                          {t(en, fil)}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <div>
                  <p className="mb-2 text-[0.95rem] font-semibold">{t("When should we call?", "Kailan ka namin tatawagan?")}</p>
                  <RadioCards
                    ariaLabel={t("When should we call?", "Kailan ka namin tatawagan?")}
                    value={when}
                    onValueChange={(v) => setWhen(v)}
                    columns={2}
                    options={[
                      { value: "afternoon", label: t("This afternoon", "Mamayang hapon"), description: "1:00 to 5:00 PM" },
                      { value: "morning", label: t("Tomorrow morning", "Bukas ng umaga"), description: "8:00 AM to 12:00 NN" },
                    ]}
                  />
                  {errors.when && <p className="mt-2 text-[0.9rem] font-medium text-negative" role="alert">{errors.when}</p>}
                </div>
                {!member && (
                  <Field label={t("Your full name", "Iyong buong pangalan")} error={errors.name}>
                    {({ id, describedBy, invalid }) => <Input id={id} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.05rem]" />}
                  </Field>
                )}
                <Field label={t("Mobile number", "Mobile number")} error={errors.mobile}>
                  {({ id, describedBy, invalid }) => <Input id={id} inputMode="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} aria-describedby={describedBy} invalid={invalid} className="text-[1.05rem] tnum" />}
                </Field>
                <Button type="submit" size="lg" block loading={busy} loadingLabel={t("Sending", "Ipinapadala")} icon={<PhoneCall size={20} weight="bold" />}>
                  {t("Request a call back", "Humiling ng tawag")}
                </Button>
              </form>
            </section>

            <section aria-labelledby="help-branch" className="mt-8">
              <h3 id="help-branch" className="flex items-center gap-2.5 text-[1.15rem] font-bold [font-stretch:92%]">
                <MapPin size={24} weight="duotone" className="text-primary" aria-hidden />
                {member ? t("Visit your branch", "Bumisita sa iyong sangay") : t("Visit the head office", "Bumisita sa head office")}
              </h3>
              <div className="mt-3 rounded-lg bg-sunken p-4">
                <p className="font-semibold">{office.name}</p>
                <p className="mt-1 text-ink-2">{office.street}, {office.city}</p>
                <p className="mt-1 text-ink-2">{office.hours}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                  <a className="link inline-flex min-h-11 items-center" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.street}, ${office.city}`)}`} target="_blank" rel="noopener noreferrer">
                    {t("Get directions", "Paano pumunta")}
                  </a>
                  {member && (
                    <Link className="link inline-flex min-h-11 items-center" to="/member/branches" onClick={() => onOpenChange(false)}>
                      {t("See all branches", "Tingnan lahat ng sangay")}
                    </Link>
                  )}
                </div>
              </div>
            </section>

            <section aria-labelledby="help-tips" className="mt-8 pb-2">
              <h3 id="help-tips" className="flex items-center gap-2.5 text-[1.15rem] font-bold [font-stretch:92%]">
                <Lightbulb size={24} weight="duotone" className="text-primary" aria-hidden />
                {t("Tips", "Mga tip")}
              </h3>
              <ul className="mt-3 space-y-2.5 text-[1rem] leading-relaxed text-ink-2">
                <li>{t("Make the words bigger in My profile, under Text size.", "Palakihin ang mga letra sa Aking profile, sa Laki ng letra.")}</li>
                <li>{t("Sign in with your fingerprint so you don't need to type your PIN.", "Mag-sign in gamit ang fingerprint para hindi na mag-type ng PIN.")}</li>
                <li>{t("Tap FIL at the top to read the app in Filipino.", "I-tap ang EN sa itaas para basahin ang app sa English.")}</li>
              </ul>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}
