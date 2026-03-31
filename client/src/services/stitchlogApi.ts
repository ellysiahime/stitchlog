export type StitchEntry = {
    date: string;
  };
  
  export async function fetchStitches(year: number): Promise<StitchEntry[]> {
    const response = await fetch(`/api/stitches?year=${year}`);
  
    if (!response.ok) {
      throw new Error("Failed to fetch stitches");
    }
  
    return response.json();
  }