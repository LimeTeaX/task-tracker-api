# Task Tracker API

Full-stack task management app with Kanban board, team collaboration, and GitHub integration.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Express 5 + TypeScript + Knex.js + PostgreSQL (Neon) |
| Frontend | React 19 + Vite + Tailwind CSS + React Router 7 |
| Auth | JWT (access in memory, refresh in httpOnly cookie), bcrypt (12 rounds), refresh token rotation |
| UI | Drag-and-drop (dnd-kit), Lucide icons, Dark mode, Toast notifications, Confirm modal |
| Testing | Jest + ts-jest + Supertest (121 tests) |
| Infra | Vercel (serverless), Neon PostgreSQL, Docker Compose |

## Quick Start (Local)

```bash
# 1. Clone & install
npm install
cd frontend && npm install && cd ..

# 2. Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL/Neon connection string

# 3. Run database migrations
npm run migrate:latest

# 4. (Optional) Seed demo data
npm run seed:dev

# 5. Start backend (port 3000)
npm run dev

# 6. Start frontend (port 5173) — terminal terpisah
cd frontend && npm run dev
```

**Demo login**: `demo@example.com` / `Demo@123`

## Docker

```bash
docker compose up -d
```

This starts PostgreSQL + Backend + Frontend (Nginx).

## API Endpoints

Base: `/api/v1`

| Group | Endpoints |
|-------|-----------|
| Auth | POST `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh` |
| Projects | CRUD `/projects`, `/projects/:id` + Members `/projects/:id/members` |
| Tasks | CRUD `/tasks`, `/tasks/:id` + Status `/tasks/:id/status` + Assign `/tasks/:id/assign` |
| Comments | GET/POST/DELETE `/tasks/:id/comments`, `/tasks/:id/comments/:commentId` |
| GitHub | Link `/github/link`, Unlink `/github/unlink/:id`, Sync `/github/sync/:id`, Commits `/github/commits/:id`, Repo `/github/repo/:id` |

## Deploy (Vercel)

Live: https://jackson-task-track.vercel.app

```bash
vercel --prod
```

**Architecture**: Backend → serverless function (`api/index.ts`), Frontend → static files, Database → Neon PostgreSQL.

## Project Structure

```
src/
├── app.ts                    # Express app setup (middleware, routes)
├── server.ts                 # Entry point
├── api/                      # Vercel serverless entry point
│   └── index.ts
├── config/                   # Database (Knex), Logger (Winston)
├── controllers/              # Route handlers (thin layer)
├── middleware/                # Auth (JWT), Error handler, Request ID
├── repositories/             # Database queries (8 files: user, refreshToken,
│                             #   project, projectMember, task, taskComment,
│                             #   githubRepo, githubCommit)
├── routes/v1/                # Route definitions (auth, project, task, github)
├── services/                 # Business logic (auth, project, task, comment, github)
├── utils/                    # jwt.util, hash.util, errors, access, param
├── validators/               # express-validator rules
└── database/                 # Knex migrations (11) + seeds
frontend/
├── src/
│   ├── App.tsx               # Router + providers
│   ├── main.tsx              # Entry point
│   ├── pages/                # Login, Register, Dashboard, ProjectDetail, NotFound
│   ├── components/           # Navbar, Modal, Skeleton, ProtectedRoute, TaskBoard,
│   │                         #   TaskColumn, SortableTaskCard, TaskForm, MemberList,
│   │                         #   GitHubPanel, CommentSection, ConfirmModal
│   ├── context/              # AuthContext, ThemeContext, ToastContext
│   ├── services/             # Axios API client (api.ts)
│   └── types/                # Shared TypeScript types
└── Dockerfile + nginx.conf
tests/
├── unit/                     # 77 tests (auth, task, project, comment, github, errors, hash)
└── integration/              # 44 tests (health, auth, projects, tasks, github)
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL/Neon connection string |
| `JWT_SECRET` | Yes | - | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | - | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token TTL |
| `PORT` | No | `3000` | Server port |
| `CORS_ORIGIN` | No | `*` | Allowed origins (comma-separated; cannot be `*` when using credentials) |
| `VITE_API_URL` | No | `/api/v1` | Frontend API base URL (relative for Vercel, absolute for local dev) |
| `NODE_ENV` | No | `development` | Environment mode |

## Testing

```bash
npm test                          # Run all 121 tests
npx jest tests/unit/              # Unit tests only
npx jest tests/integration/       # Integration tests only
npx jest --coverage               # With coverage report
```
