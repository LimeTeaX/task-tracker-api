import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { hasProjectAccess } from '../utils/access';
import { logger } from '../config/logger';
import { projectRepo, githubRepoRepo, githubCommitRepo } from '../repositories';

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
  const project = await projectRepo.findById(input.projectId);
  if (!project) throw new NotFoundError('Project not found');
  if (project.owner_id !== input.userId) throw new ForbiddenError('Only project owner can link a repository');

  const parsed = parseGithubUrl(input.repoUrl);
  if (!parsed) throw new BadRequestError('Invalid GitHub repository URL');

  const existing = await githubRepoRepo.findByProjectId(input.projectId);
  if (existing) {
    await githubRepoRepo.updateByProjectId(input.projectId, {
      repo_url: input.repoUrl,
      repo_owner: parsed.owner,
      repo_name: parsed.repo,
      updated_at: new Date(),
    });
  } else {
    await githubRepoRepo.create({
      project_id: input.projectId,
      repo_url: input.repoUrl,
      repo_owner: parsed.owner,
      repo_name: parsed.repo,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return githubRepoRepo.findByProjectId(input.projectId);
}

export async function unlinkRepo(projectId: string, userId: string) {
  const project = await projectRepo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');
  if (project.owner_id !== userId) throw new ForbiddenError('Only project owner can unlink a repository');

  await githubCommitRepo.deleteByProjectId(projectId);
  await githubRepoRepo.deleteByProjectId(projectId);
  return { success: true, message: 'Repository unlinked successfully' };
}

export async function syncCommits(projectId: string, userId: string) {
  const project = await projectRepo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const hasAccess = await hasProjectAccess(userId, projectId);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this project');

  const repo = await githubRepoRepo.findByProjectId(projectId);
  if (!repo) throw new BadRequestError('No GitHub repository linked to this project');

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'task-tracker-api',
  };
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${repo.repo_owner}/${repo.repo_name}/commits?per_page=50`,
    { headers }
  );

  if (!response.ok) {
    logger.error(`GitHub API error: ${response.status} ${response.statusText}`);
    throw new BadRequestError(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const commits = await response.json() as any[];
  const existingShas = await githubCommitRepo.findExistingShas(
    projectId,
    commits.map(c => c.sha)
  );

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

    await githubCommitRepo.batchCreate(batch);
  }

  await githubRepoRepo.updateByProjectId(projectId, {
    last_synced_at: new Date(),
    updated_at: new Date(),
  });

  return { synced: newCommits.length, total: commits.length };
}

export async function getCommits(projectId: string, userId: string) {
  const project = await projectRepo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const hasAccess = await hasProjectAccess(userId, projectId);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this project');

  return githubCommitRepo.findByProjectId(projectId);
}

export async function getLinkedRepo(projectId: string, userId: string) {
  const project = await projectRepo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const hasAccess = await hasProjectAccess(userId, projectId);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this project');

  const repo = await githubRepoRepo.findByProjectId(projectId);
  return repo || null;
}
