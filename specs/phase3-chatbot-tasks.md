---
description: "Task list for Phase III AI Chatbot Integration"
---

# Tasks: Phase III AI Chatbot Integration

**Input**: Design documents from `/specs/`
**Prerequisites**: phase3-implementation-plan.md (required), chatbot.md (user stories), mcp-tools.md, ai-cohere.md

**Tests**: Tests are included in Phase 9 as integration and end-to-end testing tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each natural language capability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/` (FastAPI, SQLModel, Cohere)
- **Frontend**: `frontend/` (Next.js, React, Tailwind)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Add COHERE_API_KEY to backend/.env.example
- [ ] T002 Add COHERE_API_KEY to backend/.env (local only, not committed)
- [ ] T003 [P] Add cohere>=4.0.0 to backend/requirements.txt
- [ ] T004 [P] Add tenacity>=8.0.0 to backend/requirements.txt
- [ ] T005 Install Python dependencies with pip install -r backend/requirements.txt
- [ ] T006 Update CORS configuration in backend/main.py to allow frontend origin with credentials
- [ ] T007 [P] Install lucide-react in frontend with npm install lucide-react
- [ ] T008 [P] Install shadcn/ui Dialog component with npx shadcn-ui@latest add dialog

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Models

- [ ] T009 [P] Create Conversation model in backend/models/conversation.py with user_id, created_at, updated_at
- [ ] T010 [P] Create Message model in backend/models/message.py with conversation_id, role, content, tool_calls, created_at
- [ ] T011 Update backend/models/__init__.py to export Conversation and Message models
- [ ] T012 Create Alembic migration for conversation and message tables with alembic revision --autogenerate
- [ ] T013 Apply database migration with alembic upgrade head

### MCP Tools Infrastructure

- [ ] T014 Create backend/tools/__init__.py module
- [ ] T015 Create backend/tools/task_tools.py with module structure and imports

### Cohere AI Agent Infrastructure

- [ ] T016 [P] Create backend/services/cohere_client.py with Cohere client initialization
- [ ] T017 [P] Add CHATBOT_PREAMBLE constant to backend/services/cohere_client.py
- [ ] T018 Implement format_messages_for_cohere() function in backend/services/cohere_client.py
- [ ] T019 Create backend/services/tool_executor.py with execute_tool() dispatcher function

### Chat Endpoint Infrastructure

- [ ] T020 [P] Create ChatRequest model in backend/models/chat.py
- [ ] T021 [P] Create ChatResponse model in backend/models/chat.py
- [ ] T022 [P] Create ToolCallResult model in backend/models/chat.py
- [ ] T023 Create backend/routers/chat.py with FastAPI router and authentication imports
- [ ] T024 Implement POST /api/{user_id}/chat endpoint skeleton in backend/routers/chat.py
- [ ] T025 Register chat router in backend/main.py with app.include_router()

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add Task via Natural Language (Priority: P1) 🎯 MVP

**Goal**: Users can add tasks using natural language commands like "Add a task to buy groceries"

**Independent Test**: Login → Open chat → Send "Add a task to buy milk" → Verify task created in database with user_id isolation

### Implementation for User Story 1

- [ ] T026 [P] [US1] Implement add_task() function in backend/tools/task_tools.py with user_id, title, description parameters
- [ ] T027 [US1] Add input validation to add_task() (title 1-255 chars, description max 1000 chars)
- [ ] T028 [US1] Add user_id isolation check to add_task() function
- [ ] T029 [US1] Add add_task tool definition to get_cohere_tools() in backend/tools/task_tools.py
- [ ] T030 [US1] Update execute_tool() in backend/services/tool_executor.py to dispatch add_task
- [ ] T031 [US1] Implement conversation creation logic in chat endpoint for new conversations
- [ ] T032 [US1] Implement conversation history fetching in chat endpoint
- [ ] T033 [US1] Implement Cohere API call with tools in backend/services/cohere_client.py
- [ ] T034 [US1] Implement tool execution loop in chat endpoint
- [ ] T035 [US1] Implement message storage (user + assistant) in chat endpoint
- [ ] T036 [US1] Add error handling for add_task failures in chat endpoint

**Checkpoint**: At this point, users can add tasks via natural language through the chat endpoint

---

## Phase 4: User Story 2 - List Tasks via Natural Language (Priority: P2)

**Goal**: Users can view their tasks using conversational queries like "Show me my tasks" or "List incomplete tasks"

**Independent Test**: Login → Open chat → Send "Show me my tasks" → Verify all user's tasks displayed, no other user's tasks shown

### Implementation for User Story 2

- [ ] T037 [P] [US2] Implement list_tasks() function in backend/tools/task_tools.py with user_id, status parameters
- [ ] T038 [US2] Add user_id filtering to list_tasks() query (CRITICAL for security)
- [ ] T039 [US2] Add status filter logic (all/completed/incomplete) to list_tasks()
- [ ] T040 [US2] Add ordering by created_at descending to list_tasks()
- [ ] T041 [US2] Add list_tasks tool definition to get_cohere_tools() in backend/tools/task_tools.py
- [ ] T042 [US2] Update execute_tool() in backend/services/tool_executor.py to dispatch list_tasks

**Checkpoint**: At this point, users can list tasks via natural language

---

## Phase 5: User Story 3 - Complete Task via Natural Language (Priority: P3)

**Goal**: Users can mark tasks as complete using natural language like "Mark task 1 as done" or "Complete the groceries task"

**Independent Test**: Login → Create task → Send "Mark task 1 as done" → Verify task.completed=True in database

### Implementation for User Story 3

- [ ] T043 [P] [US3] Implement complete_task() function in backend/tools/task_tools.py with user_id, task_id parameters
- [ ] T044 [US3] Add user_id isolation check to complete_task() (fetch with user_id filter)
- [ ] T045 [US3] Add 404 error handling for task not found in complete_task()
- [ ] T046 [US3] Update task.completed=True and task.updated_at in complete_task()
- [ ] T047 [US3] Add complete_task tool definition to get_cohere_tools() in backend/tools/task_tools.py
- [ ] T048 [US3] Update execute_tool() in backend/services/tool_executor.py to dispatch complete_task

**Checkpoint**: At this point, users can complete tasks via natural language

---

## Phase 6: User Story 4 - Delete Task via Natural Language (Priority: P3)

**Goal**: Users can delete tasks using conversational commands like "Delete task 2" or "Remove the groceries task"

**Independent Test**: Login → Create task → Send "Delete task 1" → Verify task removed from database

### Implementation for User Story 4

- [ ] T049 [P] [US4] Implement delete_task() function in backend/tools/task_tools.py with user_id, task_id parameters
- [ ] T050 [US4] Add user_id isolation check to delete_task() (fetch with user_id filter)
- [ ] T051 [US4] Add 404 error handling for task not found in delete_task()
- [ ] T052 [US4] Delete task from database in delete_task()
- [ ] T053 [US4] Add delete_task tool definition to get_cohere_tools() in backend/tools/task_tools.py
- [ ] T054 [US4] Update execute_tool() in backend/services/tool_executor.py to dispatch delete_task

**Checkpoint**: At this point, users can delete tasks via natural language

---

## Phase 7: User Story 5 - Update Task via Natural Language (Priority: P3)

**Goal**: Users can modify task details using natural language like "Change task 1 title to 'Buy milk and eggs'"

**Independent Test**: Login → Create task → Send "Update task 1 title to 'New title'" → Verify task updated in database

### Implementation for User Story 5

- [ ] T055 [P] [US5] Implement update_task() function in backend/tools/task_tools.py with user_id, task_id, title, description parameters
- [ ] T056 [US5] Add validation for at least one field provided in update_task()
- [ ] T057 [US5] Add user_id isolation check to update_task() (fetch with user_id filter)
- [ ] T058 [US5] Add field validation (title 1-255 chars, description max 1000 chars) in update_task()
- [ ] T059 [US5] Update task fields and updated_at in update_task()
- [ ] T060 [US5] Add update_task tool definition to get_cohere_tools() in backend/tools/task_tools.py
- [ ] T061 [US5] Update execute_tool() in backend/services/tool_executor.py to dispatch update_task

**Checkpoint**: At this point, all 5 MCP tools are implemented and functional

---

## Phase 8: User Story 6 - Resume Conversation After Restart (Priority: P2)

**Goal**: Users can continue their conversation after closing the app or server restart without losing context

**Independent Test**: Login → Send messages → Close browser → Reopen → Verify conversation history loads

### Implementation for User Story 6

- [ ] T062 [P] [US6] Create sendChatMessage() function in frontend/lib/api/chat.ts
- [ ] T063 [US6] Add Better Auth session retrieval to sendChatMessage() (user_id and token)
- [ ] T064 [US6] Add Authorization header with JWT token to sendChatMessage()
- [ ] T065 [US6] Add error handling (401, 403, 503) to sendChatMessage()
- [ ] T066 [P] [US6] Create MessageList component in frontend/components/chat/MessageList.tsx
- [ ] T067 [P] [US6] Create MessageBubble component in frontend/components/chat/MessageBubble.tsx
- [ ] T068 [P] [US6] Create ChatInput component in frontend/components/chat/ChatInput.tsx
- [ ] T069 [US6] Create FloatingChatIcon component in frontend/components/chat/FloatingChatIcon.tsx with MessageCircle icon
- [ ] T070 [US6] Add hover glow effect to FloatingChatIcon with Tailwind classes
- [ ] T071 [US6] Add pulse indicator for new messages to FloatingChatIcon
- [ ] T072 [US6] Create ChatModal component in frontend/components/chat/ChatModal.tsx with Dialog
- [ ] T073 [US6] Add message state management to ChatModal (messages, conversationId, isLoading, error)
- [ ] T074 [US6] Implement handleSend function in ChatModal with optimistic updates
- [ ] T075 [US6] Add sessionStorage persistence for conversationId in ChatModal
- [ ] T076 [US6] Add conversation history loading on modal open in ChatModal
- [ ] T077 [US6] Integrate FloatingChatIcon into frontend/app/layout.tsx (visible only when authenticated)
- [ ] T078 [US6] Integrate ChatModal into frontend/app/layout.tsx with state management
- [ ] T079 [US6] Add responsive design (full-screen on mobile, 500x600px on desktop) to ChatModal
- [ ] T080 [US6] Add ARIA labels and keyboard navigation to chat components

**Checkpoint**: All user stories are now independently functional with full UI integration

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Testing, validation, and improvements that affect multiple user stories

### Integration Testing

- [ ] T081 [P] Test US1: Add task via natural language - verify task created with user_id isolation
- [ ] T082 [P] Test US2: List tasks via natural language - verify all user's tasks shown, no cross-user data
- [ ] T083 [P] Test US3: Complete task via natural language - verify task.completed=True
- [ ] T084 [P] Test US4: Delete task via natural language - verify task removed from database
- [ ] T085 [P] Test US5: Update task via natural language - verify task updated in database
- [ ] T086 [P] Test US6: Resume conversation - restart server, verify history loads correctly

### Stateless Verification

- [ ] T087 Test server restart: Start conversation → Restart backend → Resume conversation → Verify history persists
- [ ] T088 Test concurrent users: Login as User A and B → Both send messages → Verify no cross-user data leakage

### Error Handling Testing

- [ ] T089 [P] Test invalid task ID: Send "Complete task 999" → Verify user-friendly error message
- [ ] T090 [P] Test Cohere API timeout: Simulate timeout → Verify retry logic executes
- [ ] T091 [P] Test database error: Simulate DB unavailability → Verify graceful error handling
- [ ] T092 [P] Test invalid JWT: Send request with expired token → Verify 401 response and frontend redirect

### User Personalization Verification

- [ ] T093 Test email in responses: Send any task command → Verify response includes user email
- [ ] T094 Test user isolation: Login as User A, create tasks → Login as User B → Verify User B sees only their tasks

### Performance Testing

- [ ] T095 [P] Test response time: Send 10 chat messages → Measure p95 response time → Target < 2 seconds
- [ ] T096 [P] Test conversation history load: Create 100 messages → Open chat → Measure load time → Target < 1 second
- [ ] T097 Test concurrent requests: Simulate 10 concurrent users → Verify no performance degradation

### Security Audit

- [ ] T098 [P] Test JWT validation: Send requests without/invalid/expired tokens → Verify 401 responses
- [ ] T099 [P] Test user ID mismatch: User A's token with User B's user_id → Verify 403 response
- [ ] T100 [P] Test SQL injection: Send malicious input in task title → Verify input sanitized by ORM
- [ ] T101 Test cross-user data access: Attempt to access another user's conversation_id → Verify 404/403

### Documentation & Cleanup

- [ ] T102 [P] Add inline code comments for complex Cohere integration logic
- [ ] T103 [P] Update README.md with Phase III setup instructions
- [ ] T104 Code cleanup: Remove console.log and debug statements
- [ ] T105 Run accessibility audit with WCAG 2.1 AA standards

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (US1 - Add Task)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (US2 - List Tasks)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (US3 - Complete Task)**: Can start after Foundational (Phase 2) - Independent of US1/US2
- **User Story 4 (US4 - Delete Task)**: Can start after Foundational (Phase 2) - Independent of US1/US2/US3
- **User Story 5 (US5 - Update Task)**: Can start after Foundational (Phase 2) - Independent of US1/US2/US3/US4
- **User Story 6 (US6 - Resume Conversation)**: Depends on Foundational (Phase 2) - Builds on conversation persistence infrastructure

### Within Each User Story

- MCP tool implementation before tool registration
- Tool registration before execute_tool() dispatcher update
- Backend complete before frontend integration
- Core implementation before testing

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories (US1-US6) can start in parallel (if team capacity allows)
- All MCP tool implementations (T026, T037, T043, T049, T055) can run in parallel after T015
- All frontend components (T066, T067, T068, T069) can run in parallel
- All testing tasks in Phase 9 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch US1 tasks in parallel:
Task: "Implement add_task() function in backend/tools/task_tools.py" (T026)
Task: "Add add_task tool definition to get_cohere_tools()" (T029)

# Then sequentially:
Task: "Update execute_tool() dispatcher" (T030)
Task: "Implement conversation creation logic" (T031)
```

---

## Parallel Example: All MCP Tools

```bash
# After T015 (task_tools.py created), launch all tool implementations in parallel:
Task: "Implement add_task() in backend/tools/task_tools.py" (T026)
Task: "Implement list_tasks() in backend/tools/task_tools.py" (T037)
Task: "Implement complete_task() in backend/tools/task_tools.py" (T043)
Task: "Implement delete_task() in backend/tools/task_tools.py" (T049)
Task: "Implement update_task() in backend/tools/task_tools.py" (T055)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T025) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T026-T036)
4. **STOP and VALIDATE**: Test US1 independently - can users add tasks via natural language?
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T025)
2. Once Foundational is done:
   - Developer A: User Story 1 (T026-T036)
   - Developer B: User Story 2 (T037-T042)
   - Developer C: User Story 3 (T043-T048)
   - Developer D: User Story 4 (T049-T054)
   - Developer E: User Story 5 (T055-T061)
   - Developer F: User Story 6 (T062-T080)
3. Stories complete and integrate independently
4. Team completes Phase 9 testing together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All MCP tools enforce user_id isolation (CRITICAL for security)
- Cohere API integration uses stateless design (all state in database)
- Frontend uses floating icon + modal (not dedicated page)
- Conversation history persists across sessions and server restarts

---

**Total Tasks**: 105
**MVP Tasks (Setup + Foundational + US1)**: 36 tasks
**Parallel Opportunities**: 30+ tasks can run in parallel after foundational phase
