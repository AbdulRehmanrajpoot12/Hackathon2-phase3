"""
Tool execution dispatcher for MCP-style tools.
Routes tool calls to appropriate tool functions.
"""
from sqlmodel import Session
from typing import Dict, Any
from tools.task_tools import add_task, list_tasks, complete_task, delete_task, update_task


def execute_tool(session: Session, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute the appropriate MCP-style tool based on name.

    Args:
        session: Database session
        tool_name: Name of the tool to execute
        parameters: Tool parameters

    Returns:
        Tool execution result

    Raises:
        ValueError: If tool name is unknown
    """
    print(f"[EXECUTOR] Tool: {tool_name}, Params: {parameters}")

    try:
        if tool_name == "add_task":
            result = add_task(
                session=session,
                user_id=parameters["user_id"],
                title=parameters["title"],
                description=parameters.get("description")
            )
        elif tool_name == "list_tasks":
            result = list_tasks(
                session=session,
                user_id=parameters["user_id"],
                status=parameters.get("status", "all")
            )
        elif tool_name == "complete_task":
            result = complete_task(
                session=session,
                user_id=parameters["user_id"],
                task_id=parameters.get("task_id"),
                title=parameters.get("title")
            )
        elif tool_name == "delete_task":
            result = delete_task(
                session=session,
                user_id=parameters["user_id"],
                task_id=parameters.get("task_id"),
                title=parameters.get("title")
            )
        elif tool_name == "update_task":
            result = update_task(
                session=session,
                user_id=parameters["user_id"],
                task_id=parameters.get("task_id"),
                old_title=parameters.get("old_title"),
                title=parameters.get("title"),
                description=parameters.get("description")
            )
        else:
            raise ValueError(f"Unknown tool: {tool_name}")

        print(f"[EXECUTOR] Result: {result}")
        return result

    except ValueError as e:
        error_result = {"status": "error", "error": str(e)}
        print(f"[EXECUTOR] ValueError: {error_result}")
        return error_result
    except Exception as e:
        error_result = {"status": "error", "error": f"Tool execution failed: {str(e)}"}
        print(f"[EXECUTOR] Exception: {error_result}")
        return error_result
