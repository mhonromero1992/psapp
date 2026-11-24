import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Bank, CheckCircle, DeviceMobile, FileText, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { date, maskAccount, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { BENEFIT_BY_ID } from "@/data/reference";
import type { Claim, ClaimDocument } from "@/data/types";
import type { PickedFile } from "@/components/ui/FileDrop";
import { useDB } from "@/store/db";
import { useCurrentMember, usePayoutsFor, useSimulatedLoad } from "@/store/hooks";
import { CLAIM_STATUS, type Tone } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useMemberActor } from "../parts/download";
import { BENEFIT_ICON, claimNext, claimUpcoming, incidentLabel } from "../parts/claims";
import { History } from "../parts/Flow";
import { DocUpload } from "../parts/Form";
import { HelpLink } from "../parts/Help";
import { Empty, Fact, LoadError, PageHead, PageSkeleton, StatusBadge, WRAP_BTN } from "../parts/Page";
import { docName, localTimeline } from "../parts/text";
import { StageTracker } from "../parts/Tracker";

const DOC_STATUS: Record<ClaimDocument["status"], { en: string; fil: string; tone: Tone }> = {
  received: { en: "Received", fil: "Natanggap", tone: "info" },
  verified: { en: "Checked", fil: "Na-check na", tone: "positive" },
  reupload: { en: "New copy needed", fil: "Kailangan ng bagong kopya", tone: "caution" },
};
const RELATION_FIL: Record<Claim["claimantRelation"], string> = { Member: "Miyembro", Spouse: "Asawa", Child: "Anak", Parent: "Magulang", Sibling: "Kapatid" };

export default function ClaimDetail() {
  const t = useT();
  const lang = useLang();
  const { id } = useParams();
  const member = useCurrentMember();
  const claims = useDB((s) => s.claims);
  const setClaimDocument = useDB((s) => s.setClaimDocument);
  const payouts = usePayoutsFor(member.id);
  const actor = useMemberActor(member);
  const claim = useMemo(() => claims.find((c) => c.id === id && c.memberId === member.id), [claims, id, member.id]);
  const load = useSimulatedLoad();
  const [replacement, setReplacement] = useState<Record<string, PickedFile[]>>({});
  const [justSent, setJustSent] = useState<string[]>([]);
  const [sending, setSending] = useState<string | null>(null);

  if (load.error) return <Shell><LoadError onRetry={load.retry} helpTopic="Claims" /></Shell>;
  if (load.loading) return <Shell><PageSkeleton shape="cards" /></Shell>;
  if (!claim) {
    return (
      <Shell>
        <div className="rounded-lg bg-surface shadow-e1">
          <Empty
            title={t("We can't find this claim", "Hindi namin makita ang claim na ito")}
            body={t(`There is no claim ${id ?? ""} on your record. Check the claim number and try again.`, `Walang claim na ${id ?? ""} sa iyong record. Pakisuri ang claim number at subukan ulit.`)}
            action={<ButtonLink to="/member/claims" size="lg">{t("Go to my claims", "Pumunta sa aking mga claim")}</ButtonLink>}
            helpTopic="Claims"
          />
        </div>
      </Shell>
    );
  }

  const b = BENEFIT_BY_ID[claim.type];
  const I = BENEFIT_ICON[claim.type];
  const needs = claim.documents.filter((d) => d.status === "reupload");
  // Once every flagged paper is replaced, the claim is back with the documents team.
  const shown: Claim = claim.status === "returned" && needs.length === 0 ? { ...claim, status: "docs_review" } : claim;
  const s = CLAIM_STATUS[shown.status];
  const account = member.payoutAccounts.find((a) => claim.payoutLabel.startsWith(a.provider) && claim.payoutLabel.endsWith(a.accountNo.replace(/\s/g, "").slice(-4)));
  const payout = payouts.find((p) => p.refId === claim.id);
  const returnedNote = [...claim.timeline].reverse().find((e) => e.label === "Returned for missing documents")?.note;

  const send = (doc: ClaimDocument) => {
    const files = replacement[doc.id] ?? [];
    if (!files.length) return;
    setSending(doc.id);
    window.setTimeout(() => {
      setClaimDocument(claim.id, doc.id, "received", actor, files[0].preview);
      setSending(null);
      setJustSent((x) => [...x, doc.id]);
      toast.success(t("New copy sent", "Naipadala ang bagong kopya"), { description: t("We will check it within 2 working days.", "Susuriin namin ito sa loob ng 2 araw ng trabaho.") });
    }, 700);
  };

  return (
    <div>
      <PageHead
        back={{ to: "/member/claims", label: t("Claims", "Mga claim") }}
        lead={
          <span className="flex items-center gap-2.5 text-[1rem] font-semibold text-ink-2">
            <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
              <I size="1.2rem" weight="duotone" aria-hidden />
            </span>
            <span className="tnum">{claim.id}</span>
          </span>
        }
        title={t(b.name, b.nameFil)}
        meta={
          <>
            <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
            <span className="text-[1rem] text-ink-2">{t(`Filed ${date(claim.filedAt)}`, `Isinampa noong ${date(claim.filedAt)}`)}</span>
          </>
        }
      />

      {/* A paper needs a new copy: the one thing to do on this screen */}
      {(needs.length > 0 || justSent.length > 0) && (
        <section aria-labelledby="reupload-title" className={cn("mb-5 rounded-xl p-5 shadow-e1 sm:p-6", needs.length ? "bg-caution-soft" : "bg-positive-soft")}>
          {needs.length > 0 ? (
            <>
              <h2 id="reupload-title" className="flex items-start gap-2.5 font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">
                <Warning size="1.6rem" weight="fill" className="mt-0.5 shrink-0 text-caution" aria-hidden />
                {t("We need a new copy of a paper", "Kailangan namin ng bagong kopya ng isang papel")}
              </h2>
              {returnedNote && <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink">{localTimeline([{ at: claim.filedAt, label: "", note: returnedNote }], lang)[0].note}</p>}
              <div className="mt-4 space-y-4">
                {needs.map((d) => (
                  <div key={d.id}>
                    <DocUpload label={docName(d.name, lang)} hint={t("Take a new, clear photo in good light.", "Kumuha ng bago at malinaw na litrato sa maliwanag na lugar.")} files={replacement[d.id] ?? []} multiple={false} onChange={(f) => setReplacement((r) => ({ ...r, [d.id]: f }))} />
                    <Button size="lg" block className={`mt-3 ${WRAP_BTN}`} disabled={!(replacement[d.id]?.length)} loading={sending === d.id} loadingLabel={t("Sending", "Ipinapadala")} onClick={() => send(d)} icon={<PaperPlaneTilt size="1.2rem" weight="bold" />}>
                      {t("Send the new copy", "Ipadala ang bagong kopya")}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div role="status">
              <h2 id="reupload-title" className="flex items-start gap-2.5 font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">
                <CheckCircle size="1.6rem" weight="fill" className="mt-0.5 shrink-0 text-positive" aria-hidden />
                {t("Thank you. We received the new copy.", "Salamat. Natanggap namin ang bagong kopya.")}
              </h2>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink">
                {t(`What happens next: we check it within 2 working days and tell you in this app. Your claim number is ${claim.id}.`, `Susunod: susuriin namin ito sa loob ng 2 araw ng trabaho at sasabihan ka sa app na ito. Ang claim number mo ay ${claim.id}.`)}
              </p>
              <ButtonLink to="/member" size="lg" className={`mt-4 w-full sm:w-auto ${WRAP_BTN}`}>
                {t("Back to Home", "Bumalik sa Home")}
              </ButtonLink>
            </div>
          )}
        </section>
      )}

      <section aria-label={t("Claim progress", "Progreso ng claim")} className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7">
        <StageTracker claim={shown} size="md" />
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink">{claimNext(shown, t)}</p>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-7">
          <section aria-labelledby="amount-title" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7">
            <h2 id="amount-title" className="text-[1rem] font-semibold text-ink-2">{claim.amountApproved !== null ? t("Amount approved", "Halagang inaprubahan") : t("Amount claimed", "Halagang kini-claim")}</h2>
            <p className="mt-1 font-display text-[min(2.6rem,12vw)] font-extrabold leading-none tracking-[-0.02em] [font-stretch:86%] sm:text-[3rem]">{peso(claim.amountApproved ?? claim.amountClaimed)}</p>
            {claim.amountApproved !== null && claim.amountApproved !== claim.amountClaimed && <p className="mt-2 text-[1rem] text-ink-2">{t(`You claimed ${peso(claim.amountClaimed)}.`, `Nag-claim ka ng ${peso(claim.amountClaimed)}.`)}</p>}
            <dl className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-x-5 gap-y-5 rounded-lg bg-sunken p-4 sm:p-5">
              <Fact label={t("Filed by", "Isinampa ni")} value={claim.claimantName} hint={lang === "fil" ? RELATION_FIL[claim.claimantRelation] : claim.claimantRelation === "Member" ? "Member" : `${claim.claimantRelation}, beneficiary`} />
              {claim.type !== "MER" && <Fact label={incidentLabel(claim.type, t)} value={date(claim.incidentDate)} />}
              {claim.hospital && <Fact label={t("Hospital", "Ospital")} value={claim.hospital} />}
              {claim.confinementDays !== undefined && <Fact label={t("Days in the hospital", "Ilang araw sa ospital")} value={t(`${claim.confinementDays} days`, `${claim.confinementDays} araw`)} />}
            </dl>
            <h3 className="mt-6 text-[1rem] font-semibold text-ink-2">{t("What happened", "Ano ang nangyari")}</h3>
            <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink">{claim.description}</p>
          </section>

          <section aria-labelledby="docs-title" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-7">
            <h2 id="docs-title" className="font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{t("Your documents", "Ang iyong mga dokumento")}</h2>
            {claim.documents.length === 0 ? (
              <p className="mt-3 text-[1rem] text-ink-2">{t("No documents were needed for this claim.", "Walang kinailangang dokumento sa claim na ito.")}</p>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--line)]">
                {claim.documents.map((d) => {
                  const st = DOC_STATUS[d.status];
                  return (
                    <li key={d.id} className="flex min-h-[3.75rem] flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
                      <span className="flex min-w-0 items-center gap-3">
                        {d.preview ? (
                          <img src={d.preview} alt={t(`Photo of ${d.name}`, `Litrato ng ${docName(d.name, lang)}`)} className="size-14 shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-sunken text-ink-2">
                            <FileText size="1.6rem" weight="duotone" aria-hidden />
                          </span>
                        )}
                        <span className="min-w-0 text-[1.0625rem] font-semibold leading-snug text-ink">{docName(d.name, lang)}</span>
                      </span>
                      <StatusBadge tone={st.tone}>{t(st.en, st.fil)}</StatusBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5 xl:col-span-5">
          <section aria-labelledby="claim-history" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
            <h2 id="claim-history" className="mb-5 font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{t("History", "Kasaysayan")}</h2>
            <History events={localTimeline(claim.timeline, lang)} upcoming={claimUpcoming(shown, t)} />
          </section>

          <section aria-labelledby="claim-money" className="rounded-xl bg-surface p-5 shadow-e1 sm:p-6">
            <h2 id="claim-money" className="font-display text-[1.4rem] font-bold leading-tight [font-stretch:88%]">{t("Where the money goes", "Saan ipapadala ang pera")}</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", account?.kind === "ewallet" ? "bg-positive-soft text-positive" : "bg-primary-soft text-primary")}>
                {account?.kind === "ewallet" ? <DeviceMobile size="1.5rem" weight="duotone" aria-hidden /> : <Bank size="1.5rem" weight="duotone" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="text-[1.0625rem] font-semibold text-ink">{account ? account.provider : claim.payoutLabel}</p>
                {account && <p className="text-[0.9375rem] text-ink-2 tnum">{account.kind === "bank" ? t("Bank account", "Bank account") : t("E-wallet", "E-wallet")} {maskAccount(account.accountNo)}</p>}
              </div>
            </div>
            <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">
              {payout && (payout.status === "settled" || payout.status === "sent")
                ? t(`${peso(payout.amount)} was sent on ${date(payout.settledAt ?? payout.createdAt)}${payout.reference ? `, reference ${payout.reference}` : ""}.`, `Naipadala ang ${peso(payout.amount)} noong ${date(payout.settledAt ?? payout.createdAt)}${payout.reference ? `, reference ${payout.reference}` : ""}.`)
                : claim.status === "denied"
                  ? t("No money is sent because the claim was not approved.", "Walang ipapadalang pera dahil hindi naaprubahan ang claim.")
                  : t("The benefit is sent here once your claim is approved.", "Ipapadala rito ang benepisyo kapag naaprubahan ang claim.")}
            </p>
          </section>
          <HelpLink topic="Claims" />
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div>
      <PageHead back={{ to: "/member/claims", label: t("Claims", "Mga claim") }} title={t("Claim details", "Detalye ng claim")} />
      {children}
    </div>
  );
}
