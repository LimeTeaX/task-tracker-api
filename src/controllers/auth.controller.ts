import { Request, Response } from 'express';
import { register, login, logout, refreshAccessToken } from '../services/auth.service';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

export async function registerController(req: Request, res: Response) {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await register(req.body);
  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function loginController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await login(req.body);
  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function logoutController(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required', []);
  }

  await logout(refreshToken);
  res.status(204).send();
}

export async function refreshController(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required', []);
  }

  const result = await refreshAccessToken(refreshToken);
  res.status(200).json({
    success: true,
    data: result,
  });
}