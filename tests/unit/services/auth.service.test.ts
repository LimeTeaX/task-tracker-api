import { ConflictError, UnauthorizedError } from '../../../src/utils/errors';

jest.mock('../../../src/repositories', () => ({
  userRepo: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
  refreshTokenRepo: {
    create: jest.fn(),
    deleteByToken: jest.fn(),
    findValidByToken: jest.fn(),
  },
}));

jest.mock('../../../src/utils/jwt.util', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
}));

jest.mock('../../../src/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('fixed-uuid'),
}));

import { userRepo, refreshTokenRepo } from '../../../src/repositories';
import * as authService from '../../../src/services/auth.service';

describe('auth.service', () => {
  const mockUser = {
    id: 'fixed-uuid',
    email: 'test@example.com',
    name: 'Test User',
    password_hash: 'hashed-password',
    role: 'member',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user and return tokens when email is not taken', async () => {
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password@123',
        name: 'Test User',
      });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'fixed-uuid',
          email: 'test@example.com',
          password_hash: 'hashed-password',
          name: 'Test User',
          role: 'member',
        })
      );
      expect(refreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'fixed-uuid',
          user_id: 'fixed-uuid',
          token: 'mock-refresh-token',
        })
      );
      expect(result).toEqual({
        user: { id: 'fixed-uuid', email: 'test@example.com', name: 'Test User', role: 'member' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw ConflictError if email already exists', async () => {
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password@123',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictError);

      expect(userRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      const { comparePassword } = require('../../../src/utils/hash.util');
      (comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password@123',
      });

      expect(result).toEqual({
        user: { id: 'fixed-uuid', email: 'test@example.com', name: 'Test User', role: 'member' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw UnauthorizedError for wrong email', async () => {
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(undefined);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'Password@123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      (userRepo.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      const { comparePassword } = require('../../../src/utils/hash.util');
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      const result = await authService.logout('some-refresh-token');

      expect(refreshTokenRepo.deleteByToken).toHaveBeenCalledWith('some-refresh-token');
      expect(result).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('should rotate refresh token and return new tokens', async () => {
      (refreshTokenRepo.findValidByToken as jest.Mock).mockResolvedValue({
        id: 'token-id',
        user_id: 'fixed-uuid',
        token: 'valid-refresh-token',
        expires_at: new Date(Date.now() + 86400000),
        created_at: new Date(),
      });
      (userRepo.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.refreshAccessToken('valid-refresh-token');

      expect(refreshTokenRepo.deleteByToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(refreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'fixed-uuid',
          token: 'mock-refresh-token',
        })
      );
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });
    });

    it('should throw UnauthorizedError for invalid or expired refresh token', async () => {
      (refreshTokenRepo.findValidByToken as jest.Mock).mockResolvedValue(undefined);

      await expect(
        authService.refreshAccessToken('invalid-token')
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when user not found for refresh token', async () => {
      (refreshTokenRepo.findValidByToken as jest.Mock).mockResolvedValue({
        id: 'token-id',
        user_id: 'nonexistent-user',
        token: 'valid-refresh-token',
        expires_at: new Date(Date.now() + 86400000),
        created_at: new Date(),
      });
      (userRepo.findById as jest.Mock).mockResolvedValue(undefined);

      await expect(
        authService.refreshAccessToken('valid-refresh-token')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
