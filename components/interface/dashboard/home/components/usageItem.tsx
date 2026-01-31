export default function UsageItem({
  label,
  current,
  limit,
  displayCurrent,
  displayLimit,
  animate,
}: {
  label: string;
  current: number;
  limit: number;
  displayCurrent: string;
  displayLimit: string;
  animate: boolean;
}) {
  const percentage = Math.min((current / limit) * 100, 100);
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-between py-2 text-[13px] border-b border-neutral-800 last:border-0 group">
      <div className="flex items-center space-x-3">
        {/* Animated SVG Circle */}
        <div className="relative w-4 h-4">
          <svg
            className="w-full h-full -rotate-90 scale-120"
            viewBox="0 0 20 20"
          >
            {/* Background Ring */}
            <circle
              cx="10"
              cy="10"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2"
              className="text-neutral-700"
            />
            {/* Progress Ring */}
            <circle
              cx="10"
              cy="10"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={circumference}
              style={{
                strokeDashoffset: animate ? offset : circumference,
                transition: "stroke-dashoffset 1.5s ease-out",
              }}
              className="text-blue-500"
            />
          </svg>
        </div>
        <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
          {label}
        </span>
      </div>
      <div className="text-neutral-400 font-mono">
        <span className="text-neutral-200">{displayCurrent}</span>
        <span className="mx-1">/</span>
        <span>{displayLimit}</span>
      </div>
    </div>
  );
}
