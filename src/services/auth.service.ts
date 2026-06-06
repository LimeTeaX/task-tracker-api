import { hashPassword, comparePassword } from '../utils/hash.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { userRepo, refreshTokenRepo } from '../repositories';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput) {
  const existingUser = await userRepo.findByEmail(input.email);
  if (existingUser) {
    throw new ConflictError('User already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const userId = uuidv4();
  await userRepo.create({
    id: userId,
    email: input.email,
    password_hash: hashedPassword,
    name: input.name,
    role: 'member',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const payload = { id: userId, email: input.email, role: 'member' };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const refreshTokenId = uuidv4();
  await refreshTokenRepo.create({
    id: refreshTokenId,
    user_id: userId,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  return {
    user: { id: userId, email: input.email, name: input.name, role: 'member' },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  const user = await userRepo.findByEmail(input.email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(input.password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const refreshTokenId = uuidv4();
  await refreshTokenRepo.create({
    id: refreshTokenId,
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
  };
}

export async function logout(refreshToken: string) {
  await refreshTokenRepo.deleteByToken(refreshToken);
  return true;
}

export async function refreshAccessToken(refreshToken: string) {
  const storedToken = await refreshTokenRepo.findValidByToken(refreshToken);
  if (!storedToken) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await userRepo.findById(storedToken.user_id);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Rotate refresh token: delete old, issue new
  await refreshTokenRepo.deleteByToken(refreshToken);

  const payload = { id: user.id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  const refreshTokenId = uuidv4();
  await refreshTokenRepo.create({
    id: refreshTokenId,
    user_id: user.id,
    token: newRefreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
