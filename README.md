# Jira-Lite: Real-Time Collaborative Kanban Tracker

> A production-grade, real-time collaborative Kanban platform built on the MERN stack with Socket.io, Redux Toolkit, and Redis.

---

## 📌 Features & Architecture Overview

- **Real-Time Collaboration**: Instant task drag-and-drop, card updates, presence indicators, and comment threads synced across all users via Socket.io rooms (`project:<id>`).
- **$O(1)$ Fractional Indexing**: Instant task reordering using fractional position indexing (`(before + after) / 2`) with automatic column rebalancing when precision gap narrows below $10^{-6}$.
- **Optimistic UI with Automatic Rollback**: Instant client-side state mutation with tracking in `pendingMoves`. Automatically rolls back state and alerts user on network or server failure.
- **Enterprise Access Control (RBAC)**: Fine-grained permissions (`Owner`, `Admin`, `Member`, `Viewer`) enforced across both REST API and WebSocket connection levels.
- **Resilient Authentication**: Short-lived 15-min JWT Access Tokens kept in memory paired with 7-day rotating Refresh Tokens stored in `httpOnly` secure cookies with token reuse detection.
- **Audit Trail & Activity Log**: Unbounded, cursor-paginated timeline tracking every change (`TASK_MOVED`, `TASK_UPDATED`, `COMMENT_ADDED`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Redux Toolkit (`createEntityAdapter`, `createSelector`), `@hello-pangea/dnd`, Tailwind CSS, React Hook Form, Zod, Axios, Socket.io-client.
- **Backend**: Node.js 22 LTS, Express 5, Mongoose 8, Socket.io 4, Redis Adapter, Pino structured logging, Zod validation middleware.
- **Database & Cache**: MongoDB 7 (Replica Set for transactions), Redis 7.
- **Testing & Quality**: Jest, Supertest, Vitest, Testing Library, Playwright, ESLint, Prettier, Husky.
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 20+ LTS or 22+ LTS
- MongoDB (local or Atlas)
- Redis (local or Docker)

### 1. Installation
```bash
# Install root and workspace dependencies
npm install
```

### 2. Environment Configuration
Copy `.env.example` in both server and client:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Run Development Servers
```bash
# Run both Backend and Frontend concurrently
npm run dev
```
- Backend runs on: `http://localhost:5000`
- Frontend runs on: `http://localhost:5173`
- Healthcheck endpoint: `http://localhost:5000/healthz`

### 4. Run with Docker Compose
```bash
docker compose up --build
```

---

## 🧪 Testing & Linting

```bash
# Run all tests
npm test

# Run code style & linting checks
npm run lint
```

---

## 📚 Documentation
- [System Requirements & User Stories](file:///docs/requirements.md)
- [Data Model & ER Diagram](file:///docs/data-model.md)
- [REST & Socket API Contracts](file:///docs/api.md)
- [UI Wireframes & Component Specs](file:///docs/wireframes.md)
- [Architecture Decision Records (ADRs)](file:///docs/adr/)
