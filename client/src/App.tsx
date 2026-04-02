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
import { Heatmap } from "@/components/heatmap/Heatmap";

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

  

  return (
    <div className="min-h-screen">
      <div className="mx-auto p-6">
        <h1>StitchLog</h1>
        <div  className="flex justify-center p-6 gap-2">
          <Select value={year.toString()} onValueChange={(value) => setYear(Number(value))}>
            <SelectTrigger className="w-[180px]">
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
            {year === currentYear && ( // Show the Sync button only if the selected year is the current year
              <Button variant="outline" onClick={handleSync} size="icon" aria-label="Submit">
                <RefreshCw />
              </Button>
            )}
        </div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div>
            <p className="mb-4 text-sm text-gray-600">
              {entries.length} stitching session in {year}
            </p>

            <Heatmap entries={entries} year={year} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;