import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { hasProjectAccess } from '../utils/access';
import { taskRepo, taskCommentRepo } from '../repositories';

export async function createComment(taskId: string, userId: string, comment: string) {
  const task = await taskRepo.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this task');

  const commentId = uuidv4();
  await taskCommentRepo.create({
    id: commentId,
    task_id: taskId,
    user_id: userId,
    comment,
    created_at: new Date(),
  });

  return taskCommentRepo.findById(commentId);
}

export async function getTaskComments(taskId: string, userId: string) {
  const task = await taskRepo.findById(taskId);
  if (!task) throw new NotFoundError('Task not found');

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this task');

  return taskCommentRepo.findByTaskId(taskId);
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await taskCommentRepo.findByIdRaw(commentId);
  if (!comment) throw new NotFoundError('Comment not found');
  if (comment.user_id !== userId) throw new ForbiddenError('You can only delete your own comments');

  await taskCommentRepo.deleteComment(commentId);
  return { success: true };
}
