---
id: 002
title: Phase III AI Chatbot Specification Constitution with Cohere API
stage: constitution
date: 2026-02-10
surface: agent
model: claude-sonnet-4-5
feature: phase3-chatbot
branch: main
user: Abdul Rehman Rajpoot
command: /sp.constitution
labels: ["phase3", "chatbot", "cohere-api", "floating-ui", "mcp-tools", "natural-language", "specifications"]
links:
  spec: specs/PHASE3_SUMMARY.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/overview.md
  - specs/features/chatbot.md
  - specs/api/mcp-tools.md
  - specs/api/rest-endpoints.md
  - specs/database/schema.md
  - specs/integration/ai-cohere.md
  - specs/ui/chat-interface.md
  - specs/integration/frontend-backend.md
  - specs/PHASE3_SUMMARY.md
tests:
  - No tests created (specification phase)
---

## Prompt

Your task is to create a COMPLETE, CONSISTENT, and READY-TO-IMPLEMENT specification constitution for integrating a powerful AI Todo Chatbot into the existing full-stack todo application (Phase II complete). This chatbot will enable users to manage their tasks using natural language and will display user-specific information (e.g., "Your tasks for abdul@example.com").

**Critical Requirements:**

1. **AI Integration - Cohere API (NOT OpenAI Agents SDK)**
   - Use Cohere API exclusively for all AI logic
   - Implement tool calling using Cohere's chat endpoint (cohere.chat)
   - The server must be stateless - conversation state stored in database
   - Natural language understanding for task operations

2. **UI Approach - Floating Chatbot Icon (NOT Dedicated Page)**
   - Floating chatbot icon in bottom-right corner (visible only after login)
   - Icon triggers a modal/chat window (not a dedicated page)
   - Icon design: MessageCircle from lucide-react
   - Modal: shadcn/ui Dialog component
   - Animations: hover glow, pulse for new messages
   - Responsive: full-screen on mobile, 500x600px on desktop
   - Persist chat state across modal open/close

3. **Backend Integration**
   - FastAPI backend with SQLModel ORM
   - Neon DB (PostgreSQL) for persistence
   - Better Auth for JWT validation
   - Stateless server architecture
   - User_id isolation in all operations

4. **MCP-Style Tools (5 tools)**
   - add_task
   - list_tasks
   - complete_task
   - delete_task
   - update_task

5. **User Personalization**
   - Include user email in AI responses
   - User-specific task management
   - Conversation history per user

**Environment Variables:**
- COHERE_API_KEY=REMOVED_COHERE_KEY
- BETTER_AUTH_SECRET=Q9TfixbrudNqlZjAKGGrMEBnPIkvwqBB
- DATABASE_URL (existing Neon DB)

**Deliverables Required:**
1. Complete feature specification (chatbot.md)
2. MCP tool definitions (mcp-tools.md)
3. REST API endpoint specification (rest-endpoints.md)
4. Database schema updates (schema.md)
5. Cohere API integration guide (ai-cohere.md)
6. UI component specifications (chat-interface.md)
7. Frontend-backend integration patterns (frontend-backend.md)
8. Executive summary (PHASE3_SUMMARY.md)

## Response snapshot

Successfully created a comprehensive Phase III specification constitution with 9 specification files covering all aspects of the AI chatbot integration:

**Architecture Overview:**
- Stateless FastAPI server with Cohere API integration
- Floating chat icon (MessageCircle) with modal dialog UI
- MCP-style tool pattern for task management
- Better Auth JWT validation for security
- Conversation persistence in Neon DB

**Key Specifications Created:**

1. **specs/overview.md** - Updated project overview with Phase III architecture
2. **specs/features/chatbot.md** - Complete chatbot feature specification with user stories, examples, and acceptance criteria
3. **specs/api/mcp-tools.md** - 5 MCP-style tool definitions with JSON schemas
4. **specs/api/rest-endpoints.md** - POST /api/{user_id}/chat endpoint specification
5. **specs/database/schema.md** - Conversation and Message models with relationships
6. **specs/integration/ai-cohere.md** - Cohere API integration patterns and tool calling
7. **specs/ui/chat-interface.md** - Floating icon + modal UI specification with animations
8. **specs/integration/frontend-backend.md** - Authentication flow and API communication
9. **specs/PHASE3_SUMMARY.md** - Executive summary and implementation checklist

**UI Design Highlights:**
- Floating icon: Fixed bottom-right, blue gradient, hover glow effect
- Modal: 500x600px desktop, full-screen mobile, shadcn/ui Dialog
- Animations: Pulse for new messages, smooth transitions
- State persistence: sessionStorage for conversation continuity
- Accessibility: ARIA labels, keyboard navigation

**Technical Patterns:**
- Stateless server: All state fetched from DB on each request
- Tool execution: Fetch → Execute → Store pattern
- User isolation: Every query filters by user_id
- Error handling: Comprehensive error taxonomy
- Performance: Connection pooling, query optimization, caching

## Outcome

- ✅ Impact: Complete Phase III specification constitution ready for implementation. All 8 core specifications created with consistent architecture, clear acceptance criteria, and implementation guidance.
- 🧪 Tests: No tests created (specification phase). Test scenarios documented in each spec file.
- 📁 Files: 9 specification files created/updated covering features, API, database, integration, and UI
- 🔁 Next prompts: `/sp.plan phase3-chatbot` to create implementation plan, `/sp.tasks phase3-chatbot` to generate actionable tasks, `/sp.adr` to document architectural decisions (Cohere vs OpenAI, stateless design, floating UI)
- 🧠 Reflection: Successfully addressed the key architectural decision of floating icon + modal vs dedicated chat page. User explicitly chose Option A (quick update to existing spec) with detailed requirements for animations, responsive design, and state persistence.

## Evaluation notes (flywheel)

- Failure modes observed: Initial git fetch operation was rejected by user (user didn't want git operations during spec update)
- Graders run and results (PASS/FAIL): PASS - All specifications are complete, consistent, and implementation-ready. User explicitly confirmed Option A approach.
- Prompt variant (if applicable): Standard /sp.constitution workflow with user clarification on UI approach
- Next experiment (smallest change to try): Consider creating ADRs for significant architectural decisions (Cohere API selection, stateless server design, floating UI pattern) using `/sp.adr` command
