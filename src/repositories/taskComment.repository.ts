import { db } from '../config/database';

export interface TaskCommentRecord {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: Date;
}

export interface TaskCommentCreateInput {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: Date;
}

export interface CommentWithUserRecord {
  id: string;
  comment: string;
  created_at: Date;
  user_id: string;
  user_name: string;
  user_email: string;
}

export async function create(data: TaskCommentCreateInput): Promise<void> {
  await db('task_comments').insert(data);
}

export async function findById(id: string): Promise<CommentWithUserRecord | undefined> {
  return db('task_comments')
    .join('users', 'task_comments.user_id', 'users.id')
    .where('task_comments.id', id)
    .select(
      'task_comments.id',
      'task_comments.comment',
      'task_comments.created_at',
      'users.id as user_id',
      'users.name as user_name',
      'users.email as user_email'
    )
    .first();
}

export async function findByIdRaw(id: string): Promise<TaskCommentRecord | undefined> {
  return db('task_comments').where({ id }).first();
}

export async function findByTaskId(taskId: string): Promise<CommentWithUserRecord[]> {
  return db('task_comments')
    .join('users', 'task_comments.user_id', 'users.id')
    .where('task_comments.task_id', taskId)
    .select(
      'task_comments.id',
      'task_comments.comment',
      'task_comments.created_at',
      'users.id as user_id',
      'users.name as user_name',
      'users.email as user_email'
    )
    .orderBy('task_comments.created_at', 'asc');
}

export async function deleteComment(id: string): Promise<void> {
  await db('task_comments').where({ id }).del();
}
