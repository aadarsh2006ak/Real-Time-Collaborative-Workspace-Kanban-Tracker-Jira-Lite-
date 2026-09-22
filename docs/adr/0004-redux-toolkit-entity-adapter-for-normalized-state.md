# ADR 0004: Redux Toolkit Entity Adapter for Normalized State

## Status
Accepted

## Context
A Kanban board manages deeply relational state: Projects, Columns, Tasks, Comments, and Online Presence. If stored as deeply nested arrays (e.g. `columns[i].tasks[j]`), state mutations require deep clones, updates are prone to race conditions, and socket broadcasts require tedious array traversals.

## Decision
We use **Redux Toolkit `createEntityAdapter`** to normalize collections into `{ ids: [], entities: {} }`:
1. Tasks are indexed by `_id`.
2. Column grouping and sorting are computed using memoized Reselect selectors (`selectTasksByColumn`).
3. Socket updates use adapter CRUD helpers (`upsertOne`, `removeOne`, `setAll`) for $O(1)$ state updates.
4. Optimistic task moves store prior coordinates in `pendingMoves[requestId]` during `moveTask.pending` and reconcile or rollback in `fulfilled` / `rejected`.

## Consequences
- **Positive**:
  - Eliminates data duplication.
  - Lightning-fast $O(1)$ entity lookup and mutation.
  - Minimal component re-renders when paired with `React.memo` and localized selectors.
