import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  active:    { label: 'Activo',     color: 'bg-green-100 text-green-700' },
  on_hold:   { label: 'En pausa',   color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => setProjects(data.data))
      .catch(() => setError('No se pudieron cargar los proyectos.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    try {
      const { data } = await api.post('/projects', form);
      setProjects([data.data, ...projects]);
      setShowForm(false);
      setForm({ name: '', description: '', priority: 'medium' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error al crear el proyecto.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis proyectos</h1>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Nuevo proyecto
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-800">Nuevo proyecto</h2>
            {formError && <p className="text-red-500 text-sm">{formError}</p>}
            <input
              required
              placeholder="Nombre del proyecto"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Prioridad baja</option>
              <option value="medium">Prioridad media</option>
              <option value="high">Prioridad alta</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
                Crear
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando proyectos...</p>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No tienes proyectos aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => {
              const status = STATUS_LABELS[p.status] || STATUS_LABELS.active;
              const progress = p.total_tasks > 0
                ? Math.round((p.completed_tasks / p.total_tasks) * 100)
                : 0;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  {p.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                  )}
                  <ProgressBar percent={progress} />
                  <p className="text-xs text-gray-400 mt-3">
                    {p.total_tasks || 0} tareas · Owner: {p.owner_name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
