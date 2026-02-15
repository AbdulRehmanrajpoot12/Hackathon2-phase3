# MCP-Style Tools Specification

## Overview
This specification defines 5 MCP (Model Context Protocol) style tools that enable the AI chatbot to perform task management operations. All tools are stateless, enforce user_id isolation, and use SQLModel for database operations.

## Tool Design Principles

### Stateless Execution
Each tool follows the pattern: **Fetch state from DB → Execute operation → Store result back to DB**

- No in-memory state or caching
- Each invocation is independent
- Database is the single source of truth
- Tools can be called in any order

### User Isolation
Every tool MUST enforce user_id filtering to prevent cross-user data access:

```python
# ALWAYS filter by user_id
task = session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == user_id)
).first()

if not task:
    raise ValueError("Task not found or access denied")
```

### Error Handling
All tools must handle these error cases:
- **Task not found**: Return clear error when task doesn't exist or user lacks access
- **Invalid input**: Validate parameters before database operations
- **Database errors**: Catch and return user-friendly error messages

## Tool Definitions

---

## Tool 1: add_task

### Purpose
Create a new task for the authenticated user.

### Parameters

```json
{
  "type": "object",
  "required": ["user_id", "title"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the authenticated user"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "description": "Task title (required)"
    },
    "description": {
      "type": "string",
      "maxLength": 1000,
      "nullable": true,
      "description": "Optional task description"
    }
  }
}
```

### Returns

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "task": {
      "type": "object",
      "properties": {
        "id": {"type": "string", "format": "uuid"},
        "user_id": {"type": "string", "format": "uuid"},
        "title": {"type": "string"},
        "description": {"type": "string", "nullable": true},
        "completed": {"type": "boolean"},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"}
      }
    },
    "message": {
      "type": "string",
      "description": "Human-readable success message"
    }
  }
}
```

### Example Request

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

### Example Response (Success)

```json
{
  "status": "success",
  "task": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2026-02-10T10:30:00Z",
    "updated_at": "2026-02-10T10:30:00Z"
  },
  "message": "Task created successfully"
}
```

### Example Response (Error)

```json
{
  "status": "error",
  "error": "Title is required and must be between 1 and 255 characters"
}
```

### Implementation Notes

```python
from sqlmodel import Session, select
from models import Task
from datetime import datetime
from uuid import uuid4

def add_task(session: Session, user_id: str, title: str, description: str = None):
    """
    Create a new task for the user.
    Stateless: Creates task in DB and returns result.
    """
    # Validate input
    if not title or len(title) > 255:
        raise ValueError("Title is required and must be between 1 and 255 characters")

    if description and len(description) > 1000:
        raise ValueError("Description must be 1000 characters or less")

    # Create task
    new_task = Task(
        id=uuid4(),
        user_id=user_id,
        title=title.strip(),
        description=description.strip() if description else None,
        completed=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    session.add(new_task)
    session.commit()
    session.refresh(new_task)

    return {
        "status": "success",
        "task": new_task.dict(),
        "message": "Task created successfully"
    }
```

---

## Tool 2: list_tasks

### Purpose
Retrieve all tasks for the authenticated user with optional status filtering.

### Parameters

```json
{
  "type": "object",
  "required": ["user_id"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the authenticated user"
    },
    "status": {
      "type": "string",
      "enum": ["all", "completed", "incomplete"],
      "default": "all",
      "description": "Filter tasks by completion status"
    }
  }
}
```

### Returns

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "user_id": {"type": "string", "format": "uuid"},
          "title": {"type": "string"},
          "description": {"type": "string", "nullable": true},
          "completed": {"type": "boolean"},
          "created_at": {"type": "string", "format": "date-time"},
          "updated_at": {"type": "string", "format": "date-time"}
        }
      }
    },
    "count": {
      "type": "integer",
      "description": "Number of tasks returned"
    },
    "message": {
      "type": "string",
      "description": "Human-readable message"
    }
  }
}
```

### Example Request

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "incomplete"
}
```

### Example Response (Success)

```json
{
  "status": "success",
  "tasks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2026-02-10T10:30:00Z",
      "updated_at": "2026-02-10T10:30:00Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Finish report",
      "description": null,
      "completed": false,
      "created_at": "2026-02-09T15:20:00Z",
      "updated_at": "2026-02-09T15:20:00Z"
    }
  ],
  "count": 2,
  "message": "Retrieved 2 incomplete tasks"
}
```

### Implementation Notes

```python
def list_tasks(session: Session, user_id: str, status: str = "all"):
    """
    List all tasks for the user with optional status filter.
    Stateless: Fetches from DB and returns results.
    """
    # Build query with user_id filter
    query = select(Task).where(Task.user_id == user_id)

    # Apply status filter
    if status == "completed":
        query = query.where(Task.completed == True)
    elif status == "incomplete":
        query = query.where(Task.completed == False)
    # "all" means no additional filter

    # Order by created_at descending (newest first)
    query = query.order_by(Task.created_at.desc())

    # Execute query
    tasks = session.exec(query).all()

    return {
        "status": "success",
        "tasks": [task.dict() for task in tasks],
        "count": len(tasks),
        "message": f"Retrieved {len(tasks)} {status} tasks"
    }
```

---

## Tool 3: complete_task

### Purpose
Mark a specific task as completed.

### Parameters

```json
{
  "type": "object",
  "required": ["user_id", "task_id"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the authenticated user"
    },
    "task_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the task to complete"
    }
  }
}
```

### Returns

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "task": {
      "type": "object",
      "properties": {
        "id": {"type": "string", "format": "uuid"},
        "user_id": {"type": "string", "format": "uuid"},
        "title": {"type": "string"},
        "description": {"type": "string", "nullable": true},
        "completed": {"type": "boolean"},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"}
      }
    },
    "message": {
      "type": "string",
      "description": "Human-readable success message"
    }
  }
}
```

### Example Request

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Example Response (Success)

```json
{
  "status": "success",
  "task": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": true,
    "created_at": "2026-02-10T10:30:00Z",
    "updated_at": "2026-02-10T11:45:00Z"
  },
  "message": "Task marked as completed"
}
```

### Example Response (Error)

```json
{
  "status": "error",
  "error": "Task not found or access denied"
}
```

### Implementation Notes

```python
def complete_task(session: Session, user_id: str, task_id: str):
    """
    Mark a task as completed.
    Stateless: Fetches task, updates, stores back to DB.
    """
    # Fetch task with user_id filter (security)
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()

    if not task:
        raise ValueError("Task not found or access denied")

    # Update task
    task.completed = True
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return {
        "status": "success",
        "task": task.dict(),
        "message": "Task marked as completed"
    }
```

---

## Tool 4: delete_task

### Purpose
Permanently delete a task.

### Parameters

```json
{
  "type": "object",
  "required": ["user_id", "task_id"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the authenticated user"
    },
    "task_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the task to delete"
    }
  }
}
```

### Returns

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "task_id": {
      "type": "string",
      "format": "uuid",
      "description": "ID of the deleted task"
    },
    "message": {
      "type": "string",
      "description": "Human-readable success message"
    }
  }
}
```

### Example Request

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Example Response (Success)

```json
{
  "status": "success",
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Task deleted successfully"
}
```

### Example Response (Error)

```json
{
  "status": "error",
  "error": "Task not found or access denied"
}
```

### Implementation Notes

```python
def delete_task(session: Session, user_id: str, task_id: str):
    """
    Delete a task permanently.
    Stateless: Fetches task, deletes from DB.
    """
    # Fetch task with user_id filter (security)
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()

    if not task:
        raise ValueError("Task not found or access denied")

    # Delete task
    session.delete(task)
    session.commit()

    return {
        "status": "success",
        "task_id": str(task_id),
        "message": "Task deleted successfully"
    }
```

---

## Tool 5: update_task

### Purpose
Update task title and/or description.

### Parameters

```json
{
  "type": "object",
  "required": ["user_id", "task_id"],
  "properties": {
    "user_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the authenticated user"
    },
    "task_id": {
      "type": "string",
      "format": "uuid",
      "description": "UUID of the task to update"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "nullable": true,
      "description": "New task title (optional)"
    },
    "description": {
      "type": "string",
      "maxLength": 1000,
      "nullable": true,
      "description": "New task description (optional)"
    }
  }
}
```

### Returns

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["success", "error"]
    },
    "task": {
      "type": "object",
      "properties": {
        "id": {"type": "string", "format": "uuid"},
        "user_id": {"type": "string", "format": "uuid"},
        "title": {"type": "string"},
        "description": {"type": "string", "nullable": true},
        "completed": {"type": "boolean"},
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"}
      }
    },
    "message": {
      "type": "string",
      "description": "Human-readable success message"
    }
  }
}
```

### Example Request

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy milk and eggs",
  "description": "From the organic section"
}
```

### Example Response (Success)

```json
{
  "status": "success",
  "task": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy milk and eggs",
    "description": "From the organic section",
    "completed": false,
    "created_at": "2026-02-10T10:30:00Z",
    "updated_at": "2026-02-10T12:15:00Z"
  },
  "message": "Task updated successfully"
}
```

### Example Response (Error)

```json
{
  "status": "error",
  "error": "At least one field (title or description) must be provided"
}
```

### Implementation Notes

```python
def update_task(session: Session, user_id: str, task_id: str,
                title: str = None, description: str = None):
    """
    Update task title and/or description.
    Stateless: Fetches task, updates fields, stores back to DB.
    """
    # Validate at least one field provided
    if title is None and description is None:
        raise ValueError("At least one field (title or description) must be provided")

    # Fetch task with user_id filter (security)
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()

    if not task:
        raise ValueError("Task not found or access denied")

    # Update fields
    if title is not None:
        if not title or len(title) > 255:
            raise ValueError("Title must be between 1 and 255 characters")
        task.title = title.strip()

    if description is not None:
        if len(description) > 1000:
            raise ValueError("Description must be 1000 characters or less")
        task.description = description.strip() if description else None

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return {
        "status": "success",
        "task": task.dict(),
        "message": "Task updated successfully"
    }
```

---

## Tool Registration for Cohere

### Cohere Tool Schema Format

All 5 tools must be registered with Cohere in this format:

```python
tools = [
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

## Security Requirements

### User ID Isolation
**CRITICAL**: Every tool MUST enforce user_id filtering:

```python
# ALWAYS use this pattern
task = session.exec(
    select(Task).where(Task.id == task_id, Task.user_id == user_id)
).first()

if not task:
    raise ValueError("Task not found or access denied")
```

### Never Trust Client Input
- user_id comes from validated JWT token, not request body
- All parameters validated before database operations
- SQL injection prevented by SQLModel ORM
- No raw SQL queries

### Error Messages
- Don't expose internal details in error messages
- Return "Task not found or access denied" (not "Task not found" vs "Access denied")
- Log detailed errors server-side for debugging

## Testing Requirements

### Unit Tests for Each Tool
- Test happy path (successful execution)
- Test user_id isolation (can't access other user's tasks)
- Test invalid input (empty title, too long description)
- Test task not found
- Test database errors

### Integration Tests
- Test tool chaining (list then delete)
- Test concurrent tool calls
- Test with real database
- Test with Cohere API integration

## Related Specifications
- `@specs/features/chatbot.md` - Chatbot feature using these tools
- `@specs/integration/ai-cohere.md` - Cohere API integration
- `@specs/database/schema.md` - Task model definition
- `@specs/api/rest-endpoints.md` - Chat endpoint calling these tools
