import { db } from '../config/database';

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ProjectCreateInput {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  status?: string;
  updated_at: Date;
}

export interface ProjectFilters {
  status?: string;
  page: number;
  limit: number;
}

export async function create(data: ProjectCreateInput): Promise<void> {
  await db('projects').insert(data);
}

export async function findById(id: string): Promise<ProjectRecord | undefined> {
  return db('projects').where({ id, deleted_at: null }).first();
}

export async function findByIdUnfiltered(id: string): Promise<ProjectRecord | undefined> {
  return db('projects').where({ id }).first();
}

export async function update(id: string, data: Partial<ProjectUpdateInput>): Promise<void> {
  await db('projects').where({ id }).update(data);
}

export async function hardDelete(id: string): Promise<void> {
  await db('projects').where({ id }).del();
}

export async function softDelete(id: string): Promise<void> {
  await db('projects').where({ id }).update({
    deleted_at: new Date(),
    updated_at: new Date(),
  });
}

export async function findAccessibleByUserId(userId: string): Promise<{ id: string; name: string }[]> {
  return db('projects')
    .leftJoin('project_members', 'projects.id', 'project_members.project_id')
    .where('projects.deleted_at', null)
    .where(function () {
      this.where('projects.owner_id', userId)
        .orWhere('project_members.user_id', userId);
    })
    .select('projects.id', 'projects.name');
}

export async function findByFilters(
  userId: string,
  filters: ProjectFilters
): Promise<{ data: ProjectRecord[]; total: number }> {
  const { status, page, limit } = filters;
  const offset = (page - 1) * limit;

  let query = db('projects')
    .leftJoin('project_members', 'projects.id', 'project_members.project_id')
    .where('projects.deleted_at', null)
    .where(function () {
      this.where('projects.owner_id', userId)
        .orWhere('project_members.user_id', userId);
    });

  if (status && status !== 'all') {
    query = query.where('projects.status', status);
  }

  const countResult = await query.clone().countDistinct('projects.id as count').first();
  const total = parseInt(String(countResult?.count || 0));

  const projects = await query
    .select('projects.*')
    .distinct('projects.id')
    .orderBy('projects.created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return { data: projects, total };
}
