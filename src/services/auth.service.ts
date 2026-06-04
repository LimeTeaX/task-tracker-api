import { db } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

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
  // Check if user already exists
  const existingUser = await db('users').where({ email: input.email }).first();
  if (existingUser) {
    throw new ConflictError('User already exists');
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Create user
  const userId = uuidv4();
  await db('users').insert({
    id: userId,
    email: input.email,
    password_hash: hashedPassword,
    name: input.name,
    role: 'member', // Default role
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Generate tokens
  const payload = { id: userId, email: input.email, role: 'member' };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  const refreshTokenId = uuidv4();
  await db('refresh_tokens').insert({
    id: refreshTokenId,
    user_id: userId,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    created_at: new Date(),
  });

  return {
    user: { id: userId, email: input.email, name: input.name, role: 'member' },
    accessToken,
    refreshToken,
  };
}

export async function login(input: LoginInput) {
  // Find user
  const user = await db('users').where({ email: input.email }).first();
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(input.password, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token
  const refreshTokenId = uuidv4();
  await db('refresh_tokens').insert({
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
  // Delete refresh token from database
  await db('refresh_tokens').where({ token: refreshToken }).del();
  return true;
}

export async function refreshAccessToken(refreshToken: string) {
  // Find refresh token in database
  const storedToken = await db('refresh_tokens')
    .where({ token: refreshToken })
    .where('expires_at', '>', new Date())
    .first();

  if (!storedToken) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Get user
  const user = await db('users').where({ id: storedToken.user_id }).first();
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Generate new access token
  const payload = { id: user.id, email: user.email, role: user.role };
  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
}