import { db } from '../config/database';

export interface ProjectMemberRecord {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
}

export interface ProjectMemberCreateInput {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: Date;
}

export interface MemberWithUserRecord {
  id: string;
  email: string;
  name: string;
  system_role: string;
  project_role: string;
  joined_at: Date;
}

export async function create(data: ProjectMemberCreateInput): Promise<void> {
  await db('project_members').insert(data);
}

export async function findByProjectAndUser(
  projectId: string,
  userId: string
): Promise<ProjectMemberRecord | undefined> {
  return db('project_members')
    .where({ project_id: projectId, user_id: userId })
    .first();
}

export async function findByProjectAndUserRole(
  projectId: string,
  userId: string,
  role: string
): Promise<ProjectMemberRecord | undefined> {
  return db('project_members')
    .where({ project_id: projectId, user_id: userId, role })
    .first();
}

export async function countByProject(projectId: string): Promise<number> {
  const result = await db('project_members')
    .where({ project_id: projectId })
    .count('id as count')
    .first();
  return parseInt(String(result?.count || 0));
}

export async function countByProjectIds(
  projectIds: string[]
): Promise<Record<string, number>> {
  const rows = await db('project_members')
    .whereIn('project_id', projectIds)
    .groupBy('project_id')
    .select('project_id')
    .count('id as count');

  const map: Record<string, number> = {};
  rows.forEach((row: any) => {
    map[row.project_id] = parseInt(String(row.count));
  });
  return map;
}

export async function deleteByProjectAndUser(
  projectId: string,
  userId: string
): Promise<number> {
  return db('project_members')
    .where({ project_id: projectId, user_id: userId })
    .del();
}

export async function findByProjectWithUsers(
  projectId: string
): Promise<MemberWithUserRecord[]> {
  return db('project_members')
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
}
