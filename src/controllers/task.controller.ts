import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { getParamId } from '../utils/param';
import * as taskService from '../services/task.service';

export async function createTaskController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await taskService.createTask({
    title: req.body.title,
    description: req.body.description,
    projectId: req.body.projectId,
    priority: req.body.priority,
    due_date: req.body.due_date ? new Date(req.body.due_date) : undefined,
    assigneeId: req.body.assigneeId,
    createdBy: req.user!.id,
  });

  res.status(201).json({ success: true, data: result });
}

export async function getTaskController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const taskId = getParamId(req.params);
  const result = await taskService.getTaskById(taskId, req.user!.id);

  res.status(200).json({ success: true, data: result });
}

export async function listTasksController(req: Request, res: Response) {
  const result = await taskService.listTasks(req.user!.id, {
    projectId: req.query.projectId as string,
    status: req.query.status as string,
    priority: req.query.priority as string,
    assigneeId: req.query.assigneeId as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  });

  res.status(200).json({ success: true, data: result });
}

export async function updateTaskController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const taskId = getParamId(req.params);
  const result = await taskService.updateTask(taskId, req.user!.id, {
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    due_date: req.body.due_date ? new Date(req.body.due_date) : undefined,
  });

  res.status(200).json({ success: true, data: result });
}

export async function deleteTaskController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const taskId = getParamId(req.params);
  await taskService.deleteTask(taskId, req.user!.id);

  res.status(204).send();
}

export async function updateStatusController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const taskId = getParamId(req.params);
  const result = await taskService.updateTaskStatus(taskId, req.user!.id, req.body.status);

  res.status(200).json({ success: true, data: result });
}

export async function assignTaskController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const taskId = getParamId(req.params);
  const result = await taskService.assignTask(taskId, req.user!.id, req.body.assigneeId);

  res.status(200).json({ success: true, data: result });
}