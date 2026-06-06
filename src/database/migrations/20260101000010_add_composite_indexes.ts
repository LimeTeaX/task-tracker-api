import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tasks_project_deleted ON tasks (project_id, deleted_at)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks (project_id, status)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_tasks_project_priority ON tasks (project_id, priority)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON task_comments (task_id, created_at)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id)');
  await knex.schema.raw('CREATE UNIQUE INDEX IF NOT EXISTS idx_github_commits_unique ON github_commits (project_id, commit_sha)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_github_commits_date ON github_commits (commit_date)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_tasks_project_deleted');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_tasks_project_status');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_tasks_project_priority');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_task_comments_task_created');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_refresh_tokens_user_id');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_github_commits_unique');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_github_commits_date');
}
