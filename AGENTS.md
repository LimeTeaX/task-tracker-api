# Task Tracker API — Codebase Context

## Architecture

### Backend (Express 5 + TypeScript + Knex.js + PostgreSQL)

```
src/
├── app.ts                    # Express app setup (middleware, routes)
├── server.ts                 # Entry point
├── config/                   # Database (Knex), Logger (Winston)
├── controllers/              # Route handlers (thin layer)
├── middleware/                # Auth (JWT), Error handler, Request ID, cookie-parser
├── repositories/             # Database queries (8 files: user, refreshToken,
│                             #   project, projectMember, task, taskComment,
│                             #   githubRepo, githubCommit)
├── routes/v1/                # Route definitions (auth, project, task, github)
├── services/                 # Business logic (auth, project, task, comment, github)
├── utils/                    # jwt.util, hash.util, errors, access, param
├── validators/               # express-validator rules
└── database/                 # Knex migrations (11) + seeds
```

### Frontend (React 19 + Vite + Tailwind CSS)

```
frontend/src/
├── App.tsx                   # Router + providers
├── main.jsx                  # Entry point
├── pages/                    # Login, Register, Dashboard, ProjectDetail, NotFound
├── components/               # Navbar, Modal, Skeleton, ProtectedRoute, TaskBoard,
│                             #   TaskColumn, SortableTaskCard, TaskForm, MemberList,
│                             #   GitHubPanel, CommentSection, ConfirmModal
├── context/                  # AuthContext, ThemeContext, ToastContext
├── services/                 # Axios API client (api.ts)
└── types/                    # Shared TypeScript types
```

## Key Decisions

- **Database**: Neon PostgreSQL (serverless, ap-southeast-1). SSL required.
- **Auth**: JWT access (localStorage) + refresh (httpOnly cookie). bcrypt (12 rounds). Refresh token rotation on every refresh.
- **Repository pattern**: All DB queries in `repositories/`, services call repositories.
- **Access control**: Centralized in `utils/access.ts` — `hasProjectAccess()`, `isProjectManager()`.
- **Testing**: Jest + ts-jest. Services mocked at `config/database` or `repositories` level.
- **Route params**: All `:id` must be UUID v4 (validated by express-validator `isUUID()`).
- **Comments routes**: Consolidated under `/api/v1/tasks/:id/comments` (in task.routes.ts).
- **Error handling**: Custom error classes (NotFoundError, ForbiddenError, etc.) + `asyncHandler`.
- **Toast/Confirm**: Custom ToastContext with auto-dismiss and slide-in animation; ConfirmModal wrapping shared Modal component — no notification library dependency.

## Testing

### Unit tests (77 tests, 7 files)
- `tests/unit/services/auth.service.test.ts`
- `tests/unit/services/task.service.test.ts`
- `tests/unit/services/project.service.test.ts`
- `tests/unit/services/comment.service.test.ts`
- `tests/unit/services/github.service.test.ts`
- `tests/unit/utils/errors.test.ts`
- `tests/unit/utils/hash.test.ts`

### Integration tests (44 tests, 5 files)
- `tests/integration/health.test.ts` — public endpoints
- `tests/integration/auth.test.ts` — auth routes (mock authService)
- `tests/integration/projects.test.ts` — CRUD + members (mock projectService)
- `tests/integration/tasks.test.ts` — CRUD + status + comments (mock taskService + commentService)
- `tests/integration/github.test.ts` — link/sync/unlink/commits/repo (mock githubService)

### Mock strategy
- **Unit tests**: Mock `config/database` (db object) or `repositories` depending on what the service uses.
- **Integration tests**: Mock the service layer directly, mock `authMiddleware` to inject `req.user`, mock `express-rate-limit` to `next()`.
- All route `:id` params must be valid UUID v4 strings in tests.

## Demo Credentials
- Email: `demo@example.com`
- Password: `Demo@123`
- Includes 1 project with 7 seed tasks.

## Deployment
- **Live**: https://jackson-task-track.vercel.app
- **Backend**: Vercel serverless function (`api/index.ts`)
- **Frontend**: Vite build → static files
- **Database**: Neon PostgreSQL (serverless)
- **Vercel env vars**: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `NODE_ENV`
