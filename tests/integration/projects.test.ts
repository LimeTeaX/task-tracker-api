import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';

jest.mock('../../src/services/project.service');
jest.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com', role: 'member' };
    next();
  },
}));
jest.mock('express-rate-limit', () => () => (_req: any, _res: any, next: any) => next());

import * as projectService from '../../src/services/project.service';

const PID = '00000000-0000-4000-a000-000000000010';
const UID = '00000000-0000-4000-a000-000000000001';

describe('Projects API', () => {
  const mockProject = {
    id: PID,
    name: 'Test Project',
    description: 'A test project',
    owner_id: UID,
    status: 'active',
    members_count: 1,
  };

  const mockMember = { id: '00000000-0000-4000-a000-000000000020', name: 'Member', email: 'member@test.com', project_role: 'member' };

  describe('GET /api/v1/projects', () => {
    it('should return paginated projects', async () => {
      (projectService.listProjects as jest.Mock).mockResolvedValueOnce({
        data: [mockProject],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      });

      const res = await request(app).get('/api/v1/projects');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      (projectService.createProject as jest.Mock).mockResolvedValueOnce(mockProject);

      const res = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'Test Project', description: 'A test project' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Project');
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({ description: 'No name' });

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should return a project', async () => {
      (projectService.getProjectById as jest.Mock).mockResolvedValueOnce(mockProject);

      const res = await request(app).get(`/api/v1/projects/${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(PID);
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    it('should update a project', async () => {
      (projectService.updateProject as jest.Mock).mockResolvedValueOnce({ ...mockProject, name: 'Updated' });

      const res = await request(app)
        .put(`/api/v1/projects/${PID}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project', async () => {
      (projectService.deleteProject as jest.Mock).mockResolvedValueOnce(true);

      const res = await request(app).delete(`/api/v1/projects/${PID}`);

      expect(res.status).toBe(204);
    });
  });

  describe('Project members', () => {
    it('should get project members', async () => {
      (projectService.getProjectMembers as jest.Mock).mockResolvedValueOnce([mockMember]);

      const res = await request(app).get(`/api/v1/projects/${PID}/members`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should add a member', async () => {
      (projectService.addProjectMember as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Member added successfully',
        user: mockMember,
      });

      const res = await request(app)
        .post(`/api/v1/projects/${PID}/members`)
        .send({ userId: mockMember.id, role: 'member' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should remove a member', async () => {
      (projectService.removeProjectMember as jest.Mock).mockResolvedValueOnce({ success: true, message: 'Member removed successfully' });

      const res = await request(app).delete(`/api/v1/projects/${PID}/members/${mockMember.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
