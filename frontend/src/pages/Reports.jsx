import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../services/api';
import Navbar from '../components/Navbar';

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#10b981'];

export default function Reports() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:8000/reports/project/${id}/summary`).then((r) => r.json()),
      fetch(`http://localhost:8000/reports/project/${id}/workload`).then((r) => r.json()),
    ]).then(([summaryRes, workloadRes]) => {
      setSummary(summaryRes.data);
      setWorkload(workloadRes.data);
      setLoading(false);
    });
  }, [id]);

  function handleExport() {
    window.open(`http://localhost:8000/reports/project/${id}/export`, '_blank');
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="p-8 text-gray-500">Cargando reportes...</p></div>;

  const pieData = summary ? [
    { name: 'Completadas', value: summary.completed },
    { name: 'En progreso', value: summary.in_progress },
    { name: 'En revisión', value: summary.in_review },
    { name: 'Pendientes',  value: summary.pending },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={`/projects/${id}`} className="text-sm text-indigo-600 hover:underline">← Volver al proyecto</Link>
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
            { label: 'Total tareas',  value: summary?.total_tasks,  color: 'text-gray-900' },
            { label: 'Completadas',   value: summary?.completed,    color: 'text-green-600' },
            { label: 'En progreso',   value: summary?.in_progress,  color: 'text-yellow-600' },
            { label: '% Avance',      value: `${summary?.progress_percent}%`, color: 'text-indigo-600' },
          ].map((m) => (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-gray-500 mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gráfica de dona */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Distribución de tareas</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Carga por miembro */}
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
      </main>
    </div>
  );
}
