import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, IdentificationCard, SignIn as SignInIcon } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";
import { EASE_OUT } from "@/lib/motion";
import { Lockup } from "@/components/brand/Emblem";
import { RibbonLabel } from "@/components/brand/Ribbon";
import { ButtonLink } from "@/components/ui/Button";
import { LangToggle, TextSizeControl } from "@/components/layout/Toggles";
import { MaskLines } from "@/components/motion/Reveal";
import { HelpLink } from "@/features/member/parts/Help";
import { MedalStage } from "./AuthLayout";

/**
 * The first screen of the Member App. Language and text size come first, because many
 * members are older; then two plain choices: sign in, or enrol as a new member.
 */
export default function Welcome() {
  const t = useT();
  const reduced = useReducedMotion();
  const rise = (delay: number) => ({ initial: reduced ? false : { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.52, ease: EASE_OUT, delay } }) as const;

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-5 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(var(--safe-top)+0.75rem)] sm:px-8 lg:justify-center lg:py-12">
      <div className="flex min-h-14 items-center justify-between gap-3">
        <div className="lg:hidden">
          <Lockup compact />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[0.85rem] font-semibold text-ink-2">{t("Language", "Wika")}</span>
          <LangToggle />
        </div>
      </div>

      {/* The medal, phones and tablets (the wide-screen panel carries it on desktop). */}
      <MedalStage live={false} className="relative mx-auto mt-2 h-[min(34vh,300px)] w-full lg:hidden" />

      <div className="mt-6 lg:mt-0">
        <motion.div {...rise(0)}>
          <RibbonLabel name="brand">{t("PSMBFI Member App", "PSMBFI Member App")}</RibbonLabel>
        </motion.div>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,1.4rem+2.6vw,3.1rem)] font-extrabold leading-[1.02] tracking-[-0.02em] [font-stretch:82%]">
          <MaskLines delay={0.08} lines={[t("Your MEP, loans and claims", "Ang iyong MEP, loans at claims"), <span key="b" className="text-primary">{t("in one app", "sa iisang app")}</span>]} />
        </h1>
        <motion.p {...rise(0.3)} className="mt-4 text-[1.08rem] leading-relaxed text-ink-2">
          {t(
            "See your Equity Value, apply for a loan, file a claim with photos and get your money sent to your bank or e-wallet.",
            "Tingnan ang iyong Equity Value, mag-apply ng loan, mag-file ng claim gamit ang litrato, at matanggap ang pera sa iyong bangko o e-wallet.",
          )}
        </motion.p>

        <motion.div {...rise(0.4)} className="mt-8 flex flex-col gap-3">
          <ButtonLink to="/sign-in" size="lg" block icon={<SignInIcon size={22} weight="bold" />}>
            {t("Sign in", "Mag-sign in")}
          </ButtonLink>
          <ButtonLink to="/enrol" variant="quiet" size="lg" block icon={<IdentificationCard size={22} weight="duotone" />} iconRight={<ArrowRight size={18} weight="bold" />}>
            {t("I'm new: enrol as a member", "Bago ako: mag-enrol bilang miyembro")}
          </ButtonLink>
        </motion.div>

        <motion.section {...rise(0.5)} aria-labelledby="text-size-label" className="mt-8 rounded-xl bg-surface p-4 shadow-e1">
          <p id="text-size-label" className="mb-3 font-semibold">
            {t("Make the words bigger", "Palakihin ang mga letra")}
          </p>
          <TextSizeControl />
        </motion.section>

        <motion.div {...rise(0.55)} className="mt-4 flex flex-col items-start gap-1">
          <HelpLink topic="Signing in or my PIN" />
          <p className="text-[0.875rem] text-ink-3">{t("Prototype with sample data. No real member records are used.", "Prototype na may sample data. Walang totoong record ng miyembro.")}</p>
        </motion.div>
      </div>
    </div>
  );
}
