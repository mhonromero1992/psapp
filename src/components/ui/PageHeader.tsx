import { Link } from "react-router";
import { CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Ribbon, type RibbonName } from "@/components/brand/Ribbon";

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({ title, subtitle, crumbs, actions, ribbon, className, meta }: { title: React.ReactNode; subtitle?: React.ReactNode; crumbs?: Crumb[]; actions?: React.ReactNode; ribbon?: RibbonName; className?: string; meta?: React.ReactNode }) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-ink-3">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-1">
                  {c.to ? (
                    <Link to={c.to} className="rounded-xs font-medium hover:text-ink">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-ink-2">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && <CaretRight size={11} weight="bold" aria-hidden />}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex items-center gap-3">
          {ribbon && <Ribbon name={ribbon} size="lg" className="hidden sm:inline-block" />}
          <h1 className="font-display text-[1.75rem] font-extrabold leading-[1.05] tracking-[-0.02em] [font-stretch:84%] sm:text-[2.15rem]">{title}</h1>
        </div>
        {subtitle && <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-2">{subtitle}</p>}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
