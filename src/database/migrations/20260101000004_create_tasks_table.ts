import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary();
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.string('status', 20).notNullable().defaultTo('todo');
    table.string('priority', 20).notNullable().defaultTo('medium');
    table.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    table.uuid('assignee_id').nullable().references('id').inTable('users');
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.date('due_date').nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Indexes
    table.index('project_id');
    table.index('assignee_id');
    table.index('status');
    table.index('priority');
    table.index('due_date');
    table.index('deleted_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tasks');
}