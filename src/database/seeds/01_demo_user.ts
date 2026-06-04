import { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('task_comments').del();
  await knex('github_commits').del();
  await knex('github_repos').del();
  await knex('tasks').del();
  await knex('project_members').del();
  await knex('projects').del();
  await knex('refresh_tokens').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('Demo@123', 12);
  const demoUserId = uuidv4();

  await knex('users').insert({
    id: demoUserId,
    email: 'demo@example.com',
    password_hash: passwordHash,
    name: 'Demo User',
    role: 'member',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const projectId = uuidv4();
  await knex('projects').insert({
    id: projectId,
    name: 'Demo Project',
    description: 'This is a demo project to get you started',
    owner_id: demoUserId,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  await knex('project_members').insert({
    id: uuidv4(),
    project_id: projectId,
    user_id: demoUserId,
    role: 'manager',
    joined_at: new Date(),
  });

  const tasks = [
    { title: 'Setup project infrastructure', priority: 'high', status: 'done' },
    { title: 'Implement user authentication', priority: 'high', status: 'done' },
    { title: 'Design database schema', priority: 'medium', status: 'done' },
    { title: 'Create task management UI', priority: 'high', status: 'in_progress' },
    { title: 'Add GitHub integration', priority: 'medium', status: 'todo' },
    { title: 'Write unit tests', priority: 'low', status: 'todo' },
    { title: 'Fix pagination bug', priority: 'critical', status: 'review' },
  ];

  for (const task of tasks) {
    await knex('tasks').insert({
      id: uuidv4(),
      title: task.title,
      description: null,
      status: task.status,
      priority: task.priority,
      project_id: projectId,
      assignee_id: demoUserId,
      created_by: demoUserId,
      due_date: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  console.log(`✅ Seeded demo user: demo@example.com / Demo@123`);
  console.log(`✅ Created project with ${tasks.length} tasks`);
}
