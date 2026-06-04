import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', (table) => {
    table.uuid('id').primary();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.uuid('owner_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('status', 20).notNullable().defaultTo('active'); // active, archived
    table.timestamp('deleted_at').nullable(); // soft delete
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Index untuk performa
    table.index('owner_id');
    table.index('status');
    table.index('deleted_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('projects');
}