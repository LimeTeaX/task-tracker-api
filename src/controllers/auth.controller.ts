import { Request, Response } from 'express';
import { register, login, logout, refreshAccessToken } from '../services/auth.service';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function registerController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await register(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
  res.status(201).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export async function loginController(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const result = await login(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
}

export async function logoutController(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    await logout(refreshToken);
  }
  res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
  res.status(204).send();
}

export async function refreshController(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required', []);
  }

  const result = await refreshAccessToken(refreshToken);
  res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    data: { accessToken: result.accessToken },
  });
}
