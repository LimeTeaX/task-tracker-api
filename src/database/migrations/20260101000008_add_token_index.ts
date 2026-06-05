import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.index('token', 'idx_refresh_tokens_token');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.dropIndex('token', 'idx_refresh_tokens_token');
  });
}
