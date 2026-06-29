import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { key: 'todo',        label: 'Por hacer' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'review',      label: 'En revisión' },
  { key: 'done',        label: 'Completado' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [addUserId, setAddUserId] = useState('');
  const [memberError, setMemberError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo' });

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`),
    ])
      .then(([projRes, taskRes]) => {
        setProject(projRes.data.data);
        setMembers(projRes.data.data.members || []);
        setTasks(taskRes.data.data);
      })
      .catch(() => setError('No se pudo cargar el proyecto.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Solo el admin o el dueño del proyecto pueden gestionar miembros.
  const canManage = user?.role === 'admin' || project?.owner_id === user?.id;

  // Carga el directorio de usuarios cuando el gestor lo necesita.
  useEffect(() => {
    if (!canManage) return;
    api.get('/users').then(({ data }) => setUsers(data.data)).catch(() => {});
  }, [canManage]);

  async function handleAddMember(e) {
    e.preventDefault();
    setMemberError('');
    if (!addUserId) return;
    try {
      const { data } = await api.post(`/projects/${id}/members`, {
        user_id: parseInt(addUserId),
        role: 'member',
      });
      const u = users.find((x) => x.id === parseInt(addUserId));
      setMembers([
        ...members,
        { id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url, role: data.data.role, joined_at: data.data.joined_at },
      ]);
      setAddUserId('');
    } catch (err) {
      setMemberError(err.response?.data?.message || 'No se pudo agregar el miembro.');
    }
  }

  async function handleRemoveMember(userId) {
    setMemberError('');
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setMembers(members.filter((m) => m.id !== userId));
    } catch (err) {
      setMemberError(err.response?.data?.message || 'No se pudo quitar el miembro.');
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setTaskError('');
    try {
      const { data } = await api.post('/tasks', { ...taskForm, project_id: parseInt(id) });
      setTasks([data.data, ...tasks]);
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo' });
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Error al crear la tarea.');
    }
  }

  async function handleStatusChange(task, newStatus) {
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch {
      // revierte visualmente si falla
      setTasks((prev) => [...prev]);
    }
  }

  const memberName = (uid) => members.find((m) => m.id === uid)?.name || '—';

  // Reconstruye los campos de asignados de una tarea a partir de los IDs.
  const withAssignees = (task, ids) => ({
    ...task,
    assignee_ids: ids,
    assignees: ids.map(memberName).filter((n) => n !== '—').join(', '),
  });

  async function handleAssign(task, userId) {
    try {
      await api.post(`/tasks/${task.id}/assign`, { user_id: userId });
      const ids = [...(task.assignee_ids || []), userId];
      setTasks(tasks.map((t) => (t.id === task.id ? withAssignees(t, ids) : t)));
    } catch {
      // ignora si ya estaba asignado o falla
    }
  }

  async function handleUnassign(task, userId) {
    try {
      await api.delete(`/tasks/${task.id}/assign/${userId}`);
      const ids = (task.assignee_ids || []).filter((id) => id !== userId);
      setTasks(tasks.map((t) => (t.id === task.id ? withAssignees(t, ids) : t)));
    } catch {
      // ignora si falla
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="p-8 text-gray-500">Cargando...</p></div>;
  if (error || !project) return <div className="min-h-screen bg-gray-50"><Navbar /><p className="p-8 text-red-500">{error || 'Proyecto no encontrado.'}</p></div>;

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
            <span className="text-sm text-gray-600">{members.length} miembros</span>
          </div>
          <ProgressBar percent={progress} />
        </div>

        {/* Miembros del proyecto */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Miembros</h2>
          {memberError && <p className="text-red-500 text-sm mb-2">{memberError}</p>}

          <div className="flex flex-wrap gap-2 mb-3">
            {members.length === 0 && <p className="text-sm text-gray-400">Aún no hay miembros.</p>}
            {members.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                {m.name}
                <span className="text-gray-400">· {m.role}</span>
                {canManage && m.id !== project.owner_id && (
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Quitar del proyecto"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>

          {canManage && (
            <form onSubmit={handleAddMember} className="flex gap-2">
              <select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Agregar miembro…</option>
                {users
                  .filter((u) => !members.some((m) => m.id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
              </select>
              <button
                type="submit"
                disabled={!addUserId}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Agregar
              </button>
            </form>
          )}
        </div>

        {/* Formulario nueva tarea */}
        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
            <h2 className="font-semibold text-gray-800">Nueva tarea</h2>
            {taskError && <p className="text-red-500 text-sm">{taskError}</p>}
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
                  {colTasks.map((task) => {
                    const assigned = task.assignee_ids || [];
                    const available = members.filter((m) => !assigned.includes(m.id));
                    return (
                      <div key={task.id}>
                        <TaskCard task={task} />

                        {/* Asignados */}
                        {assigned.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {assigned.map((uid) => (
                              <span key={uid} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded-full">
                                {memberName(uid)}
                                <button
                                  onClick={() => handleUnassign(task, uid)}
                                  className="hover:text-red-500"
                                  title="Quitar asignación"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          className="mt-1 w-full text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-500"
                        >
                          {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>

                        {available.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => e.target.value && handleAssign(task, parseInt(e.target.value))}
                            className="mt-1 w-full text-xs border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-500"
                          >
                            <option value="">+ Asignar miembro…</option>
                            {available.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
