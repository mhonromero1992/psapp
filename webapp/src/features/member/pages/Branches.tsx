import { useMemo, useState } from "react";
import { CheckCircle, Clock, MapPin, NavigationArrow } from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { useCurrentMember } from "@/store/hooks";
import { useDB } from "@/store/db";
import { OFFICES } from "@/data/reference";
import type { Office } from "@/data/types";
import { PageHead, SectionHead } from "../parts/Page";
import { HelpLink } from "../parts/Help";

const ISLANDS: { en: string; fil: string; regions: string[] }[] = [
  { en: "Luzon", fil: "Luzon", regions: ["NCR", "Ilocos", "CAR", "Cagayan Valley", "Central Luzon", "CALABARZON", "Bicol"] },
  { en: "Visayas", fil: "Visayas", regions: ["Western Visayas", "Central Visayas", "Eastern Visayas"] },
  { en: "Mindanao", fil: "Mindanao", regions: ["Zamboanga Peninsula", "Northern Mindanao", "Davao", "SOCCSKSARGEN", "Caraga"] },
];

const mapsUrl = (o: Office) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.street}, ${o.city}`)}`;

export default function Branches() {
  const t = useT();
  const member = useCurrentMember();
  const updateMember = useDB((s) => s.updateMember);
  const [q, setQ] = useState("");
  const mine = OFFICES.find((o) => o.id === member.officeId) ?? OFFICES[0];

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const match = (o: Office) => !s || [o.name, o.city, o.region, o.street].some((x) => x.toLowerCase().includes(s));
    return ISLANDS.map((g) => ({ ...g, offices: OFFICES.filter((o) => g.regions.includes(o.region) && match(o)) })).filter((g) => g.offices.length > 0);
  }, [q]);

  const choose = (o: Office) => {
    updateMember(member.id, { officeId: o.id });
    toast.success(t(`${o.name} is now your branch`, `${o.name} na ang iyong sangay`));
  };

  return (
    <div className="pb-6">
      <PageHead title={t("Branches", "Mga sangay")} helper={t("Visit any PSMBFI office from Monday to Friday. Bring a valid ID.", "Bumisita sa alinmang PSMBFI office mula Lunes hanggang Biyernes. Magdala ng valid ID.")} />

      {/* Your branch first */}
      <section aria-labelledby="mine-title" className="rounded-xl bg-night p-5 text-white shadow-e2 sm:p-6">
        <p className="flex items-center gap-2 text-[0.95rem] font-semibold text-white/80">
          <CheckCircle size={20} weight="fill" className="text-[#5fd99a]" aria-hidden /> {t("Your branch", "Ang iyong sangay")}
        </p>
        <h2 id="mine-title" className="mt-2 font-display text-[1.7rem] font-extrabold leading-tight [font-stretch:86%]">{mine.name}</h2>
        <p className="mt-2 flex items-start gap-2 text-[1.05rem] text-white/90">
          <MapPin size={22} weight="duotone" className="mt-0.5 shrink-0" aria-hidden />
          {mine.street}, {mine.city}
        </p>
        <p className="mt-1.5 flex items-start gap-2 text-[1.05rem] text-white/90">
          <Clock size={22} weight="duotone" className="mt-0.5 shrink-0" aria-hidden />
          {t(mine.hours, mine.hours.replace("Mon to Fri", "Lunes hanggang Biyernes"))}
        </p>
        <a href={mapsUrl(mine)} target="_blank" rel="noopener noreferrer" className="btn btn-light btn-lg mt-5 w-full sm:w-auto">
          <span className="btn-label inline-flex items-center gap-[inherit]">
            <NavigationArrow size={20} weight="bold" aria-hidden /> {t("Get directions", "Paano pumunta")}
          </span>
        </a>
      </section>

      <div className="mt-8">
        <SearchInput value={q} onChange={setQ} label={t("Search branches by city or region", "Hanapin ang sangay ayon sa lungsod o rehiyon")} placeholder={t("Search a city or region", "Maghanap ng lungsod o rehiyon")} className="[&_input]:h-14 [&_input]:text-[1.05rem]" />
      </div>

      {groups.length === 0 ? (
        <div className="mt-6 rounded-xl bg-surface p-6 text-center shadow-e1" role="status">
          <p className="text-[1.1rem] font-semibold">{t(`No branch matches "${q}"`, `Walang sangay na tugma sa "${q}"`)}</p>
          <p className="mt-1 text-ink-2">{t("Try the name of your province or city.", "Subukan ang pangalan ng probinsya o lungsod.")}</p>
          <Button variant="quiet" size="lg" className="mt-4" onClick={() => setQ("")}>
            {t("Show all branches", "Ipakita lahat ng sangay")}
          </Button>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.en} aria-labelledby={`g-${g.en}`} className="mt-8">
            <SectionHead id={`g-${g.en}`} title={t(g.en, g.fil)} count={g.offices.length} />
            <ul className="grid gap-3 md:grid-cols-2">
              {g.offices.map((o) => {
                const isMine = o.id === mine.id;
                return (
                  <li key={o.id} className={cn("rounded-xl bg-surface p-5 shadow-e1", isMine && "shadow-[inset_0_0_0_2px_var(--primary),var(--e1)]")}>
                    <p className="text-[1.12rem] font-bold [font-stretch:92%]">{o.name}</p>
                    <p className="mt-1 text-ink-2">{o.street}, {o.city}</p>
                    <p className="mt-0.5 text-ink-2">{t(o.hours, o.hours.replace("Mon to Fri", "Lunes hanggang Biyernes"))}</p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <a href={mapsUrl(o)} target="_blank" rel="noopener noreferrer" className="btn btn-quiet sm:flex-1">
                        <span className="btn-label inline-flex items-center gap-[inherit]">
                          <NavigationArrow size={18} weight="bold" aria-hidden /> {t("Get directions", "Paano pumunta")}
                        </span>
                      </a>
                      {isMine ? (
                        <span className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-primary-soft font-semibold text-primary sm:flex-1">
                          <CheckCircle size={18} weight="fill" aria-hidden /> {t("Your branch", "Iyong sangay")}
                        </span>
                      ) : (
                        <Button variant="tonal" className="sm:flex-1" onClick={() => choose(o)}>
                          {t("Make this my branch", "Gawin itong aking sangay")}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      <HelpLink topic="Something else" className="mt-8" />
    </div>
  );
}
