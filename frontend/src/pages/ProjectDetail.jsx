import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { key: 'todo',        label: 'Por hacer',   dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'En progreso', dot: 'bg-indigo-400' },
  { key: 'review',      label: 'En revisión', dot: 'bg-amber-400' },
  { key: 'done',        label: 'Completado',  dot: 'bg-emerald-400' },
];

const cardSelect = 'mt-1 w-full text-xs bg-[#0f1520] border border-white/10 rounded px-1.5 py-1 text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50';

const ROLE_LABELS = { leader: 'Líder', member: 'Miembro', viewer: 'Solo lectura' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [addUserId, setAddUserId] = useState('');
  const [addRole, setAddRole] = useState('member');
  const [memberError, setMemberError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskError, setTaskError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });

  // Modal de detalle de tarea (editar / borrar / comentarios)
  const [selectedTask, setSelectedTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [modalError, setModalError] = useState('');

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
        role: addRole,
      });
      const u = users.find((x) => x.id === parseInt(addUserId));
      setMembers([
        ...members,
        { id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url, role: data.data.role, joined_at: data.data.joined_at },
      ]);
      setAddUserId('');
      setAddRole('member');
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

  async function handleChangeRole(userId, role) {
    setMemberError('');
    try {
      await api.patch(`/projects/${id}/members/${userId}`, { role });
      setMembers(members.map((m) => (m.id === userId ? { ...m, role } : m)));
    } catch (err) {
      setMemberError(err.response?.data?.message || 'No se pudo cambiar el rol.');
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setTaskError('');
    try {
      const { data } = await api.post('/tasks', { ...taskForm, project_id: parseInt(id) });
      setTasks([data.data, ...tasks]);
      setShowTaskForm(false);
      setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' });
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Error al crear la tarea.');
    }
  }

  async function handleStatusChange(task, newStatus) {
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch {
      setTasks((prev) => [...prev]);
    }
  }

  const memberName = (uid) => members.find((m) => m.id === uid)?.name || '—';

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
    } catch { /* ignora */ }
  }

  async function handleUnassign(task, userId) {
    try {
      await api.delete(`/tasks/${task.id}/assign/${userId}`);
      const ids = (task.assignee_ids || []).filter((id) => id !== userId);
      setTasks(tasks.map((t) => (t.id === task.id ? withAssignees(t, ids) : t)));
    } catch { /* ignora */ }
  }

  const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  async function openTask(task) {
    setSelectedTask(task);
    setModalError('');
    setNewComment('');
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      due_date: toDateInput(task.due_date),
    });
    setComments([]);
    try {
      const { data } = await api.get(`/comments?task_id=${task.id}`);
      setComments(data.data);
    } catch { /* sin comentarios */ }
  }

  function closeTask() {
    setSelectedTask(null);
    setComments([]);
    setNewComment('');
    setModalError('');
  }

  async function handleUpdateTask(e) {
    e.preventDefault();
    setModalError('');
    try {
      const payload = { ...editForm, due_date: editForm.due_date || null };
      const { data } = await api.put(`/tasks/${selectedTask.id}`, payload);
      setTasks(tasks.map((t) => (t.id === selectedTask.id ? { ...t, ...data.data } : t)));
      setSelectedTask((t) => ({ ...t, ...data.data }));
    } catch (err) {
      setModalError(err.response?.data?.message || 'No se pudo guardar la tarea.');
    }
  }

  async function handleDeleteTask() {
    if (!window.confirm('¿Eliminar esta tarea? No se puede deshacer.')) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      setTasks(tasks.filter((t) => t.id !== selectedTask.id));
      closeTask();
    } catch (err) {
      setModalError(err.response?.data?.message || 'No se pudo eliminar la tarea.');
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post('/comments', { task_id: selectedTask.id, content: newComment.trim() });
      setComments([...comments, { ...data.data, author_name: user.name, author_avatar: user.avatar_url }]);
      setNewComment('');
    } catch (err) {
      setModalError(err.response?.data?.message || 'No se pudo enviar el comentario.');
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch { /* ignora */ }
  }

  if (loading) return <Layout><p className="text-slate-400">Cargando…</p></Layout>;
  if (error || !project) return <Layout><p className="text-red-300">{error || 'Proyecto no encontrado.'}</p></Layout>;

  // Rol efectivo del usuario dentro del proyecto → define qué acciones puede realizar.
  // Un admin global se trata como 'leader'. viewer = solo lectura.
  const myProjectRole = user?.role === 'admin'
    ? 'leader'
    : members.find((m) => m.id === user?.id)?.role;
  const canEdit = myProjectRole === 'leader' || myProjectRole === 'member';
  const isViewer = !!myProjectRole && !canEdit;
  // Asignar/desasignar a OTROS miembros es privilegio de líder/owner/admin.
  // Un member solo puede autoasignarse (ver botón "Asignarme").
  const canAssignOthers = myProjectRole === 'leader';

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-300">← Proyectos</Link>
          <h1 className="text-2xl font-bold text-white mt-1">
            {project.name}
            {isViewer && (
              <span className="ml-2 align-middle text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 ring-1 ring-white/10">
                Solo lectura
              </span>
            )}
          </h1>
          {project.description && <p className="text-sm text-slate-400 mt-1 max-w-2xl">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${id}/reports`} className="btn-ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            Reportes
          </Link>
          {canEdit && (
            <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary">
              <span className="text-base leading-none">+</span> Nueva tarea
            </button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-3 text-sm">
          <span className="text-slate-300"><span className="font-semibold text-white">{total}</span> tareas</span>
          <span className="text-slate-300"><span className="font-semibold text-emerald-300">{completed}</span> completadas</span>
          <span className="text-slate-300"><span className="font-semibold text-indigo-300">{members.length}</span> miembros</span>
        </div>
        <ProgressBar percent={progress} />
      </div>

      {/* Miembros */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-3">Miembros</h2>
        {memberError && <p className="text-red-300 text-sm mb-2">{memberError}</p>}

        <div className="flex flex-wrap gap-2 mb-3">
          {members.length === 0 && <p className="text-sm text-slate-500">Aún no hay miembros.</p>}
          {members.map((m) => (
            <span key={m.id} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-200 text-xs px-3 py-1.5 rounded-full">
              <span className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] text-white font-semibold">
                {m.name?.[0]?.toUpperCase()}
              </span>
              {m.name}
              {canManage && m.id !== project.owner_id ? (
                <select
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.id, e.target.value)}
                  className="bg-transparent text-slate-400 text-xs rounded px-1 py-0.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
                  title="Cambiar rol"
                >
                  <option value="leader">Líder</option>
                  <option value="member">Miembro</option>
                  <option value="viewer">Solo lectura</option>
                </select>
              ) : (
                <span className="text-slate-500">· {ROLE_LABELS[m.role] || m.role}</span>
              )}
              {canManage && m.id !== project.owner_id && (
                <button onClick={() => handleRemoveMember(m.id)} className="text-slate-500 hover:text-red-400" title="Quitar del proyecto">✕</button>
              )}
            </span>
          ))}
        </div>

        {canManage && (
          <form onSubmit={handleAddMember} className="flex flex-wrap gap-2">
            <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className="input max-w-xs">
              <option value="">Agregar miembro…</option>
              {users.filter((u) => !members.some((m) => m.id === u.id)).map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <select value={addRole} onChange={(e) => setAddRole(e.target.value)} className="input max-w-[160px]" title="Rol en el proyecto">
              <option value="leader">Líder</option>
              <option value="member">Miembro</option>
              <option value="viewer">Solo lectura</option>
            </select>
            <button type="submit" disabled={!addUserId} className="btn-primary">Agregar</button>
          </form>
        )}
      </div>

      {/* Formulario nueva tarea */}
      {showTaskForm && canEdit && (
        <form onSubmit={handleCreateTask} className="card p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-white">Nueva tarea</h2>
          {taskError && <p className="text-red-300 text-sm">{taskError}</p>}
          <input required placeholder="Título de la tarea" value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="input" />
          <textarea placeholder="Descripción (opcional)" value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="input" rows={2} />
          <div className="flex flex-wrap gap-3">
            <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="input max-w-[140px]">
              <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option>
            </select>
            <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="input max-w-[160px]">
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} className="input max-w-[170px]" title="Fecha límite (opcional)" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Crear</button>
            <button type="button" onClick={() => setShowTaskForm(false)} className="btn-ghost">Cancelar</button>
          </div>
        </form>
      )}

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  {col.label}
                </h3>
                <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.length === 0 && <p className="text-xs text-slate-600 px-1 py-3">Sin tareas</p>}
                {colTasks.map((task) => {
                  const assigned = task.assignee_ids || [];
                  const available = members.filter((m) => !assigned.includes(m.id));
                  return (
                    <div key={task.id}>
                      <TaskCard task={task} onClick={openTask} />

                      {assigned.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {assigned.map((uid) => (
                            <span key={uid} className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full">
                              {memberName(uid)}
                              {canEdit && (canAssignOthers || uid === user?.id) && (
                                <button onClick={() => handleUnassign(task, uid)} className="hover:text-red-400" title="Quitar asignación">✕</button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {canEdit && (
                        <select value={task.status} onChange={(e) => handleStatusChange(task, e.target.value)} className={cardSelect}>
                          {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                      )}

                      {canAssignOthers && available.length > 0 && (
                        <select value="" onChange={(e) => e.target.value && handleAssign(task, parseInt(e.target.value))} className={cardSelect}>
                          <option value="">+ Asignar miembro…</option>
                          {available.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      )}

                      {!canAssignOthers && canEdit && !assigned.includes(user?.id) && (
                        <button
                          type="button"
                          onClick={() => handleAssign(task, user.id)}
                          className={cardSelect + ' text-left hover:text-indigo-300'}
                        >
                          + Asignarme
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal detalle de tarea */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeTask}>
          <div className="bg-[#141a24] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl shadow-black/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Detalle de tarea</h2>
              <button onClick={closeTask} className="text-slate-500 hover:text-slate-200">✕</button>
            </div>
            {modalError && <p className="text-red-300 text-sm mb-2">{modalError}</p>}

            <form onSubmit={handleUpdateTask} className="space-y-3">
              <input required disabled={!canEdit} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="input disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Título" />
              <textarea disabled={!canEdit} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="input disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Descripción" />
              <div className="grid grid-cols-3 gap-2">
                <select disabled={!canEdit} value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} className="input disabled:opacity-60 disabled:cursor-not-allowed">
                  <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option>
                </select>
                <select disabled={!canEdit} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="input disabled:opacity-60 disabled:cursor-not-allowed">
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <input type="date" disabled={!canEdit} value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className="input disabled:opacity-60 disabled:cursor-not-allowed" />
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">Guardar</button>
                  <button type="button" onClick={handleDeleteTask} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium px-4 py-2 transition-colors bg-transparent text-red-400 hover:bg-red-500/10">
                    Eliminar tarea
                  </button>
                </div>
              )}
            </form>

            {/* Comentarios */}
            <div className="mt-6 border-t border-white/[0.06] pt-4">
              <h3 className="font-semibold text-white text-sm mb-3">Comentarios</h3>
              <div className="space-y-3 mb-3">
                {comments.length === 0 && <p className="text-sm text-slate-500">Sin comentarios todavía.</p>}
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] text-white font-semibold">
                      {c.author_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-200">{c.author_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">{new Date(c.created_at).toLocaleString('es-ES')}</span>
                          {(c.user_id === user.id || user.role === 'admin') && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-slate-600 hover:text-red-400 text-xs" title="Eliminar comentario">✕</button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 break-words">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              {canEdit ? (
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escribe un comentario…" className="input flex-1" />
                  <button type="submit" disabled={!newComment.trim()} className="btn-primary">Enviar</button>
                </form>
              ) : (
                <p className="text-xs text-slate-500">Tu rol es de solo lectura: no puedes comentar.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
