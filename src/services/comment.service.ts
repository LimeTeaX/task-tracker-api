import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { hasProjectAccess } from '../utils/access';

export async function createComment(taskId: string, userId: string, comment: string) {
  const task = await db('tasks').where({ id: taskId, deleted_at: null }).first();
  if (!task) throw new NotFoundError('Task not found');

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this task');

  const commentId = uuidv4();
  await db('task_comments').insert({
    id: commentId,
    task_id: taskId,
    user_id: userId,
    comment,
    created_at: new Date(),
  });

  return getCommentById(commentId);
}

export async function getTaskComments(taskId: string, userId: string) {
  const task = await db('tasks').where({ id: taskId, deleted_at: null }).first();
  if (!task) throw new NotFoundError('Task not found');

  const hasAccess = await hasProjectAccess(userId, task.project_id);
  if (!hasAccess) throw new ForbiddenError('You do not have access to this task');

  const comments = await db('task_comments')
    .join('users', 'task_comments.user_id', 'users.id')
    .where('task_comments.task_id', taskId)
    .select(
      'task_comments.id',
      'task_comments.comment',
      'task_comments.created_at',
      'users.id as user_id',
      'users.name as user_name',
      'users.email as user_email',
    )
    .orderBy('task_comments.created_at', 'asc');

  return comments;
}

async function getCommentById(commentId: string) {
  const comment = await db('task_comments')
    .join('users', 'task_comments.user_id', 'users.id')
    .where('task_comments.id', commentId)
    .select(
      'task_comments.id',
      'task_comments.comment',
      'task_comments.created_at',
      'users.id as user_id',
      'users.name as user_name',
      'users.email as user_email',
    )
    .first();
  return comment || null;
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await db('task_comments').where({ id: commentId }).first();
  if (!comment) throw new NotFoundError('Comment not found');
  if (comment.user_id !== userId) throw new ForbiddenError('You can only delete your own comments');

  await db('task_comments').where({ id: commentId }).del();
  return { success: true };
}


