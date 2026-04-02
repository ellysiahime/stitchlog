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
    <div className="min-h-screen bg-pink-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
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
            <p className="mb-2 text-sm text-gray-600">
              Entries found: {entries.length}
            </p>

            <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
              {JSON.stringify(entries.slice(0, 20), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;