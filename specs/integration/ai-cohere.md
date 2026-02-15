# Cohere API Integration Specification

## Overview
This specification defines how to integrate Cohere's chat API with tool calling support into the FastAPI backend to power the AI chatbot assistant. Cohere replaces OpenAI Agents SDK while maintaining similar tool calling patterns.

## Cohere API Basics

### API Endpoint
```
POST https://api.cohere.ai/v1/chat
```

### Authentication
```python
import cohere

co = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))
```

### Environment Variable
```bash
COHERE_API_KEY=REMOVED_COHERE_KEY
```

## Cohere Chat with Tool Calling

### Basic Request Structure

```python
import cohere
import os

co = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))

response = co.chat(
    message="Add a task to buy groceries",
    chat_history=[
        {"role": "USER", "message": "Hello"},
        {"role": "CHATBOT", "message": "Hi! How can I help you with your tasks?"}
    ],
    tools=[
        {
            "name": "add_task",
            "description": "Create a new task for the user",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "title": {
                    "description": "Task title (1-255 characters)",
                    "type": "string",
                    "required": True
                }
            }
        }
    ],
    preamble="You are a helpful task management assistant. Always include the user's email in your responses."
)
```

### Response Structure

```python
{
    "text": "Added 'buy groceries' to your tasks for abdul@example.com!",
    "tool_calls": [
        {
            "name": "add_task",
            "parameters": {
                "user_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "buy groceries"
            }
        }
    ],
    "chat_history": [...],
    "generation_id": "abc123..."
}
```

## Tool Definition Format

### Cohere Tool Schema

All 5 MCP-style tools must be defined in Cohere's format:

```python
def get_cohere_tools():
    """
    Return all 5 MCP-style tools in Cohere format.
    """
    return [
        {
            "name": "add_task",
            "description": "Create a new task for the user",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "title": {
                    "description": "Task title (1-255 characters)",
                    "type": "string",
                    "required": True
                },
                "description": {
                    "description": "Optional task description (max 1000 characters)",
                    "type": "string",
                    "required": False
                }
            }
        },
        {
            "name": "list_tasks",
            "description": "List all tasks for the user with optional status filter",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "status": {
                    "description": "Filter by status: 'all', 'completed', or 'incomplete'",
                    "type": "string",
                    "required": False
                }
            }
        },
        {
            "name": "complete_task",
            "description": "Mark a task as completed",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "task_id": {
                    "description": "UUID of the task to complete",
                    "type": "string",
                    "required": True
                }
            }
        },
        {
            "name": "delete_task",
            "description": "Permanently delete a task",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "task_id": {
                    "description": "UUID of the task to delete",
                    "type": "string",
                    "required": True
                }
            }
        },
        {
            "name": "update_task",
            "description": "Update task title and/or description",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "task_id": {
                    "description": "UUID of the task to update",
                    "type": "string",
                    "required": True
                },
                "title": {
                    "description": "New task title (1-255 characters)",
                    "type": "string",
                    "required": False
                },
                "description": {
                    "description": "New task description (max 1000 characters)",
                    "type": "string",
                    "required": False
                }
            }
        }
    ]
```

## Message History Format

### Converting Database Messages to Cohere Format

```python
def format_messages_for_cohere(messages: list[Message]) -> list[dict]:
    """
    Convert database messages to Cohere chat_history format.

    Cohere uses:
    - "USER" for user messages
    - "CHATBOT" for assistant messages
    """
    chat_history = []

    for msg in messages:
        if msg.role == "user":
            chat_history.append({
                "role": "USER",
                "message": msg.content
            })
        elif msg.role == "assistant":
            chat_history.append({
                "role": "CHATBOT",
                "message": msg.content
            })

    return chat_history
```

### Example Conversion

**Database Messages:**
```python
[
    Message(role="user", content="Hello"),
    Message(role="assistant", content="Hi! How can I help?"),
    Message(role="user", content="Add a task to buy milk")
]
```

**Cohere Format:**
```python
[
    {"role": "USER", "message": "Hello"},
    {"role": "CHATBOT", "message": "Hi! How can I help?"},
    {"role": "USER", "message": "Add a task to buy milk"}
]
```

## Complete Integration Flow

### Step-by-Step Implementation

```python
import cohere
import os
from sqlmodel import Session, select
from models import Conversation, Message, Task
from datetime import datetime
from uuid import uuid4

# Initialize Cohere client
co = cohere.Client(api_key=os.getenv("COHERE_API_KEY"))

async def process_chat_message(
    session: Session,
    user_id: str,
    user_email: str,
    message: str,
    conversation_id: str = None
):
    """
    Complete chat processing flow with Cohere API.
    """

    # Step 1: Get or create conversation
    if conversation_id:
        conversation = session.exec(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        ).first()
        if not conversation:
            raise ValueError("Conversation not found")
    else:
        conversation = Conversation(
            id=uuid4(),
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    # Step 2: Fetch conversation history
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    ).all()

    # Step 3: Format history for Cohere
    chat_history = format_messages_for_cohere(messages)

    # Step 4: Call Cohere API
    try:
        response = co.chat(
            message=f"User: {user_email}\nMessage: {message}",
            chat_history=chat_history,
            tools=get_cohere_tools(),
            preamble="You are a helpful task management assistant. Always include the user's email in your responses for personalization.",
            temperature=0.7,
            max_tokens=500
        )
    except Exception as e:
        raise Exception(f"Cohere API error: {str(e)}")

    # Step 5: Execute tool calls
    tool_results = []
    if response.tool_calls:
        for tool_call in response.tool_calls:
            tool_name = tool_call.name
            tool_params = tool_call.parameters

            # Execute the tool
            result = execute_tool(session, tool_name, tool_params)
            tool_results.append({
                "name": tool_name,
                "parameters": tool_params,
                "result": result
            })

    # Step 6: Store messages
    user_message = Message(
        id=uuid4(),
        conversation_id=conversation.id,
        role="user",
        content=message,
        created_at=datetime.utcnow()
    )
    session.add(user_message)

    assistant_message = Message(
        id=uuid4(),
        conversation_id=conversation.id,
        role="assistant",
        content=response.text,
        tool_calls=json.dumps(tool_results) if tool_results else None,
        created_at=datetime.utcnow()
    )
    session.add(assistant_message)

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    session.add(conversation)

    session.commit()
    session.refresh(assistant_message)

    # Step 7: Return response
    return {
        "message": response.text,
        "tool_calls": tool_results,
        "conversation_id": str(conversation.id),
        "message_id": str(assistant_message.id)
    }
```

## Tool Execution

### Tool Dispatcher

```python
def execute_tool(session: Session, tool_name: str, parameters: dict):
    """
    Execute the appropriate MCP-style tool based on name.
    """
    if tool_name == "add_task":
        return add_task(
            session,
            parameters["user_id"],
            parameters["title"],
            parameters.get("description")
        )
    elif tool_name == "list_tasks":
        return list_tasks(
            session,
            parameters["user_id"],
            parameters.get("status", "all")
        )
    elif tool_name == "complete_task":
        return complete_task(
            session,
            parameters["user_id"],
            parameters["task_id"]
        )
    elif tool_name == "delete_task":
        return delete_task(
            session,
            parameters["user_id"],
            parameters["task_id"]
        )
    elif tool_name == "update_task":
        return update_task(
            session,
            parameters["user_id"],
            parameters["task_id"],
            parameters.get("title"),
            parameters.get("description")
        )
    else:
        raise ValueError(f"Unknown tool: {tool_name}")
```

## Error Handling

### Cohere API Errors

```python
from cohere.error import CohereAPIError, CohereConnectionError

try:
    response = co.chat(...)
except CohereAPIError as e:
    # API returned an error (4xx, 5xx)
    logger.error(f"Cohere API error: {e.message}")
    raise HTTPException(
        status_code=503,
        detail="AI service temporarily unavailable"
    )
except CohereConnectionError as e:
    # Network/connection error
    logger.error(f"Cohere connection error: {e}")
    raise HTTPException(
        status_code=503,
        detail="Failed to connect to AI service"
    )
except Exception as e:
    # Unexpected error
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(
        status_code=500,
        detail="Failed to process chat message"
    )
```

### Timeout Configuration

```python
import cohere

co = cohere.Client(
    api_key=os.getenv("COHERE_API_KEY"),
    timeout=10  # 10 second timeout
)
```

### Retry Logic

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def call_cohere_with_retry(co, message, chat_history, tools, preamble):
    """
    Call Cohere API with exponential backoff retry.
    """
    return co.chat(
        message=message,
        chat_history=chat_history,
        tools=tools,
        preamble=preamble
    )
```

## Preamble Configuration

### System Instructions

```python
CHATBOT_PREAMBLE = """You are a helpful task management assistant for a todo application.

Your capabilities:
- Add new tasks for users
- List tasks (all, completed, or incomplete)
- Mark tasks as completed
- Delete tasks
- Update task details

Important guidelines:
- Always include the user's email in your responses for personalization
- Be friendly and conversational
- Confirm actions clearly (e.g., "Added 'buy groceries' to your tasks for user@example.com!")
- If a request is ambiguous, ask clarifying questions
- Keep responses concise and helpful

When listing tasks, format them clearly with numbers or bullets.
"""
```

### Usage

```python
response = co.chat(
    message=message,
    chat_history=chat_history,
    tools=get_cohere_tools(),
    preamble=CHATBOT_PREAMBLE,
    temperature=0.7
)
```

## Performance Optimization

### Caching Tool Definitions

```python
# Cache tool definitions to avoid recreating on every request
_COHERE_TOOLS_CACHE = None

def get_cohere_tools():
    global _COHERE_TOOLS_CACHE
    if _COHERE_TOOLS_CACHE is None:
        _COHERE_TOOLS_CACHE = [
            # ... tool definitions
        ]
    return _COHERE_TOOLS_CACHE
```

### Conversation History Pagination

```python
def get_recent_messages(session: Session, conversation_id: str, limit: int = 50):
    """
    Get recent messages to avoid sending too much history to Cohere.
    """
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    ).all()

    # Reverse to get chronological order
    return list(reversed(messages))
```

## Testing

### Unit Tests

```python
def test_format_messages_for_cohere():
    messages = [
        Message(role="user", content="Hello"),
        Message(role="assistant", content="Hi!")
    ]

    result = format_messages_for_cohere(messages)

    assert result == [
        {"role": "USER", "message": "Hello"},
        {"role": "CHATBOT", "message": "Hi!"}
    ]

def test_execute_tool_add_task():
    result = execute_tool(session, "add_task", {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Test task"
    })

    assert result["status"] == "success"
    assert result["task"]["title"] == "Test task"
```

### Integration Tests

```python
def test_cohere_integration():
    """
    Test complete flow with Cohere API (requires API key).
    """
    response = process_chat_message(
        session=session,
        user_id="550e8400-e29b-41d4-a716-446655440000",
        user_email="test@example.com",
        message="Add a task to buy milk"
    )

    assert "buy milk" in response["message"].lower()
    assert len(response["tool_calls"]) > 0
    assert response["tool_calls"][0]["name"] == "add_task"
```

## Security Considerations

### API Key Protection
- Store COHERE_API_KEY in environment variables
- Never commit API key to version control
- Use different keys for dev/staging/production
- Rotate keys periodically

### User Data Privacy
- User_id always from validated JWT token
- Never send sensitive user data to Cohere
- Log Cohere requests without PII
- Comply with data privacy regulations

### Rate Limiting
- Implement rate limiting per user
- Monitor Cohere API usage
- Set appropriate timeouts
- Handle quota exceeded errors gracefully

## Monitoring and Logging

### Logging Pattern

```python
import logging

logger = logging.getLogger(__name__)

# Log Cohere API calls
logger.info(f"Cohere API call: user_id={user_id}, message_length={len(message)}")

# Log tool executions
logger.info(f"Tool executed: {tool_name}, user_id={user_id}")

# Log errors
logger.error(f"Cohere API error: {error}", exc_info=True)
```

### Metrics to Track
- Cohere API response time
- Tool execution success rate
- Error rate by type
- Token usage per request
- User satisfaction (implicit from conversation length)

## Related Specifications
- `@specs/features/chatbot.md` - Chatbot feature requirements
- `@specs/api/mcp-tools.md` - MCP-style tool definitions
- `@specs/api/rest-endpoints.md` - Chat endpoint specification
- `@specs/database/schema.md` - Database models
