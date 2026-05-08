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
  formatShortDate,
  getOptionName,
  getProjectName,
} from "@/utils/notion";

function isCompletedStatus(status: string | null) {
  if (!status) {
    return false;
  }

  return ["completed", "complete", "finished", "finish"].some((value) =>
    status.toLowerCase().includes(value)
  );
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
    const completed = entries.filter((entry) =>
      isCompletedStatus(getOptionName(entry.properties.Status))
    ).length;

    return {
      total: entries.length,
      active: entries.length - completed,
      completed,
    };
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
        <StatCard label="Projects" value={stats.total} tone="sky" />
        <StatCard label="Active" value={stats.active} tone="amber" />
        <StatCard label="Completed" value={stats.completed} tone="emerald" />
        <StatCard label="Available Links" value={entries.filter((entry) => entry.url).length} tone="rose" />
      </div>

      {loading && <p className="mt-10 text-left text-sm text-stone-500">Loading projects...</p>}
      {error && <p className="mt-10 text-left text-sm text-rose-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            const status = getOptionName(entry.properties.Status) ?? "Unknown";
            const completed = isCompletedStatus(status);

            return (
              <article
                key={entry.notionPageId}
                className="rounded-[1.75rem] border border-rose-100/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(255,248,251,0.94)_55%,_rgba(254,252,248,0.92)_100%)] p-5 text-left shadow-[0_16px_40px_rgba(233,162,187,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        completed
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-sky-100 text-sky-700"
                      )}
                    >
                      {status}
                    </p>
                    <h3 className="mt-4 text-xl text-stone-800">{getProjectName(entry)}</h3>
                  </div>

                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-stone-200 p-2 text-stone-500 transition hover:border-sky-200 hover:text-sky-600"
                      aria-label={`Open ${getProjectName(entry)} in Notion`}
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>

                <p className="mt-3 text-sm leading-6 text-stone-500">
                  Last updated {formatShortDate(entry.lastEditedTime ?? entry.updatedAt)}
                </p>
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
