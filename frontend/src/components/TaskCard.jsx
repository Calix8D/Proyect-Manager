const PRIORITY = {
  high:   { label: 'Alta',  cls: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20' },
  medium: { label: 'Media', cls: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20' },
  low:    { label: 'Baja',  cls: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20' },
};

export default function TaskCard({ task, onClick }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  // Vencida = fecha límite ANTERIOR a hoy (una tarea que vence hoy no está vencida,
  // igual que el criterio del backend: due_date < CURRENT_DATE).
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const overdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < startOfToday;

  return (
    <div
      onClick={() => onClick?.(task)}
      className="group bg-[#1a212e] border border-white/[0.06] rounded-xl p-3 cursor-pointer hover:border-indigo-500/40 hover:bg-[#1e2636] transition-colors"
    >
      <p className="text-sm font-medium text-slate-100 mb-2 group-hover:text-white">{task.title}</p>

      <div className="flex items-center justify-between">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${p.cls}`}>
          {p.label}
        </span>
        {task.due_date && (
          <span className={`text-[11px] ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
            {new Date(task.due_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
}
