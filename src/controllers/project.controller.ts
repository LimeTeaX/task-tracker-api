import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { getParamId, getParamUserId } from '../utils/param';
import * as projectService from '../services/project.service';

export async function createProjectController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await projectService.createProject({
    name: req.body.name,
    description: req.body.description,
    ownerId: req.user!.id,
  });

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function getProjectController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = getParamId(req.params);
  const result = await projectService.getProjectById(projectId, req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function listProjectsController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await projectService.listProjects(req.user!.id, {
    status: req.query.status as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function updateProjectController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = getParamId(req.params);
  const result = await projectService.updateProject(
    projectId,
    req.user!.id,
    {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
    }
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function deleteProjectController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = getParamId(req.params);
  await projectService.deleteProject(projectId, req.user!.id, false);

  res.status(204).send();
}

export async function addMemberController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = getParamId(req.params);
  const result = await projectService.addProjectMember(
    projectId,
    req.user!.id,
    req.body.userId,
    req.body.role || 'member'
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function removeMemberController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = getParamId(req.params);
  const targetUserId = getParamUserId(req.params);
  const result = await projectService.removeProjectMember(
    projectId,
    req.user!.id,
    targetUserId
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getMembersController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const projectId = getParamId(req.params);
  const result = await projectService.getProjectMembers(projectId, req.user!.id);

  res.status(200).json({
    success: true,
    data: result,
  });
}