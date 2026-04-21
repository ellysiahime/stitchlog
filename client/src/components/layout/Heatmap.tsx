import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
  import {
    generateYearDays,
    getMonthLabels,
    groupDaysIntoWeeks,
    type StitchEntry,
  } from "@/utils/heatmap";
  
type HeatmapProps = {
  entries: StitchEntry[];
  year: number;
  lastSyncDate: string | null;
};
  
  const LEVEL_STYLES: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "bg-zinc-200",
    1: "bg-pink-100",
    2: "bg-pink-200",
    3: "bg-pink-300",
    4: "bg-pink-400",
  };

  function formatDateWithOrdinal(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDate();
    const ordinal =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
    return `${month} ${day}${ordinal}`;
  }
  
  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function formatLastSyncDate(dateString: string) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  }

  function formatLegendLabel(level: 0 | 1 | 2 | 3 | 4) {
    if (level === 4) {
      return "4+ entries";
    }

    return `${level} ${level === 1 ? "entry" : "entries"}`;
  }
  
  export function Heatmap({ entries, year, lastSyncDate }: HeatmapProps) {
    const days = generateYearDays(year, entries);
    const weeks = groupDaysIntoWeeks(days);
    const monthLabels = getMonthLabels(weeks);
  
    return (
      <TooltipProvider>
        <div className="w-full overflow-x-auto">
          <div className="inline-block min-w-max rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 grid grid-flow-col auto-cols-[14px] gap-1 pl-8 text-[14px] text-muted-foreground">
              {monthLabels.map((label, index) => (
                <div key={`${label}-${index}`} className="h-4 overflow-visible whitespace-nowrap">
                  {label}
                </div>
              ))}
            </div>
  
            <div className="flex gap-2">
              <div className="grid grid-rows-7 gap-1 pt-[2px] text-[14px] text-muted-foreground">
                {WEEKDAY_LABELS.map((label, index) => (
                  <div key={index} className="flex h-[14px] items-center justify-end pr-1">
                    {label}
                  </div>
                ))}
              </div>
  
              <div className="grid grid-flow-col auto-cols-[14px] gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-rows-7 gap-1">
                    {week.map((day, dayIndex) => {
                      const isEmpty = day.date === "";
  
                      return (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger>
                            <div
                              className={[
                                "h-[14px] w-[14px] rounded-[4px] transition duration-150",
                                isEmpty
                                  ? "bg-transparent"
                                  : `${LEVEL_STYLES[day.level]} hover:scale-110 hover:ring-2 hover:ring-pink-300/60`,
                              ].join(" ")}
                            />
                          </TooltipTrigger>
  
                          {!isEmpty && (
                            <TooltipContent side="top" className="rounded-lg">
                              <p className="text-[12px]">
                                <span className="font-medium">{day.count}</span>{" "}
                                {day.count === 1 ? "entry" : "entries"} on {formatDateWithOrdinal(day.date)}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
  
            <div className="flex justify-between">
              <div className="mt-4 flex ">
                {lastSyncDate && (
                  <p className="mt-2 text-right text-[14px] text-muted-foreground">
                    Last Sync on {formatLastSyncDate(lastSyncDate)}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[14px] text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <Tooltip key={level}>
                    <TooltipTrigger>
                      <div
                        className={`h-[12px] w-[12px] rounded-[3px] ${LEVEL_STYLES[level as 0 | 1 | 2 | 3 | 4]}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="rounded-lg">
                      <p className="text-[12px]">
                        {formatLegendLabel(level as 0 | 1 | 2 | 3 | 4)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }
