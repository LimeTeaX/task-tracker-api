import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { logger } from '../config/logger';

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

interface LinkRepoInput {
  projectId: string;
  repoUrl: string;
  userId: string;
}

export async function linkRepo(input: LinkRepoInput) {
  const project = await db('projects').where({ id: input.projectId, deleted_at: null }).first();
  if (!project) throw new NotFoundError('Project not found');
  if (project.owner_id !== input.userId) throw new ForbiddenError('Only project owner can link a repository');

  const parsed = parseGithubUrl(input.repoUrl);
  if (!parsed) throw new BadRequestError('Invalid GitHub repository URL');

  const existing = await db('github_repos').where({ project_id: input.projectId }).first();
  if (existing) {
    await db('github_repos').where({ project_id: input.projectId }).update({
      repo_url: input.repoUrl,
      repo_owner: parsed.owner,
      repo_name: parsed.repo,
      updated_at: new Date(),
    });
  } else {
    await db('github_repos').insert({
      project_id: input.projectId,
      repo_url: input.repoUrl,
      repo_owner: parsed.owner,
      repo_name: parsed.repo,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return db('github_repos').where({ project_id: input.projectId }).first();
}

export async function unlinkRepo(projectId: string, userId: string) {
  const project = await db('projects').where({ id: projectId, deleted_at: null }).first();
  if (!project) throw new NotFoundError('Project not found');
  if (project.owner_id !== userId) throw new ForbiddenError('Only project owner can unlink a repository');

  await db('github_commits').where({ project_id: projectId }).del();
  await db('github_repos').where({ project_id: projectId }).del();
  return { success: true, message: 'Repository unlinked successfully' };
}

export async function syncCommits(projectId: string, userId: string) {
  const project = await db('projects').where({ id: projectId, deleted_at: null }).first();
  if (!project) throw new NotFoundError('Project not found');

  const hasAccess = await checkProjectAccess(userId, projectId);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this project');

  const repo = await db('github_repos').where({ project_id: projectId }).first();
  if (!repo) throw new BadRequestError('No GitHub repository linked to this project');

  const response = await fetch(
    `https://api.github.com/repos/${repo.repo_owner}/${repo.repo_name}/commits?per_page=50`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'task-tracker-api',
      },
    }
  );

  if (!response.ok) {
    logger.error(`GitHub API error: ${response.status} ${response.statusText}`);
    throw new BadRequestError(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const commits = await response.json() as any[];
  const existingShas = await db('github_commits')
    .where({ project_id: projectId })
    .whereIn('commit_sha', commits.map(c => c.sha))
    .select('commit_sha');

  const existingSet = new Set(existingShas.map(c => c.commit_sha));
  const newCommits = commits.filter(c => !existingSet.has(c.sha));

  if (newCommits.length > 0) {
    const batch = newCommits.map(c => ({
      id: uuidv4(),
      project_id: projectId,
      commit_sha: c.sha,
      message: c.commit.message,
      author: c.commit.author?.name || c.commit.committer?.name || 'Unknown',
      commit_date: new Date(c.commit.author?.date || c.commit.committer?.date || new Date()),
      commit_url: c.html_url,
      synced_at: new Date(),
    }));

    await db('github_commits').insert(batch);
  }

  await db('github_repos').where({ project_id: projectId }).update({
    last_synced_at: new Date(),
    updated_at: new Date(),
  });

  return { synced: newCommits.length, total: commits.length };
}

export async function getCommits(projectId: string, userId: string) {
  const project = await db('projects').where({ id: projectId, deleted_at: null }).first();
  if (!project) throw new NotFoundError('Project not found');

  const hasAccess = await checkProjectAccess(userId, projectId);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this project');

  const commits = await db('github_commits')
    .where({ project_id: projectId })
    .orderBy('commit_date', 'desc')
    .limit(50);

  return commits;
}

export async function getLinkedRepo(projectId: string, userId: string) {
  const project = await db('projects').where({ id: projectId, deleted_at: null }).first();
  if (!project) throw new NotFoundError('Project not found');

  const hasAccess = await checkProjectAccess(userId, projectId);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this project');

  const repo = await db('github_repos').where({ project_id: projectId }).first();
  return repo || null;
}

async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await db('projects').where({ id: projectId, deleted_at: null }).first();
  if (!project) return false;
  if (project.owner_id === userId) return true;
  const member = await db('project_members').where({ project_id: projectId, user_id: userId }).first();
  return !!member;
}
