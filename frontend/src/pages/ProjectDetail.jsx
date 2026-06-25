import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import ProgressBar from '../components/ProgressBar';

const COLUMNS = [
  { key: 'todo',        label: 'Por hacer' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'review',      label: 'En revisión' },
  { key: 'done',        label: 'Completado' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo' });

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`),
    ]).then(([projRes, taskRes]) => {
      setProject(projRes.data.data);
      setTasks(taskRes.data.data);
      setLoading(false);
    });
  }, [id]);

  async function handleCreateTask(e) {
    e.preventDefault();
    const { data } = await api.post('/tasks', { ...taskForm, project_id: parseInt(id) });
    setTasks([data.data, ...tasks]);
    setShowTaskForm(false);
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo' });
  }

  async function handleStatusChange(task, newStatus) {
    await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="p-8 text-gray-500">Cargando...</p></div>;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-sm text-gray-500 mt-1">{project.description}</p>}
          </div>
          <div className="flex gap-2">
            <Link
              to={`/projects/${id}/reports`}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Ver reportes
            </Link>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Nueva tarea
            </button>
          </div>
        </div>

        {/* Progreso */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-6 mb-3">
            <span className="text-sm text-gray-600">{total} tareas totales</span>
            <span className="text-sm text-gray-600">{completed} completadas</span>
            <span className="text-sm text-gray-600">{project.members?.length || 0} miembros</span>
          </div>
          <ProgressBar percent={progress} />
        </div>

        {/* Formulario nueva tarea */}
        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
            <h2 className="font-semibold text-gray-800">Nueva tarea</h2>
            <input
              required
              placeholder="Título de la tarea"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <div className="flex gap-3">
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
              <select
                value={taskForm.status}
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Crear</button>
              <button type="button" onClick={() => setShowTaskForm(false)} className="text-gray-500 px-4 py-2 text-sm">Cancelar</button>
            </div>
          </form>
        )}

        {/* Board de tareas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div key={task.id}>
                      <TaskCard task={task} />
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value)}
                        className="mt-1 w-full text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-500"
                      >
                        {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
