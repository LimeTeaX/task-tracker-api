import { projectRepo, projectMemberRepo } from '../repositories';

export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await projectRepo.findById(projectId);
  if (!project) return false;
  if (project.owner_id === userId) return true;

  const member = await projectMemberRepo.findByProjectAndUser(projectId, userId);
  return !!member;
}

export async function isProjectMember(userId: string, projectId: string): Promise<boolean> {
  const member = await projectMemberRepo.findByProjectAndUser(projectId, userId);
  return !!member;
}

export async function isProjectManager(userId: string, projectId: string): Promise<boolean> {
  const project = await projectRepo.findById(projectId);
  if (project && project.owner_id === userId) return true;

  const member = await projectMemberRepo.findByProjectAndUserRole(projectId, userId, 'manager');
  return !!member;
}
