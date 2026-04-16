type StitchEntry = {
    date: string;
  };
  
  export type StitchStats = {
    totalSessions: number;
    totalDaysStitched: number;
    currentStreak: number;
    longestStreak: number;
  };
  
  export function calculateStitchStats(entries: StitchEntry[]): StitchStats {
    const totalSessions = entries.length;
  
    const uniqueDates = [...new Set(entries.map((entry) => entry.date))].sort();
  
    const totalDaysStitched = uniqueDates.length;
  
    const currentStreak = calculateCurrentStreak(uniqueDates);
    const longestStreak = calculateLongestStreak(uniqueDates);
  
    return {
      totalSessions,
      totalDaysStitched,
      currentStreak,
      longestStreak,
    };
  }
  
  function calculateCurrentStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
  
    const dateSet = new Set(dates);
    const today = startOfLocalDay(new Date());
    const yesterday = addDays(today, -1);
  
    let streak = 0;
    let cursor = dateSet.has(formatLocalDate(today)) ? today : yesterday;
  
    while (dateSet.has(formatLocalDate(cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    }
  
    return streak;
  }
  
  function calculateLongestStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
  
    let longest = 1;
    let current = 1;
  
    for (let i = 1; i < dates.length; i++) {
      const prev = parseLocalDate(dates[i - 1]);
      const curr = parseLocalDate(dates[i]);
  
      const diffInDays = getDayDifference(prev, curr);
  
      if (diffInDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
  
    return longest;
  }
  
  function parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  
  function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }
  
  function startOfLocalDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  
  function addDays(date: Date, amount: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return startOfLocalDay(next);
  }
  
  function getDayDifference(a: Date, b: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  
    return Math.round((utcB - utcA) / msPerDay);
  }
