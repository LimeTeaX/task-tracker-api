import request from 'supertest';
import app from '../../src/app';

jest.mock('../../src/services/github.service');
jest.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com', role: 'member' };
    next();
  },
}));
jest.mock('express-rate-limit', () => () => (_req: any, _res: any, next: any) => next());

import * as githubService from '../../src/services/github.service';

const PID = '00000000-0000-4000-a000-000000000010';

describe('GitHub API', () => {
  const mockRepo = {
    project_id: PID,
    repo_url: 'https://github.com/owner/repo',
    repo_owner: 'owner',
    repo_name: 'repo',
    last_synced_at: null,
  };

  const mockCommits = [
    { id: '00000000-0000-4000-a000-000000000020', message: 'Initial commit', author: 'owner', commit_date: new Date().toISOString(), commit_sha: 'abc123', commit_url: 'https://github.com/owner/repo/commit/abc123' },
  ];

  describe('POST /api/v1/github/link', () => {
    it('should link a repository', async () => {
      (githubService.linkRepo as jest.Mock).mockResolvedValueOnce(mockRepo);

      const res = await request(app)
        .post('/api/v1/github/link')
        .send({ projectId: PID, repoUrl: 'https://github.com/owner/repo' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repo_url).toBe('https://github.com/owner/repo');
    });

    it('should reject missing repoUrl', async () => {
      const res = await request(app)
        .post('/api/v1/github/link')
        .send({ projectId: PID });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/v1/github/unlink/:id', () => {
    it('should unlink a repository', async () => {
      (githubService.unlinkRepo as jest.Mock).mockResolvedValueOnce({ success: true, message: 'Repository unlinked successfully' });

      const res = await request(app).delete(`/api/v1/github/unlink/${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/github/sync/:id', () => {
    it('should sync commits', async () => {
      (githubService.syncCommits as jest.Mock).mockResolvedValueOnce({ synced: 5, total: 10 });

      const res = await request(app).post(`/api/v1/github/sync/${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.synced).toBe(5);
    });
  });

  describe('GET /api/v1/github/commits/:id', () => {
    it('should return commits', async () => {
      (githubService.getCommits as jest.Mock).mockResolvedValueOnce(mockCommits);

      const res = await request(app).get(`/api/v1/github/commits/${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/github/repo/:id', () => {
    it('should return linked repo', async () => {
      (githubService.getLinkedRepo as jest.Mock).mockResolvedValueOnce(mockRepo);

      const res = await request(app).get(`/api/v1/github/repo/${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.repo_url).toBe('https://github.com/owner/repo');
    });

    it('should return null when no repo linked', async () => {
      (githubService.getLinkedRepo as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get(`/api/v1/github/repo/${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });
});
