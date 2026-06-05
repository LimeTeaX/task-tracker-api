import { db } from '../config/database';

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  priority: string;
  due_date: Date | null;
  assignee_id: string | null;
  created_by: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface TaskCreateInput {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  priority: string;
  due_date: Date | null;
  assignee_id: string | null;
  created_by: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: Date;
  status?: string;
  assignee_id?: string;
  updated_at: Date;
}

export interface TaskFilters {
  projectIds?: string[];
  status?: string;
  priority?: string;
  assigneeId?: string;
  page: number;
  limit: number;
}

export async function create(data: TaskCreateInput): Promise<void> {
  await db('tasks').insert(data);
}

export async function findById(id: string): Promise<TaskRecord | undefined> {
  return db('tasks').where({ id, deleted_at: null }).first();
}

export async function findByIdWithUsers(id: string): Promise<any | undefined> {
  const task = await db('tasks')
    .where('tasks.id', id)
    .select(
      'tasks.*',
      'assignee_users.name as assignee_name',
      'assignee_users.email as assignee_email',
      'creator_users.name as created_by_name'
    )
    .leftJoin('users as assignee_users', 'tasks.assignee_id', 'assignee_users.id')
    .leftJoin('users as creator_users', 'tasks.created_by', 'creator_users.id')
    .first();

  if (!task) return undefined;

  return {
    ...task,
    assignee: task.assignee_id
      ? { id: task.assignee_id, name: task.assignee_name, email: task.assignee_email }
      : null,
    assignee_name: undefined,
    assignee_email: undefined,
  };
}

export async function findByFilters(
  filters: TaskFilters
): Promise<{ data: any[]; total: number }> {
  const { projectIds, status, priority, assigneeId, page, limit } = filters;
  const offset = (page - 1) * limit;

  let query = db('tasks').where('tasks.deleted_at', null);

  if (projectIds && projectIds.length > 0) {
    query = query.whereIn('tasks.project_id', projectIds);
  }

  if (status && status !== 'all') {
    query = query.where('tasks.status', status);
  }

  if (priority) {
    query = query.where('tasks.priority', priority);
  }

  if (assigneeId) {
    query = query.where('tasks.assignee_id', assigneeId);
  }

  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(String(countResult?.count || 0));

  const tasks = await query
    .select(
      'tasks.*',
      'assignee_users.name as assignee_name',
      'assignee_users.email as assignee_email'
    )
    .leftJoin('users as assignee_users', 'tasks.assignee_id', 'assignee_users.id')
    .orderBy('tasks.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  const data = tasks.map((task: any) => ({
    ...task,
    assignee: task.assignee_id
      ? { id: task.assignee_id, name: task.assignee_name, email: task.assignee_email }
      : null,
    assignee_name: undefined,
    assignee_email: undefined,
  }));

  return { data, total };
}

export async function update(id: string, data: Partial<TaskUpdateInput>): Promise<void> {
  await db('tasks').where({ id }).update(data);
}

export async function softDelete(id: string): Promise<void> {
  await db('tasks').where({ id }).update({ deleted_at: new Date() });
}
