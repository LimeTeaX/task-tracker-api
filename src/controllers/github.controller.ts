import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { getParamId } from '../utils/param';
import * as githubService from '../services/github.service';

export async function linkRepoController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Validation failed', errors.array());
  const result = await githubService.linkRepo({
    projectId: req.body.projectId,
    repoUrl: req.body.repoUrl,
    userId: req.user!.id,
  });
  res.status(200).json({ success: true, data: result });
}

export async function unlinkRepoController(req: Request, res: Response) {
  const projectId = getParamId(req.params);
  const result = await githubService.unlinkRepo(projectId, req.user!.id);
  res.status(200).json({ success: true, data: result });
}

export async function syncCommitsController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Validation failed', errors.array());
  const projectId = getParamId(req.params);
  const result = await githubService.syncCommits(projectId, req.user!.id);
  res.status(200).json({ success: true, data: result });
}

export async function getCommitsController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new ValidationError('Validation failed', errors.array());
  const projectId = getParamId(req.params);
  const result = await githubService.getCommits(projectId, req.user!.id);
  res.status(200).json({ success: true, data: result });
}

export async function getLinkedRepoController(req: Request, res: Response) {
  const projectId = getParamId(req.params);
  const result = await githubService.getLinkedRepo(projectId, req.user!.id);
  res.status(200).json({ success: true, data: result });
}
