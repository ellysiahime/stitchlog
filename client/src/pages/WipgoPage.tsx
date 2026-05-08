import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchProjects,
  fetchWipgo,
  syncProjects,
  syncWipgo,
  type SyncedNotionEntry,
} from "@/services/stitchlogApi";
import { formatLastSyncDate, getLatestSyncDate } from "@/utils/notion";
import { buildWipgoTiles } from "@/utils/wipgo";

export function WipgoPage() {
  const [projectEntries, setProjectEntries] = useState<SyncedNotionEntry[]>([]);
  const [wipgoEntries, setWipgoEntries] = useState<SyncedNotionEntry[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWipgoBoard() {
      try {
        setLoading(true);
        setError("");
        const [projectsData, wipgoData] = await Promise.all([fetchProjects(), fetchWipgo()]);
        setProjectEntries(projectsData.entries);
        setWipgoEntries(wipgoData.entries);
        setLastSyncDate(getLatestSyncDate(projectsData.lastSyncDate, wipgoData.lastSyncDate));
      } catch (loadError) {
        setError("Failed to load WIPGO board");
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    }

    void loadWipgoBoard();
  }, []);

  async function handleSync() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([syncProjects(), syncWipgo()]);
      const [projectsData, wipgoData] = await Promise.all([fetchProjects(), fetchWipgo()]);
      setProjectEntries(projectsData.entries);
      setWipgoEntries(wipgoData.entries);
      setLastSyncDate(getLatestSyncDate(projectsData.lastSyncDate, wipgoData.lastSyncDate));
    } catch (syncError) {
      setError("Failed to sync Projects and WIPGO");
      console.error(syncError);
    } finally {
      setLoading(false);
    }
  }

  const wipgoTiles = useMemo(
    () => buildWipgoTiles(wipgoEntries, projectEntries),
    [projectEntries, wipgoEntries]
  );
  const completedTiles = wipgoTiles.filter((tile) => tile.isCompleted).length;
  const inProgressTiles = wipgoTiles.length - completedTiles;
  const linkedProjectsCount = wipgoTiles.filter((tile) => tile.hasLinkedProject).length;

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/30 p-5 shadow-[0_24px_80px_rgba(94,234,212,0.1)] backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-emerald-500">
            WIPGO Board
          </p>
          <h2 className="mt-3 text-2xl text-stone-800 sm:text-3xl lg:text-3xl">
            A dedicated board for goals and progress.
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-500 sm:text-base">
            Complete as many tiles as you can and track your progress in a fun way.
          </p>
        </div>

        <div className="flex flex-col w-[30%] gap-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            className="h-11 rounded-full border-emerald-200 bg-white/90 px-5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
            onClick={handleSync}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Sync WIPGO
          </Button>
          <p className="text-[14px]">
            Last sync: <span className="font-semibold ">{formatLastSyncDate(lastSyncDate)}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Board Tiles" value={wipgoTiles.length} tone="emerald" />
        <StatCard label="Completed" value={completedTiles} tone="rose" />
        <StatCard label="In Progress" value={inProgressTiles} tone="amber" />
        <StatCard label="Projects Linked" value={linkedProjectsCount} tone="sky" />
      </div>

      {loading && <p className="mt-10 text-left text-sm text-stone-500">Loading WIPGO...</p>}
      {error && <p className="mt-10 text-left text-sm text-rose-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 overflow-x-auto pb-2">
          {wipgoTiles.length > 0 ? (
            <div className="mx-auto min-w-[320px] max-w-[1080px]">
              <div className="grid grid-cols-5 gap-3">
                {wipgoTiles.map((tile) => (
                  <article
                    key={tile.notionPageId}
                    className={cn(
                      "flex aspect-square flex-col rounded-[1.55rem] border p-3 text-left shadow-[0_14px_34px_rgba(148,163,184,0.12)] transition-transform duration-200 hover:-translate-y-1",
                      tile.isCompleted
                        ? "border-emerald-200 bg-[linear-gradient(180deg,_#f3fff8_0%,_#ddf8ea_100%)]"
                        : tile.isTodo
                          ? "border-sky-100 bg-[linear-gradient(180deg,_#f5fbff_0%,_#e8f5ff_58%,_#fffdf8_100%)]"
                          : "border-rose-100 bg-[linear-gradient(180deg,_#fff9fb_0%,_#fff4ed_58%,_#fffdf8_100%)]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.2em]",
                          tile.isCompleted
                            ? "bg-emerald-100 text-emerald-700"
                            : tile.isTodo
                              ? "bg-sky-100 text-sky-600"
                              : "bg-rose-100 text-rose-500"
                        )}
                      >
                        {tile.number}
                      </span>
                      <span className="text-[11px] font-medium text-stone-400">
                        {tile.monthCalled ?? "Open"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="line-clamp-2 text-[12px] font-semibold text-stone-800 sm:text-sm">
                        {tile.projectName}
                      </p>
                      <p className="line-clamp-4 text-[10px] leading-5 text-stone-500 sm:text-xs">
                        {tile.goal}
                      </p>
                    </div>

                    <div className="mt-auto pt-3">
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2 text-[11px] font-semibold sm:text-xs",
                          tile.isCompleted
                            ? "bg-emerald-200/70 text-emerald-800"
                            : tile.isTodo
                              ? "bg-sky-100/80 text-sky-700"
                              : "bg-white/80 text-stone-600"
                        )}
                      >
                        {tile.status}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-14 text-left">
              <p className="text-lg font-semibold text-stone-800">No WIPGO entries found yet.</p>
              <p className="mt-2 text-sm text-stone-500">
                Sync the WIPGO database and the 5x5 board will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
