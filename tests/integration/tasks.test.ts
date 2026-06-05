import request from 'supertest';
import app from '../../src/app';

jest.mock('../../src/services/task.service');
jest.mock('../../src/services/comment.service');
jest.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { id: '00000000-0000-4000-a000-000000000001', email: 'test@example.com', role: 'member' };
    next();
  },
}));
jest.mock('express-rate-limit', () => () => (_req: any, _res: any, next: any) => next());

import * as taskService from '../../src/services/task.service';
import * as commentService from '../../src/services/comment.service';

const PID = '00000000-0000-4000-a000-000000000010';
const TID = '00000000-0000-4000-a000-000000000020';
const CID = '00000000-0000-4000-a000-000000000030';
const UID = '00000000-0000-4000-a000-000000000001';

describe('Tasks API', () => {
  const mockTask = {
    id: TID,
    title: 'Test Task',
    description: 'A test task',
    status: 'todo',
    priority: 'medium',
    project_id: PID,
  };

  describe('GET /api/v1/tasks', () => {
    it('should return tasks with pagination', async () => {
      (taskService.listTasks as jest.Mock).mockResolvedValueOnce({
        data: [mockTask],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      });

      const res = await request(app).get(`/api/v1/tasks?projectId=${PID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
    });

    it('should return tasks without projectId filter', async () => {
      (taskService.listTasks as jest.Mock).mockResolvedValueOnce({
        data: [mockTask],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      });

      const res = await request(app).get('/api/v1/tasks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should return a task', async () => {
      (taskService.getTaskById as jest.Mock).mockResolvedValueOnce(mockTask);

      const res = await request(app).get(`/api/v1/tasks/${TID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(TID);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task', async () => {
      (taskService.createTask as jest.Mock).mockResolvedValueOnce(mockTask);

      const res = await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'Test Task', projectId: PID, priority: 'medium' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing title', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .send({ projectId: PID });

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    it('should update a task', async () => {
      (taskService.updateTask as jest.Mock).mockResolvedValueOnce({ ...mockTask, title: 'Updated' });

      const res = await request(app)
        .put(`/api/v1/tasks/${TID}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated');
    });
  });

  describe('PATCH /api/v1/tasks/:id/status', () => {
    it('should update task status', async () => {
      (taskService.updateTaskStatus as jest.Mock).mockResolvedValueOnce({ ...mockTask, status: 'done' });

      const res = await request(app)
        .patch(`/api/v1/tasks/${TID}/status`)
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('done');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${TID}/status`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task', async () => {
      (taskService.deleteTask as jest.Mock).mockResolvedValueOnce(true);

      const res = await request(app).delete(`/api/v1/tasks/${TID}`);

      expect(res.status).toBe(204);
    });
  });

  describe('Task comments', () => {
    const mockComment = { id: CID, comment: 'Test comment', user_id: UID, user_name: 'Test', created_at: new Date().toISOString() };

    it('should get comments for a task', async () => {
      (commentService.getTaskComments as jest.Mock).mockResolvedValueOnce([mockComment]);

      const res = await request(app).get(`/api/v1/tasks/${TID}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it('should add a comment', async () => {
      (commentService.createComment as jest.Mock).mockResolvedValueOnce(mockComment);

      const res = await request(app)
        .post(`/api/v1/tasks/${TID}/comments`)
        .send({ comment: 'Test comment' });

      expect(res.status).toBe(201);
      expect(res.body.data.comment).toBe('Test comment');
    });

    it('should reject empty comment', async () => {
      const res = await request(app)
        .post(`/api/v1/tasks/${TID}/comments`)
        .send({ comment: '' });

      expect(res.status).toBe(422);
    });

    it('should delete a comment', async () => {
      (commentService.deleteComment as jest.Mock).mockResolvedValueOnce({ success: true });

      const res = await request(app).delete(`/api/v1/tasks/${TID}/comments/${CID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
