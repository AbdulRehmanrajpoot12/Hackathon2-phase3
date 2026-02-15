# ADR-0004: MCP-Style Tool Pattern for Task Operations

> **Scope**: This ADR documents the decision to implement task management operations as MCP (Model Context Protocol) style tools with stateless execution and user_id isolation.

- **Status:** Accepted
- **Date:** 2026-02-10
- **Feature:** phase3-chatbot
- **Context:** The chatbot needs to execute task management operations (add, list, complete, delete, update) based on natural language commands. These operations must be secure (user_id isolation), reliable (stateless), and compatible with Cohere's tool calling API. We need a pattern that ensures consistency, testability, and maintainability across all task operations.

## Decision

Implement 5 task management operations as MCP-style tools:
- **Tool Pattern**: Stateless functions following fetch → execute → store pattern
- **User Isolation**: Every tool MUST filter by user_id to prevent cross-user data access
- **Cohere Integration**: Tools defined in Cohere's parameter_definitions format
- **Error Handling**: Consistent error responses across all tools
- **Tool Dispatcher**: Central execute_tool() function routes to appropriate tool

**5 MCP Tools:**
1. **add_task**: Create new task (user_id, title, description)
2. **list_tasks**: Retrieve tasks (user_id, status filter)
3. **complete_task**: Mark task done (user_id, task_id)
4. **delete_task**: Remove task (user_id, task_id)
5. **update_task**: Modify task (user_id, task_id, title, description)

**Implementation Details:**
- Location: backend/tools/task_tools.py
- Signature: All tools accept Session as first parameter, user_id always required
- Validation: Input validation before database operations
- Response Format: Consistent {status, data/error, message} structure
- Security: user_id from JWT token (never from request body)

## Consequences

### Positive

- **Security by Design**: user_id isolation enforced at tool level; impossible to access other users' data
- **Stateless Execution**: Each tool invocation is independent; no shared state or side effects
- **Testability**: Tools are pure functions; easy to unit test with mock database sessions
- **Consistency**: All tools follow same pattern; predictable behavior and error handling
- **Cohere Compatibility**: Tool definitions map directly to Cohere's parameter_definitions format
- **Maintainability**: Adding new tools follows established pattern; clear separation of concerns
- **Debugging**: Each tool is isolated; easy to trace execution and identify issues

### Negative

- **Database Queries**: Every tool call requires database round-trip; no caching or batching
- **Repetitive Code**: Similar validation and error handling logic across all tools
- **No Transactions**: Tools execute independently; no multi-tool transactions or rollback
- **Limited Composition**: Can't easily chain tools or create composite operations
- **Cohere Dependency**: Tool definitions tightly coupled to Cohere's API format
- **No Streaming**: Tools return complete results; can't stream large task lists
- **Error Granularity**: Generic error responses; limited detail for debugging

## Alternatives Considered

### Alternative 1: Service Layer with Business Logic
- **Pros**: Centralized business logic, transaction support, easier to add complex workflows, better code reuse
- **Cons**: More abstraction layers, harder to map to Cohere tools, increased complexity, slower development
- **Why Rejected**: Over-engineering for simple CRUD operations. MCP pattern is sufficient for current requirements. Can refactor later if needed.

### Alternative 2: Direct Database Access from Chat Endpoint
- **Pros**: Simplest implementation, no abstraction, fastest development, fewer files
- **Cons**: No reusability, hard to test, security risks, violates separation of concerns, difficult to maintain
- **Why Rejected**: Violates clean architecture principles. Would make testing and security audits much harder. Not scalable.

### Alternative 3: GraphQL Mutations
- **Pros**: Flexible queries, type safety, introspection, standard protocol, good tooling
- **Cons**: Requires GraphQL server, complex setup, overkill for simple operations, Cohere doesn't support GraphQL natively
- **Why Rejected**: Adds significant complexity. Cohere API expects simple function calls, not GraphQL. Would require translation layer.

### Alternative 4: REST API Endpoints (No Tools)
- **Pros**: Standard HTTP, easy to test with curl, familiar pattern, language-agnostic
- **Cons**: Cohere can't call REST endpoints directly, would need proxy layer, loses natural language mapping, more complex error handling
- **Why Rejected**: Doesn't integrate with Cohere's tool calling. Would require building custom proxy to translate tool calls to REST calls.

### Alternative 5: Event-Driven Architecture
- **Pros**: Decoupled, scalable, async processing, audit trail, easy to add side effects
- **Cons**: Massive complexity, eventual consistency, harder to debug, requires message queue, overkill for synchronous operations
- **Why Rejected**: Chatbot requires synchronous responses. Event-driven would add weeks of development for no user-facing benefit.

## References

- Feature Spec: specs/features/chatbot.md (User Stories 1-5: Task Operations)
- Implementation Plan: specs/phase3-implementation-plan.md (Phase 3: MCP Tools Implementation)
- MCP Tools Spec: specs/api/mcp-tools.md (All 5 tool definitions)
- Cohere Integration: specs/integration/ai-cohere.md (Tool Execution section)
- Related ADRs: ADR-0001 (Cohere API), ADR-0002 (Stateless Server Architecture)
- Evaluator Evidence: history/prompts/phase3-chatbot/002-phase3-chatbot-tasks-generation.tasks.prompt.md
