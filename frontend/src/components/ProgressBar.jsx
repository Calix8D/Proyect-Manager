export default function ProgressBar({ percent = 0, showLabel = true }) {
  return (
    <div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-slate-400 mt-1.5">{percent}% completado</p>}
    </div>
  );
}
