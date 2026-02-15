---
id: 001
title: Phase III Chatbot Implementation Plan
stage: plan
date: 2026-02-10
surface: agent
model: claude-sonnet-4-5
feature: phase3-chatbot
branch: main
user: Abdul Rehman Rajpoot
command: /sp.plan
labels: ["phase3", "chatbot", "implementation-plan", "cohere-api", "mcp-tools", "floating-ui", "stateless-architecture"]
links:
  spec: specs/PHASE3_SUMMARY.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/phase3-implementation-plan.md
tests:
  - No tests created (planning phase)
---

## Prompt

Now that the Phase III specification constitution is complete (all specs in /specs/ directory updated for Cohere API), your task is to create a DETAILED yet CONCISE IMPLEMENTATION PLAN for the chatbot integration.

Rules:
- Do NOT write any code — only produce a clear, structured markdown plan document.
- Place the plan in: specs/phase3-implementation-plan.md
- Structure the plan in sequential phases/tasks.
- Each phase must include: Name, Goal, Files to create/modify, Specs to follow (@specs/...), Dependencies, Complexity (low/medium/high)
- Prioritize integration into existing Phase II backend (FastAPI, Neon DB, Better Auth)
- Use Cohere API exclusively for AI logic (cohere.chat with tool calling)
- Include floating chatbot icon + modal in frontend UI
- Cover stateless design, conversation persistence, and full task control

Required phases (in this exact order):
1. Backend Preparation
   - Update existing FastAPI with Cohere API key env var
   - Add COHERE_API_KEY to .env
   - Add CORS for frontend URL

2. Database Extension
   - Add Conversation and Message models
   - Update schema and indexes
   - Create migration (SQLModel or alembic)

3. MCP Tools Implementation
   - Build all 5 MCP tools (add_task, list_tasks, complete_task, delete_task, update_task)
   - Integrate with existing Task model
   - Ensure user_id enforcement

4. Cohere AI Agent Setup
   - Configure Cohere chat endpoint with tool calling
   - Adapt agent loop to Cohere response format
   - Map intents to tools
   - Add confirmation and error responses

5. Chat Endpoint Implementation
   - Create POST /api/{user_id}/chat in FastAPI
   - Fetch/store conversation history
   - Run Cohere agent and return response

6. Frontend Chatbot UI Integration
   - Add floating chatbot icon (bottom-right, visible after login)
   - On click: Open modal/chat window with message list, input, loading
   - Call chat endpoint with user_id from Better Auth
   - Display tool results (task list, confirmations)

7. Full Integration & Testing
   - End-to-end flow: Login → Open chat icon → Send message → Tool call → Task updated
   - Stateless verification (restart server, resume chat)
   - Error handling and user email personalization

Output:
- Full content of specs/phase3-implementation-plan.md
- End with "Phase III implementation plan completed ✅"
- Keep it concise but actionable — small, sequential steps

Start now.

## Response snapshot

Successfully created a comprehensive 7-phase implementation plan for Phase III chatbot integration with detailed tasks, dependencies, and acceptance criteria.

**Plan Structure:**

**Phase 1: Backend Preparation** (1-2 hours)
- Add COHERE_API_KEY environment variable
- Install Cohere Python SDK and tenacity for retry logic
- Update CORS configuration for frontend

**Phase 2: Database Extension** (2-3 hours)
- Create Conversation model (id, user_id, created_at, updated_at)
- Create Message model (id, conversation_id, role, content, tool_calls, created_at)
- Update models index and create Alembic migration

**Phase 3: MCP Tools Implementation** (4-6 hours)
- Create tools module structure
- Implement all 5 tools: add_task, list_tasks, complete_task, delete_task, update_task
- Each tool enforces user_id isolation (CRITICAL for security)
- Create Cohere tool definitions with parameter_definitions format

**Phase 4: Cohere AI Agent Setup** (4-6 hours)
- Initialize Cohere client with API key and timeout
- Implement message formatting (database format → Cohere USER/CHATBOT format)
- Create tool execution dispatcher
- Implement Cohere chat function with retry logic and error handling

**Phase 5: Chat Endpoint Implementation** (3-4 hours)
- Create ChatRequest/ChatResponse Pydantic models
- Create chat router with JWT authentication dependency
- Implement complete chat flow: fetch history → call Cohere → execute tools → store messages
- Register router in main.py

**Phase 6: Frontend Chatbot UI Integration** (6-8 hours)
- Install lucide-react and shadcn/ui Dialog component
- Create chat API client with Better Auth integration
- Create message components (MessageList, MessageBubble, ChatInput)
- Create FloatingChatIcon with MessageCircle icon, hover glow, pulse indicator
- Create ChatModal with Dialog component (500x600px desktop, full-screen mobile)
- Integrate into global layout with state persistence (sessionStorage)

**Phase 7: Full Integration & Testing** (4-6 hours)
- End-to-end flow testing (add, list, complete, delete, update tasks)
- Stateless verification (server restart, concurrent users)
- Error handling testing (invalid task ID, API timeout, database errors, invalid JWT)
- User personalization verification (email in responses, user isolation)
- Performance testing (< 2s response time, conversation history load)
- Security audit (JWT validation, SQL injection prevention, cross-user access)

**Key Architectural Decisions:**
1. Stateless server design (all state in database)
2. MCP-style tool pattern (fetch → execute → store)
3. User_id isolation enforced in ALL queries
4. Floating icon + modal UI (not dedicated page)
5. Cohere API with tool calling (not OpenAI Agents SDK)

**Risk Mitigation:**
- Cohere API rate limits → rate limiting + retry logic
- Database performance → pagination + indexes
- Cross-user data leakage → user_id filtering + integration tests
- Cohere API downtime → circuit breaker + health checks

**Total Estimated Effort:** 24-35 hours

## Outcome

- ✅ Impact: Complete Phase III implementation plan created with 7 sequential phases, 35+ actionable tasks, clear dependencies, and comprehensive acceptance criteria. Plan is ready for task generation and implementation.
- 🧪 Tests: No tests created (planning phase). Test scenarios documented in Phase 7 for end-to-end, stateless, error handling, personalization, performance, and security testing.
- 📁 Files: 1 file created (specs/phase3-implementation-plan.md) - comprehensive 400+ line implementation plan
- 🔁 Next prompts: `/sp.tasks phase3-chatbot` to generate actionable tasks from this plan, `/sp.adr` to document architectural decisions (Cohere API selection, stateless design, floating UI pattern, MCP tool pattern)
- 🧠 Reflection: Successfully created a detailed yet concise implementation plan that breaks down the complex chatbot integration into manageable phases. Each phase has clear goals, file modifications, spec references, dependencies, and complexity ratings. The plan follows the constitution's specification-first approach and prioritizes security (user_id isolation) and user experience (floating icon, responsive design).

## Evaluation notes (flywheel)

- Failure modes observed: Initial setup-plan.sh script failed because we're on main branch (not a feature branch). Adapted by creating PHR manually using agent-native approach.
- Graders run and results (PASS/FAIL): PASS - Implementation plan is comprehensive, actionable, and follows all requirements. All 7 phases specified by user are included with detailed tasks.
- Prompt variant (if applicable): Standard /sp.plan workflow with detailed phase requirements provided by user
- Next experiment (smallest change to try): Consider creating ADRs for the 3-4 significant architectural decisions identified in the plan (Cohere vs OpenAI, stateless server, floating UI, MCP pattern) using `/sp.adr` command before implementation begins
