import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'active' | 'archived';
}

export async function createProject(input: CreateProjectInput) {
  const projectId = uuidv4();
  
  await db('projects').insert({
    id: projectId,
    name: input.name,
    description: input.description || null,
    owner_id: input.ownerId,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Auto-add owner as member with manager role
  await db('project_members').insert({
    id: uuidv4(),
    project_id: projectId,
    user_id: input.ownerId,
    role: 'manager',
    joined_at: new Date(),
  });

  return getProjectById(projectId, input.ownerId);
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Check if user has access (owner or member)
  const hasAccess = await checkUserProjectAccess(userId, projectId);
  if (!hasAccess && project.owner_id !== userId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  // Get members count
  const membersCount = await db('project_members')
    .where({ project_id: projectId })
    .count('id as count')
    .first();

  return {
    ...project,
    members_count: parseInt(String(membersCount?.count || 0)),
  };
}

export async function listProjects(userId: string, filters: { status?: string; page?: number; limit?: number }) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  // Get projects where user is owner or member
  let query = db('projects')
    .leftJoin('project_members', 'projects.id', 'project_members.project_id')
    .where('projects.deleted_at', null)
    .where(function() {
      this.where('projects.owner_id', userId)
        .orWhere('project_members.user_id', userId);
    });

  // Filter by status
  if (filters.status && filters.status !== 'all') {
    query = query.where('projects.status', filters.status);
  }

  // Get total count
  const countResult = await query.clone().countDistinct('projects.id as count').first();
  const total = parseInt(String(countResult?.count || 0));

  // Get paginated results
  const projects = await query
    .select('projects.*')
    .distinct('projects.id')
    .orderBy('projects.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  // Get members count for each project
  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const membersCount = await db('project_members')
        .where({ project_id: project.id })
        .count('id as count')
        .first();
      
      return {
        ...project,
        members_count: parseInt(String(membersCount?.count || 0)),
      };
    })
  );

  return {
    data: projectsWithCounts,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
  // Check if user is owner or manager
  const isAuthorized = await isProjectManager(userId, projectId);
  if (!isAuthorized) {
    throw new ForbiddenError('Only project owner or manager can update this project');
  }

  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  await db('projects')
    .where({ id: projectId })
    .update({
      ...input,
      updated_at: new Date(),
    });

  return getProjectById(projectId, userId);
}

export async function deleteProject(projectId: string, userId: string, hardDelete = false) {
  // Check if user is owner
  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.owner_id !== userId) {
    throw new ForbiddenError('Only project owner can delete this project');
  }

  if (hardDelete) {
    // Hard delete - cascade will delete members and tasks
    await db('projects').where({ id: projectId }).del();
  } else {
    // Soft delete
    await db('projects')
      .where({ id: projectId })
      .update({
        deleted_at: new Date(),
        updated_at: new Date(),
      });
  }

  return true;
}

export async function addProjectMember(projectId: string, userId: string, targetUserIdOrEmail: string, role: string = 'member') {
  const isAuthorized = await isProjectManager(userId, projectId);
  if (!isAuthorized) {
    throw new ForbiddenError('Only project owner or manager can add members');
  }

  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  let targetUser = await db('users').where({ id: targetUserIdOrEmail }).first();
  if (!targetUser) {
    targetUser = await db('users').where({ email: targetUserIdOrEmail }).first();
  }
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  const existing = await db('project_members')
    .where({ project_id: projectId, user_id: targetUser.id })
    .first();

  if (existing) {
    throw new BadRequestError('User is already a member of this project');
  }

  await db('project_members').insert({
    id: uuidv4(),
    project_id: projectId,
    user_id: targetUser.id,
    role,
    joined_at: new Date(),
  });

  return {
    success: true,
    message: 'Member added successfully',
    user: { id: targetUser.id, name: targetUser.name, email: targetUser.email },
  };
}

export async function removeProjectMember(projectId: string, userId: string, targetUserId: string) {
  // Check if requester is owner or manager
  const isAuthorized = await isProjectManager(userId, projectId);
  if (!isAuthorized) {
    throw new ForbiddenError('Only project owner or manager can remove members');
  }

  // Cannot remove the project owner
  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (project && project.owner_id === targetUserId) {
    throw new BadRequestError('Cannot remove the project owner');
  }

  const deleted = await db('project_members')
    .where({ project_id: projectId, user_id: targetUserId })
    .del();

  if (!deleted) {
    throw new NotFoundError('Member not found in this project');
  }

  return { success: true, message: 'Member removed successfully' };
}

export async function getProjectMembers(projectId: string, userId: string) {
  // Check if user has access
  const hasAccess = await checkUserProjectAccess(userId, projectId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this project');
  }

  const members = await db('project_members')
    .join('users', 'project_members.user_id', 'users.id')
    .where('project_members.project_id', projectId)
    .select(
      'users.id',
      'users.email',
      'users.name',
      'users.role as system_role',
      'project_members.role as project_role',
      'project_members.joined_at'
    );

  return members;
}

// Helper functions
async function checkUserProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const member = await db('project_members')
    .where({ project_id: projectId, user_id: userId })
    .first();
  
  return !!member;
}

async function isProjectManager(userId: string, projectId: string): Promise<boolean> {
  // Check if user is project owner
  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (project && project.owner_id === userId) {
    return true;
  }

  // Check if user is project manager
  const member = await db('project_members')
    .where({ project_id: projectId, user_id: userId, role: 'manager' })
    .first();

  return !!member;
}