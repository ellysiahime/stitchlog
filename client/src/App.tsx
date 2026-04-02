import { useEffect, useState } from "react";
import { fetchStitches, syncStitches, type StitchEntry } from "./services/stitchlogApi";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button"; 
import { RefreshCw } from "lucide-react"
import { Heatmap } from "@/components/layout/Heatmap";
import { StatCard } from "@/components/layout/StatCard";
import { calculateStitchStats } from "@/utils/stats";

function App() {
  const [entries, setEntries] = useState<StitchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentYear = new Date().getFullYear(); 
  const years = [2026, 2025, 2024];
  const [year, setYear] = useState(currentYear);
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchStitches(year);
        setEntries(data);
      } catch (err) {
        setError("Failed to load stitches");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [year]);

  async function handleSync() {
    try {
      setLoading(true);
      setError("");
      await syncStitches(year);
      const data = await fetchStitches(year);
      setEntries(data);
    } catch (err) {
      setError("Failed to sync stitches");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const stats = calculateStitchStats(entries);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-center text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
          StitchLog
        </h1>
  
        <div className="mt-6 flex flex-col gap-4 justify-center">
          
  
          <div className="flex justify-center gap-2">
            {year === currentYear && (
              <Button
                variant="outline"
                className="bg-white"
                onClick={handleSync}
                size="icon"
                aria-label="Sync from Notion"
              >
                <RefreshCw />
              </Button>
            )}
  
            <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading && <div className="mt-10"><p>Loading...</p></div>}
        {error && <div className="mt-10"><p className="text-red-500">{error}</p></div>}
        {!loading && !error && (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex max-w-full flex-col">
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard label="Sessions" value={stats.totalSessions} />
                <StatCard label="Days Stitched" value={stats.totalDaysStitched} />
                <StatCard label="Current Streak" value={`🔥 ${stats.currentStreak}`} />
                <StatCard label="Longest Streak" value={`🏆 ${stats.longestStreak}`} />
              </div>

              <Heatmap entries={entries} year={year} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;