# Data Model & Schema Design: Jira-Lite

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    USER ||--o{ PROJECT_MEMBER : "participates in"
    USER ||--o{ TASK : "assigned / reported"
    USER ||--o{ COMMENT : "authors"
    USER ||--o{ ACTIVITY : "acts as"
    USER ||--o{ NOTIFICATION : "receives"

    PROJECT ||--|{ COLUMN : "embeds"
    PROJECT ||--|{ PROJECT_MEMBER : "has members"
    PROJECT ||--o{ TASK : "contains"
    PROJECT ||--o{ ACTIVITY : "tracks"

    TASK ||--o{ COMMENT : "has threads"
    TASK ||--o{ ACTIVITY : "has history"

    USER {
        ObjectId _id PK
        string name
        string email "unique"
        string passwordHash
        string avatarUrl
        array refreshTokens "embedded: tokenHash, expiresAt, userAgent"
        date createdAt
        date updatedAt
    }

    PROJECT {
        ObjectId _id PK
        string name
        string key "uppercase, unique (e.g. JIRA)"
        ObjectId owner FK
        array members "embedded: user FK, role"
        array columns "embedded: name, order, wipLimit"
        number taskCounter "atomic sequence"
        date createdAt
        date updatedAt
    }

    TASK {
        ObjectId _id PK
        ObjectId project FK
        string key "e.g. JIRA-104"
        string title
        string description
        ObjectId columnId
        number position "fractional index (e.g. 1536.0)"
        string priority "low | medium | high | urgent"
        array labels
        array assignees FK
        ObjectId reporter FK
        date dueDate
        number version "optimistic locking"
        date deletedAt "soft delete"
        date createdAt
        date updatedAt
    }

    COMMENT {
        ObjectId _id PK
        ObjectId task FK
        ObjectId project FK
        ObjectId author FK
        string body
        ObjectId parentId "self-reference FK (1-level nesting)"
        array mentions FK
        date editedAt
        date deletedAt
        date createdAt
        date updatedAt
    }

    ACTIVITY {
        ObjectId _id PK
        ObjectId project FK
        ObjectId task FK
        ObjectId actor FK
        string type "TASK_CREATED, TASK_MOVED, etc."
        object meta "from/to, field diffs"
        date createdAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId user FK
        string type "ASSIGNMENT, MENTION, COMMENT"
        string refType "Task | Comment"
        ObjectId refId FK
        date readAt
        date createdAt
    }
```

---

## 2. Strategic Schema Decision: Embed vs Reference

| Entity Relationship | Design Strategy | Strategic Reason |
| :--- | :--- | :--- |
| **Project $\rightarrow$ Columns** | **Embedded Array** | A project rarely has more than 5–10 workflow columns. Columns are always read when the board is opened. Embedding guarantees atomic board reads in 1 database roundtrip. |
| **Project $\rightarrow$ Members** | **Embedded Array** | Team sizes per board are bounded (typically 5–50 users). Embedded memberships allow instant RBAC authorization inside the Project document without secondary collection lookups. |
| **Project $\rightarrow$ Tasks** | **Referenced Collection** | Projects contain thousands of tasks over time. Unbounded growth violates MongoDB's 16MB document size limit and makes querying slow. |
| **Task $\rightarrow$ Comments** | **Referenced Collection** | Active discussions grow unboundedly. Independent collection allows cursor-based pagination and threaded sorting without loading entire task blobs. |
| **Project $\rightarrow$ Activity Log** | **Referenced Collection** | Audit logs grow continuously. Stored in an append-only collection with compound index `{ project: 1, createdAt: -1 }` for high-throughput chronological retrieval. |

---

## 3. Database Indexes Specification

### Users Collection (`users`)
- `{ email: 1 }` (Unique): Enforces unique account emails and provides $O(1)$ lookup for authentication.

### Projects Collection (`projects`)
- `{ key: 1 }` (Unique): Ensures project keys (e.g., `PROJ`, `FRONT`) are globally unique and uppercase.
- `{ "members.user": 1 }`: Rapidly filters projects where a specific user is a participant.

### Tasks Collection (`tasks`)
- `{ project: 1, columnId: 1, position: 1 }` (Compound): Critical for sorting tasks in column order during board render and fractional reordering.
- `{ title: "text", description: "text" }` (Text Index): Powers full-text keyword search across project tasks.
- `{ assignees: 1 }`: Fast retrieval of all tasks assigned to a specific team member.
- `{ project: 1, key: 1 }` (Unique): Fast resolution for direct URL routing (e.g. `/projects/JIRA/tasks/JIRA-42`).

### Comments Collection (`comments`)
- `{ task: 1, createdAt: 1 }`: Retrieves chronologically sorted comment threads for the task modal.

### Activity Collection (`activities`)
- `{ project: 1, createdAt: -1 }`: Powers project-level activity stream.
- `{ task: 1, createdAt: -1 }`: Powers task-specific audit trail tab.

### Notifications Collection (`notifications`)
- `{ user: 1, readAt: 1, createdAt: -1 }`: Fast unread notification badge counts (`countDocuments({ user, readAt: null })`) and list queries.
