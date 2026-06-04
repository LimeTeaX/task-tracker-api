import knex, { Knex } from 'knex';
import config from '../database/knexfile';

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

export const db: Knex = knex(dbConfig);

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}