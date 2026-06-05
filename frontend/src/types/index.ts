export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  owner_id: string;
  members_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskAssignee {
  id: string;
  name: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assignee_id?: string;
  assignee?: TaskAssignee;
  project_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  project_role: string;
}

export interface Comment {
  id: string;
  comment: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export interface Repo {
  id: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  last_synced_at?: string;
}

export interface Commit {
  id: string;
  message: string;
  author: string;
  commit_date: string;
  commit_url: string;
  commit_sha: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assigneeId: string;
}

export interface TaskFilters {
  status: string;
  priority?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
}

export interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}
