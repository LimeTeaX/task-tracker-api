import jwt from 'jsonwebtoken';

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const JWT_SECRET = getEnvOrThrow('JWT_SECRET');
const JWT_REFRESH_SECRET = getEnvOrThrow('JWT_REFRESH_SECRET');
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY } as jwt.SignOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload as object, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    return null;
  }
}