const PRIORITY_COLORS = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
};

export default function TaskCard({ task, onClick }) {
  return (
    <div
      onClick={() => onClick?.(task)}
      className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="text-sm font-medium text-gray-800 mb-2">{task.title}</p>

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="text-xs text-gray-400">
            {new Date(task.due_date).toLocaleDateString('es-ES')}
          </span>
        )}
      </div>
    </div>
  );
}
