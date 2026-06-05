import { NotFoundError, BadRequestError, ForbiddenError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories', () => ({
  projectRepo: {
    findById: jest.fn(),
  },
  githubRepoRepo: {
    findByProjectId: jest.fn(),
    create: jest.fn(),
    updateByProjectId: jest.fn(),
    deleteByProjectId: jest.fn(),
  },
  githubCommitRepo: {
    findByProjectId: jest.fn(),
    deleteByProjectId: jest.fn(),
  },
}));

jest.mock('../../../src/utils/access', () => ({
  hasProjectAccess: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('fixed-uuid'),
}));

import { projectRepo, githubRepoRepo, githubCommitRepo } from '../../../src/repositories';
import { hasProjectAccess } from '../../../src/utils/access';
import * as githubService from '../../../src/services/github.service';

describe('github.service', () => {
  const userId = 'user-1';
  const ownerId = 'owner-1';
  const projectId = 'project-1';

  const mockProject = {
    id: projectId,
    name: 'Test Project',
    owner_id: ownerId,
    deleted_at: null,
  };

  const mockRepo = {
    project_id: projectId,
    repo_url: 'https://github.com/owner/repo',
    repo_owner: 'owner',
    repo_name: 'repo',
    last_synced_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('linkRepo', () => {
    it('should link a new repository', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);
      (githubRepoRepo.findByProjectId as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(mockRepo);

      const result = await githubService.linkRepo({
        projectId,
        repoUrl: 'https://github.com/owner/repo',
        userId: ownerId,
      });

      expect(githubRepoRepo.create).toHaveBeenCalled();
      expect(result).toEqual(mockRepo);
    });

    it('should update an existing linked repository', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);
      (githubRepoRepo.findByProjectId as jest.Mock)
        .mockResolvedValueOnce(mockRepo)
        .mockResolvedValueOnce(mockRepo);

      const result = await githubService.linkRepo({
        projectId,
        repoUrl: 'https://github.com/owner/new-repo',
        userId: ownerId,
      });

      expect(githubRepoRepo.updateByProjectId).toHaveBeenCalled();
      expect(result).toEqual(mockRepo);
    });

    it('should throw ForbiddenError if not project owner', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        githubService.linkRepo({ projectId, repoUrl: 'https://github.com/owner/repo', userId: 'other-user' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError for invalid URL', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        githubService.linkRepo({ projectId, repoUrl: 'not-a-url', userId: ownerId })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        githubService.linkRepo({ projectId, repoUrl: 'https://github.com/owner/repo', userId: ownerId })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('unlinkRepo', () => {
    it('should unlink repository and delete commits', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);

      const result = await githubService.unlinkRepo(projectId, ownerId);

      expect(githubCommitRepo.deleteByProjectId).toHaveBeenCalledWith(projectId);
      expect(githubRepoRepo.deleteByProjectId).toHaveBeenCalledWith(projectId);
      expect(result).toEqual({ success: true, message: 'Repository unlinked successfully' });
    });

    it('should throw ForbiddenError if not project owner', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        githubService.unlinkRepo(projectId, 'other-user')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getCommits', () => {
    const mockCommits = [{ id: '1', project_id: projectId, commit_sha: 'abc' }];

    it('should return commits for a project', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (githubCommitRepo.findByProjectId as jest.Mock).mockResolvedValue(mockCommits);

      const result = await githubService.getCommits(projectId, userId);

      expect(result).toEqual(mockCommits);
    });

    it('should throw ForbiddenError if user has no access', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(githubService.getCommits(projectId, userId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getLinkedRepo', () => {
    it('should return linked repo', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (githubRepoRepo.findByProjectId as jest.Mock).mockResolvedValue(mockRepo);

      const result = await githubService.getLinkedRepo(projectId, userId);

      expect(result).toEqual(mockRepo);
    });

    it('should return null if no repo linked', async () => {
      (projectRepo.findById as jest.Mock).mockResolvedValue(mockProject);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (githubRepoRepo.findByProjectId as jest.Mock).mockResolvedValue(undefined);

      const result = await githubService.getLinkedRepo(projectId, userId);

      expect(result).toBeNull();
    });
  });
});
