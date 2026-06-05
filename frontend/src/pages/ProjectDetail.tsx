import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI, taskAPI, githubAPI, commentAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { SkeletonDetail } from '../components/Skeleton';
import TaskBoard from '../components/TaskBoard';
import TaskForm from '../components/TaskForm';
import MemberList from '../components/MemberList';
import GitHubPanel from '../components/GitHubPanel';
import CommentSection from '../components/CommentSection';
import type { Task, TaskFormData, TaskFilters, TaskStatus, Member, Repo, Commit, Comment } from '../types';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({ status: '' });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<TaskFormData | undefined>();

  const [repo, setRepo] = useState<Repo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [syncing, setSyncing] = useState(false);

  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isOwner = project?.owner_id === user?.id;

  useEffect(() => {
    fetchProject();
    fetchMembers();
    fetchRepo();
  }, [id]);

  useEffect(() => { fetchTasks(); }, [id, taskFilters]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getById(id);
      setProject(response.data.data);
    } catch (error: any) {
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
      const params: Record<string, string> = {};
      if (taskFilters.status) params.status = taskFilters.status;
      if (taskFilters.priority) params.priority = taskFilters.priority;
      const response = await taskAPI.getByProject(id, params);
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

  const fetchComments = async (taskId: string) => {
    try {
      const response = await commentAPI.getByTask(taskId);
      setComments(prev => ({ ...prev, [taskId]: response.data.data || [] }));
    } catch (error) { console.error('Failed to fetch comments:', error); }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toLocaleDateString('en-CA') : '',
      assigneeId: task.assignee_id || '',
    });
    setShowEditTaskModal(true);
  };

  const handleCreateTask = async (data: TaskFormData) => {
    try {
      const response = await taskAPI.create({
        ...data, projectId: id, due_date: data.due_date || null, assigneeId: data.assigneeId || null,
      });
      setTasks([response.data.data, ...tasks]);
      setShowTaskModal(false);
      setTaskFormData(undefined);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create task');
    }
  };

  const handleEditTask = async (data: TaskFormData) => {
    if (!editingTask) return;
    try {
      const response = await taskAPI.update(editingTask.id, {
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.due_date || null,
      });
      setTasks(tasks.map(t => t.id === editingTask.id ? response.data.data : t));
      setShowEditTaskModal(false);
      setEditingTask(null);
      setTaskFormData(undefined);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update task');
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try { await taskAPI.updateStatus(taskId, status); }
    catch (error: any) { alert(error.response?.data?.error || 'Failed to update status'); fetchTasks(); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        setTasks(tasks.filter(t => t.id !== taskId));
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete task');
      }
    }
  };

  const handleAddMember = async (email: string) => {
    try {
      const member = await projectAPI.addMember(id, email, 'member');
      if (member.data.data && member.data.data.user) {
        const newM = member.data.data.user;
        setMembers([...members, { ...newM, project_role: 'member' }]);
      } else {
        fetchMembers();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Remove this member?')) {
      try {
        await projectAPI.removeMember(id, userId);
        setMembers(members.filter(m => m.id !== userId));
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to remove member');
      }
    }
  };

  const handleLinkRepo = async (repoUrl: string) => {
    try {
      const response = await githubAPI.link(id, repoUrl);
      setRepo(response.data.data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to link repository');
    }
  };

  const handleUnlinkRepo = async () => {
    if (window.confirm('Unlink this repository?')) {
      try {
        await githubAPI.unlink(id);
        setRepo(null);
        setCommits([]);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to unlink repository');
      }
    }
  };

  const handleSyncCommits = async () => {
    setSyncing(true);
    try {
      await githubAPI.sync(id);
      await fetchCommits();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to sync commits');
    } finally { setSyncing(false); }
  };

  const handleOpenComments = async (taskId: string) => {
    setShowCommentModal(taskId);
    if (!comments[taskId]) await fetchComments(taskId);
  };

  const handleAddComment = async (comment: string) => {
    if (!showCommentModal) return;
    try {
      await commentAPI.create(showCommentModal, comment);
      await fetchComments(showCommentModal);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await commentAPI.delete(commentId);
        if (showCommentModal) await fetchComments(showCommentModal);
      } catch (error: any) {
        alert(error.response?.data?.error || 'Failed to delete comment');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse" />
          <SkeletonDetail />
        </div>
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
        >
          &larr; Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold dark:text-white">{project.name}</h1>
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full capitalize">
              {project.status}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-300">{project.description || 'No description'}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold dark:text-white">Tasks</h2>
              <button
                onClick={() => { setShowTaskModal(true); setTaskFormData(undefined); }}
                className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600"
              >
                + New Task
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
              <select
                value={taskFilters.status}
                onChange={(e) => setTaskFilters(prev => ({ ...prev, status: e.target.value }))}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              <select
                value={taskFilters.priority || ''}
                onChange={(e) => setTaskFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {(taskFilters.status || taskFilters.priority) && (
                <button
                  onClick={() => setTaskFilters({ status: '' })}
                  className="text-sm text-red-500 hover:text-red-700 px-2"
                >
                  Clear filters
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3">Drag task antar kolom untuk ubah status, atau pilih dari dropdown</p>
            <TaskBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
              onEdit={handleOpenEdit}
              onOpenComments={handleOpenComments}
              comments={comments}
            />
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <MemberList
            members={members}
            isOwner={isOwner}
            currentUserId={user?.id || ''}
            onAddMember={handleAddMember}
            onRemoveMember={handleRemoveMember}
          />
        )}

        {/* GitHub Tab */}
        {activeTab === 'github' && (
          <GitHubPanel
            repo={repo}
            commits={commits}
            isOwner={isOwner}
            onLinkRepo={handleLinkRepo}
            onUnlinkRepo={handleUnlinkRepo}
            onSyncCommits={handleSyncCommits}
            syncing={syncing}
          />
        )}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <TaskForm
          isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setTaskFormData(undefined); }}
          onSubmit={handleCreateTask}
          members={members}
          isEditing={false}
        />
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && (
        <TaskForm
          isOpen={showEditTaskModal}
          onClose={() => { setShowEditTaskModal(false); setEditingTask(null); setTaskFormData(undefined); }}
          onSubmit={handleEditTask}
          initialData={taskFormData}
          members={members}
          isEditing={true}
        />
      )}

      {/* Comments Modal */}
      <CommentSection
        isOpen={showCommentModal !== null}
        taskId={showCommentModal}
        comments={showCommentModal ? comments[showCommentModal] || [] : []}
        currentUserId={user?.id || ''}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onClose={() => setShowCommentModal(null)}
      />
    </div>
  );
};

export default ProjectDetail;
