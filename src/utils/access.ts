import { db } from '../config/database';

export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
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

export async function verifyProjectAccess(userId: string, projectId: string): Promise<void> {
  const project = await db('projects')
    .where({ id: projectId, deleted_at: null })
    .first();

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.owner_id === userId) return;

  const member = await db('project_members')
    .where({ project_id: projectId, user_id: userId })
    .first();

  if (!member) {
    throw new Error('Access denied');
  }
}
