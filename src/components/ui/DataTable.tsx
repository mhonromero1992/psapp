import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CaretDown, CaretLeft, CaretRight, CaretUp } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { EmptyState, ErrorState, LoadingRows } from "./States";

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sort?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  width?: string;
  /** Hidden in the stacked phone layout. */
  hideOnMobile?: boolean;
  /** Hidden below the lg breakpoint in the table layout. */
  hideBelowLg?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Rows become navigable; the first column renders as the keyboard-reachable link. */
  rowHref?: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  empty?: { title: string; body?: string; action?: React.ReactNode };
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  caption: string;
  className?: string;
  dense?: boolean;
  selectedKey?: string | null;
}

/**
 * The one table for every back-office list. Sortable headers are buttons, rows link
 * through their first cell, and phones get stacked rows instead of a sideways scroll.
 */
export function DataTable<T>({ rows, columns, rowKey, rowHref, onRowClick, loading, error, onRetry, empty, pageSize = 12, initialSort, caption, className, dense, selectedKey }: DataTableProps<T>) {
  const navigate = useNavigate();
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const get = col.sort;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const activate = (row: T) => {
    if (onRowClick) onRowClick(row);
    else if (rowHref) navigate(rowHref(row));
  };
  const interactive = !!(rowHref || onRowClick);

  if (loading) return <div className={cn("rounded-lg bg-surface p-5 shadow-e1", className)}><LoadingRows rows={Math.min(pageSize, 6)} /></div>;
  if (error) return <div className={cn("rounded-lg bg-surface shadow-e1", className)}><ErrorState onRetry={onRetry} /></div>;
  if (rows.length === 0)
    return (
      <div className={cn("rounded-lg bg-surface shadow-e1", className)}>
        <EmptyState title={empty?.title ?? "Nothing here yet"} body={empty?.body} action={empty?.action} />
      </div>
    );

  const firstCell = (row: T, c: Column<T>) => {
    const content = c.cell(row);
    if (rowHref)
      return (
        <a
          href={rowHref(row)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            activate(row);
          }}
          className="rounded-xs font-semibold text-ink outline-none hover:text-primary focus-visible:text-primary"
        >
          {content}
        </a>
      );
    if (onRowClick)
      return (
        <button type="button" onClick={(e) => { e.stopPropagation(); activate(row); }} className="rounded-xs text-left font-semibold text-ink hover:text-primary">
          {content}
        </button>
      );
    return content;
  };

  return (
    <div className={cn("overflow-hidden rounded-lg bg-surface shadow-e1", className)}>
      {/* Table layout, md and up */}
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left text-[0.875rem]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface-2">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    style={{ width: c.width }}
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn("h-11 whitespace-nowrap px-4 text-[0.78rem] font-semibold text-ink-3 shadow-[inset_0_-1px_0_var(--line)]", c.align === "right" && "text-right", c.align === "center" && "text-center", c.hideBelowLg && "hidden lg:table-cell")}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPage(0);
                          setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "desc" }));
                        }}
                        className={cn("inline-flex items-center gap-1 rounded-xs transition-colors hover:text-ink", active && "text-ink", c.align === "right" && "flex-row-reverse")}
                      >
                        {c.header}
                        <span aria-hidden className={cn("transition-opacity", active ? "opacity-100" : "opacity-30")}>
                          {active && sort!.dir === "asc" ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  onClick={interactive ? () => activate(row) : undefined}
                  className={cn(
                    "shadow-[inset_0_-1px_0_var(--line)] transition-colors duration-150 last:shadow-none",
                    interactive && "cursor-pointer hover:bg-surface-2",
                    selectedKey === key && "bg-primary-soft hover:bg-primary-soft",
                  )}
                >
                  {columns.map((c, ci) => (
                    <td key={c.key} className={cn("px-4 align-middle text-ink-2", dense ? "h-12" : "h-[3.5rem]", c.align === "right" && "text-right tnum", c.align === "center" && "text-center", c.hideBelowLg && "hidden lg:table-cell")}>
                      {ci === 0 ? firstCell(row, c) : c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stacked layout for phones */}
      <ul className="md:hidden" aria-label={caption}>
        {slice.map((row) => {
          const key = rowKey(row);
          const [first, ...rest] = columns.filter((c) => !c.hideOnMobile);
          return (
            <li key={key} onClick={interactive ? () => activate(row) : undefined} className={cn("px-4 py-3.5 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none", interactive && "active:bg-surface-2", selectedKey === key && "bg-primary-soft")}>
              <div className="mb-1.5 text-[0.95rem]">{firstCell(row, first)}</div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.84rem]">
                {rest.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[0.75rem] text-ink-3">{c.header}</dt>
                    <dd className="truncate text-ink-2">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-[0.8125rem] text-ink-3 shadow-[inset_0_1px_0_var(--line)]">
          <span className="tnum">
            {safePage * pageSize + 1} to {Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length.toLocaleString("en-PH")}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-sm btn-icon" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <span className="btn-label"><CaretLeft size={15} weight="bold" /></span>
            </button>
            <span className="tnum px-1 font-semibold text-ink-2">
              {safePage + 1} / {pages}
            </span>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" aria-label="Next page" disabled={safePage >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
              <span className="btn-label"><CaretRight size={15} weight="bold" /></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
