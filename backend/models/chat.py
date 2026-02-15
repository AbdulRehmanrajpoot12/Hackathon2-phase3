"""
Pydantic models for chat API requests and responses.
"""
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str
    conversation_id: Optional[str] = None


class ToolCallResult(BaseModel):
    """Model for tool call results"""
    name: str
    parameters: dict
    result: dict


class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    message: str
    tool_calls: List[ToolCallResult]
    conversation_id: str
    message_id: str
