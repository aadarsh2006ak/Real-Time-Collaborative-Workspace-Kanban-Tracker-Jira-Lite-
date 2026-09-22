# API Specifications: Jira-Lite

## 1. Design Conventions & Envelope Format

- **Base Path**: `/api/v1`
- **Authentication**: `Authorization: Bearer <accessToken>` in request header.
- **WebSocket Identification**: `x-socket-id: <socketId>` header sent with state-mutating REST requests to prevent echo broadcasts back to sender.

### Standard Response Envelope (Success)
```json
{
  "success": true,
  "data": { ... }
}
```

### Standard Response Envelope (Error)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | VERSION_CONFLICT | INTERNAL",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

---

## 2. REST Endpoints Matrix

### Authentication (`/api/v1/auth`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register user account with name, email, password. |
| `POST` | `/auth/login` | Public | Authenticate user, return JWT access token, set httpOnly refresh cookie. |
| `POST` | `/auth/refresh` | Public (Cookie) | Rotate refresh token and issue new 15m access token. |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and clear auth cookies. |
| `GET` | `/auth/me` | Authenticated | Get current authenticated user session data. |

### Projects (`/api/v1/projects`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | User | List all projects the user is a member of. |
| `POST` | `/projects` | User | Create a new project with default workflow columns. |
| `GET` | `/projects/:projectId` | Viewer+ | Retrieve project details, embedded columns, and members list. |
| `PATCH` | `/projects/:projectId` | Admin+ | Update project metadata (name, description). |
| `DELETE`| `/projects/:projectId` | Owner | Delete/Archive project. |
| `POST` | `/projects/:projectId/members` | Admin+ | Invite / add member with specified role. |
| `PATCH` | `/projects/:projectId/members/:userId`| Admin+ | Modify user role (Admin cannot change Owner role). |
| `DELETE`| `/projects/:projectId/members/:userId`| Admin+ | Remove member from project. |
| `POST` | `/projects/:projectId/columns` | Admin+ | Add custom workflow column. |
| `PATCH` | `/projects/:projectId/columns/:columnId`| Admin+ | Rename column or update WIP limit. |
| `DELETE`| `/projects/:projectId/columns/:columnId`| Admin+ | Delete column and migrate existing tasks. |

### Tasks (`/api/v1`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:projectId/tasks` | Viewer+ | Fetch all active tasks for board (supports filters: `assignee`, `label`, `priority`, `q`). |
| `POST` | `/projects/:projectId/tasks` | Member+ | Create a new task in a specified column. |
| `GET` | `/tasks/:taskId` | Viewer+ | Get task details, assignees, description, and metadata. |
| `PATCH` | `/tasks/:taskId` | Member+ | Update task fields (title, description, priority, assignees, version check). |
| `DELETE`| `/tasks/:taskId` | Admin+ / Reporter | Soft-delete task card (`deletedAt` timestamp). |
| `PATCH` | `/tasks/:taskId/move` | Member+ | Reorder task across columns with fractional indexing (`beforeId`, `afterId`, `toColumnId`). |

### Comments & Activity (`/api/v1`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks/:taskId/comments` | Viewer+ | Cursor-paginated comment thread list for task modal. |
| `POST` | `/tasks/:taskId/comments` | Member+ | Post comment or nested reply with `@mentions`. |
| `PATCH` | `/comments/:commentId` | Author | Edit comment body (sets `editedAt`). |
| `DELETE`| `/comments/:commentId` | Author / Admin | Soft delete comment ("Message deleted"). |
| `GET` | `/projects/:projectId/activity` | Viewer+ | Cursor-paginated project activity stream. |
| `GET` | `/tasks/:taskId/activity` | Viewer+ | Cursor-paginated activity log for specific task. |

### Notifications (`/api/v1/notifications`)
| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | List recent notifications (paginated) & unread count. |
| `PATCH` | `/notifications/:notificationId/read` | Authenticated | Mark single notification as read. |
| `POST` | `/notifications/read-all` | Authenticated | Mark all user notifications as read. |

---

## 3. Real-Time Socket.io Event Contract

| Event Name | Direction | Payload | Client Action / Purpose |
| :--- | :---: | :--- | :--- |
| `project:join` | Client $\rightarrow$ Server | `{ projectId }` | Join room `project:<id>` and receive current online user list. |
| `project:leave`| Client $\rightarrow$ Server | `{ projectId }` | Leave room on project exit. |
| `task:created` | Server $\rightarrow$ Client | `{ task }` | Upsert newly created task into Redux store adapter. |
| `task:updated` | Server $\rightarrow$ Client | `{ task }` | Upsert task into Redux store if version is newer. |
| `task:moved` | Server $\rightarrow$ Client | `{ task }` | Upsert task columnId & position (smooth card animation). |
| `task:deleted` | Server $\rightarrow$ Client | `{ taskId }` | Remove task from Redux store adapter. |
| `comment:created`| Server $\rightarrow$ Client| `{ comment }` | Append new comment to active discussion thread. |
| `activity:new` | Server $\rightarrow$ Client | `{ activity }` | Prepend new activity item to live audit stream. |
| `presence:update`| Server $\rightarrow$ Client| `{ online: [userId] }`| Update online member indicator bar. |
| `typing` | Client $\leftrightarrow$ Server | `{ taskId, userId, isTyping }` | Display "User is typing..." in task comment box. |
| `notification:new`| Server $\rightarrow$ Client | `{ notification }` | User personal room (`user:<id>`): increment badge count & pop toast. |
