type StatCardProps = {
  label: string;
  value: string | number;
  tone?: "rose" | "amber" | "sky" | "emerald";
};

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  rose: "border-rose-100 bg-rose-50/70 shadow-rose-100/60",
  amber: "border-amber-100 bg-amber-50/70 shadow-amber-100/60",
  sky: "border-sky-100 bg-sky-50/70 shadow-sky-100/60",
  emerald: "border-emerald-100 bg-emerald-50/70 shadow-emerald-100/60",
};

export function StatCard({ label, value, tone = "rose" }: StatCardProps) {
  return (
    <div
      className={`rounded-[1.5rem] border p-5 text-left shadow-[0_16px_35px] backdrop-blur-sm ${TONE_STYLES[tone]}`}
    >
      <p className="text-lg font-medium tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
