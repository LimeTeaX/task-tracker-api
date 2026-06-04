import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('github_repos', (table) => {
    table.uuid('project_id').primary().references('id').inTable('projects').onDelete('CASCADE');
    table.string('repo_url', 500).notNullable();
    table.string('repo_owner', 255).notNullable();
    table.string('repo_name', 255).notNullable();
    table.timestamp('last_synced_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('github_repos');
}
