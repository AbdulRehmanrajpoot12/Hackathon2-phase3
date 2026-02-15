from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from db import get_session
from models import Task
from schemas.task import TaskCreate, TaskUpdate, TaskResponse
from dependencies.auth import get_current_user, verify_user_access

router = APIRouter(prefix="/api", tags=["tasks"])

@router.get("/{user_id}/tasks", response_model=List[TaskResponse])
async def list_tasks(
    user_id: str,
    status_filter: str = Query("all", alias="status"),
    sort: str = Query("created_at"),
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all tasks for the authenticated user with optional filtering and sorting

    Args:
        user_id: User ID from path (must match authenticated user)
        status_filter: Filter by status (all/pending/completed)
        sort: Sort order (created_at/title)
        current_user: Authenticated user ID from JWT
        session: Database session

    Returns:
        List of tasks belonging to the authenticated user
    """
    import logging
    import time
    logger = logging.getLogger(__name__)

    start_time = time.time()
    logger.info(f"[TASKS] Fetching tasks for user {current_user} - start (filter={status_filter}, sort={sort})")

    verify_user_access(user_id, current_user)

    # Optimized query with indexed columns (user_id, created_at)
    query = select(Task).where(Task.user_id == current_user)

    # Apply status filter
    if status_filter == "completed":
        query = query.where(Task.completed == True)
    elif status_filter == "pending":
        query = query.where(Task.completed == False)

    # Apply sorting (use indexed column for better performance)
    if sort == "title":
        query = query.order_by(Task.title)
    elif sort == "created_at":
        query = query.order_by(Task.created_at.desc())

    try:
        tasks = session.exec(query).all()
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"[TASKS] Fetched {len(tasks)} tasks for user {current_user} in {elapsed:.2f}ms")
        return tasks
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        logger.error(f"[TASKS] Failed to fetch tasks for user {current_user} after {elapsed:.2f}ms: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")

@router.post("/{user_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    user_id: str,
    task_data: TaskCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new task for the authenticated user

    Args:
        user_id: User ID from path (must match authenticated user)
        task_data: Task creation data (title, description)
        current_user: Authenticated user ID from JWT
        session: Database session

    Returns:
        Created task with all fields
    """
    verify_user_access(user_id, current_user)

    task = Task(
        user_id=current_user,
        title=task_data.title,
        description=task_data.description
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.get("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    user_id: str,
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get a specific task by ID

    Args:
        user_id: User ID from path (must match authenticated user)
        task_id: Task ID to retrieve
        current_user: Authenticated user ID from JWT
        session: Database session

    Returns:
        Task details

    Raises:
        HTTPException(404): Task not found or doesn't belong to user
    """
    verify_user_access(user_id, current_user)

    task = session.get(Task, task_id)
    if not task or task.user_id != current_user:
        raise HTTPException(status_code=404, detail="Task not found")

    return task

@router.put("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: TaskUpdate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update an existing task

    Args:
        user_id: User ID from path (must match authenticated user)
        task_id: Task ID to update
        task_data: Task update data (title, description, completed)
        current_user: Authenticated user ID from JWT
        session: Database session

    Returns:
        Updated task

    Raises:
        HTTPException(404): Task not found or doesn't belong to user
    """
    verify_user_access(user_id, current_user)

    task = session.get(Task, task_id)
    if not task or task.user_id != current_user:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update only provided fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed

    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.delete("/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    user_id: str,
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a task

    Args:
        user_id: User ID from path (must match authenticated user)
        task_id: Task ID to delete
        current_user: Authenticated user ID from JWT
        session: Database session

    Raises:
        HTTPException(404): Task not found or doesn't belong to user
    """
    verify_user_access(user_id, current_user)

    task = session.get(Task, task_id)
    if not task or task.user_id != current_user:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()

@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskResponse)
async def toggle_complete(
    user_id: str,
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Toggle the completion status of a task

    Args:
        user_id: User ID from path (must match authenticated user)
        task_id: Task ID to toggle
        current_user: Authenticated user ID from JWT
        session: Database session

    Returns:
        Updated task with toggled completion status

    Raises:
        HTTPException(404): Task not found or doesn't belong to user
    """
    verify_user_access(user_id, current_user)

    task = session.get(Task, task_id)
    if not task or task.user_id != current_user:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
