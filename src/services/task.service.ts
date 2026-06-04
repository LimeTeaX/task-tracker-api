import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  priority?: string;
  due_date?: Date;
  assigneeId?: string;
  createdBy: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: string;
  due_date?: Date;
}

export async function createTask(input: CreateTaskInput) {
  // Check if user has access to project
  const hasAccess = await checkProjectAccess(input.createdBy, input.projectId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project');
  }

  const taskId = uuidv4();
  
  await db('tasks').insert({
    id: taskId,
    title: input.title,
    description: input.description || null,
    project_id: input.projectId,
    priority: input.priority || 'medium',
    due_date: input.due_date || null,
    assignee_id: input.assigneeId || null,
    created_by: input.createdBy,
    status: 'todo',
    created_at: new Date(),
    updated_at: new Date(),
  });

  return getTaskById(taskId, input.createdBy);
}

export async function getTaskById(taskId: string, userId: string) {
  const task = await db('tasks')
    .where({ id: taskId, deleted_at: null })
    .first();

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // Check access
  const hasAccess = await checkProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  // Get assignee name
  let assignee = null;
  if (task.assignee_id) {
    const user = await db('users').where({ id: task.assignee_id }).first();
    assignee = { id: user.id, name: user.name, email: user.email };
  }

  // Get creator name
  const creator = await db('users').where({ id: task.created_by }).first();

  return {
    ...task,
    assignee,
    created_by_name: creator?.name,
  };
}

export async function listTasks(userId: string, filters: {
  projectId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  // Build query
  let query = db('tasks')
    .where('tasks.deleted_at', null);

  // Filter by project (with access check)
  if (filters.projectId) {
    const hasAccess = await checkProjectAccess(userId, filters.projectId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }
    query = query.where('tasks.project_id', filters.projectId);
  } else {
    // Get all projects user has access to
    const accessibleProjects = await getAccessibleProjects(userId);
    const projectIds = accessibleProjects.map(p => p.id);
    if (projectIds.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, total_pages: 0 } };
    }
    query = query.whereIn('tasks.project_id', projectIds);
  }

  // Additional filters
  if (filters.status && filters.status !== 'all') {
    query = query.where('tasks.status', filters.status);
  }
  if (filters.priority) {
    query = query.where('tasks.priority', filters.priority);
  }
  if (filters.assigneeId) {
    query = query.where('tasks.assignee_id', filters.assigneeId);
  }

  // Get total count
  const countResult = await query.clone().count('id as count').first();
  const total = parseInt(String(countResult?.count || 0));

  // Get paginated results
  const tasks = await query
    .select('tasks.*')
    .orderBy('tasks.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  // Get assignee names
  const tasksWithDetails = await Promise.all(
    tasks.map(async (task) => {
      let assignee = null;
      if (task.assignee_id) {
        const user = await db('users').where({ id: task.assignee_id }).first();
        assignee = { id: user.id, name: user.name };
      }
      return { ...task, assignee };
    })
  );

  return {
    data: tasksWithDetails,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const task = await db('tasks').where({ id: taskId, deleted_at: null }).first();
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // Check if user has access to project
  const hasAccess = await checkProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  await db('tasks')
    .where({ id: taskId })
    .update({
      ...input,
      updated_at: new Date(),
    });

  return getTaskById(taskId, userId);
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await db('tasks').where({ id: taskId, deleted_at: null }).first();
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await checkProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  await db('tasks')
    .where({ id: taskId })
    .update({ deleted_at: new Date() });

  return true;
}

export async function updateTaskStatus(taskId: string, userId: string, status: string) {
  const task = await db('tasks').where({ id: taskId, deleted_at: null }).first();
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await checkProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  await db('tasks')
    .where({ id: taskId })
    .update({
      status,
      updated_at: new Date(),
    });

  return getTaskById(taskId, userId);
}

export async function assignTask(taskId: string, userId: string, assigneeId: string) {
  const task = await db('tasks').where({ id: taskId, deleted_at: null }).first();
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await checkProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  // Check if assignee exists and is member of project
  const isMember = await db('project_members')
    .where({ project_id: task.project_id, user_id: assigneeId })
    .first();

  if (!isMember) {
    throw new BadRequestError('User is not a member of this project');
  }

  await db('tasks')
    .where({ id: taskId })
    .update({
      assignee_id: assigneeId,
      updated_at: new Date(),
    });

  return getTaskById(taskId, userId);
}

// Helper functions
async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();
  
  if (!project) return false;
  
  if (project.owner_id === userId) return true;
  
  const member = await db('project_members')
    .where({ project_id: projectId, user_id: userId })
    .first();
  
  return !!member;
}

async function getAccessibleProjects(userId: string): Promise<any[]> {
  const projects = await db('projects')
    .leftJoin('project_members', 'projects.id', 'project_members.project_id')
    .where('projects.deleted_at', null)
    .where(function() {
      this.where('projects.owner_id', userId)
        .orWhere('project_members.user_id', userId);
    })
    .select('projects.id', 'projects.name');
  
  return projects;
}