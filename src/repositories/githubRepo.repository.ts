import { db } from '../config/database';

export interface GithubRepoRecord {
  project_id: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface GithubRepoCreateInput {
  project_id: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface GithubRepoUpdateInput {
  repo_url?: string;
  repo_owner?: string;
  repo_name?: string;
  last_synced_at?: Date;
  updated_at: Date;
}

export async function findByProjectId(projectId: string): Promise<GithubRepoRecord | undefined> {
  return db('github_repos').where({ project_id: projectId }).first();
}

export async function create(data: GithubRepoCreateInput): Promise<void> {
  await db('github_repos').insert(data);
}

export async function updateByProjectId(
  projectId: string,
  data: Partial<GithubRepoUpdateInput>
): Promise<void> {
  await db('github_repos').where({ project_id: projectId }).update(data);
}

export async function deleteByProjectId(projectId: string): Promise<void> {
  await db('github_repos').where({ project_id: projectId }).del();
}
