type StatCardProps = {
    label: string;
    value: string | number;
  };
  
  export function StatCard({ label, value }: StatCardProps) {
    return (
      <div className="rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <p className="text-lg font-medium tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
      </div>
    );
  }