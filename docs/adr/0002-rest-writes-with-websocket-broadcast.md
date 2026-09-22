# ADR 0002: REST Writes with WebSocket Broadcast

## Status
Accepted

## Context
Real-time collaborative applications need to balance reliable data persistence with low-latency event propagation. Two main architectural patterns were evaluated:
1. Pure WebSocket approach (both mutations and broadcasts over socket).
2. Hybrid REST writes + WebSocket broadcasts.

## Decision
We choose the **Hybrid Architecture**:
- All state mutations (Create, Update, Move, Delete) are performed via standard HTTP REST endpoints.
- Once the database transaction/write is successfully committed, the server broadcasts an event via Socket.io to the corresponding room (e.g., `project:<id>`).
- The client sends an `x-socket-id` header with REST mutations so the server skips echoing the event back to the initiator.

## Consequences
- **Positive**:
  - Leverages mature HTTP infrastructure: standardized middleware, Zod payload validation, status codes, authentication, rate limiting, and caching.
  - Failure modes are simple and deterministic (e.g. 400 Validation, 401 Unauthorized, 409 Conflict, 403 Forbidden).
  - WebSockets only handle low-latency read broadcasts and transient events (presence, typing indicators).
- **Negative / Mitigations**:
  - Requires maintaining both HTTP and WebSocket transports on client and server. Mitigated by centralized API and socket singletons.
