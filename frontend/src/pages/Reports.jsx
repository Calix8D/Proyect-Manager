import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import Navbar from '../components/Navbar';

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981'];

const PRIORITY_COLORS = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-green-100 text-green-700',
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
      const a   = document.createElement('a');
      a.href     = url;
      a.download = res.headers['content-disposition']
        ?.split('filename=')[1] ?? `reporte_${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al exportar el reporte.');
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="p-8 text-gray-500">Cargando reportes...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <p className="p-8 text-red-500">{error}</p>
    </div>
  );

  const pieData = summary ? [
    { name: 'Completadas', value: summary.completed    },
    { name: 'En progreso', value: summary.in_progress  },
    { name: 'En revisión', value: summary.in_review    },
    { name: 'Pendientes',  value: summary.pending       },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={`/projects/${id}`} className="text-sm text-indigo-600 hover:underline">
              ← Volver al proyecto
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Reportes — {summary?.project_name}
            </h1>
          </div>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Exportar Excel
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total tareas',  value: summary?.total_tasks,       color: 'text-gray-900'   },
            { label: 'Completadas',   value: summary?.completed,         color: 'text-green-600'  },
            { label: 'En progreso',   value: summary?.in_progress,       color: 'text-yellow-600' },
            { label: '% Avance',      value: `${summary?.progress_percent ?? 0}%`, color: 'text-indigo-600' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Distribución de tareas</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Carga por miembro</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workload} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completadas" fill="#10b981" />
                <Bar dataKey="pending"   name="Pendientes"  fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tareas vencidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Tareas vencidas</h2>
            {overdue.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                {overdue.length} vencida{overdue.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {overdue.length === 0 ? (
            <p className="text-sm text-gray-400">No hay tareas vencidas. ¡Todo al día!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Tarea</th>
                    <th className="pb-2 font-medium">Prioridad</th>
                    <th className="pb-2 font-medium">Fecha límite</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Asignados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overdue.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-800">{task.title}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-red-500">
                        {new Date(task.due_date).toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 capitalize">
                        {task.status.replace('_', ' ')}
                      </td>
                      <td className="py-2 text-gray-400 truncate max-w-[150px]">
                        {task.assignees || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
