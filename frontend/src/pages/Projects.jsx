import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Users, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      fetchProjects();
      setShowModal(false);
      setEditingProject(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({ name: project.name, description: project.description || '' });
    setShowModal(true);
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
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-300 mt-1">Manage your team projects</p>
        </div>
        {(user?.role === 'ADMIN' || true) && (
          <button
            onClick={() => {
              setEditingProject(null);
              setFormData({ name: '', description: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="glass-card p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{project.name}</h3>
              {user?.role === 'ADMIN' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-1 hover:bg-white/10 rounded transition"
                  >
                    <Edit2 size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1 hover:bg-white/10 rounded transition"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              )}
            </div>
            
            {project.description && (
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users size={14} />
                <span>{project.members?.length || 0} members</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar size={14} />
                <span>Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-gray-300 text-sm">
                {project.tasks?.length || 0} tasks
              </span>
              <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                View Details <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingProject ? 'Edit Project' : 'New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Project name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-glass"
                  required
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-glass"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
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

export default Projects;