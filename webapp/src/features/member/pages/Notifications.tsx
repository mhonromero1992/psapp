import { useMemo, useState } from "react";
import { Checks } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { AppNotification } from "@/data/types";
import { useDB } from "@/store/db";
import { useCurrentMember, useNotificationsFor, useSimulatedLoad } from "@/store/hooks";
import { Button } from "@/components/ui/Button";
import { NotificationRow } from "../parts/Bits";
import { BigSegmented } from "../parts/Form";
import { Empty, LoadError, PageHead, PageSkeleton, SectionHead } from "../parts/Page";

type Filter = "all" | "new";

export default function Notifications() {
  const t = useT();
  const member = useCurrentMember();
  const notes = useNotificationsFor("member", member.id);
  const markAllRead = useDB((s) => s.markAllRead);
  const load = useSimulatedLoad();
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(() => [...notes].sort((a, b) => b.at.localeCompare(a.at)), [notes]);
  const unread = sorted.filter((n) => !n.read);
  const read = sorted.filter((n) => n.read);

  const markAll = () => {
    markAllRead("member", member.id);
    toast.success(t("All notifications marked as read", "Namarkahang nabasa ang lahat ng abiso"));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead
        title={t("Notifications", "Mga abiso")}
        helper={unread.length ? t(`You have ${unread.length} new ${unread.length === 1 ? "notification" : "notifications"}. Tap one to open it.`, `May ${unread.length} kang bagong abiso. I-tap ang isa para buksan.`) : t("You're all caught up.", "Nabasa mo na lahat.")}
        action={
          <Button size="lg" variant="tonal" icon={<Checks size="1.3rem" weight="bold" />} onClick={markAll} disabled={unread.length === 0 || !load.ready}>
            {t("Mark all as read", "Markahang nabasa lahat")}
          </Button>
        }
      />

      {load.error ? (
        <LoadError onRetry={load.retry} helpTopic="Something else" />
      ) : load.loading ? (
        <PageSkeleton shape="list" />
      ) : (
        <>
          <BigSegmented
            value={filter}
            onValueChange={setFilter}
            ariaLabel={t("Show", "Ipakita")}
            options={[
              { value: "all", label: t(`All (${sorted.length})`, `Lahat (${sorted.length})`) },
              { value: "new", label: t(`New (${unread.length})`, `Bago (${unread.length})`) },
            ]}
            className="mb-6 w-full sm:w-[22rem]"
          />

          {sorted.length === 0 ? (
            <div className="rounded-lg bg-surface shadow-e1">
              <Empty title={t("No notifications yet", "Wala pang abiso")} body={t("We will tell you here when your loans, claims or contributions change.", "Sasabihan ka namin dito kapag may pagbabago sa iyong loan, claim o kontribusyon.")} helpTopic="Something else" />
            </div>
          ) : filter === "new" && unread.length === 0 ? (
            <div className="rounded-lg bg-surface shadow-e1">
              <Empty title={t("No new notifications", "Walang bagong abiso")} body={t("You have read everything. Choose All to see older notifications.", "Nabasa mo na lahat. Piliin ang Lahat para makita ang mga lumang abiso.")} />
            </div>
          ) : (
            <div className="space-y-8">
              {unread.length > 0 && <Group id="new-notes" title={t("New", "Bago")} items={unread} />}
              {filter === "all" && read.length > 0 && <Group id="earlier-notes" title={t("Earlier", "Nakaraan")} items={read} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Group({ id, title, items }: { id: string; title: string; items: AppNotification[] }) {
  return (
    <section aria-labelledby={id}>
      <SectionHead id={id} title={title} count={items.length} />
      <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-lg bg-surface shadow-e1">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationRow n={n} />
          </li>
        ))}
      </ul>
    </section>
  );
}
