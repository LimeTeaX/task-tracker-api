# Task Tracker — Frontend

React 19 + Vite + Tailwind CSS + React Router 7.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email + password login |
| `/register` | Register | New user registration |
| `/` | Dashboard | Project list with search/filter |
| `/projects/:id` | ProjectDetail | Task board, members, GitHub, comments |
| `*` | NotFound | 404 page |

## Key Components

| Component | Description |
|-----------|-------------|
| `TaskBoard` | DndContext wrapper with drag-and-drop |
| `TaskColumn` | Droppable column with count badge |
| `SortableTaskCard` | Draggable task card with edit/delete |
| `TaskForm` | Modal form for create/edit task |
| `MemberList` | Team member management |
| `GitHubPanel` | Link/unlink/sync repo + commits |
| `CommentSection` | Comments modal per task |
| `ConfirmModal` | Reusable confirmation dialog |
| `ToastContext` | Toast notification system (auto-dismiss, slide-in) |

## Contexts

- **AuthContext** — login/logout, silent refresh via httpOnly cookie
- **ThemeContext** — dark/light mode (Tailwind `dark:` class)
- **ToastContext** — global toast notifications

## Dev

```bash
npm run dev      # Vite dev server (port 5173, proxy /api → localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```
