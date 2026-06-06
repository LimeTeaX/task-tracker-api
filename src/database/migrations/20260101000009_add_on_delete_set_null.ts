import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('ALTER TABLE tasks ALTER COLUMN created_by DROP NOT NULL');
  await knex.schema.raw('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_foreign');
  await knex.schema.raw('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_created_by_foreign');
  await knex.schema.raw('ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_id_foreign FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL');
  await knex.schema.raw('ALTER TABLE tasks ADD CONSTRAINT tasks_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL');

  await knex.schema.raw('ALTER TABLE task_comments ALTER COLUMN user_id DROP NOT NULL');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_task_comments_user_id');
  await knex.schema.raw('ALTER TABLE task_comments DROP CONSTRAINT IF EXISTS task_comments_user_id_foreign');
  await knex.schema.raw('ALTER TABLE task_comments ADD CONSTRAINT task_comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_foreign');
  await knex.schema.raw('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_created_by_foreign');
  await knex.schema.raw('ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_id_foreign FOREIGN KEY (assignee_id) REFERENCES users(id)');
  await knex.schema.raw('ALTER TABLE tasks ADD CONSTRAINT tasks_created_by_foreign FOREIGN KEY (created_by) REFERENCES users(id)');
  await knex.schema.raw('ALTER TABLE tasks ALTER COLUMN created_by SET NOT NULL');

  await knex.schema.raw('ALTER TABLE task_comments DROP CONSTRAINT IF EXISTS task_comments_user_id_foreign');
  await knex.schema.raw('ALTER TABLE task_comments ADD CONSTRAINT task_comments_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id)');
  await knex.schema.raw('ALTER TABLE task_comments ALTER COLUMN user_id SET NOT NULL');
}
