# System Requirements & User Stories: Jira-Lite

## 1. Project Overview & Business Goals

Jira-Lite is a high-performance, real-time collaborative Kanban board engineered for engineering and product teams. It enables teams to organize tasks across configurable workflow columns, drag cards in real-time, collaborate in threaded discussions, assign members, and inspect full audit logs.

### Key Value Propositions
- **Zero-lag real-time collaboration**: Task position moves, title edits, assignments, and comments sync across all active browsers within 300 ms without page refresh.
- **Enterprise-grade security**: Granular Role-Based Access Control (RBAC) enforced on both REST endpoints and WebSocket room joins.
- **Resilient State Management**: Normalized frontend caching with optimistic updates and automatic server-failure rollback.

---

## 2. Roles & Permissions (RBAC Matrix)

| Action | Viewer | Member | Admin | Owner |
| :--- | :---: | :---: | :---: | :---: |
| **View Board & Comments** | ✅ | ✅ | ✅ | ✅ |
| **Create / Edit / Move Tasks** | ❌ | ✅ | ✅ | ✅ |
| **Post Comments & Replies** | ❌ | ✅ | ✅ | ✅ |
| **Delete / Edit Others' Comments** | ❌ | ❌ | ✅ | ✅ |
| **Manage Columns (Add/Edit/Reorder/Delete)** | ❌ | ❌ | ✅ | ✅ |
| **Invite & Remove Project Members** | ❌ | ❌ | ✅ | ✅ |
| **Change Member Roles** | ❌ | ❌ | ❌ | ✅ |
| **Delete Project / Archive** | ❌ | ❌ | ❌ | ✅ |

---

## 3. User Stories (MoSCoW Prioritized)

| ID | Priority | User Story | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **US-01** | **Must** | As a user, I want to register and log in with email/password so I can access my workspace securely. | Password hashed with bcrypt (cost 12); Short-lived JWT (15m) issued with httpOnly refresh token (7d); form errors properly handled. |
| **US-02** | **Must** | As a user, I want to create a new project and invite team members by email. | Project key generated automatically; default columns created (`To Do`, `In Progress`, `Review`, `Done`); members assigned roles (`Admin`, `Member`, `Viewer`). |
| **US-03** | **Must** | As a member, I want to drag task cards across columns smoothly. | Dragging cards computes fractional positions; optimistic update updates UI in 0ms; persistent position saved on backend. |
| **US-04** | **Must** | As a member, when a teammate moves a card, I want to see the change immediately without refreshing. | Server broadcasts `task:moved` event to `project:<id>` room; card animates into place on other connected clients within 300ms. |
| **US-05** | **Must** | As a member, I want to assign/unassign tasks to project members. | Assignee avatars update on card in real-time; assigned member receives in-app notification. |
| **US-06** | **Must** | As a member, I want to comment on a task and reply in 1-level nested threads. | Comments support Markdown; mentions formatted as `@[userId]`; real-time updates broadcast to modal viewers. |
| **US-07** | **Must** | As a member, I want to view the complete activity audit trail for a task. | Every task create, edit, move, assign, comment is logged chronologically with actor, timestamp, and field diffs. |
| **US-08** | **Should** | As a member, I want to receive notifications when mentioned or assigned. | Bell badge counter increments; dropdown lists unread notifications; click navigates to task modal. |
| **US-09** | **Should** | As a member, I want to filter and search tasks by text, priority, label, and assignee. | Debounced text search (300ms); instant filtering without server roundtrips; filter state preserved in URL query parameters. |
| **US-10** | **Should** | As a viewer, I want to browse boards in read-only mode without edit abilities. | Drag handles disabled; editing inputs rendered as text; REST requests from viewers return HTTP 403 Forbidden. |
| **US-11** | **Could** | As a member, I want to see who is currently active on the board. | Real-time presence bar displays avatars of active online users in the current project room. |
| **US-12** | **Could** | As a member, I want to attach files to task cards. | Pre-signed URL generation for secure direct upload; file metadata attached to task document. |

---

## 4. Non-Functional Requirements (NFRs)

| Metric / Area | Specification & Target |
| :--- | :--- |
| **Latency** | REST API $p95 < 300$ ms; Socket broadcast $p95 < 300$ ms within same cloud region. |
| **Concurrency & Scale** | 100 concurrent active users per board; 1,000 total active connections per API instance. Architecture horizontally scalable to 10,000 users. |
| **High Availability** | Zero downtime deployments; auto-reconnect with exponential backoff on client; automatic state resync on socket reconnect. |
| **Security Standards** | OWASP Top 10 compliance: Strict CSP via Helmet, CORS domain whitelisting, Rate limiting on Auth & write endpoints, NoSQL injection prevention via strict Zod schemas, XSS mitigation with sanitized input. |
| **Accessibility** | Keyboard-accessible drag and drop (Space to grab, Arrow keys to reposition, Space to drop), WCAG AA color contrast, ARIA landmarks. |
| **Maintainability** | Layered modular architecture: `Route` $\rightarrow$ `Controller` $\rightarrow$ `Service` $\rightarrow$ `Model`. 70%+ test coverage. |
