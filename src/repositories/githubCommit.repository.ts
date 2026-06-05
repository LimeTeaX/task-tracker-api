import { db } from '../config/database';

export interface GithubCommitRecord {
  id: string;
  project_id: string;
  commit_sha: string;
  message: string;
  author: string;
  commit_date: Date;
  commit_url: string;
  synced_at: Date;
}

export interface GithubCommitCreateInput {
  id: string;
  project_id: string;
  commit_sha: string;
  message: string;
  author: string;
  commit_date: Date;
  commit_url: string;
  synced_at: Date;
}

export async function findByProjectId(
  projectId: string,
  limit = 50
): Promise<GithubCommitRecord[]> {
  return db('github_commits')
    .where({ project_id: projectId })
    .orderBy('commit_date', 'desc')
    .limit(limit);
}

export async function deleteByProjectId(projectId: string): Promise<void> {
  await db('github_commits').where({ project_id: projectId }).del();
}

export async function findExistingShas(
  projectId: string,
  shas: string[]
): Promise<{ commit_sha: string }[]> {
  return db('github_commits')
    .where({ project_id: projectId })
    .whereIn('commit_sha', shas)
    .select('commit_sha');
}

export async function batchCreate(commits: GithubCommitCreateInput[]): Promise<void> {
  await db('github_commits').insert(commits);
}
