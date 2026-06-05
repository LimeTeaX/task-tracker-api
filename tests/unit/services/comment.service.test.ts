import { NotFoundError, ForbiddenError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories', () => ({
  taskRepo: {
    findById: jest.fn(),
  },
  taskCommentRepo: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdRaw: jest.fn(),
    findByTaskId: jest.fn(),
    deleteComment: jest.fn(),
  },
}));

jest.mock('../../../src/utils/access', () => ({
  hasProjectAccess: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('fixed-comment-uuid'),
}));

import { taskRepo, taskCommentRepo } from '../../../src/repositories';
import { hasProjectAccess } from '../../../src/utils/access';
import * as commentService from '../../../src/services/comment.service';

describe('comment.service', () => {
  const userId = 'user-1';
  const taskId = 'task-1';
  const projectId = 'project-1';
  const commentId = 'fixed-comment-uuid';

  const mockTask = {
    id: taskId,
    project_id: projectId,
    title: 'Test Task',
    status: 'todo',
    deleted_at: null,
  };

  const mockComment = {
    id: commentId,
    comment: 'Test comment',
    created_at: new Date(),
    user_id: userId,
    user_name: 'Test User',
    user_email: 'test@example.com',
  };

  const mockCommentRaw = {
    id: commentId,
    task_id: taskId,
    user_id: userId,
    comment: 'Test comment',
    created_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create and return comment', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskCommentRepo.findById as jest.Mock).mockResolvedValue(mockComment);

      const result = await commentService.createComment(taskId, userId, 'Test comment');

      expect(taskCommentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: commentId,
          task_id: taskId,
          user_id: userId,
          comment: 'Test comment',
        })
      );
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        commentService.createComment(taskId, userId, 'Test comment')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has no access', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(
        commentService.createComment(taskId, userId, 'Test comment')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('getTaskComments', () => {
    it('should return comments for a task', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(mockTask);
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      (taskCommentRepo.findByTaskId as jest.Mock).mockResolvedValue([mockComment]);

      const result = await commentService.getTaskComments(taskId, userId);

      expect(result).toEqual([mockComment]);
    });

    it('should throw NotFoundError if task does not exist', async () => {
      (taskRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        commentService.getTaskComments(taskId, userId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteComment', () => {
    it('should delete own comment', async () => {
      (taskCommentRepo.findByIdRaw as jest.Mock).mockResolvedValue(mockCommentRaw);

      const result = await commentService.deleteComment(commentId, userId);

      expect(taskCommentRepo.deleteComment).toHaveBeenCalledWith(commentId);
      expect(result).toEqual({ success: true });
    });

    it('should throw NotFoundError if comment does not exist', async () => {
      (taskCommentRepo.findByIdRaw as jest.Mock).mockResolvedValue(undefined);

      await expect(
        commentService.deleteComment(commentId, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if not the comment owner', async () => {
      (taskCommentRepo.findByIdRaw as jest.Mock).mockResolvedValue(mockCommentRaw);

      await expect(
        commentService.deleteComment(commentId, 'other-user')
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
