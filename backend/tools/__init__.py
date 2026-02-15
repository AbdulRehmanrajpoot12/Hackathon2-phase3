"""
MCP-style tools for task management operations.
All tools follow the pattern: fetch state from DB → execute operation → store result back to DB
"""

__all__ = [
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task",
    "get_cohere_tools"
]
