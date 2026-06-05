import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import { SkeletonList } from '../components/Skeleton';
import { Project } from '../types';

const FILTERS = ['active', 'archived', 'all'];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  archived: 'bg-gray-200 text-gray-600',
};

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('active');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, [filter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = filter === 'all' ? { status: 'all' } : { status: filter };
      const response = await projectAPI.getAll(params);
      setProjects(response.data.data.data || []);
    } catch (error: any) {
      if (error.response?.status === 401) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setShowCreateModal(true);
  };

  const openEdit = (project: Project) => {
    setEditProject(project);
    setForm({ name: project.name, description: project.description || '' });
    setShowEditModal(true);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      const response = await projectAPI.create(form);
      setProjects([response.data.data, ...projects]);
      setShowCreateModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create project');
    }
  };

  const handleUpdate = async () => {
    if (!form.name.trim() || !editProject) return;
    try {
      const response = await projectAPI.update(editProject.id, form);
      setProjects(projects.map(p => p.id === editProject.id ? response.data.data : p));
      setShowEditModal(false);
      setEditProject(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update project');
    }
  };

  const handleArchive = async (project: Project) => {
    const newStatus = project.status === 'archived' ? 'active' : 'archived';
    const label = newStatus === 'archived' ? 'archive' : 'unarchive';
    if (window.confirm(`Are you sure you want to ${label} "${project.name}"?`)) {
      try {
        const response = await projectAPI.update(project.id, { status: newStatus });
        setProjects(projects.map(p => p.id === project.id ? response.data.data : p));
      } catch (error: any) {
        alert(error.response?.data?.error || `Failed to ${label} project`);
      }
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this project?')) {
      try {
        await projectAPI.delete(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete project');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Welcome, {user?.name}!</h2>
            <p className="text-gray-500 dark:text-gray-300">Manage your projects here</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            + New Project
          </button>
        </div>

        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm w-fit">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonList count={6} />
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center shadow-sm">
            <p className="text-gray-500 dark:text-gray-300 mb-4">
              {filter === 'archived' ? 'No archived projects' : "You don't have any projects yet"}
            </p>
            {filter !== 'archived' && (
              <button
                onClick={openCreate}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Create your first project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
                project.status === 'archived' ? 'opacity-75' : ''
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold truncate flex-1 mr-2 dark:text-white">{project.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ${STATUS_STYLES[project.status] || 'bg-blue-100 text-blue-700'}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 dark:text-gray-400">{project.members_count || 1} members</span>
                  <div className="flex gap-2">
                    {project.status === 'active' && (
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(project)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchive(project)}
                      className={`${project.status === 'archived' ? 'text-green-600 hover:text-green-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Project">
        <input
          type="text"
          placeholder="Project Name *"
          value={form.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 min-h-[80px] bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Create</button>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <input
          type="text"
          placeholder="Project Name *"
          value={form.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 min-h-[80px] bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleUpdate} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Save</button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
