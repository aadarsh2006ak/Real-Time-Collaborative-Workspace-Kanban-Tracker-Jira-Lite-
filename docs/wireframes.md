# Wireframes & UI Specifications: Jira-Lite

## 1. Authentication Screen (`/login`, `/register`)

```
+---------------------------------------------------------------+
| Jira-Lite                            [ Dark / Light Mode 🌓 ] |
+---------------------------------------------------------------+
|                                                               |
|                +-----------------------------+                |
|                |         Jira-Lite           |                |
|                | Real-Time Collaborative Hub |                |
|                +-----------------------------+                |
|                | Email                       |                |
|                | [ user@company.com        ] |                |
|                | Password                    |                |
|                | [ ******************      ] |                |
|                |                             |                |
|                | [       Sign In       ]     |                |
|                |                             |                |
|                | Don't have an account? Sign |                |
|                +-----------------------------+                |
|                                                               |
+---------------------------------------------------------------+
```

---

## 2. Main Kanban Board View (`/projects/:projectId`)

```
+---------------------------------------------------------------------------------------------------------+
| [⚡ Jira-Lite]  Projects  |  [ PROJ-1 ] Frontend Core    🔍 [ Search tasks... ]   🔔(3)  [ 👤 Avatar ] |
+---------------------------------------------------------------------------------------------------------+
| Board: Sprint 14   | Members: [👤][👤][👤] +Invite | Filters: [ Priority v ] [ Label v ] [ Assignee v ] |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+         |
|  | TO DO (3)       +  |  | IN PROGRESS (2) +  |  | CODE REVIEW (1) +  |  | DONE (4)        +  |         |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+         |
|  | [PROJ-101] High 🔥 |  | [PROJ-102] Med     |  | [PROJ-105] Urgent⚡|  | [PROJ-98] Low      |         |
|  | Setup Auth & JWT   |  | Implement DnD      |  | Socket Fanout Test |  | Database Indexing  |         |
|  | 🏷️ backend, auth   |  | 🏷️ frontend        |  | 🏷️ realtime, test  |  | 🏷️ mongo, perf     |         |
|  | 📅 Oct 28  👤 Alice |  | 📅 Oct 29   👤 Bob |  | 📅 Oct 30  👤 Alice|  | 📅 Oct 24   👤 John|         |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+         |
|  | [PROJ-103] Low     |  | [PROJ-104] High 🔥 |                                                         |
|  | Dark mode palette  |  | RTK Entity Adapter |                                                         |
|  | 🏷️ ui, design      |  | 🏷️ state, redux    |                                                         |
|  | 📅 Nov 02   👤 Bob |  | 📅 Oct 31   👤 Riya|                                                         |
|  +--------------------+  +--------------------+                                                         |
|  | + Add a card       |  | + Add a card       |  | + Add a card       |  | + Add a card       |         |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+         |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Task Details & Activity Modal (`?task=PROJ-102`)

```
+------------------------------------------------------------------------------------+
|  [PROJ-102] Implement Drag & Drop with Fractional Indexing             [ ❌ Close ] |
+------------------------------------------------------------------------------------+
|  Status: [ In Progress v ]   Priority: [ Medium v ]   Assignees: [ 👤 Bob ] [+ Add] |
|                                                                                    |
|  Description:                                                                      |
|  +------------------------------------------------------------------------------+  |
|  | Compute fractional positions using ((before.pos + after.pos) / 2).           |  |
|  | Includes optimistic update on pending thunk and automatic state rollback.    |  |
|  +------------------------------------------------------------------------------+  |
|                                                                                    |
|  [ Tabs: 💬 Comments (3) | 🕒 Activity History (7) | 📎 Attachments (0) ]          |
|  --------------------------------------------------------------------------------  |
|  | 👤 Alice (2 hours ago):                                                        |
|  | Checked the edge cases when dropping cards between small intervals!             |
|  |                                                                                |
|  | ↳ 👤 Bob (1 hour ago):                                                         |
|  | Column rebalancing is implemented if gap < 1e-6.                               |
|  |                                                                                |
|  | [ Write a comment... (Type @ to mention team members)                 ]        |
|  | [ Post Comment ]                                                               |
+------------------------------------------------------------------------------------+
```
