export type StitchEntry = {
    date: string;
  };
  
  export type HeatmapDay = {
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
    month: number;
    dayOfWeek: number;
  };
  
  export type HeatmapWeek = HeatmapDay[];
  
  export function buildHeatmapData(entries: StitchEntry[]) {
    const map: Record<string, number> = {};
  
    for (const entry of entries) {
      const date = entry.date;
      map[date] = (map[date] ?? 0) + 1;
    }
  
    return map;
  }
  
  export function getLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  }
  
  export function generateYearDays(year: number, entries: StitchEntry[]): HeatmapDay[] {
    const counts = buildHeatmapData(entries);
    const days: HeatmapDay[] = [];
  
    const current = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
  
    while (current <= end) {
      const date = formatLocalDate(current);
      const count = counts[date] ?? 0;
  
      days.push({
        date,
        count,
        level: getLevel(count),
        month: current.getMonth(),
        dayOfWeek: current.getDay(),
      });
  
      current.setDate(current.getDate() + 1);
    }
  
    return days;
  }
  
  export function groupDaysIntoWeeks(days: HeatmapDay[]): HeatmapWeek[] {
    const weeks: HeatmapWeek[] = [];
    let currentWeek: HeatmapWeek = [];
  
    const firstDayOfWeek = days[0]?.dayOfWeek ?? 0;
  
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(createEmptyDay());
    }
  
    for (const day of days) {
      currentWeek.push(day);
  
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
  
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(createEmptyDay());
      }
      weeks.push(currentWeek);
    }
  
    return weeks;
  }
  
  export function getMonthLabels(weeks: HeatmapWeek[]) {
    return weeks.map((week, index) => {
      const firstRealDay = week.find((day) => day.date !== "");
  
      if (!firstRealDay) return "";
  
      const monthName = MONTH_LABELS[firstRealDay.month];
      const prevWeek = weeks[index - 1];
      const prevRealDay = prevWeek?.find((day) => day.date !== "");
  
      if (!prevRealDay || prevRealDay.month !== firstRealDay.month) {
        return monthName;
      }
  
      return "";
    });
  }
  
  function createEmptyDay(): HeatmapDay {
    return {
      date: "",
      count: 0,
      level: 0,
      month: -1,
      dayOfWeek: -1,
    };
  }
  
  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }
  
  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];