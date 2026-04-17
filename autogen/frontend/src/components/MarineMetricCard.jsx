const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const MarineMetricCard = ({
  title,
  value,
  unit,
  icon,
  max = 100,
  cautionFrom = 45,
  dangerFrom = 75,
  decimals = 1,
  higherIsRiskier = true,
}) => {
  const numeric = Number(value) || 0;
  const valuePct = clamp((numeric / max) * 100, 0, 100);
  const riskPct = higherIsRiskier ? valuePct : 100 - valuePct;

  const statusTone =
    riskPct >= dangerFrom
      ? "text-tertiary"
      : riskPct >= cautionFrom
        ? "text-secondary"
        : "text-primary";

  const markerTone =
    riskPct >= dangerFrom
      ? "bg-tertiary"
      : riskPct >= cautionFrom
        ? "bg-secondary"
        : "bg-primary";

  const bandLeft = higherIsRiskier ? "bg-[rgba(0,69,13,0.24)]" : "bg-[rgba(124,0,10,0.24)]";
  const bandMid = "bg-[rgba(131,84,0,0.22)]";
  const bandRight = higherIsRiskier ? "bg-[rgba(124,0,10,0.24)]" : "bg-[rgba(0,69,13,0.24)]";
  const fillGradient = higherIsRiskier
    ? "linear-gradient(90deg,rgba(0,69,13,0.6),rgba(27,94,32,0.65),rgba(131,84,0,0.65),rgba(124,0,10,0.7))"
    : "linear-gradient(90deg,rgba(124,0,10,0.7),rgba(131,84,0,0.65),rgba(27,94,32,0.65),rgba(0,69,13,0.6))";

  return (
    <div className="slide-up rounded-[28px] bg-white p-5 shadow-lg transition duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-outline">{title}</p>
        <span className={`material-symbols-outlined ${statusTone}`}>{icon}</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <span className={`text-5xl font-black ${statusTone}`}>{numeric.toFixed(decimals).replace(/\.0$/, "")}</span>
        <span className="pb-1 text-lg font-bold text-outline">{unit}</span>
      </div>

      <div className="relative mt-4">
        <div className="h-3 overflow-hidden rounded-full bg-surface-container-highest">
          <div className={`absolute inset-y-0 left-0 w-[45%] ${bandLeft}`} />
          <div className={`absolute inset-y-0 left-[45%] w-[30%] ${bandMid}`} />
          <div className={`absolute inset-y-0 left-[75%] w-[25%] ${bandRight}`} />
          <div
            className="h-full rounded-full transition-all duration-1000"
            // Reverse gradient direction for inverse-risk metrics such as visibility.
            style={{ width: `${valuePct}%`, background: fillGradient }}
          />
        </div>

        <div
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-all duration-1000 ${markerTone} animate-pulse`}
          style={{ left: `calc(${valuePct}% - 10px)` }}
        />
      </div>
    </div>
  );
};

export default MarineMetricCard;
