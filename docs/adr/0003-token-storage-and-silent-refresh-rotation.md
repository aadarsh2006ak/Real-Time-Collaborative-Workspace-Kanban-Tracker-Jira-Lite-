# ADR 0003: Token Storage and Silent Refresh Rotation

## Status
Accepted

## Context
Storing JWT access tokens in browser `localStorage` or `sessionStorage` exposes tokens to Cross-Site Scripting (XSS) attacks. Storing all tokens exclusively in cookies exposes APIs to Cross-Site Request Forgery (CSRF) unless strict anti-CSRF tokens are enforced.

## Decision
We implement a **Dual-Token Architecture**:
1. **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Transmitted in `Authorization: Bearer <token>` headers and kept strictly in frontend in-memory Redux state.
2. **Refresh Token**: Long-lived (7 days), signed with `JWT_REFRESH_SECRET`, stored inside an `httpOnly`, `SameSite=lax`, secure cookie pinned to `/api/v1/auth`.
3. **Token Rotation & Reuse Detection**: On every `/api/v1/auth/refresh` call, the old refresh token is invalidated, its SHA256 hash in MongoDB is replaced with a new token, and a new `jti` is issued. If a revoked token is used, all user sessions are immediately revoked (compromise defense).
4. **Axios Interceptor Queue**: If a REST request fails with `401 TOKEN_EXPIRED`, an Axios response interceptor holds pending requests in a promise queue, executes a silent refresh, and retries the original request seamlessly.

## Consequences
- **Positive**:
  - Maximum protection against XSS and CSRF.
  - Seamless user experience without abrupt logouts.
- **Negative / Mitigations**:
  - Page reload clears memory state. Mitigated by `restoreSession` thunk dispatch on initial app boot.
