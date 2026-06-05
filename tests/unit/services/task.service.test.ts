import { NotFoundError, ForbiddenError, BadRequestError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories', () => ({
  taskRepo: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithUsers: jest.fn(),
    findByFilters: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  },
  projectRepo: {
    findAccessibleByUserId: jest.fn(),
  },
  projectMemberRepo: {
    findByProjectAndUser: jest.fn(),
  },
}));

jest.mock('../../../src/utils/access', () => ({
  hasProjectAccess: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('fixed-task-uuid'),
}));

import { taskRepo, projectRepo, projectMemberRepo } from '../../../src/repositories';
import { hasProjectAccess } from '../../../src/utils/access';
import * as taskService from '../../../src/services/task.service';

describe('task.service', () => {
  const userId = 'user-1';
  const projectId = 'project-1';
  const taskId = 'fixed-task-uuid';

  const mockTask = {
    id: taskId,
    title: 'Test Task',
    description: 'A test task',
    project_id: projectId,
    priority: 'medium',
    due_date: null,
    assignee_id: null,
    created_by: userId,
    status: 'todo',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  const mockTaskWithUsers = {
    ...mockTask,
    assignee: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create and return task', async () => {
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (taskRepo.findByIdWithUsers as jest.Mock).mockResolvedValue(mockTaskWithUsers);

      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'A test task',
        projectId,
        createdBy: userId,
      });

      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: taskId,
          title: 'Test Task',
          project_id: projectId,
          priority: 'medium',
          status: 'todo',
          created_by: userId,
        })
      );
      expect(result).toEqual(mockTaskWithUsers);
    });

    it('should throw ForbiddenError if user has no project access', async () => {
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(
        taskService.createTask({
          title: 'Test Task',
          projectId,
          createdBy: userId,
        })
      ).rejects.toThrow(ForbiddenError);

      expect(taskRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('getTaskById', () => {
    it('should return task with users', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskRepo.findByIdWithUsers as jest.Mock).mockResolvedValue(mockTaskWithUsers);

      const result = await taskService.getTaskById(taskId, userId);

      expect(result).toEqual(mockTaskWithUsers);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(taskService.getTaskById(taskId, userId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has no project access', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(taskService.getTaskById(taskId, userId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listTasks', () => {
    it('should return paginated tasks', async () => {
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskRepo.findByFilters as jest.Mock).mockResolvedValue({
        data: [mockTaskWithUsers],
        total: 1,
      });

      const result = await taskService.listTasks(userId, { projectId, page: 1, limit: 20 });

      expect(result).toEqual({
        data: [mockTaskWithUsers],
        pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
      });
    });

    it('should return empty list when no project specified and no accessible projects', async () => {
      (projectRepo.findAccessibleByUserId as jest.Mock).mockResolvedValue([]);

      const result = await taskService.listTasks(userId, {});

      expect(result).toEqual({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
      });
    });

    it('should throw ForbiddenError if user has no access to specified project', async () => {
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(
        taskService.listTasks(userId, { projectId })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateTask', () => {
    it('should update and return task', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskRepo.findByIdWithUsers as jest.Mock).mockResolvedValue({
        ...mockTaskWithUsers,
        title: 'Updated Task',
      });

      const result = await taskService.updateTask(taskId, userId, {
        title: 'Updated Task',
      });

      expect(taskRepo.update).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({ title: 'Updated Task' })
      );
      expect(result).toEqual(expect.objectContaining({ title: 'Updated Task' }));
    });

    it('should throw NotFoundError if task does not exist', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        taskService.updateTask(taskId, userId, { title: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has no project access', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(
        taskService.updateTask(taskId, userId, { title: 'Updated' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteTask', () => {
    it('should soft delete the task', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);

      const result = await taskService.deleteTask(taskId, userId);

      expect(taskRepo.softDelete).toHaveBeenCalledWith(taskId);
      expect(result).toBe(true);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(taskService.deleteTask(taskId, userId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has no access', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(taskService.deleteTask(taskId, userId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskRepo.findByIdWithUsers as jest.Mock).mockResolvedValue({
        ...mockTaskWithUsers,
        status: 'in_progress',
      });

      const result = await taskService.updateTaskStatus(taskId, userId, 'in_progress');

      expect(taskRepo.update).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({ status: 'in_progress' })
      );
      expect(result).toEqual(expect.objectContaining({ status: 'in_progress' }));
    });

    it('should throw NotFoundError if task does not exist', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        taskService.updateTaskStatus(taskId, userId, 'in_progress')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignTask', () => {
    it('should assign a member to the task', async () => {
      const assigneeId = 'user-2';
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (projectMemberRepo.findByProjectAndUser as jest.Mock).mockResolvedValue({
        id: 'member-id',
        project_id: projectId,
        user_id: assigneeId,
        role: 'member',
        joined_at: new Date(),
      });
      (taskRepo.findByIdWithUsers as jest.Mock).mockResolvedValue({
        ...mockTaskWithUsers,
        assignee_id: assigneeId,
      });

      const result = await taskService.assignTask(taskId, userId, assigneeId);

      expect(taskRepo.update).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({ assignee_id: assigneeId })
      );
      expect(result).toEqual(expect.objectContaining({ assignee_id: assigneeId }));
    });

    it('should throw BadRequestError if user is not a project member', async () => {
      const assigneeId = 'user-2';
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (projectMemberRepo.findByProjectAndUser as jest.Mock).mockResolvedValue(undefined);

      await expect(
        taskService.assignTask(taskId, userId, assigneeId)
      ).rejects.toThrow(BadRequestError);
    });
  });
});
