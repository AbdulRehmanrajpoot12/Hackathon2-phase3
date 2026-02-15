# Full-Stack Web Todo Application - Specification Overview

## Project Name
Full-Stack Web Todo Application with AI Chatbot (Phase III)

## Purpose
A modern, full-stack todo application with an intelligent AI chatbot assistant that allows users to manage their tasks through natural language conversations. The application combines secure authentication, CRUD operations, responsive UI design, and conversational AI powered by Cohere API.

## Current Phase
Phase III: AI Chatbot Integration with Cohere API

Building upon Phase II's authentication and task management foundation, Phase III introduces a conversational AI interface that enables users to:
- Add, update, complete, and delete tasks using natural language
- List and filter tasks through conversational queries
- Receive personalized, context-aware responses
- Maintain conversation history across sessions

## Tech Stack Summary

### Frontend
- **Framework**: Next.js 14+ with App Router, React Server Components
- **Styling**: Tailwind CSS for responsive UI
- **Chat UI**: Custom chat interface components
- **State Management**: React hooks and context
- **Authentication**: Better Auth client integration

### Backend
- **API Framework**: FastAPI with Python 3.10+
- **AI Integration**: Cohere API (cohere.chat endpoint with tool calling)
- **Authentication**: Better Auth for JWT-based authentication
- **Database**: Neon PostgreSQL with SQLModel ORM
- **Tool Pattern**: MCP-style tool calling with Cohere's tool use feature

### Database
- **Provider**: Neon PostgreSQL (serverless)
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Models**: Users, Tasks, Conversations, Messages
- **Architecture**: Stateless server with conversation persistence

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway/Render
- **Database**: Neon (managed PostgreSQL)

## High-Level Architecture

### Phase III Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat Interface                                       │  │
│  │  - Message list with auto-scroll                     │  │
│  │  - Input field with send button                      │  │
│  │  - Tool result displays (task lists, confirmations)  │  │
│  │  - Loading states and error handling                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Better Auth Client                                   │  │
│  │  - Extract user_id from session                      │  │
│  │  - Include JWT token in API requests                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/{user_id}/chat Endpoint                   │  │
│  │  1. Validate JWT token (Better Auth)                 │  │
│  │  2. Fetch conversation history from DB               │  │
│  │  3. Call Cohere API with message + tools             │  │
│  │  4. Execute tool calls (add/list/complete/delete)    │  │
│  │  5. Store messages in DB                             │  │
│  │  6. Return AI response + tool results                │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cohere Integration Layer                            │  │
│  │  - Format messages for Cohere API                    │  │
│  │  - Define 5 MCP-style tools                          │  │
│  │  - Parse Cohere tool_calls response                  │  │
│  │  - Execute tools and format results                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MCP-Style Tools (Stateless)                         │  │
│  │  - add_task(user_id, title, description)            │  │
│  │  - list_tasks(user_id, status)                      │  │
│  │  - complete_task(user_id, task_id)                  │  │
│  │  - delete_task(user_id, task_id)                    │  │
│  │  - update_task(user_id, task_id, title, desc)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Neon PostgreSQL Database                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables:                                              │  │
│  │  - users (id, email, password_hash, created_at)      │  │
│  │  - tasks (id, user_id, title, description, ...)      │  │
│  │  - conversations (id, user_id, created_at, ...)      │  │
│  │  - messages (id, conversation_id, role, content, ...)│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↑
                    External Services
┌─────────────────────────────────────────────────────────────┐
│  Cohere API (cohere.chat)                                   │
│  - Natural language understanding                            │
│  - Tool calling support                                      │
│  - Context-aware responses                                   │
└─────────────────────────────────────────────────────────────┘
```

## High-Level Features in Phase III

### AI Chatbot Assistant
- **Natural Language Task Management**: Users can add, update, complete, and delete tasks using conversational language
- **Intent Recognition**: Cohere API understands user intent and maps to appropriate tool calls
- **Tool Execution**: Backend executes MCP-style tools to perform task operations
- **Personalized Responses**: AI includes user email and context in responses
- **Conversation History**: Messages persisted in database for context and resumption
- **Stateless Design**: Server maintains no session state; all context from database

### Inherited from Phase II
- **Authentication System**: JWT-based authentication with Better Auth
- **Task Management**: Full CRUD operations on tasks
- **User Interface**: Responsive design with Tailwind CSS
- **Data Isolation**: Multi-user support with strict data separation

## Key Technical Decisions

### Why Cohere API Instead of OpenAI?
- **Tool Calling Support**: Cohere's chat endpoint supports tool/function calling similar to OpenAI
- **Cost Efficiency**: Competitive pricing for production workloads
- **API Simplicity**: Clean REST API with straightforward integration
- **Flexibility**: Easy to adapt existing OpenAI Agents SDK patterns to Cohere

### Stateless Server Architecture
- **No Session State**: Server does not maintain conversation state in memory
- **Database Persistence**: All conversation history stored in Neon PostgreSQL
- **Scalability**: Stateless design enables horizontal scaling
- **Reliability**: Server restarts do not lose conversation context
- **Resume Capability**: Users can resume conversations after any interruption

### MCP-Style Tool Pattern
- **Standardized Interface**: Tools follow Model Context Protocol conventions
- **Stateless Execution**: Each tool call fetches state from DB, executes, stores result
- **User Isolation**: Every tool enforces user_id filtering for security
- **Composability**: Tools can be chained for complex operations
- **Testability**: Each tool is independently testable

## Environment Variables

### Required Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_SECRET=your_better_auth_secret_here
COHERE_API_KEY=your_cohere_api_key_here

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:8000
```

### Environment Variable Descriptions

| Variable | Purpose | Phase |
|----------|---------|-------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Phase II |
| `BETTER_AUTH_SECRET` | JWT signing secret (shared between frontend/backend) | Phase II |
| `COHERE_API_KEY` | Cohere API authentication key | Phase III |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | Phase II |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Better Auth service URL | Phase II |

## Development Approach

The project follows a spec-driven development methodology:

1. **Specification Phase** - Complete, consistent specifications for all features
2. **Planning Phase** - Architectural decisions and implementation plan
3. **Task Generation Phase** - Break-down into testable implementation tasks
4. **Implementation Phase** - Using Claude Code for development
5. **Testing Phase** - Comprehensive testing of all features
6. **Deployment Phase** - Production deployment and monitoring

## Specification Artifacts for Phase III

### Core Specifications
- ✅ `@specs/overview.md` - Project overview and architecture (this file)
- ✅ `@specs/features/chatbot.md` - AI chatbot feature specification
- ✅ `@specs/api/mcp-tools.md` - MCP-style tool definitions
- ✅ `@specs/api/rest-endpoints.md` - REST API endpoints (updated with chat endpoint)
- ✅ `@specs/database/schema.md` - Database schema (updated with conversation models)
- ✅ `@specs/integration/ai-cohere.md` - Cohere API integration details
- ✅ `@specs/ui/chat-interface.md` - Chat interface UI specification
- ✅ `@specs/integration/frontend-backend.md` - Frontend-backend integration

### Inherited from Phase II
- `@specs/features/authentication.md` - Authentication system
- `@specs/features/task-crud.md` - Task CRUD operations
- `@specs/ui/pages.md` - UI pages specification
- `@specs/ui/components.md` - UI components specification
- `@specs/ui/theme.md` - UI theme and styling

## Checklist of Completion Status

### Phase III Specification Artifacts
- [x] Project overview updated for Phase III
- [x] Chatbot feature specification complete
- [x] MCP tools specification complete
- [x] REST API endpoints updated with chat endpoint
- [x] Database schema updated with conversation models
- [x] Cohere integration specification complete
- [x] Chat interface UI specification complete
- [x] Frontend-backend integration specification complete

### Phase III Technical Implementation
- [ ] Conversation and Message database models
- [ ] Database migrations for new tables
- [ ] MCP-style tool implementations (5 tools)
- [ ] Cohere API integration layer
- [ ] POST /api/{user_id}/chat endpoint
- [ ] Chat interface frontend components
- [ ] Tool result display components
- [ ] Better Auth integration for chat
- [ ] Conversation history management
- [ ] Error handling and graceful degradation
- [ ] Testing coverage for chatbot features
- [ ] Deployment configuration updates

### Phase III Quality Assurance
- [ ] User_id isolation in all tool calls
- [ ] Conversation persistence and resumption
- [ ] Cohere API error handling
- [ ] Tool execution validation
- [ ] Natural language intent accuracy
- [ ] Response personalization (user email)
- [ ] Performance optimization (conversation history)
- [ ] Security audit (JWT validation, data isolation)
- [ ] Accessibility compliance for chat UI
- [ ] Mobile responsiveness for chat interface

## Success Criteria for Phase III

### Functional Requirements
1. Users can add tasks via natural language (e.g., "Add a task to buy groceries")
2. Users can list tasks via natural language (e.g., "Show me my incomplete tasks")
3. Users can complete tasks via natural language (e.g., "Mark task 3 as done")
4. Users can delete tasks via natural language (e.g., "Delete my first task")
5. Users can update tasks via natural language (e.g., "Change the title of task 2")
6. AI responses include user email for personalization
7. Conversation history persists across sessions
8. Tool results display clearly in chat interface

### Non-Functional Requirements
1. Chat endpoint responds within 2 seconds (p95)
2. Cohere API calls have proper timeout and retry logic
3. All tool calls enforce user_id isolation
4. Conversation history loads efficiently (pagination if needed)
5. Chat interface is responsive on mobile and desktop
6. Error messages are user-friendly and actionable
7. Server can restart without losing conversation context

## Related Specifications
- `@specs/features/chatbot.md` - Detailed chatbot feature requirements
- `@specs/api/mcp-tools.md` - Tool definitions and schemas
- `@specs/integration/ai-cohere.md` - Cohere API integration guide
- `@specs/database/schema.md` - Database models and relationships
- `@specs/ui/chat-interface.md` - Chat UI design and components
