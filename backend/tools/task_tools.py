"""
MCP-style tools for task management operations.
Each tool is stateless and enforces user_id isolation.
"""
from sqlmodel import Session, select
from datetime import datetime
from uuid import uuid4
from typing import Optional


def add_task(session: Session, user_id: str, title: str, description: str = None) -> dict:
    """
    Create a new task for the user.
    Stateless: Creates task in DB and returns result.

    Args:
        session: Database session
        user_id: UUID of the authenticated user
        title: Task title (1-255 characters)
        description: Optional task description (max 1000 characters)

    Returns:
        dict with status, task data, and message
    """
    # Import Task model
    from models.task import Task

    print(f"[TOOL] add_task called - user_id={user_id}, title={repr(title)}, description={repr(description)}")

    try:
        # Clean and normalize input with UTF-8 encoding
        # This handles emojis, special characters, and prevents charmap errors
        if title:
            title = title.strip()
            # Force UTF-8 encoding to handle any Unicode characters
            title = title.encode('utf-8', errors='ignore').decode('utf-8')

        if description:
            description = description.strip()
            # Force UTF-8 encoding for description
            description = description.encode('utf-8', errors='ignore').decode('utf-8')

        # Validate input
        if not title or len(title) == 0:
            error_msg = "Title is required"
            print(f"[TOOL] ERROR: {error_msg}")
            return {"status": "error", "error": error_msg}

        if len(title) > 255:
            error_msg = "Title must be 255 characters or less"
            print(f"[TOOL] ERROR: {error_msg}")
            return {"status": "error", "error": error_msg}

        if description and len(description) > 1000:
            error_msg = "Description must be 1000 characters or less"
            print(f"[TOOL] ERROR: {error_msg}")
            return {"status": "error", "error": error_msg}

        print(f"[TOOL] Cleaned title: {repr(title)}")

        # Check for duplicate title (case-insensitive)
        title_normalized = title.lower()
        existing_task = session.exec(
            select(Task).where(
                Task.user_id == user_id,
                Task.title.ilike(title_normalized)
            )
        ).first()

        if existing_task:
            print(f"[TOOL] Duplicate task found: ID {existing_task.id}")
            return {
                "status": "warning",
                "message": f"⚠️ Task with title '{title}' already exists (ID: {existing_task.id}). Do you want to update it instead?",
                "existing_task_id": str(existing_task.id),
                "existing_task": {
                    "id": str(existing_task.id),
                    "title": existing_task.title,
                    "description": existing_task.description,
                    "completed": existing_task.completed
                }
            }

        # Create task with user_id isolation
        new_task = Task(
            id=None,
            user_id=user_id,
            title=title,
            description=description if description else None,
            completed=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        print(f"[TOOL] Adding task to session: title='{title}'")
        session.add(new_task)
        session.commit()
        session.refresh(new_task)

        print(f"[TOOL] SUCCESS: Created task ID: {new_task.id} for user: {user_id}")

        return {
            "status": "success",
            "task": {
                "id": str(new_task.id),
                "user_id": str(new_task.user_id),
                "title": new_task.title,
                "description": new_task.description,
                "completed": new_task.completed,
                "created_at": new_task.created_at.isoformat(),
                "updated_at": new_task.updated_at.isoformat()
            },
            "message": f"✅ Created Task ID: {new_task.id} - {new_task.title}"
        }

    except Exception as e:
        # Rollback on any error
        session.rollback()
        error_msg = f"Failed to add task: {str(e)}"
        print(f"[TOOL] EXCEPTION in add_task: {repr(e)}")
        print(f"[TOOL] Error type: {type(e).__name__}")
        return {
            "status": "error",
            "error": error_msg,
            "details": repr(e)
        }


def list_tasks(session: Session, user_id: str, status: str = "all") -> dict:
    """
    List all tasks for the user with optional status filter.
    Stateless: Fetches from DB and returns results.

    Args:
        session: Database session
        user_id: UUID of the authenticated user
        status: Filter by status: 'all', 'completed', or 'incomplete'

    Returns:
        dict with status, tasks array, count, and message
    """
    from models.task import Task

    # Build query with user_id filter (CRITICAL for security)
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
        "tasks": [
            {
                "id": str(task.id),
                "user_id": str(task.user_id),
                "title": task.title,
                "description": task.description,
                "completed": task.completed,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }
            for task in tasks
        ],
        "count": len(tasks),
        "message": f"Retrieved {len(tasks)} {status} tasks"
    }


def complete_task(session: Session, user_id: str, task_id: str = None, title: str = None) -> dict:
    """
    Mark a task as completed by ID or title.
    Stateless: Fetches task, updates, stores back to DB.

    Args:
        session: Database session
        user_id: UUID of the authenticated user
        task_id: ID of the task to complete (optional if title provided)
        title: Title of the task to complete (optional if task_id provided)

    Returns:
        dict with status, task data, and message

    Raises:
        ValueError: If task not found or access denied
    """
    from models.task import Task

    print(f"[TOOL] complete_task called - task_id={task_id}, title={title}, user_id={user_id}")

    # Must provide either task_id or title
    if not task_id and not title:
        error_msg = "Must provide either task_id or title"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    # Try to find by ID first
    if task_id:
        print(f"[TOOL] Searching by task_id: {task_id}")
        try:
            task = session.exec(
                select(Task).where(Task.id == int(task_id), Task.user_id == user_id)
            ).first()
            if task:
                print(f"[TOOL] Found task by ID: {task.id} - '{task.title}' (completed={task.completed})")
        except ValueError as e:
            print(f"[TOOL] ValueError converting task_id: {e}")
            task = None
    else:
        task = None

    # If not found by ID or no ID provided, try by title
    if not task and title:
        print(f"[TOOL] Searching by title: {title}")
        # Case-insensitive partial match
        tasks = session.exec(
            select(Task).where(
                Task.user_id == user_id,
                Task.title.ilike(f"%{title}%")
            )
        ).all()

        if len(tasks) == 1:
            task = tasks[0]
            print(f"[TOOL] Found single match by title: Task ID {task.id} - {task.title}")
        elif len(tasks) > 1:
            print(f"[TOOL] Multiple matches found: {len(tasks)}")
            # Multiple matches - return list for user to choose
            return {
                "status": "multiple_matches",
                "message": f"Found {len(tasks)} tasks matching '{title}':",
                "tasks": [
                    {
                        "id": str(t.id),
                        "title": t.title,
                        "completed": t.completed
                    } for t in tasks
                ]
            }
        else:
            print(f"[TOOL] No task found with title: {title}")

    if not task:
        error_msg = f"Task not found for this user"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    print(f"[TOOL] BEFORE UPDATE: Task #{task.id} - title='{task.title}', completed={task.completed}")

    # Update task
    task.completed = True
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    print(f"[TOOL] AFTER COMMIT: Task #{task.id} - title='{task.title}', completed={task.completed}")
    print(f"[TOOL] SUCCESS: complete_task completed for task #{task.id}")

    return {
        "status": "success",
        "task": {
            "id": str(task.id),
            "user_id": str(task.user_id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        },
        "message": f"✅ Marked '{task.title}' as done!"
    }


def delete_task(session: Session, user_id: str, task_id: str = None, title: str = None) -> dict:
    """
    Delete a task permanently by ID or title.
    Stateless: Fetches task, deletes from DB.

    Args:
        session: Database session
        user_id: UUID of the authenticated user
        task_id: ID of the task to delete (optional if title provided)
        title: Title of the task to delete (optional if task_id provided)

    Returns:
        dict with status, task_id, and message

    Raises:
        ValueError: If task not found or access denied
    """
    from models.task import Task

    print(f"[TOOL] delete_task called - task_id={task_id}, title={title}, user_id={user_id}")

    # Must provide either task_id or title
    if not task_id and not title:
        error_msg = "Must provide either task_id or title"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    # Try to find by ID first
    if task_id:
        print(f"[TOOL] Searching by task_id: {task_id}")
        try:
            task = session.exec(
                select(Task).where(Task.id == int(task_id), Task.user_id == user_id)
            ).first()
            if task:
                print(f"[TOOL] Found task by ID: {task.id} - '{task.title}' (completed={task.completed})")
        except ValueError as e:
            print(f"[TOOL] ValueError converting task_id: {e}")
            task = None
    else:
        task = None

    # If not found by ID or no ID provided, try by title
    if not task and title:
        print(f"[TOOL] Searching by title: {title}")
        # Case-insensitive partial match
        tasks = session.exec(
            select(Task).where(
                Task.user_id == user_id,
                Task.title.ilike(f"%{title}%")
            )
        ).all()

        if len(tasks) == 1:
            task = tasks[0]
            print(f"[TOOL] Found single match by title: Task ID {task.id} - {task.title}")
        elif len(tasks) > 1:
            print(f"[TOOL] Multiple matches found: {len(tasks)}")
            # Multiple matches - return list for user to choose
            return {
                "status": "multiple_matches",
                "message": f"Found {len(tasks)} tasks matching '{title}':",
                "tasks": [
                    {
                        "id": str(t.id),
                        "title": t.title,
                        "completed": t.completed
                    } for t in tasks
                ]
            }
        else:
            print(f"[TOOL] No task found with title: {title}")

    if not task:
        error_msg = f"Task not found for this user"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    # Store info before deleting
    task_title = task.title
    task_id_str = str(task.id)
    task_completed = task.completed

    print(f"[TOOL] BEFORE DELETE: Task #{task_id_str} - title='{task_title}', completed={task_completed}")

    # Delete task
    session.delete(task)
    session.commit()

    print(f"[TOOL] AFTER COMMIT: Task #{task_id_str} deleted from database")
    print(f"[TOOL] SUCCESS: delete_task completed for task #{task_id_str}")

    return {
        "status": "success",
        "task_id": task_id_str,
        "message": f"🗑️ Deleted '{task_title}'"
    }


def update_task(session: Session, user_id: str, task_id: str = None,
                old_title: str = None, title: str = None, description: str = None) -> dict:
    """
    Update task title and/or description by ID or old title.
    Stateless: Fetches task, updates fields, stores back to DB.

    Args:
        session: Database session
        user_id: UUID of the authenticated user
        task_id: ID of the task to update (optional if old_title provided)
        old_title: Current title to search for (optional if task_id provided)
        title: New task title (optional)
        description: New task description (optional)

    Returns:
        dict with status, task data, and message

    Raises:
        ValueError: If validation fails or task not found
    """
    from models.task import Task

    print(f"[TOOL] update_task called - task_id={task_id}, old_title={old_title}, title={title}, description={description}, user_id={user_id}")

    # Must provide either task_id or old_title
    if not task_id and not old_title:
        error_msg = "Must provide either task_id or old_title"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    # Validate at least one field to update
    if title is None and description is None:
        error_msg = "At least one field (title or description) must be provided"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    # Try to find by ID first
    if task_id:
        print(f"[TOOL] Searching by task_id: {task_id}")
        try:
            task = session.exec(
                select(Task).where(Task.id == int(task_id), Task.user_id == user_id)
            ).first()
            if task:
                print(f"[TOOL] Found task by ID: {task.id} - '{task.title}' (completed={task.completed})")
        except ValueError as e:
            print(f"[TOOL] ValueError converting task_id: {e}")
            task = None
    else:
        task = None

    # If not found by ID or no ID provided, try by old_title
    if not task and old_title:
        print(f"[TOOL] Searching by old_title: {old_title}")
        # Case-insensitive partial match
        tasks = session.exec(
            select(Task).where(
                Task.user_id == user_id,
                Task.title.ilike(f"%{old_title}%")
            )
        ).all()

        if len(tasks) == 1:
            task = tasks[0]
            print(f"[TOOL] Found single match by title: Task ID {task.id} - {task.title}")
        elif len(tasks) > 1:
            print(f"[TOOL] Multiple matches found: {len(tasks)}")
            # Multiple matches - return list for user to choose
            return {
                "status": "multiple_matches",
                "message": f"Found {len(tasks)} tasks matching '{old_title}':",
                "tasks": [
                    {
                        "id": str(t.id),
                        "title": t.title,
                        "completed": t.completed
                    } for t in tasks
                ]
            }
        else:
            print(f"[TOOL] No task found with title: {old_title}")

    if not task:
        error_msg = f"Task not found for this user"
        print(f"[TOOL] ERROR: {error_msg}")
        return {"status": "error", "error": error_msg}

    # Store old title for message
    old_task_title = task.title
    print(f"[TOOL] BEFORE UPDATE: Task #{task.id} - title='{task.title}', completed={task.completed}")

    # Update fields
    if title is not None:
        if not title or len(title) > 255:
            error_msg = "Title must be between 1 and 255 characters"
            print(f"[TOOL] ERROR: {error_msg}")
            return {"status": "error", "error": error_msg}
        task.title = title.strip()
        print(f"[TOOL] Updated title: '{old_task_title}' -> '{task.title}'")

    if description is not None:
        if len(description) > 1000:
            error_msg = "Description must be 1000 characters or less"
            print(f"[TOOL] ERROR: {error_msg}")
            return {"status": "error", "error": error_msg}
        task.description = description.strip() if description else None
        print(f"[TOOL] Updated description")

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    print(f"[TOOL] AFTER COMMIT: Task #{task.id} - title='{task.title}', completed={task.completed}")
    print(f"[TOOL] SUCCESS: update_task completed for task #{task.id}")

    return {
        "status": "success",
        "task": {
            "id": str(task.id),
            "user_id": str(task.user_id),
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat()
        },
        "message": f"✏️ Changed '{old_task_title}' to '{task.title}'" if title else "✏️ Updated task description"
    }


def get_cohere_tools():
    """
    Return all 5 MCP-style tools in Cohere format.
    """
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
            "description": "Mark a task as completed. Can use task_id OR title to find the task.",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "task_id": {
                    "description": "ID of the task to complete (optional if title provided)",
                    "type": "string",
                    "required": False
                },
                "title": {
                    "description": "Title or partial title of the task to complete (optional if task_id provided)",
                    "type": "string",
                    "required": False
                }
            }
        },
        {
            "name": "delete_task",
            "description": "Permanently delete a task. Can use task_id OR title to find the task.",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "task_id": {
                    "description": "ID of the task to delete (optional if title provided)",
                    "type": "string",
                    "required": False
                },
                "title": {
                    "description": "Title or partial title of the task to delete (optional if task_id provided)",
                    "type": "string",
                    "required": False
                }
            }
        },
        {
            "name": "update_task",
            "description": "Update task title and/or description. Can use task_id OR old_title to find the task.",
            "parameter_definitions": {
                "user_id": {
                    "description": "UUID of the authenticated user",
                    "type": "string",
                    "required": True
                },
                "task_id": {
                    "description": "ID of the task to update (optional if old_title provided)",
                    "type": "string",
                    "required": False
                },
                "old_title": {
                    "description": "Current title or partial title to search for (optional if task_id provided)",
                    "type": "string",
                    "required": False
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
    return tools
