"""
Chat router for AI chatbot endpoints.
Handles natural language task management through Cohere API.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import Dict, List
from uuid import uuid4
from datetime import datetime
import json
import logging
import logging

from models.chat import ChatRequest, ChatResponse, ToolCallResult
from models.conversation import Conversation
from models.message import Message
from dependencies.auth import get_current_user
from db import get_session
from services.cohere_client import co, CHATBOT_PREAMBLE, format_messages_for_cohere
from services.tool_executor import execute_tool
from tools.task_tools import get_cohere_tools

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    authorization: str = Header(None),
    session: Session = Depends(get_session)
):
    """
    Stateless chat endpoint for AI-powered task management.

    Flow:
    1. Get or create conversation
    2. Fetch conversation history from database
    3. Format history for Cohere API
    4. Call Cohere API with tools
    5. Execute tool calls
    6. Store user and assistant messages
    7. Return response

    Args:
        user_id: User ID from path (must match JWT token)
        request: Chat request with message and optional conversation_id
        authorization: JWT token in Authorization header
        session: Database session (dependency)

    Returns:
        ChatResponse with AI message, tool calls, and conversation ID
    """
    # Get user_id and email from JWT token
    from dependencies.auth import get_current_user_with_email
    token_user_id, user_email = await get_current_user_with_email(authorization)

    # Verify user_id matches authenticated user
    if token_user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied: user_id mismatch")

    try:
        # Step 1: Get or create conversation
        if request.conversation_id:
            # Fetch existing conversation
            conversation = session.exec(
                select(Conversation).where(
                    Conversation.id == request.conversation_id,
                    Conversation.user_id == user_id
                )
            ).first()

            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation
            conversation = Conversation(
                id=uuid4(),
                user_id=user_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(conversation)
            session.commit()
            session.refresh(conversation)

        # Step 2: Fetch conversation history (limit to 50 recent messages)
        messages = session.exec(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
            .limit(50)
        ).all()

        # Step 3: Format history for Cohere
        chat_history = format_messages_for_cohere(messages)

        # Step 4: Call Cohere API with tools
        # Use real user email from JWT token
        logger.info(f"[CHAT] Using real email from JWT: {user_email}")
        logger.info(f"[CHAT] Cohere request - Message: {request.message}")

        # Call Cohere with user message and tools
        cohere_response = co.chat(
            message=request.message,
            chat_history=chat_history,
            tools=get_cohere_tools(),
            preamble=CHATBOT_PREAMBLE,
            temperature=0.7,
            max_tokens=1000
        )

        logger.info(f"[CHAT] Cohere response - Text: {cohere_response.text[:200] if cohere_response.text else 'None'}")
        logger.info(f"[CHAT] Cohere response - Tool calls: {len(cohere_response.tool_calls) if cohere_response.tool_calls else 0}")

        # Step 5: Execute tool calls if any
        tool_results = []
        if cohere_response.tool_calls:
            logger.info(f"[CHAT] Executing {len(cohere_response.tool_calls)} tool calls for user {user_id}")

            for tool_call in cohere_response.tool_calls:
                tool_name = tool_call.name
                tool_params = tool_call.parameters.copy()

                logger.info(f"[CHAT] Tool: {tool_name}, Params: {tool_params}")

                # Add user_id to tool parameters for security isolation
                tool_params["user_id"] = user_id

                logger.info(f"[CHAT] Executing {tool_name} with user_id: {user_id}")

                # Execute the tool and capture result
                result = execute_tool(session, tool_name, tool_params)

                logger.info(f"[CHAT] Tool {tool_name} result: {result}")

                tool_results.append({
                    "call": {
                        "name": tool_name,
                        "parameters": tool_params
                    },
                    "outputs": [result]
                })

            # Multi-turn: Call Cohere again with tool results
            # Use force_single_step=True to allow sending message with tool_results
            logger.info(f"[CHAT] Calling Cohere with tool results for final response")
            logger.info(f"[CHAT] Tool results: {tool_results}")

            # Second call: Send message + tool_results with force_single_step=True
            final_response = co.chat(
                message=request.message,
                tool_results=tool_results,
                preamble=CHATBOT_PREAMBLE,
                force_single_step=True,
                temperature=0.7,
                max_tokens=1000
            )

            logger.info(f"[CHAT] Final response text: {final_response.text[:200] if final_response.text else 'None'}")

            # Use the final natural response
            cohere_response = final_response
        else:
            # No tools called, use original response
            logger.info(f"[CHAT] No tool calls, using direct response")
            tool_results = []

        # Step 6: Store messages
        # Store user message
        user_message = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role="user",
            content=request.message,
            created_at=datetime.utcnow()
        )
        session.add(user_message)

        # Store assistant message
        assistant_message = Message(
            id=uuid4(),
            conversation_id=conversation.id,
            role="assistant",
            content=cohere_response.text,
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
        # Format tool results for frontend
        formatted_tool_calls = []
        for tc in tool_results:
            formatted_tool_calls.append(
                ToolCallResult(
                    name=tc["call"]["name"],
                    parameters=tc["call"]["parameters"],
                    result=tc["outputs"][0]
                )
            )

        return ChatResponse(
            message=cohere_response.text,
            tool_calls=formatted_tool_calls,
            conversation_id=str(conversation.id),
            message_id=str(assistant_message.id)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat message: {str(e)}")
