# Frontend-Backend Integration Specification

## Overview
This specification defines how the Next.js frontend integrates with the FastAPI backend for Phase III chatbot functionality, including authentication, API communication, state management, and error handling.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Better Auth Client                             │    │
│  │  - getSession()                                 │    │
│  │  - Extract user_id and JWT token               │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  API Client Layer                               │    │
│  │  - sendChatMessage(message, conversationId)    │    │
│  │  - Include Authorization header                 │    │
│  │  - Handle errors and retries                    │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  Chat Components                                │    │
│  │  - ChatContainer                                │    │
│  │  - MessageList                                  │    │
│  │  - ChatInput                                    │    │
│  │  - ToolResultsDisplay                           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  JWT Validation Middleware                      │    │
│  │  - Verify token with BETTER_AUTH_SECRET        │    │
│  │  - Extract user_id from token                   │    │
│  │  - Validate user_id matches path parameter     │    │
│  └────────────────────────────────────────────────┘    │
│                         ↓                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  POST /api/{user_id}/chat Endpoint             │    │
│  │  - Fetch conversation history                   │    │
│  │  - Call Cohere API with tools                   │    │
│  │  - Execute MCP tools                            │    │
│  │  - Store messages                               │    │
│  │  - Return response                              │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Environment Variables

### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:8000

# Production
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# NEXT_PUBLIC_BETTER_AUTH_URL=https://api.yourdomain.com
```

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication
BETTER_AUTH_SECRET=Q9TfixbrudNqlZjAKGGrMEBnPIkvwqBB

# AI Integration (Phase III)
COHERE_API_KEY=REMOVED_COHERE_KEY

# CORS (if needed)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Authentication Flow

### 1. Better Auth Session Management

**Frontend: Get Session**
```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth/client';

export const authClient = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

export async function getSession() {
  const session = await authClient.getSession();
  return session;
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token || null;
}
```

**Frontend: useAuth Hook**
```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { getSession } from '@/lib/auth';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, []);

  return {
    session,
    loading,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    token: session?.token
  };
}
```

### 2. Backend JWT Validation

**Backend: Verify JWT Middleware**
```python
# backend/middleware/auth.py
from fastapi import Header, HTTPException
from jose import jwt, JWTError
import os

async def verify_auth(
    user_id: str,
    authorization: str = Header(...)
) -> dict:
    """
    Verify Better Auth JWT token and validate user_id.
    """
    try:
        # Extract token from "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")

        token = authorization.replace("Bearer ", "")

        # Verify JWT with Better Auth secret
        payload = jwt.decode(
            token,
            os.getenv("BETTER_AUTH_SECRET"),
            algorithms=["HS256"]
        )

        # Extract user_id from token
        token_user_id = payload.get("sub")

        # Verify token user_id matches path user_id
        if token_user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: user_id mismatch"
            )

        return {
            "user_id": token_user_id,
            "email": payload.get("email")
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
```

## API Communication

### Frontend API Client

**Chat API Client**
```typescript
// lib/api/chat.ts
import { getSession } from '@/lib/auth';

interface ChatRequest {
  message: string;
  conversation_id?: string;
}

interface ChatResponse {
  message: string;
  tool_calls: ToolCall[];
  conversation_id: string;
  message_id: string;
}

interface ToolCall {
  id: string;
  function: string;
  arguments: string;
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  // Get authentication
  const session = await getSession();
  if (!session?.user?.id || !session?.token) {
    throw new Error('Not authenticated');
  }

  const userId = session.user.id;
  const token = session.token;

  // Build request
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const url = `${apiUrl}/api/${userId}/chat`;

  const body: ChatRequest = {
    message,
    conversation_id: conversationId
  };

  // Call API
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  // Handle errors
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error('Access denied');
    }
    if (response.status === 503) {
      throw new Error('AI service temporarily unavailable. Please try again.');
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to send message');
  }

  // Parse response
  const data: ChatResponse = await response.json();
  return data;
}
```

### Error Handling

**Frontend Error Types**
```typescript
// lib/api/errors.ts
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'APIError';
  }
}

export function handleAPIError(error: any): string {
  if (error instanceof AuthenticationError) {
    // Redirect to login
    window.location.href = '/login?returnUrl=/chat';
    return 'Redirecting to login...';
  }

  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof APIError) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
```

## Stateless Chat Flow

### Complete Request-Response Cycle

**1. Frontend: User Sends Message**
```typescript
async function handleSendMessage(message: string) {
  setIsLoading(true);
  setError(null);

  // Optimistic update
  const userMessage = {
    id: `temp-${Date.now()}`,
    role: 'user' as const,
    content: message,
    created_at: new Date().toISOString()
  };
  setMessages(prev => [...prev, userMessage]);

  try {
    // Call backend
    const response = await sendChatMessage(message, conversationId);

    // Update conversation ID (first message)
    if (!conversationId) {
      setConversationId(response.conversation_id);
    }

    // Add assistant message
    const assistantMessage = {
      id: response.message_id,
      role: 'assistant' as const,
      content: response.message,
      tool_calls: response.tool_calls,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev.slice(0, -1), userMessage, assistantMessage]);
  } catch (err) {
    setError(handleAPIError(err));
    setMessages(prev => prev.slice(0, -1)); // Rollback optimistic update
  } finally {
    setIsLoading(false);
  }
}
```

**2. Backend: Process Request**
```python
@router.post("/api/{user_id}/chat")
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    current_user: dict = Depends(verify_auth),
    session: Session = Depends(get_session)
):
    """
    Stateless chat endpoint.
    All state fetched from database on each request.
    """
    try:
        # Step 1: Fetch conversation history from DB
        messages, conversation = fetch_conversation_history(
            session, user_id, request.conversation_id
        )

        # Step 2: Call Cohere API with history
        ai_response = await call_cohere_api(
            messages=messages,
            new_message=request.message,
            user_email=current_user["email"]
        )

        # Step 3: Execute tool calls
        tool_results = []
        if ai_response.get("tool_calls"):
            for tool_call in ai_response["tool_calls"]:
                result = execute_tool(
                    session,
                    tool_call["name"],
                    tool_call["parameters"]
                )
                tool_results.append(result)

        # Step 4: Store messages in DB
        user_msg, assistant_msg = store_messages(
            session,
            conversation.id,
            request.message,
            ai_response["message"],
            tool_results
        )

        # Step 5: Return response
        return ChatResponse(
            message=ai_response["message"],
            tool_calls=tool_results,
            conversation_id=str(conversation.id),
            message_id=str(assistant_msg.id)
        )

    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")
```

## Data Flow Diagram

```
User Types Message
       ↓
Frontend: Optimistic Update (add user message to UI)
       ↓
Frontend: Call sendChatMessage(message, conversationId)
       ↓
Frontend: Include Authorization: Bearer <token>
       ↓
Backend: Verify JWT token
       ↓
Backend: Extract user_id from token
       ↓
Backend: Validate user_id matches path parameter
       ↓
Backend: Fetch conversation history from DB
       ↓
Backend: Format messages for Cohere API
       ↓
Backend: Call Cohere API with tools
       ↓
Backend: Parse Cohere response (text + tool_calls)
       ↓
Backend: Execute tool calls (add_task, list_tasks, etc.)
       ↓
Backend: Store user message in DB
       ↓
Backend: Store assistant message in DB
       ↓
Backend: Return response to frontend
       ↓
Frontend: Update UI with assistant message
       ↓
Frontend: Display tool results (task lists, confirmations)
```

## State Management

### Frontend State

**Conversation State**
```typescript
interface ConversationState {
  conversationId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// Persist conversation ID in session storage
useEffect(() => {
  if (conversationId) {
    sessionStorage.setItem('current_conversation_id', conversationId);
  }
}, [conversationId]);

// Restore on mount
useEffect(() => {
  const savedId = sessionStorage.getItem('current_conversation_id');
  if (savedId) {
    setConversationId(savedId);
    // Optionally: fetch conversation history
  }
}, []);
```

### Backend State

**Stateless Design**
- No conversation state in memory
- All state fetched from database on each request
- Tool execution is stateless (fetch → execute → store)
- Server can restart without losing conversations

## Task Synchronization (Critical)

### Real-Time UI Updates After Chat Operations

After successful tool execution (complete_task, add_task, delete_task, update_task):
- The task's status/data must be updated in the Neon DB
- The frontend main /tasks page must automatically refetch or invalidate the tasks query to show the updated status (e.g., from Active to Completed)
- Use TanStack Query invalidateQueries(['tasks']) or equivalent to sync the UI
- No manual refresh required — sync happens in real-time after chat operation

### Implementation

**Frontend: Invalidate Tasks Query After Chat Response**
```typescript
// In ChatModal or chat handler
async function handleSendMessage(message: string) {
  setIsLoading(true);

  try {
    const response = await sendChatMessage(message, conversationId);

    // Add assistant message to UI
    setMessages(prev => [...prev, response]);

    // CRITICAL: Invalidate tasks query if any task tool was called
    const taskTools = ['add_task', 'complete_task', 'delete_task', 'update_task'];
    const hasTaskOperation = response.tool_calls?.some(tc =>
      taskTools.includes(tc.function)
    );

    if (hasTaskOperation) {
      // Invalidate React Query cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      console.log('[Chat] Tasks cache invalidated - main page will auto-update');
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}
```

**Alternative: Use Custom Hook**
```typescript
// hooks/useChatWithSync.ts
export function useChatWithSync() {
  const queryClient = useQueryClient();

  const sendMessageWithSync = async (message: string, conversationId?: string) => {
    const response = await sendChatMessage(message, conversationId);

    // Auto-sync tasks after any task operation
    const taskTools = ['add_task', 'complete_task', 'delete_task', 'update_task'];
    if (response.tool_calls?.some(tc => taskTools.includes(tc.function))) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }

    return response;
  };

  return { sendMessageWithSync };
}
```

**Verification**
- User adds task via chat → Task appears on /tasks page immediately
- User completes task via chat → Task status changes from Active to Completed on /tasks page
- User deletes task via chat → Task disappears from /tasks page
- No manual page refresh required

## CORS Configuration

### Backend CORS Setup

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"]
)
```

## Security Considerations

### Frontend Security

**1. Token Storage**
- JWT token stored in httpOnly cookie (Better Auth handles this)
- Never store token in localStorage
- Token automatically included in requests

**2. Input Validation**
- Validate message length (1-2000 characters)
- Sanitize user input before display
- Prevent XSS attacks

**3. Error Handling**
- Don't expose sensitive error details
- Log errors client-side for debugging
- Show user-friendly error messages

### Backend Security

**1. Authentication**
- Validate JWT on every request
- Verify user_id matches token
- Return 401 for invalid tokens, 403 for mismatches

**2. Authorization**
- All tool calls enforce user_id filtering
- No cross-user data access
- Conversation history isolated per user

**3. Input Validation**
- Validate all request parameters
- Sanitize inputs before database operations
- Use Pydantic models for validation

**4. Rate Limiting**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/{user_id}/chat")
@limiter.limit("10/minute")
async def chat_endpoint(...):
    ...
```

## Performance Optimization

### Frontend Optimization

**1. Debouncing (Future)**
```typescript
const debouncedSend = useMemo(
  () => debounce(sendMessage, 300),
  []
);
```

**2. Lazy Loading**
```typescript
// Load conversation history on demand
async function loadConversationHistory(conversationId: string) {
  const response = await fetch(`/api/${userId}/conversations/${conversationId}`);
  const data = await response.json();
  setMessages(data.messages);
}
```

**3. Optimistic Updates**
- Add user message immediately
- Show loading indicator
- Update with server response
- Rollback on error

### Backend Optimization

**1. Database Query Optimization**
```python
# Use indexes for fast queries
query = select(Message).where(
    Message.conversation_id == conversation_id
).order_by(Message.created_at.asc())

# Limit conversation history
query = query.limit(100)
```

**2. Cohere API Caching**
```python
# Cache tool definitions
_COHERE_TOOLS_CACHE = None

def get_cohere_tools():
    global _COHERE_TOOLS_CACHE
    if _COHERE_TOOLS_CACHE is None:
        _COHERE_TOOLS_CACHE = [...]
    return _COHERE_TOOLS_CACHE
```

**3. Connection Pooling**
```python
# SQLModel engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True
)
```

## Testing Strategy

### Frontend Tests

**Unit Tests**
```typescript
describe('sendChatMessage', () => {
  it('should send message with auth token', async () => {
    const response = await sendChatMessage('Hello', null);
    expect(response.message).toBeDefined();
    expect(response.conversation_id).toBeDefined();
  });

  it('should throw error on 401', async () => {
    await expect(sendChatMessage('Hello', null)).rejects.toThrow('Authentication required');
  });
});
```

**Integration Tests**
```typescript
describe('Chat Flow', () => {
  it('should complete full chat cycle', async () => {
    render(<ChatPage />);

    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Add a task' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Added/)).toBeInTheDocument();
    });
  });
});
```

### Backend Tests

**Unit Tests**
```python
def test_verify_auth_valid_token():
    token = create_jwt_token(user_id="123", email="test@example.com")
    result = verify_auth("123", f"Bearer {token}")
    assert result["user_id"] == "123"

def test_verify_auth_user_mismatch():
    token = create_jwt_token(user_id="123", email="test@example.com")
    with pytest.raises(HTTPException) as exc:
        verify_auth("456", f"Bearer {token}")
    assert exc.value.status_code == 403
```

**Integration Tests**
```python
def test_chat_endpoint_full_flow(client, db_session):
    # Create user and get token
    user = create_test_user(db_session)
    token = create_jwt_token(user.id, user.email)

    # Send chat message
    response = client.post(
        f"/api/{user.id}/chat",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "Add a task to buy milk"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "buy milk" in data["message"].lower()
    assert len(data["tool_calls"]) > 0
```

## Deployment Considerations

### Frontend Deployment (Vercel)

**Environment Variables**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://api.yourdomain.com
```

**Build Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Backend Deployment (Railway/Render)

**Environment Variables**
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
COHERE_API_KEY=...
ALLOWED_ORIGINS=https://yourdomain.com
```

**Health Check Endpoint**
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## Monitoring and Logging

### Frontend Logging

```typescript
// Log API calls
console.log('[API] Sending chat message', {
  messageLength: message.length,
  conversationId,
  timestamp: new Date().toISOString()
});

// Log errors
console.error('[API] Chat error', {
  error: error.message,
  statusCode: error.statusCode,
  timestamp: new Date().toISOString()
});
```

### Backend Logging

```python
import logging

logger = logging.getLogger(__name__)

# Log requests
logger.info(f"Chat request: user_id={user_id}, message_length={len(message)}")

# Log tool executions
logger.info(f"Tool executed: {tool_name}, user_id={user_id}, success={success}")

# Log errors
logger.error(f"Chat error: {error}", exc_info=True)
```

## Related Specifications
- `@specs/features/chatbot.md` - Chatbot feature requirements
- `@specs/api/rest-endpoints.md` - Chat API endpoint
- `@specs/integration/ai-cohere.md` - Cohere API integration
- `@specs/ui/chat-interface.md` - Chat UI components
- `@specs/features/authentication.md` - Better Auth integration
