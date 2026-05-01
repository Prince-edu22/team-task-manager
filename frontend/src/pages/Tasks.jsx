import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Filter, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ projectId: '', status: '', assignedTo: 'me' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedUserId: '',
    status: 'TODO',
    dueDate: ''
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.projectId) queryParams.append('projectId', filters.projectId);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      
      const [tasksRes, projectsRes] = await Promise.all([
        api.get(`/tasks?${queryParams}`),
        api.get('/projects')
      ]);
      
      setTasks(tasksRes.data.tasks);
      setProjects(projectsRes.data.projects);
      
      if (user?.role === 'ADMIN') {
        const usersRes = await api.get('/users'); // You'd need to add this endpoint
        setUsers(usersRes?.data?.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      fetchData();
      setShowModal(false);
      setEditingTask(null);
      setFormData({ title: '', description: '', projectId: '', assignedUserId: '', status: 'TODO', dueDate: '' });
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: task.projectId.toString(),
      assignedUserId: task.assignedUserId?.toString() || '',
      status: task.status,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''
    });
    setShowModal(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      TODO: 'bg-gray-500',
      IN_PROGRESS: 'bg-blue-500',
      COMPLETED: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-300 mt-1">Manage and track your tasks</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setFormData({ title: '', description: '', projectId: '', assignedUserId: '', status: 'TODO', dueDate: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-gray-300 text-sm mb-1">Project</label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="input-glass"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-gray-300 text-sm mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-glass"
            >
              <option value="">All Status</option>
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-gray-300 text-sm mb-1">Assigned To</label>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
              className="input-glass"
            >
              <option value="me">My Tasks</option>
              <option value="all">All Tasks</option>
              {user?.role === 'ADMIN' && users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFilters({ projectId: '', status: '', assignedTo: 'me' })}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400">No tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="glass-card p-5 hover:bg-white/5 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}></div>
                    <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                    <span className="text-xs px-2 py-1 bg-white/10 rounded text-gray-300">
                      {task.project?.name}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-gray-300 text-sm mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {task.assignedUser && (
                      <div className="flex items-center gap-1">
                        <User size={14} />
                        <span>{task.assignedUser.name}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Due {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  >
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 hover:bg-white/10 rounded transition"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 hover:bg-white/10 rounded transition"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-glass"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-glass"
                  rows="3"
                />
              </div>
              <div>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="input-glass"
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Unassigned</option>
                  {projects.find(p => p.id.toString() === formData.projectId)?.members?.map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-glass"
                >
                  <option value="TODO">Todo</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary">
                  {editingTask ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;