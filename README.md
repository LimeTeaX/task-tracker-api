# Task Tracker API

Full-stack task management app with Kanban board, team collaboration, and GitHub integration.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Express 5 + TypeScript + Knex.js + PostgreSQL |
| Frontend | React 19 + Vite + Tailwind CSS + React Router 7 |
| Auth | JWT (access + refresh tokens), bcrypt |
| UI | Drag-and-drop (dnd-kit), Lucide icons, Dark mode |
| Infra | Docker Compose, Vercel (serverless) |

## Quick Start (Local)

```bash
# 1. Clone & install
npm install
cd frontend && npm install && cd ..

# 2. Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL connection

# 3. Run database migrations
npm run migrate:latest

# 4. (Optional) Seed demo data
npm run seed:dev

# 5. Start backend (port 3000)
npm run dev

# 6. Start frontend (port 5173) — terminal terpisah
cd frontend && npm run dev
```

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
| Projects | CRUD `/projects`, `/projects/:id`, Members: `/projects/:id/members` |
| Tasks | CRUD `/tasks`, `/tasks/:id`, Status: `/tasks/:id/status`, Assign: `/tasks/:id/assign` |
| Comments | GET/POST `/task/:taskId/comments`, DELETE `/comments/:id` |
| GitHub | Link `/github/link`, Unlink `/github/unlink/:id`, Sync `/github/sync/:id`, Commits `/github/commits/:id` |

## Deploy (Vercel)

Live: https://jackson-task-track.vercel.app

```bash
# Backend: Vercel serverless function (api/index.ts)
# Frontend: Vite build → static files
# Database: Neon PostgreSQL (serverless)

vercel --prod
```

## Project Structure

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Entry point
├── config/                   # Database, logger
├── controllers/              # Route handlers
├── middleware/                # Auth, error handler
├── routes/v1/                # Route definitions
├── services/                 # Business logic
├── utils/                    # Helpers (errors, param, access)
├── validators/               # express-validator rules
└── database/                 # Knex migrations + seeds
frontend/
├── src/
│   ├── pages/                # Login, Register, Dashboard, ProjectDetail
│   ├── components/           # Navbar, Modal, TaskCard, Skeleton, ProtectedRoute
│   ├── context/              # AuthContext, ThemeContext
│   └── services/             # Axios API client
└── Dockerfile + nginx.conf
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | - | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token TTL |
| `PORT` | No | `3000` | Server port |
| `CORS_ORIGIN` | No | `*` | Allowed origins (comma-separated) |
| `NODE_ENV` | No | `development` | Environment mode |
