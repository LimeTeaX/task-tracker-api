import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { getParamId } from '../utils/param';
import * as commentService from '../services/comment.service';

export async function createCommentController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Validation failed', errors.array());
  const taskId = getParamId(req.params);
  const result = await commentService.createComment(taskId, req.user!.id, req.body.comment);
  res.status(201).json({ success: true, data: result });
}

export async function getTaskCommentsController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Validation failed', errors.array());
  const taskId = getParamId(req.params);
  const result = await commentService.getTaskComments(taskId, req.user!.id);
  res.status(200).json({ success: true, data: result });
}

export async function deleteCommentController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Validation failed', errors.array());
  const commentId = getParamId(req.params);
  const result = await commentService.deleteComment(commentId, req.user!.id);
  res.status(200).json({ success: true, data: result });
}
