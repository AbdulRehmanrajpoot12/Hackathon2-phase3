# Phase III Implementation Plan: AI Chatbot Integration

## Overview

This plan outlines the step-by-step implementation of an AI-powered chatbot assistant using Cohere API for natural language task management. The chatbot will be integrated into the existing Phase II full-stack todo application with a floating icon + modal UI approach.

**Architecture**: Stateless FastAPI backend with Cohere API integration, floating chat icon with modal dialog, MCP-style tools, Better Auth JWT validation, and conversation persistence in Neon DB.

**Key Principles** (from @specs/.specify/memory/constitution.md):
- Specification-first development
- Authentication and authorization (NON-NEGOTIABLE)
- API-first architecture
- Type safety and validation
- Database integrity
- Component reusability

---

## Phase 1: Backend Preparation

### Goal
Prepare the existing FastAPI backend to support Cohere API integration and chat functionality.

### Tasks

#### 1.1 Add Cohere API Environment Variable
**Files to modify:**
- `backend/.env.example`
- `backend/.env` (local only, not committed)

**Actions:**
```bash
# Add to .env
COHERE_API_KEY=your_cohere_api_key_here
```

**Specs:** @specs/integration/ai-cohere.md (Environment Variable section)

**Dependencies:** None

**Complexity:** Low

#### 1.2 Install Cohere Python SDK
**Files to modify:**
- `backend/requirements.txt`

**Actions:**
```bash
# Add to requirements.txt
cohere>=4.0.0
tenacity>=8.0.0  # For retry logic
```

**Command:**
```bash
cd backend
pip install cohere tenacity
```

**Specs:** @specs/integration/ai-cohere.md (Cohere API Basics section)

**Dependencies:** 1.1

**Complexity:** Low

#### 1.3 Update CORS Configuration
**Files to modify:**
- `backend/main.py`

**Actions:**
- Add frontend URL to ALLOWED_ORIGINS
- Ensure Authorization header is allowed
- Verify credentials support is enabled

**Specs:** @specs/integration/frontend-backend.md (CORS Configuration section)

**Dependencies:** None

**Complexity:** Low

**Acceptance Criteria:**
- [ ] COHERE_API_KEY environment variable configured
- [ ] Cohere SDK installed and importable
- [ ] CORS allows frontend origin with credentials
- [ ] Backend starts without errors

---

## Phase 2: Database Extension

### Goal
Extend the database schema to support conversation history and message storage.

### Tasks

#### 2.1 Create Conversation Model
**Files to create:**
- `backend/models/conversation.py`

**Actions:**
```python
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

**Specs:** @specs/database/schema.md (Conversation Model section)

**Dependencies:** None

**Complexity:** Low

#### 2.2 Create Message Model
**Files to create:**
- `backend/models/message.py`

**Actions:**
```python
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Text, JSON
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", index=True)
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str = Field(sa_column=Column(Text))
    tool_calls: Optional[str] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
```

**Specs:** @specs/database/schema.md (Message Model section)

**Dependencies:** 2.1

**Complexity:** Low

#### 2.3 Update Models Index
**Files to modify:**
- `backend/models/__init__.py`

**Actions:**
```python
from .conversation import Conversation
from .message import Message

__all__ = ["Conversation", "Message", ...]
```

**Dependencies:** 2.1, 2.2

**Complexity:** Low

#### 2.4 Create Database Migration
**Files to create:**
- `backend/alembic/versions/xxx_add_conversation_message_tables.py`

**Actions:**
```bash
cd backend
alembic revision --autogenerate -m "Add conversation and message tables"
alembic upgrade head
```

**Specs:** @specs/database/schema.md (Migration section)

**Dependencies:** 2.1, 2.2, 2.3

**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Conversation model created with proper fields and indexes
- [ ] Message model created with proper fields and indexes
- [ ] Models exported from __init__.py
- [ ] Migration created and applied successfully
- [ ] Tables exist in database with correct schema

---

## Phase 3: MCP Tools Implementation

### Goal
Implement all 5 MCP-style tools for task management operations with user_id isolation.

### Tasks

#### 3.1 Create Tools Module Structure
**Files to create:**
- `backend/tools/__init__.py`
- `backend/tools/task_tools.py`

**Actions:**
```python
# backend/tools/__init__.py
from .task_tools import (
    add_task,
    list_tasks,
    complete_task,
    delete_task,
    update_task,
    get_cohere_tools
)

__all__ = [
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task",
    "get_cohere_tools"
]
```

**Specs:** @specs/api/mcp-tools.md (Tool Definitions section)

**Dependencies:** Phase 2 complete

**Complexity:** Low

#### 3.2 Implement add_task Tool
**Files to modify:**
- `backend/tools/task_tools.py`

**Actions:**
- Implement add_task function with user_id, title, description parameters
- Validate input (title 1-255 chars, description max 1000 chars)
- Create Task in database with user_id isolation
- Return success response with task details

**Specs:** @specs/api/mcp-tools.md (Tool 1: add_task section)

**Dependencies:** 3.1

**Complexity:** Low

#### 3.3 Implement list_tasks Tool
**Files to modify:**
- `backend/tools/task_tools.py`

**Actions:**
- Implement list_tasks function with user_id, status parameters
- Filter by user_id (CRITICAL for security)
- Apply status filter (all/completed/incomplete)
- Order by created_at descending
- Return tasks array with count

**Specs:** @specs/api/mcp-tools.md (Tool 2: list_tasks section)

**Dependencies:** 3.1

**Complexity:** Low

#### 3.4 Implement complete_task Tool
**Files to modify:**
- `backend/tools/task_tools.py`

**Actions:**
- Implement complete_task function with user_id, task_id parameters
- Fetch task with user_id filter (security)
- Return 404 if not found or access denied
- Update completed=True and updated_at
- Return success response with updated task

**Specs:** @specs/api/mcp-tools.md (Tool 3: complete_task section)

**Dependencies:** 3.1

**Complexity:** Low

#### 3.5 Implement delete_task Tool
**Files to modify:**
- `backend/tools/task_tools.py`

**Actions:**
- Implement delete_task function with user_id, task_id parameters
- Fetch task with user_id filter (security)
- Return 404 if not found or access denied
- Delete task from database
- Return success response with task_id

**Specs:** @specs/api/mcp-tools.md (Tool 4: delete_task section)

**Dependencies:** 3.1

**Complexity:** Low

#### 3.6 Implement update_task Tool
**Files to modify:**
- `backend/tools/task_tools.py`

**Actions:**
- Implement update_task function with user_id, task_id, title, description parameters
- Validate at least one field provided
- Fetch task with user_id filter (security)
- Update provided fields
- Return success response with updated task

**Specs:** @specs/api/mcp-tools.md (Tool 5: update_task section)

**Dependencies:** 3.1

**Complexity:** Low

#### 3.7 Create Cohere Tool Definitions
**Files to modify:**
- `backend/tools/task_tools.py`

**Actions:**
- Implement get_cohere_tools() function
- Return all 5 tools in Cohere format with parameter_definitions
- Cache tool definitions to avoid recreation on every request

**Specs:** @specs/api/mcp-tools.md (Tool Registration for Cohere section)

**Dependencies:** 3.2, 3.3, 3.4, 3.5, 3.6

**Complexity:** Medium

**Acceptance Criteria:**
- [ ] All 5 tools implemented with proper signatures
- [ ] All tools enforce user_id isolation
- [ ] All tools validate input parameters
- [ ] All tools return consistent response format
- [ ] get_cohere_tools() returns proper Cohere schema
- [ ] Unit tests pass for each tool

---

## Phase 4: Cohere AI Agent Setup

### Goal
Configure Cohere API client and implement the AI agent logic for natural language understanding and tool calling.

### Tasks

#### 4.1 Create Cohere Client Module
**Files to create:**
- `backend/services/cohere_client.py`

**Actions:**
```python
import cohere
import os

# Initialize Cohere client
co = cohere.Client(
    api_key=os.getenv("COHERE_API_KEY"),
    timeout=10
)

CHATBOT_PREAMBLE = """You are a helpful task management assistant..."""
```

**Specs:** @specs/integration/ai-cohere.md (Cohere API Basics section)

**Dependencies:** Phase 1 complete

**Complexity:** Low

#### 4.2 Implement Message Formatting
**Files to modify:**
- `backend/services/cohere_client.py`

**Actions:**
- Implement format_messages_for_cohere() function
- Convert database messages (role: user/assistant) to Cohere format (USER/CHATBOT)
- Handle message history pagination (limit to 50 recent messages)

**Specs:** @specs/integration/ai-cohere.md (Message History Format section)

**Dependencies:** 4.1

**Complexity:** Low

#### 4.3 Implement Tool Execution Dispatcher
**Files to create:**
- `backend/services/tool_executor.py`

**Actions:**
- Implement execute_tool() function
- Dispatch to appropriate tool based on tool_name
- Handle tool errors gracefully
- Return standardized result format

**Specs:** @specs/integration/ai-cohere.md (Tool Execution section)

**Dependencies:** Phase 3 complete

**Complexity:** Medium

#### 4.4 Implement Cohere Chat Function
**Files to modify:**
- `backend/services/cohere_client.py`

**Actions:**
- Implement call_cohere_chat() function
- Format message with user email context
- Call co.chat() with tools and preamble
- Parse response (text + tool_calls)
- Handle Cohere API errors with retry logic

**Specs:** @specs/integration/ai-cohere.md (Complete Integration Flow section)

**Dependencies:** 4.1, 4.2, Phase 3 complete

**Complexity:** High

**Acceptance Criteria:**
- [ ] Cohere client initialized with API key
- [ ] Message formatting converts to Cohere format correctly
- [ ] Tool dispatcher routes to correct tool functions
- [ ] Cohere chat function calls API successfully
- [ ] Error handling catches and logs Cohere errors
- [ ] Retry logic implemented for transient failures

---

## Phase 5: Chat Endpoint Implementation

### Goal
Create the POST /api/{user_id}/chat endpoint that orchestrates the complete chat flow.

### Tasks

#### 5.1 Create Chat Request/Response Models
**Files to create:**
- `backend/models/chat.py`

**Actions:**
```python
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ToolCallResult(BaseModel):
    name: str
    parameters: dict
    result: dict

class ChatResponse(BaseModel):
    message: str
    tool_calls: List[ToolCallResult]
    conversation_id: str
    message_id: str
```

**Specs:** @specs/api/rest-endpoints.md (POST /api/{user_id}/chat section)

**Dependencies:** None

**Complexity:** Low

#### 5.2 Create Chat Router
**Files to create:**
- `backend/routers/chat.py`

**Actions:**
- Create FastAPI router for chat endpoints
- Import authentication dependency
- Import Cohere client and tool executor

**Dependencies:** 5.1, Phase 4 complete

**Complexity:** Low

#### 5.3 Implement Chat Endpoint Logic
**Files to modify:**
- `backend/routers/chat.py`

**Actions:**
```python
@router.post("/api/{user_id}/chat")
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    current_user: dict = Depends(verify_auth),
    session: Session = Depends(get_session)
):
    # 1. Get or create conversation
    # 2. Fetch conversation history
    # 3. Format history for Cohere
    # 4. Call Cohere API
    # 5. Execute tool calls
    # 6. Store user and assistant messages
    # 7. Return response
```

**Specs:** @specs/integration/ai-cohere.md (Complete Integration Flow section)

**Dependencies:** 5.1, 5.2, Phase 2, Phase 3, Phase 4 complete

**Complexity:** High

#### 5.4 Register Chat Router
**Files to modify:**
- `backend/main.py`

**Actions:**
```python
from routers.chat import router as chat_router
app.include_router(chat_router)
```

**Dependencies:** 5.3

**Complexity:** Low

**Acceptance Criteria:**
- [ ] Chat request/response models defined
- [ ] Chat endpoint validates JWT token
- [ ] Endpoint fetches/creates conversation
- [ ] Endpoint calls Cohere API with tools
- [ ] Endpoint executes tool calls
- [ ] Endpoint stores messages in database
- [ ] Endpoint returns proper response format
- [ ] Error handling for all failure modes
- [ ] Integration tests pass

---

## Phase 6: Frontend Chatbot UI Integration

### Goal
Implement the floating chatbot icon and modal dialog UI in the Next.js frontend.

### Tasks

#### 6.1 Install Required Dependencies
**Files to modify:**
- `frontend/package.json`

**Actions:**
```bash
cd frontend
npm install lucide-react
# shadcn/ui Dialog component (if not already installed)
npx shadcn-ui@latest add dialog
```

**Specs:** @specs/ui/chat-interface.md (Component Library section)

**Dependencies:** None

**Complexity:** Low

#### 6.2 Create Chat API Client
**Files to create:**
- `frontend/lib/api/chat.ts`

**Actions:**
- Implement sendChatMessage() function
- Get user_id and token from Better Auth session
- Call POST /api/{user_id}/chat with Authorization header
- Handle errors (401, 403, 503)
- Return ChatResponse

**Specs:** @specs/integration/frontend-backend.md (Frontend API Client section)

**Dependencies:** Phase 5 complete

**Complexity:** Medium

#### 6.3 Create Message Components
**Files to create:**
- `frontend/components/chat/MessageList.tsx`
- `frontend/components/chat/MessageBubble.tsx`
- `frontend/components/chat/ChatInput.tsx`

**Actions:**
- MessageList: Scrollable container for messages
- MessageBubble: Display user/assistant messages with styling
- ChatInput: Text input with send button and loading state

**Specs:** @specs/ui/chat-interface.md (Core Components section)

**Dependencies:** None

**Complexity:** Medium

#### 6.4 Create Floating Chat Icon Component
**Files to create:**
- `frontend/components/chat/FloatingChatIcon.tsx`

**Actions:**
```tsx
import { MessageCircle } from 'lucide-react';

export function FloatingChatIcon({ onClick, hasUnread }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-300 flex items-center justify-center group"
      aria-label="Open chat assistant"
    >
      <MessageCircle className="w-6 h-6" />
      {hasUnread && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
```

**Specs:** @specs/ui/chat-interface.md (Floating Chat Icon section)

**Dependencies:** 6.1

**Complexity:** Low

#### 6.5 Create Chat Modal Component
**Files to create:**
- `frontend/components/chat/ChatModal.tsx`

**Actions:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatModal({ isOpen, onOpenChange }) {
  // State: messages, conversationId, isLoading, error
  // Handle send message
  // Handle optimistic updates
  // Persist conversation ID in sessionStorage

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
        <DialogHeader className="border-b p-4 flex-shrink-0">
          <DialogTitle>Chat Assistant</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} />
        </div>
        <div className="border-t p-4 flex-shrink-0">
          <ChatInput onSend={handleSend} isLoading={isLoading} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Specs:** @specs/ui/chat-interface.md (Chat Modal section)

**Dependencies:** 6.2, 6.3, 6.4

**Complexity:** High

#### 6.6 Integrate into Global Layout
**Files to modify:**
- `frontend/app/layout.tsx` or `frontend/components/Layout.tsx`

**Actions:**
- Add FloatingChatIcon to layout (visible only when authenticated)
- Add ChatModal with state management
- Handle modal open/close
- Persist chat state across navigation

**Specs:** @specs/ui/chat-interface.md (Integration with Global Layout section)

**Dependencies:** 6.4, 6.5

**Complexity:** Medium

**Acceptance Criteria:**
- [ ] Floating icon appears in bottom-right corner after login
- [ ] Icon has hover glow effect
- [ ] Icon shows pulse indicator for new messages
- [ ] Clicking icon opens modal dialog
- [ ] Modal displays message history
- [ ] User can send messages via input
- [ ] Messages display with proper styling
- [ ] Tool results render correctly
- [ ] Conversation ID persists in sessionStorage
- [ ] Modal is responsive (full-screen on mobile)
- [ ] Accessibility features work (keyboard navigation, ARIA labels)

---

## Phase 7: Full Integration & Testing

### Goal
Verify end-to-end functionality, test edge cases, and ensure production readiness.

### Tasks

#### 7.1 End-to-End Flow Testing
**Test Scenarios:**

1. **Happy Path: Add Task**
   - Login as user
   - Open chat icon
   - Send: "Add a task to buy groceries"
   - Verify: Task created in database
   - Verify: Confirmation message includes user email
   - Verify: Message history persisted

2. **Happy Path: List Tasks**
   - Send: "Show me my tasks"
   - Verify: All user's tasks displayed
   - Verify: No other user's tasks shown

3. **Happy Path: Complete Task**
   - Send: "Mark task 1 as done"
   - Verify: Task marked completed in database
   - Verify: Confirmation message

4. **Happy Path: Delete Task**
   - Send: "Delete task 2"
   - Verify: Task removed from database
   - Verify: Confirmation message

5. **Happy Path: Update Task**
   - Send: "Change task 1 title to 'Buy milk'"
   - Verify: Task updated in database
   - Verify: Confirmation message

**Specs:** @specs/features/chatbot.md (User Stories section)

**Dependencies:** All previous phases complete

**Complexity:** High

#### 7.2 Stateless Verification
**Test Scenarios:**

1. **Server Restart Test**
   - Start conversation, send messages
   - Restart backend server
   - Resume conversation
   - Verify: History loads correctly
   - Verify: Can continue conversation

2. **Concurrent Users Test**
   - Login as User A and User B
   - Both send messages simultaneously
   - Verify: No cross-user data leakage
   - Verify: Each sees only their own tasks

**Specs:** @specs/integration/ai-cohere.md (Stateless Design section)

**Dependencies:** 7.1

**Complexity:** Medium

#### 7.3 Error Handling Testing
**Test Scenarios:**

1. **Invalid Task ID**
   - Send: "Complete task 999"
   - Verify: User-friendly error message
   - Verify: No crash

2. **Cohere API Timeout**
   - Simulate Cohere API timeout
   - Verify: Retry logic executes
   - Verify: User sees appropriate error message

3. **Database Connection Error**
   - Simulate database unavailability
   - Verify: Graceful error handling
   - Verify: User-friendly error message

4. **Invalid JWT Token**
   - Send request with expired token
   - Verify: 401 response
   - Verify: Frontend redirects to login

**Specs:** @specs/integration/frontend-backend.md (Error Handling section)

**Dependencies:** 7.1

**Complexity:** Medium

#### 7.4 User Personalization Verification
**Test Scenarios:**

1. **Email in Responses**
   - Send any task command
   - Verify: Response includes user email
   - Example: "Added task for abdul@example.com"

2. **User Isolation**
   - Login as User A, create tasks
   - Login as User B, list tasks
   - Verify: User B sees only their tasks
   - Verify: No access to User A's tasks

**Specs:** @specs/features/chatbot.md (User Personalization section)

**Dependencies:** 7.1

**Complexity:** Low

#### 7.5 Performance Testing
**Test Scenarios:**

1. **Response Time**
   - Send 10 chat messages
   - Measure p95 response time
   - Target: < 2 seconds

2. **Conversation History Load**
   - Create conversation with 100 messages
   - Open chat modal
   - Measure load time
   - Target: < 1 second

3. **Concurrent Requests**
   - Simulate 10 concurrent users
   - Verify: No performance degradation
   - Verify: No database connection pool exhaustion

**Specs:** @specs/features/chatbot.md (Performance section)

**Dependencies:** 7.1

**Complexity:** Medium

#### 7.6 Security Audit
**Test Scenarios:**

1. **JWT Validation**
   - Send request without token → 401
   - Send request with invalid token → 401
   - Send request with expired token → 401
   - Send request with valid token → 200

2. **User ID Mismatch**
   - User A's token with User B's user_id in path → 403

3. **SQL Injection Prevention**
   - Send malicious input in task title
   - Verify: Input sanitized by ORM
   - Verify: No SQL injection possible

4. **Cross-User Data Access**
   - Attempt to access another user's conversation_id
   - Verify: 404 or 403 response
   - Verify: No data leakage

**Specs:** @specs/integration/frontend-backend.md (Security Considerations section)

**Dependencies:** 7.1

**Complexity:** High

**Acceptance Criteria:**
- [ ] All end-to-end flows work correctly
- [ ] Stateless design verified (server restart doesn't lose context)
- [ ] Error handling graceful for all failure modes
- [ ] User email included in all responses
- [ ] User isolation enforced (no cross-user access)
- [ ] Performance targets met (< 2s response time)
- [ ] Security audit passes (JWT validation, no SQL injection)
- [ ] Accessibility audit passes (WCAG 2.1 AA)
- [ ] All tests documented and passing

---

## Implementation Order Summary

```
Phase 1: Backend Preparation (1-2 hours)
  ├─ 1.1 Add Cohere API env var
  ├─ 1.2 Install Cohere SDK
  └─ 1.3 Update CORS

Phase 2: Database Extension (2-3 hours)
  ├─ 2.1 Create Conversation model
  ├─ 2.2 Create Message model
  ├─ 2.3 Update models index
  └─ 2.4 Create migration

Phase 3: MCP Tools Implementation (4-6 hours)
  ├─ 3.1 Create tools module
  ├─ 3.2 Implement add_task
  ├─ 3.3 Implement list_tasks
  ├─ 3.4 Implement complete_task
  ├─ 3.5 Implement delete_task
  ├─ 3.6 Implement update_task
  └─ 3.7 Create Cohere tool definitions

Phase 4: Cohere AI Agent Setup (4-6 hours)
  ├─ 4.1 Create Cohere client
  ├─ 4.2 Implement message formatting
  ├─ 4.3 Implement tool dispatcher
  └─ 4.4 Implement Cohere chat function

Phase 5: Chat Endpoint Implementation (3-4 hours)
  ├─ 5.1 Create request/response models
  ├─ 5.2 Create chat router
  ├─ 5.3 Implement chat endpoint logic
  └─ 5.4 Register router

Phase 6: Frontend Chatbot UI Integration (6-8 hours)
  ├─ 6.1 Install dependencies
  ├─ 6.2 Create chat API client
  ├─ 6.3 Create message components
  ├─ 6.4 Create floating icon
  ├─ 6.5 Create chat modal
  └─ 6.6 Integrate into layout

Phase 7: Full Integration & Testing (4-6 hours)
  ├─ 7.1 End-to-end flow testing
  ├─ 7.2 Stateless verification
  ├─ 7.3 Error handling testing
  ├─ 7.4 User personalization verification
  ├─ 7.5 Performance testing
  └─ 7.6 Security audit
```

**Total Estimated Effort:** 24-35 hours

---

## Risk Mitigation

### Risk 1: Cohere API Rate Limits
**Mitigation:**
- Implement rate limiting on chat endpoint (10 requests/minute per user)
- Add retry logic with exponential backoff
- Monitor API usage and set alerts

### Risk 2: Database Performance with Large Conversation History
**Mitigation:**
- Limit conversation history to 50 recent messages
- Add pagination for message loading
- Create indexes on conversation_id and created_at

### Risk 3: Cross-User Data Leakage
**Mitigation:**
- Enforce user_id filtering in ALL database queries
- Add integration tests for user isolation
- Conduct security audit before production

### Risk 4: Cohere API Downtime
**Mitigation:**
- Implement circuit breaker pattern
- Show user-friendly error message
- Add health check endpoint for monitoring

---

## Success Criteria

### Functional Requirements
- [ ] Users can add tasks via natural language
- [ ] Users can list tasks via natural language
- [ ] Users can complete tasks via natural language
- [ ] Users can delete tasks via natural language
- [ ] Users can update tasks via natural language
- [ ] AI responses include user email
- [ ] Conversation history persists across sessions
- [ ] Tool results display in chat interface

### Non-Functional Requirements
- [ ] Chat endpoint responds within 2 seconds (p95)
- [ ] Cohere API calls have timeout and retry logic
- [ ] All tool calls enforce user_id isolation
- [ ] Conversation history loads efficiently
- [ ] Chat interface is responsive
- [ ] Error messages are user-friendly
- [ ] Server can restart without losing context

### Security Requirements
- [ ] JWT token validated on every request
- [ ] User_id extracted from token, not request body
- [ ] No cross-user data access possible
- [ ] SQL injection prevented by ORM
- [ ] CORS configured for specific origins only

---

## Related Specifications

- @specs/PHASE3_SUMMARY.md - Executive summary
- @specs/features/chatbot.md - Feature requirements
- @specs/api/mcp-tools.md - Tool definitions
- @specs/api/rest-endpoints.md - API endpoints
- @specs/database/schema.md - Database models
- @specs/integration/ai-cohere.md - Cohere integration
- @specs/ui/chat-interface.md - UI components
- @specs/integration/frontend-backend.md - Integration patterns

---

**Phase III implementation plan completed ✅**
