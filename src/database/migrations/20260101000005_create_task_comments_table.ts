import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('task_comments', (table) => {
    table.uuid('id').primary();
    table.uuid('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.text('comment').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index('task_id');
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('task_comments');
}