# Architecture Decision Records

## ADR-001: Monorepo Structure
**Status:** Accepted
**Context:** Need to share code between frontend and backend
**Decision:** Use monorepo with npm workspaces
**Consequences:** Simpler dependency management, easier refactoring, single PR for full-stack changes

## ADR-002: Supabase for Data Layer
**Status:** Accepted
**Context:** Need database, auth, storage, and real-time in one service
**Decision:** Use Supabase for all data needs
**Consequences:** Reduced complexity, built-in RLS, but vendor lock-in

## ADR-003: Django + Next.js Stack
**Status:** Accepted
**Context:** Need rapid development with AI/ML capabilities
**Decision:** Django for backend (Python ecosystem), Next.js for frontend (React + performance)
**Consequences:** Best of both worlds but two languages to maintain

## ADR-004: API-First Monolith
**Status:** Accepted
**Context:** MVP speed vs future scalability
**Decision:** Build monolith with clear API boundaries
**Consequences:** Fast initial development, easy to extract services later
