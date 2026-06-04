import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, taskAPI, githubAPI, commentAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigneeId: '' });

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const [repo, setRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [showLinkRepoModal, setShowLinkRepoModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [syncing, setSyncing] = useState(false);

  const [comments, setComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(null);
  const [newComment, setNewComment] = useState('');

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isOwner = project?.owner_id === user?.id;

  useEffect(() => {
    fetchProject();
    fetchMembers();
    fetchTasks();
    fetchRepo();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getById(id);
      setProject(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) { logout(); navigate('/login'); }
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await projectAPI.getMembers(id);
      setMembers(response.data.data || []);
    } catch (error) { console.error('Failed to fetch members:', error); }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getByProject(id);
      setTasks(response.data.data.data || []);
    } catch (error) { console.error('Failed to fetch tasks:', error); }
    finally { setLoading(false); }
  };

  const fetchRepo = async () => {
    try {
      const response = await githubAPI.getRepo(id);
      if (response.data.data) {
        setRepo(response.data.data);
        fetchCommits();
      }
    } catch (error) { /* no repo linked */ }
  };

  const fetchCommits = async () => {
    try {
      const response = await githubAPI.getCommits(id);
      setCommits(response.data.data || []);
    } catch (error) { console.error('Failed to fetch commits:', error); }
  };

  const fetchComments = async (taskId) => {
    try {
      const response = await commentAPI.getByTask(taskId);
      setComments(prev => ({ ...prev, [taskId]: response.data.data || [] }));
    } catch (error) { console.error('Failed to fetch comments:', error); }
  };

  // Task handlers
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const response = await taskAPI.create({
        ...newTask, projectId: id, due_date: newTask.due_date || null, assigneeId: newTask.assigneeId || null,
      });
      setTasks([response.data.data, ...tasks]);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigneeId: '' });
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, status) => {
    try {
      await taskAPI.updateStatus(taskId, status);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete task');
      }
    }
  };

  // Member handlers
  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    try {
      const member = await projectAPI.addMember(id, newMemberEmail, 'member');
      if (member.data.data && member.data.data.user) {
        const newM = member.data.data.user;
        setMembers([...members, { ...newM, project_role: 'member' }]);
      } else {
        fetchMembers();
      }
      setShowMemberModal(false);
      setNewMemberEmail('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Remove this member?')) {
      try {
        await projectAPI.removeMember(id, userId);
        setMembers(members.filter(m => m.id !== userId));
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to remove member');
      }
    }
  };

  // GitHub handlers
  const handleLinkRepo = async () => {
    if (!repoUrl.trim()) return;
    try {
      const response = await githubAPI.link(id, repoUrl);
      setRepo(response.data.data);
      setShowLinkRepoModal(false);
      setRepoUrl('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to link repository');
    }
  };

  const handleUnlinkRepo = async () => {
    if (window.confirm('Unlink this repository?')) {
      try {
        await githubAPI.unlink(id);
        setRepo(null);
        setCommits([]);
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to unlink repository');
      }
    }
  };

  const handleSyncCommits = async () => {
    setSyncing(true);
    try {
      await githubAPI.sync(id);
      await fetchCommits();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to sync commits');
    } finally { setSyncing(false); }
  };

  // Comment handlers
  const handleOpenComments = async (taskId) => {
    setShowCommentModal(taskId);
    if (!comments[taskId]) await fetchComments(taskId);
    setNewComment('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !showCommentModal) return;
    try {
      await commentAPI.create(showCommentModal, newComment);
      await fetchComments(showCommentModal);
      setNewComment('');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await commentAPI.delete(commentId);
        await fetchComments(showCommentModal);
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete comment');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!project) return null;

  const tabs = [
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'members', label: `Members (${members.length})` },
    { key: 'github', label: 'GitHub' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
        >
          &larr; Back to Dashboard
        </button>

        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full capitalize">
              {project.status}
            </span>
          </div>
          <p className="text-gray-500">{project.description || 'No description'}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600"
              >
                + New Task
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks yet. Click "New Task" to create one.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map(task => (
                  <div key={task.id}>
                    <TaskCard
                      task={task}
                      onStatusChange={handleUpdateStatus}
                      onDelete={handleDeleteTask}
                    />
                    <button
                      onClick={() => handleOpenComments(task.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1 ml-1"
                    >
                      {comments[task.id]?.length ? `${comments[task.id].length} comments` : 'Add comment'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Team Members</h2>
              {isOwner && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600"
                >
                  + Add Member
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No members yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map(member => (
                  <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full capitalize">
                        {member.project_role}
                      </span>
                      {isOwner && member.id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GitHub Tab */}
        {activeTab === 'github' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">GitHub Integration</h2>
              {isOwner && !repo && (
                <button
                  onClick={() => setShowLinkRepoModal(true)}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600"
                >
                  Link Repository
                </button>
              )}
            </div>

            {!repo ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No GitHub repository linked</p>
                {!isOwner && <p className="text-sm text-gray-400">Only the project owner can link a repository</p>}
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        <a
                          href={repo.repo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {repo.repo_owner}/{repo.repo_name}
                        </a>
                      </p>
                      {repo.last_synced_at && (
                        <p className="text-sm text-gray-500 mt-1">
                          Last synced: {new Date(repo.last_synced_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSyncCommits}
                        disabled={syncing}
                        className="bg-green-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-600 disabled:opacity-50"
                      >
                        {syncing ? 'Syncing...' : 'Sync'}
                      </button>
                      {isOwner && (
                        <button
                          onClick={handleUnlinkRepo}
                          className="text-red-500 text-sm hover:text-red-700 px-3 py-1.5"
                        >
                          Unlink
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold mb-3">Recent Commits ({commits.length})</h3>
                {commits.length === 0 ? (
                  <p className="text-gray-500 text-sm">No commits synced yet. Click "Sync" to fetch commits.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                    {commits.map(commit => (
                      <div key={commit.id} className="bg-gray-50 rounded-md p-3 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-2">
                            <p className="text-sm font-medium truncate">{commit.message.split('\n')[0]}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {commit.author} &middot; {new Date(commit.commit_date).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={commit.commit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            {commit.commit_sha.slice(0, 7)}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Create New Task">
        <input
          type="text" placeholder="Task Title *"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
        />
        <textarea
          placeholder="Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 min-h-[80px]"
        />
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="date"
          value={newTask.due_date}
          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
        />
        <select
          value={newTask.assigneeId}
          onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
        >
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowTaskModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleCreateTask} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Create Task</button>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={showMemberModal} onClose={() => setShowMemberModal(false)} title="Add Member">
        <p className="text-sm text-gray-500 mb-3">Enter the user email to add them to this project.</p>
        <input
          type="text" placeholder="User Email"
          value={newMemberEmail}
          onChange={(e) => setNewMemberEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowMemberModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleAddMember} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add Member</button>
        </div>
      </Modal>

      {/* Link Repo Modal */}
      <Modal isOpen={showLinkRepoModal} onClose={() => setShowLinkRepoModal(false)} title="Link GitHub Repository">
        <p className="text-sm text-gray-500 mb-3">Enter the GitHub repository URL (e.g. https://github.com/owner/repo).</p>
        <input
          type="text" placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowLinkRepoModal(false)} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleLinkRepo} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Link</button>
        </div>
      </Modal>

      {/* Comments Modal */}
      <Modal isOpen={showCommentModal !== null} onClose={() => setShowCommentModal(null)} title="Comments">
        {showCommentModal && (
          <div>
            <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
              {comments[showCommentModal]?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
              ) : (
                comments[showCommentModal]?.map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500">{c.user_name}</p>
                        <p className="text-sm mt-1">{c.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                      </div>
                      {c.user_id === user?.id && (
                        <button onClick={() => handleDeleteComment(c.id)} className="text-red-500 text-xs hover:text-red-700 ml-2">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text" placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">Send</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectDetail;
