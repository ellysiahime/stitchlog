import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchProjects,
  syncProjects,
  type SyncedNotionEntry,
} from "@/services/stitchlogApi";
import {
  formatLastSyncDate,
  getOptionName,
  getProjectName,
} from "@/utils/notion";

const PROJECT_STATUS_ORDER: Record<string, number> = {
  active: 0,
  passive: 1,
  ready: 2,
  kip: 3,
  finished: 4,
  ufo: 5,
  wishlist: 6,
};

function getStatusBadgeClass(status: string | null) {
  const normalizedStatus = status?.trim().toLowerCase();

  switch (normalizedStatus) {
    case "finished":
      return "bg-emerald-100 text-emerald-700";
    case "active":
      return "bg-pink-100 text-pink-700";
    case "passive":
      return "bg-violet-100 text-violet-700";
    case "ufo":
      return "bg-amber-100 text-amber-700";
    case "ready":
      return "bg-sky-100 text-sky-700";
    case "kip":
      return "bg-orange-100 text-orange-700";
    case "wishlist":
      return "bg-stone-200 text-stone-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
}

function getStatusPriority(status: string | null) {
  const normalizedStatus = status?.trim().toLowerCase();

  if (!normalizedStatus) {
    return Number.MAX_SAFE_INTEGER;
  }

  return PROJECT_STATUS_ORDER[normalizedStatus] ?? Number.MAX_SAFE_INTEGER;
}

export function ProjectsPage() {
  const [entries, setEntries] = useState<SyncedNotionEntry[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProjects();
        setEntries(data.entries);
        setLastSyncDate(data.lastSyncDate);
      } catch (loadError) {
        setError("Failed to load projects");
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    }

    void loadProjects();
  }, []);

  async function handleSync() {
    try {
      setLoading(true);
      setError("");
      await syncProjects();
      const data = await fetchProjects();
      setEntries(data.entries);
      setLastSyncDate(data.lastSyncDate);
    } catch (syncError) {
      setError("Failed to sync projects");
      console.error(syncError);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const statusCounts = entries.reduce(
      (counts, entry) => {
        const status = getOptionName(entry.properties.Status)?.trim().toLowerCase();

        if (!status) {
          return counts;
        }

        if (status === "active") {
          counts.active += 1;
        }

        if (status === "passive") {
          counts.passive += 1;
        }

        if (status === "finished") {
          counts.finished += 1;
        }

        return counts;
      },
      { active: 0, passive: 0, finished: 0 }
    );

    return {
      projects:
        statusCounts.active + statusCounts.passive + statusCounts.finished,
      wip: statusCounts.active + statusCounts.passive,
      completed: statusCounts.finished,
    };
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((leftEntry, rightEntry) => {
      const leftStatus = getOptionName(leftEntry.properties.Status);
      const rightStatus = getOptionName(rightEntry.properties.Status);
      const priorityDifference =
        getStatusPriority(leftStatus) - getStatusPriority(rightStatus);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return getProjectName(leftEntry).localeCompare(getProjectName(rightEntry));
    });
  }, [entries]);

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/30 p-5 shadow-[0_24px_80px_rgba(182,129,115,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-500">
            Project Library
          </p>
          <h2 className="mt-3 text-2xl text-stone-800 sm:text-3xl lg:text-3xl">
            Your cross stitch project of all time.
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-500 sm:text-base">
            WIPs, FFOs, stash beyond life expectancy, and future projects live here.
          </p>
        </div>

        <div className="flex flex-col w-[30%] gap-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="h-11 rounded-full border-sky-200 bg-white/90 px-5 text-sm font-semibold text-sky-600 hover:bg-sky-50"
            onClick={handleSync}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Sync Projects
          </Button>
          <p className="text-[14px]">
            Last sync: <span className="font-semibold">{formatLastSyncDate(lastSyncDate)}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Projects" value={stats.projects} tone="sky" />
        <StatCard label="WIP Count" value={stats.wip} tone="amber" />
        <StatCard label="Finished Projects" value={stats.completed} tone="emerald" />
        <StatCard label="All Entries" value={entries.filter((entry) => entry.url).length} tone="rose" />
      </div>

      {loading && <p className="mt-10 text-left text-sm text-stone-500">Loading projects...</p>}
      {error && <p className="mt-10 text-left text-sm text-rose-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {sortedEntries.map((entry) => {
            const status = getOptionName(entry.properties.Status) ?? "Unknown";

            return (
              <article
                key={entry.notionPageId}
                className="flex h-full flex-col rounded-[1.35rem] border border-rose-100/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(255,248,251,0.94)_55%,_rgba(254,252,248,0.92)_100%)] p-4 text-left shadow-[0_12px_30px_rgba(233,162,187,0.10)] lg:min-h-[240px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusBadgeClass(status)
                      )}
                    >
                      {status}
                    </p>
                    <h3 className="mt-3 text-sm leading-5 text-stone-800">
                      {getProjectName(entry)}
                    </h3>
                  </div>

                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full border border-stone-200 p-2 text-stone-500 transition hover:border-sky-200 hover:text-sky-600"
                      aria-label={`Open ${getProjectName(entry)} in Notion`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>

                {entry.progressPicsUrl ? (
                  <a
                    href={entry.progressPicsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto pt-4 text-sm inline-flex text-sky-600 transition hover:text-sky-700 hover:underline"
                  >
                    View progress pic
                  </a>
                ) : (
                  <p className="mt-auto pt-4 text-sm text-stone-400">View progress pic</p>
                )}
              </article>
            );
          })}

          {entries.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-sky-200 bg-sky-50/55 px-6 py-14 text-left">
              <p className="text-lg font-semibold text-stone-800">No projects synced yet.</p>
              <p className="mt-2 text-sm text-stone-500">
                Sync your Projects database and the shelf will populate here.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
