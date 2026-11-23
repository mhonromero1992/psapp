import { House } from "@phosphor-icons/react";
import { BladeMark } from "@/components/brand/BladeMark";
import { Lockup } from "@/components/brand/Emblem";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-night px-6 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-[0.12]">
        <BladeMark size={520} rim={false} />
      </div>
      <div className="relative max-w-lg">
        <Lockup tone="light" />
        <p className="mt-14 font-display text-[5.5rem] font-extrabold leading-none tracking-[-0.03em] [font-stretch:72%] text-white/90">404</p>
        <h1 className="mt-3 font-display text-[2rem] font-bold [font-stretch:86%]">This page is not part of PS-ACCESS</h1>
        <p className="mt-3 text-white/75">The link may be old, or the page moved when a module went live. Your records are safe.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/" variant="light" icon={<House size={18} weight="bold" />}>Go to the home page</ButtonLink>
          <ButtonLink to="/sign-in" variant="glass">Sign in to PS-ACCESS</ButtonLink>
        </div>
      </div>
    </div>
  );
}
