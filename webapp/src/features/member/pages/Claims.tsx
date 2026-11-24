import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, FirstAidKit, Warning } from "@phosphor-icons/react";
import { date, peso } from "@/lib/format";
import { useLang, useT } from "@/lib/i18n";
import { BENEFIT_BY_ID, BENEFIT_TYPES } from "@/data/reference";
import type { Claim } from "@/data/types";
import { useClaimsFor, useCurrentMember, useSimulatedLoad } from "@/store/hooks";
import { CLAIM_STATUS } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { HelpLink } from "../parts/Help";
import { BENEFIT_ICON, OPEN_CLAIM, claimNext } from "../parts/claims";
import { Empty, LoadError, PageHead, PageSkeleton, SectionHead, StatusBadge } from "../parts/Page";
import { BENEFIT_FIL, BENEFIT_SCHEDULE_EN } from "../parts/text";
import { StageTracker } from "../parts/Tracker";

export default function Claims() {
  const t = useT();
  const member = useCurrentMember();
  const claims = useClaimsFor(member.id);
  const load = useSimulatedLoad();

  const sorted = useMemo(() => [...claims].sort((a, b) => b.filedAt.localeCompare(a.filedAt)), [claims]);
  const open = sorted.filter((c) => OPEN_CLAIM.includes(c.status));
  const past = sorted.filter((c) => !OPEN_CLAIM.includes(c.status));

  return (
    <div>
      <PageHead
        title={t("Claims", "Mga claim")}
        helper={t("Money for hospital stays, injuries on duty and other covered events. File from your phone with photos of your papers.", "Pera para sa pagka-ospital, pinsala sa tungkulin at iba pang sakop na pangyayari. Mag-file gamit ang phone at litrato ng mga papel.")}
        action={
          <ButtonLink to="/member/claims/new" size="lg" icon={<FirstAidKit size="1.3rem" weight="bold" />}>
            {t("File a claim", "Mag-file ng claim")}
          </ButtonLink>
        }
      />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Claims" />
      ) : load.loading ? (
        <PageSkeleton shape="cards" />
      ) : (
        <div className="grid gap-10 xl:grid-cols-12 xl:gap-6">
          <div className="xl:col-span-7">
            <section aria-labelledby="open-claims">
              <SectionHead id="open-claims" title={t("In progress", "Pinoproseso")} count={open.length} />
              {open.length === 0 ? (
                <div className="rounded-lg bg-surface shadow-e1">
                  <Empty compact title={t("No claims in progress", "Walang claim na pinoproseso")} body={t("When you file a claim, you can follow each step here.", "Kapag nag-file ka ng claim, masusubaybayan mo rito ang bawat hakbang.")} helpTopic="Claims" />
                </div>
              ) : (
                <div className="space-y-3">
                  {open.map((c) => (
                    <OpenClaim key={c.id} claim={c} />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="past-claims" className="mt-10">
              <SectionHead id="past-claims" title={t("Finished claims", "Mga tapos nang claim")} count={past.length} />
              {past.length === 0 ? (
                <div className="rounded-lg bg-surface shadow-e1">
                  <Empty compact title={t("No finished claims yet", "Wala pang tapos na claim")} body={t("Paid and closed claims are kept here for your records.", "Dito itinatago ang mga bayad at saradong claim para sa iyong records.")} />
                </div>
              ) : (
                <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg bg-surface shadow-e1">
                  {past.map((c) => (
                    <li key={c.id}>
                      <PastClaimRow claim={c} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="benefits" className="xl:col-span-5">
            <SectionHead id="benefits" title={t("What you can claim", "Ano ang maaari mong i-claim")} />
            <p className="-mt-1 mb-3 text-[1rem] text-ink-2">{t("Amounts are sample values to confirm with PSMBFI.", "Sample na halaga lang ang mga amount, kukumpirmahin sa PSMBFI.")}</p>
            <ul className="divide-y divide-[var(--line)] rounded-lg bg-surface shadow-e1">
              {BENEFIT_TYPES.map((b) => (
                <BenefitRow key={b.id} id={b.id} />
              ))}
            </ul>
            <HelpLink topic="Claims" className="mt-5" />
          </section>
        </div>
      )}
    </div>
  );
}

function OpenClaim({ claim }: { claim: Claim }) {
  const t = useT();
  const b = BENEFIT_BY_ID[claim.type];
  const I = BENEFIT_ICON[claim.type];
  const s = CLAIM_STATUS[claim.status];
  const needsDoc = claim.status === "returned" || claim.documents.some((d) => d.status === "reupload");
  return (
    <Link to={`/member/claims/${claim.id}`} className="sheen group block rounded-xl bg-surface p-5 shadow-e1 transition-shadow duration-300 hover:shadow-e2 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <I size="1.5rem" weight="duotone" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <h3 className="text-[1.1875rem] font-bold leading-snug text-ink">{t(b.name, b.nameFil)}</h3>
            <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
          </div>
          <p className="mt-0.5 text-[0.9375rem] text-ink-2 tnum">
            {claim.id} · {t(`filed ${date(claim.filedAt)}`, `isinampa ${date(claim.filedAt)}`)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[1rem] text-ink-2">
        {t("Amount claimed", "Halagang kini-claim")} <span className="ml-1 text-[1.25rem] font-bold text-ink tnum">{peso(claim.amountClaimed)}</span>
      </p>
      <StageTracker claim={claim} size="md" className="mt-5" />
      {needsDoc ? (
        <p className="mt-4 flex items-start gap-2.5 rounded-md bg-caution-soft px-4 py-3 text-[1rem] font-semibold leading-snug text-ink">
          <Warning size="1.3rem" weight="fill" className="mt-0.5 shrink-0 text-caution" aria-hidden />
          {t("We need a new copy of a document. Open this claim to send it.", "Kailangan namin ng bagong kopya ng isang dokumento. Buksan ang claim para ipadala ito.")}
        </p>
      ) : (
        <p className="mt-4 text-[1rem] leading-snug text-ink">{claimNext(claim, t)}</p>
      )}
      <span className="mt-4 inline-flex min-h-6 items-center gap-1.5 text-[1rem] font-semibold text-primary">
        {t("See claim details", "Tingnan ang detalye ng claim")}
        <ArrowRight size="1rem" weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}

function PastClaimRow({ claim }: { claim: Claim }) {
  const t = useT();
  const b = BENEFIT_BY_ID[claim.type];
  const I = BENEFIT_ICON[claim.type];
  const s = CLAIM_STATUS[claim.status];
  const ended = claim.timeline[claim.timeline.length - 1]?.at ?? claim.filedAt;
  return (
    <Link to={`/member/claims/${claim.id}`} className="flex min-h-[3.75rem] items-start gap-3.5 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5">
      <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-sunken text-ink-2">
        <I size="1.35rem" weight="duotone" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-semibold leading-snug text-ink">{t(b.name, b.nameFil)}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <span className="text-[0.9375rem] text-ink-2 tnum">
            {peso(claim.amountApproved ?? claim.amountClaimed)} · {date(ended)}
          </span>
          <StatusBadge tone={s.tone}>{t(s.label, s.fil)}</StatusBadge>
        </span>
      </span>
    </Link>
  );
}

function BenefitRow({ id }: { id: keyof typeof BENEFIT_FIL }) {
  const t = useT();
  const lang = useLang();
  const b = BENEFIT_BY_ID[id];
  const I = BENEFIT_ICON[id];
  const fil = BENEFIT_FIL[id];
  return (
    <li className="flex gap-3.5 px-4 py-4 sm:px-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <I size="1.35rem" weight="duotone" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[1.0625rem] font-semibold leading-snug text-ink">
          {t(b.name, b.nameFil)}
          {b.id !== "DEATH" && b.id !== "DISABILITY" && <span className="font-normal text-ink-2"> ({b.id})</span>}
        </p>
        <p className="mt-1 text-[1rem] leading-snug text-ink-2">{lang === "fil" ? fil.description : b.description}</p>
        <p className="mt-1.5 text-[1rem] font-semibold text-ink">{lang === "fil" ? fil.schedule : BENEFIT_SCHEDULE_EN[b.id] ?? b.schedule}</p>
      </div>
    </li>
  );
}
