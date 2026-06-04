import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ name: '', description: '' });
    setShowCreateModal(true);
  };

  const openEdit = (project) => {
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
    } catch (error) {
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
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update project');
    }
  };

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectAPI.delete(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete project');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Welcome, {user?.name}!</h2>
            <p className="text-gray-500">Manage your projects here</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            + New Project
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <p className="text-gray-500 mb-4">You don't have any projects yet</p>
            <button
              onClick={openCreate}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold truncate flex-1 mr-2">{project.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full capitalize whitespace-nowrap">
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">{project.members_count || 1} members</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEdit(project)}
                      className="text-yellow-600 hover:text-yellow-800"
                    >
                      Edit
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
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 min-h-[80px]"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Create
          </button>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <input
          type="text"
          placeholder="Project Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 min-h-[80px]"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleUpdate} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
