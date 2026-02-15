from sqlmodel import SQLModel, Field, Column
from sqlalchemy import Text, JSON
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class Message(SQLModel, table=True):
    """
    Message model for storing individual chat messages.
    Each message belongs to a conversation and has a role (user or assistant).
    """
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", index=True)
    role: str = Field(max_length=20)  # "user" or "assistant"
    content: str = Field(sa_column=Column(Text))
    tool_calls: Optional[str] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
