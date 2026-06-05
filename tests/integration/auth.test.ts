import request from 'supertest';
import app from '../../src/app';
import * as authService from '../../src/services/auth.service';
import { ConflictError, UnauthorizedError } from '../../src/utils/errors';

jest.mock('../../src/services/auth.service');

jest.mock('express-rate-limit', () => {
  return () => (_req: any, _res: any, next: any) => next();
});

describe('Auth API', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  });

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'member',
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      (authService.register as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        ...mockTokens,
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'Password1!', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      (authService.register as jest.Mock).mockRejectedValueOnce(
        new ConflictError('User already exists')
      );

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'existing@example.com', password: 'Password1!', name: 'Test User' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('User already exists');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'Password1!', name: 'Test User' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'short', name: 'Test User' });

      expect(res.status).toBe(422);
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'Password1!' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login and return tokens', async () => {
      (authService.login as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        ...mockTokens,
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password1!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject wrong password', async () => {
      (authService.login as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedError('Invalid email or password')
      );

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword1!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'invalid', password: 'Password1!' });

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      (authService.logout as jest.Mock).mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'mock-refresh-token' });

      expect(res.status).toBe(204);
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token', async () => {
      (authService.refreshAccessToken as jest.Mock).mockResolvedValueOnce({
        accessToken: 'new-access-token',
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'mock-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(422);
    });
  });
});
