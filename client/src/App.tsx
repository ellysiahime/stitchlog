import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Heatmap } from "@/components/layout/Heatmap";
import { StatCard } from "@/components/layout/StatCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchStitches, syncStitches, type StitchEntry } from "@/services/stitchlogApi";
import { calculateStitchStats } from "@/utils/stats";

function App() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, index) => currentYear - index);
  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState<StitchEntry[]>([]);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchStitches(year);
        setEntries(data.entries);
        setLastSyncDate(data.lastSyncDate);
      } catch (loadError) {
        setError("Failed to load stitches");
        console.error(loadError);
      } finally {
        setLoading(false);
      }
    }

    void loadHomeData();
  }, [year]);

  async function handleSync() {
    try {
      setLoading(true);
      setError("");
      await syncStitches(year);
      const data = await fetchStitches(year);
      setEntries(data.entries);
      setLastSyncDate(data.lastSyncDate);
    } catch (syncError) {
      setError("Failed to sync stitches");
      console.error(syncError);
    } finally {
      setLoading(false);
    }
  }

  const stats = calculateStitchStats(entries);
  const visibleLastSyncDate = year === currentYear ? lastSyncDate : null;

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/30 p-5 shadow-[0_24px_80px_rgba(182,129,115,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-rose-400">
            Stitch Heatmap
          </p>
          <h2 className="mt-3 text-2xl text-stone-800 sm:text-3xl lg:text-3xl">
            Your daily stitching rhythm, all in one view.
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-500 sm:text-base">
            A comprehensive view of your stitching habits.
          </p>
        </div>

        <div className="flex flex-col w-[30%] gap-3 items-end sm:flex-row sm:justify-end lg:items-center">
          {year === currentYear && (
            <Button
              variant="outline"
              className="h-11 rounded-full border-rose-200 bg-white/90 px-5 text-sm font-semibold text-rose-500 hover:bg-rose-50"
              onClick={handleSync}
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Sync Heatmap
            </Button>
          )}

          <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="h-11 w-full rounded-full border-stone-200 bg-white/90 sm:w-[180px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((availableYear) => (
                  <SelectItem key={availableYear} value={availableYear.toString()}>
                    {availableYear}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="mt-10 text-left text-sm text-stone-500">Loading stitches...</p>}
      {error && <p className="mt-10 text-left text-sm text-rose-500">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Sessions" value={stats.totalSessions} tone="rose" />
            <StatCard label="Days Stitched" value={stats.totalDaysStitched} tone="amber" />
            <StatCard label="Current Streak" value={`${stats.currentStreak} days`} tone="sky" />
            <StatCard label="Longest Streak" value={`${stats.longestStreak} days`} tone="emerald" />
          </div>

          <Heatmap entries={entries} year={year} lastSyncDate={visibleLastSyncDate} />
        </div>
      )}
    </section>
  );
}

export default App;
