# ADR-0002: Stateless Server Architecture with Database State

> **Scope**: This ADR documents the decision to implement a stateless FastAPI server where all conversation state is stored in the database rather than in-memory.

- **Status:** Accepted
- **Date:** 2026-02-10
- **Feature:** phase3-chatbot
- **Context:** The chatbot needs to maintain conversation history across user sessions and server restarts. Traditional chatbot architectures often keep conversation state in memory (session stores, Redis, etc.), but this creates challenges for horizontal scaling, reliability, and state persistence. We need an architecture that supports multiple server instances, graceful restarts, and guaranteed conversation persistence.

## Decision

Implement a fully stateless FastAPI server where:
- **No in-memory conversation state**: Server maintains zero conversation context in memory
- **Database as single source of truth**: All conversation history stored in Neon PostgreSQL (Conversation and Message models)
- **Fetch-on-request pattern**: Every chat request fetches conversation history from database
- **Stateless tool execution**: Tools follow pattern: fetch state from DB → execute operation → store result back to DB
- **No session management**: No Redis, no in-memory caches, no sticky sessions

**Implementation Details:**
- Conversation model: user_id, id, created_at, updated_at
- Message model: conversation_id, role (user/assistant), content, tool_calls, created_at
- Indexes on user_id, conversation_id, created_at for fast queries
- Pagination: Limit to 50 recent messages per request to Cohere API
- Connection pooling: SQLModel engine with pool_size=5, max_overflow=10

## Consequences

### Positive

- **Horizontal Scalability**: Multiple server instances can handle requests without coordination or state synchronization
- **Reliability**: Server restarts don't lose conversation context; users can resume conversations seamlessly
- **Simplicity**: No complex session management, no Redis cluster, no cache invalidation logic
- **Debugging**: All state visible in database; easy to inspect, replay, or debug conversations
- **Cost Efficiency**: No need for Redis or other caching infrastructure; single database handles all state
- **Disaster Recovery**: Database backups contain complete conversation history; easy to restore
- **Testing**: Easier to test since state is explicit in database; no hidden in-memory state to mock

### Negative

- **Database Load**: Every chat request requires database queries (fetch history, store messages)
- **Latency**: Database round-trips add ~50-100ms latency per request vs in-memory cache
- **Query Complexity**: Need to carefully optimize queries with proper indexes to avoid slow performance
- **Connection Pool Limits**: High concurrent load could exhaust database connection pool
- **Cost at Scale**: Database queries cost more than in-memory operations at very high scale
- **No Real-Time Updates**: Other clients won't see new messages without polling or WebSocket layer
- **History Pagination**: Large conversations (>100 messages) require pagination logic to avoid loading too much data

## Alternatives Considered

### Alternative 1: Redis Session Store
- **Pros**: Fast in-memory access (~1ms), mature ecosystem, supports pub/sub for real-time updates, reduces database load
- **Cons**: Adds infrastructure complexity, requires Redis cluster for HA, cache invalidation logic needed, state split between Redis and DB, higher operational cost
- **Why Rejected**: Adds significant complexity for minimal benefit. Our target response time (<2s) is easily achievable with database queries. Redis would be premature optimization.

### Alternative 2: In-Memory Server State (Sticky Sessions)
- **Pros**: Fastest possible access (no network), zero infrastructure cost, simplest implementation
- **Cons**: Cannot scale horizontally, server restart loses all conversations, no load balancing, single point of failure, debugging nightmare
- **Why Rejected**: Completely incompatible with production requirements. Users would lose conversations on every deployment.

### Alternative 3: Hybrid (Recent in Redis, Full in DB)
- **Pros**: Fast access to recent messages, full history in DB, good balance of performance and reliability
- **Cons**: Complex cache invalidation, state synchronization bugs, two sources of truth, operational overhead, harder to debug
- **Why Rejected**: Complexity outweighs benefits. Database performance is sufficient for our scale. Would add weeks to development time.

### Alternative 4: Event Sourcing with CQRS
- **Pros**: Complete audit trail, time-travel debugging, eventual consistency, highly scalable
- **Cons**: Massive complexity, steep learning curve, overkill for chatbot, requires event store infrastructure, harder to query conversation state
- **Why Rejected**: Architectural overkill for a chatbot feature. Would require complete system redesign and months of development.

## References

- Feature Spec: specs/features/chatbot.md (User Story 6: Resume Conversation)
- Implementation Plan: specs/phase3-implementation-plan.md (Phase 2: Database Extension)
- Database Schema: specs/database/schema.md (Conversation and Message models)
- Integration Spec: specs/integration/ai-cohere.md (Complete Integration Flow)
- Related ADRs: ADR-0001 (Cohere API), ADR-0004 (MCP-Style Tool Pattern)
- Evaluator Evidence: history/prompts/phase3-chatbot/001-phase3-implementation-plan.plan.prompt.md
