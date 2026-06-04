import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('project_members', (table) => {
    table.uuid('id').primary();
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role', 20).notNullable().defaultTo('member');
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    
    table.unique(['project_id', 'user_id']);
    table.index('project_id');
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('project_members');
}