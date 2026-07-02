import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import Layout from '../components/Layout';

const COLORS = ['#10b981', '#6366f1', '#a855f7', '#f59e0b'];

const PRIORITY_COLORS = {
  high:   'bg-red-500/15 text-red-300',
  medium: 'bg-amber-500/15 text-amber-300',
  low:    'bg-emerald-500/15 text-emerald-300',
};

// El servicio de reportes envía fechas como 'YYYY-MM-DD'; se formatea directo del
// texto porque new Date('YYYY-MM-DD') asume UTC y puede mostrar el día anterior.
const formatDate = (d) => {
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const tooltipStyle = {
  backgroundColor: '#1a212e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  color: '#e2e8f0',
  fontSize: '12px',
};

export default function Reports() {
  const { id } = useParams();
  const [summary,  setSummary]  = useState(null);
  const [workload, setWorkload] = useState([]);
  const [overdue,  setOverdue]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/reports/${id}/summary`),
      api.get(`/reports/${id}/workload`),
      api.get(`/reports/${id}/overdue`),
    ])
      .then(([summaryRes, workloadRes, overdueRes]) => {
        setSummary(summaryRes.data.data);
        setWorkload(workloadRes.data.data);
        setOverdue(overdueRes.data.data);
      })
      .catch(() => setError('No se pudieron cargar los reportes.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleExport() {
    try {
      const res = await api.get(`/reports/${id}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      const match = res.headers['content-disposition']?.match(/filename="?([^";]+)"?/);
      a.download = match?.[1] ?? `reporte_${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar el reporte.');
    }
  }

  if (loading) return <Layout><p className="text-slate-400">Cargando reportes…</p></Layout>;
  if (error) return <Layout><p className="text-red-300">{error}</p></Layout>;

  const pieData = summary ? [
    { name: 'Completadas', value: summary.completed   },
    { name: 'En progreso', value: summary.in_progress },
    { name: 'En revisión', value: summary.in_review   },
    { name: 'Pendientes',  value: summary.pending      },
  ].filter((d) => d.value > 0) : [];

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <Link to={`/projects/${id}`} className="text-xs text-slate-500 hover:text-slate-300">← Volver al proyecto</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Reportes — {summary?.project_name}</h1>
        </div>
        <button onClick={handleExport} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium px-4 py-2 transition-colors bg-emerald-600 text-white hover:bg-emerald-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Exportar Excel
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total tareas', value: summary?.total_tasks,  color: 'text-white' },
          { label: 'Completadas',  value: summary?.completed,    color: 'text-emerald-300' },
          { label: 'En progreso',  value: summary?.in_progress,  color: 'text-indigo-300' },
          { label: '% Avance',     value: `${summary?.progress_percent ?? 0}%`, color: 'text-violet-300' },
        ].map((m) => (
          <div key={m.label} className="card p-4 text-center">
            <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-400 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">Distribución de tareas</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-slate-500 h-[250px] flex items-center justify-center">Sin tareas para mostrar.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value"
                  stroke="#141a24" strokeWidth={3}
                  label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                  style={{ fontSize: 12, fill: '#94a3b8' }}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">Carga por miembro</h2>
          {workload.length === 0 ? (
            <p className="text-sm text-slate-500 h-[250px] flex items-center justify-center">Sin datos de carga.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workload} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }} />
                <Bar dataKey="completed" name="Completadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending"   name="Pendientes"  fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tareas vencidas */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Tareas vencidas</h2>
          {overdue.length > 0 && (
            <span className="text-xs bg-red-500/15 text-red-300 px-2 py-1 rounded-full font-medium ring-1 ring-red-500/20">
              {overdue.length} vencida{overdue.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {overdue.length === 0 ? (
          <p className="text-sm text-slate-500">No hay tareas vencidas. ¡Todo al día! ✅</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-white/[0.06]">
                  <th className="pb-2 font-medium">Tarea</th>
                  <th className="pb-2 font-medium">Prioridad</th>
                  <th className="pb-2 font-medium">Fecha límite</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Asignados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {overdue.map((task) => (
                  <tr key={task.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 font-medium text-slate-200">{task.title}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-red-400">{formatDate(task.due_date)}</td>
                    <td className="py-2.5 pr-4 text-slate-400 capitalize">{task.status.replace('_', ' ')}</td>
                    <td className="py-2.5 text-slate-500 truncate max-w-[150px]">{task.assignees || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
