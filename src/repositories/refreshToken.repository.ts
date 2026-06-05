import { db } from '../config/database';

export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface RefreshTokenCreateInput {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export async function create(data: RefreshTokenCreateInput): Promise<void> {
  await db('refresh_tokens').insert(data);
}

export async function deleteByToken(token: string): Promise<void> {
  await db('refresh_tokens').where({ token }).del();
}

export async function findValidByToken(token: string): Promise<RefreshTokenRecord | undefined> {
  return db('refresh_tokens')
    .where({ token })
    .where('expires_at', '>', new Date())
    .first();
}
