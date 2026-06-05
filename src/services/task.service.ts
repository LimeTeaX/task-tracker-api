import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { hasProjectAccess } from '../utils/access';
import { taskRepo, projectRepo, projectMemberRepo } from '../repositories';

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
  const hasAccess = await hasProjectAccess(input.createdBy, input.projectId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project');
  }

  const taskId = uuidv4();

  await taskRepo.create({
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
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  const taskWithUsers = await taskRepo.findByIdWithUsers(taskId);
  return taskWithUsers;
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

  let projectIds: string[] | undefined;
  if (filters.projectId) {
    const hasAccess = await hasProjectAccess(userId, filters.projectId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this project');
    }
    projectIds = [filters.projectId];
  } else {
    const accessibleProjects = await projectRepo.findAccessibleByUserId(userId);
    projectIds = accessibleProjects.map(p => p.id);
    if (projectIds.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, total_pages: 0 } };
    }
  }

  const { data, total } = await taskRepo.findByFilters({
    projectIds,
    status: filters.status,
    priority: filters.priority,
    assigneeId: filters.assigneeId,
    page,
    limit,
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  await taskRepo.update(taskId, { ...input, updated_at: new Date() });

  return getTaskById(taskId, userId);
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  await taskRepo.softDelete(taskId);
  return true;
}

export async function updateTaskStatus(taskId: string, userId: string, status: string) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  await taskRepo.update(taskId, { status, updated_at: new Date() });

  return getTaskById(taskId, userId);
}

export async function assignTask(taskId: string, userId: string, assigneeId: string) {
  const task = await taskRepo.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this task');
  }

  const isMember = await projectMemberRepo.findByProjectAndUser(task.project_id, assigneeId);
  if (!isMember) {
    throw new BadRequestError('User is not a member of this project');
  }

  await taskRepo.update(taskId, { assignee_id: assigneeId, updated_at: new Date() });

  return getTaskById(taskId, userId);
}
