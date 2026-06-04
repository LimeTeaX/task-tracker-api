import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('github_commits', (table) => {
    table.uuid('id').primary();
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.string('commit_sha', 40).notNullable();
    table.text('message').notNullable();
    table.string('author', 255).notNullable();
    table.timestamp('commit_date').notNullable();
    table.string('commit_url', 500).notNullable();
    table.timestamp('synced_at').notNullable().defaultTo(knex.fn.now());
    table.index('project_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('github_commits');
}
