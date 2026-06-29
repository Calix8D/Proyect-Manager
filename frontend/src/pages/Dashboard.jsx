import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  active:    { label: 'Activo',     color: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20' },
  on_hold:   { label: 'En pausa',   color: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20' },
  completed: { label: 'Completado', color: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/20' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/20' },
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
    <Layout>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis proyectos</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} en total
          </p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <span className="text-base leading-none">+</span> Nuevo proyecto
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-white">Nuevo proyecto</h2>
          {formError && <p className="text-red-300 text-sm">{formError}</p>}
          <input
            required
            placeholder="Nombre del proyecto"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
          <textarea
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input"
            rows={2}
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="input max-w-[200px]"
          >
            <option value="low">Prioridad baja</option>
            <option value="medium">Prioridad media</option>
            <option value="high">Prioridad alta</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Crear</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-36">
              <div className="h-4 w-2/3 bg-white/10 rounded mb-3" />
              <div className="h-3 w-full bg-white/5 rounded mb-2" />
              <div className="h-2 w-full bg-white/10 rounded-full mt-6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-red-300 text-sm">{error}</p>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-3 text-2xl">📁</div>
          <p className="text-slate-300 font-medium">No tienes proyectos aún</p>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === 'admin' ? 'Crea uno con el botón “Nuevo proyecto”.' : 'Pídele a un admin que te agregue a un proyecto.'}
          </p>
        </div>
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
                className="card p-5 cursor-pointer hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-white text-sm leading-snug">{p.name}</h3>
                  <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                {p.description && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{p.description}</p>
                )}
                <ProgressBar percent={progress} />
                <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                  <span>{p.total_tasks || 0} tareas</span>
                  <span className="truncate">Owner: {p.owner_name}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
