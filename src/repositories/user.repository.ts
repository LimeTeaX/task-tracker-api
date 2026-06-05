import { db } from '../config/database';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export async function create(data: UserCreateInput): Promise<void> {
  await db('users').insert(data);
}

export async function findByEmail(email: string): Promise<UserRecord | undefined> {
  return db('users').where({ email }).first();
}

export async function findById(id: string): Promise<UserRecord | undefined> {
  return db('users').where({ id }).first();
}
