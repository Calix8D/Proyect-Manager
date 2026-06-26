export default function ProgressBar({ percent = 0 }) {
  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percent}% completado</p>
    </div>
  );
}
