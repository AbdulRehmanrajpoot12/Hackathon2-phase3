# AI Chatbot Feature Specification

## Overview
An intelligent AI chatbot assistant powered by Cohere API that enables users to manage their tasks through natural language conversations. The chatbot understands user intent, executes task operations via MCP-style tools, and provides personalized, context-aware responses.

## User Stories

### US-1: Add Task via Natural Language
**As a** user
**I want to** add tasks using natural language
**So that** I can quickly create tasks without navigating forms

**Examples:**
- "Add a task to buy groceries"
- "Create a new task: finish the report by Friday"
- "Remind me to call mom"
- "I need to schedule a dentist appointment"

**Expected Behavior:**
- AI recognizes intent to add task
- Extracts task title from user message
- Calls `add_task` tool with user_id and title
- Returns confirmation: "Added 'buy groceries' to your tasks for user@example.com!"

### US-2: List Tasks via Natural Language
**As a** user
**I want to** view my tasks using conversational queries
**So that** I can quickly see what I need to do

**Examples:**
- "Show me my tasks"
- "What do I need to do today?"
- "List all my incomplete tasks"
- "Show me completed tasks"

**Expected Behavior:**
- AI recognizes intent to list tasks
- Determines filter (all, completed, incomplete)
- Calls `list_tasks` tool with user_id and status filter
- Returns formatted task list with user context

### US-3: Complete Task via Natural Language
**As a** user
**I want to** mark tasks as complete using natural language
**So that** I can update task status conversationally

**Examples:**
- "Mark task 3 as done"
- "Complete the 'buy groceries' task"
- "I finished the report"
- "Check off my first task"

**Expected Behavior:**
- AI recognizes intent to complete task
- Identifies task by ID or title
- Calls `complete_task` tool with user_id and task_id
- Returns confirmation: "Marked 'buy groceries' as completed for user@example.com!"

### US-4: Delete Task via Natural Language
**As a** user
**I want to** delete tasks using conversational commands
**So that** I can remove tasks without clicking buttons

**Examples:**
- "Delete task 2"
- "Remove the 'call mom' task"
- "Delete my first task"
- "Get rid of the dentist appointment"

**Expected Behavior:**
- AI recognizes intent to delete task
- Identifies task by ID or title
- Calls `delete_task` tool with user_id and task_id
- Returns confirmation: "Deleted 'call mom' from your tasks for user@example.com!"

### US-5: Update Task via Natural Language
**As a** user
**I want to** modify task details using natural language
**So that** I can edit tasks conversationally

**Examples:**
- "Change the title of task 2 to 'Buy milk and eggs'"
- "Update the description of my first task"
- "Rename 'call mom' to 'call mom at 3pm'"

**Expected Behavior:**
- AI recognizes intent to update task
- Identifies task and fields to update
- Calls `update_task` tool with user_id, task_id, and new values
- Returns confirmation: "Updated task title for user@example.com!"

### US-6: Resume Conversation After Restart
**As a** user
**I want to** continue my conversation after closing the app
**So that** I don't lose context when I return

**Expected Behavior:**
- Conversation history persisted in database
- On return, previous messages load automatically
- User can reference previous context
- AI maintains awareness of conversation history

## Natural Language Examples and Expected Tool Calls

### Example 1: Add Task
**User Input:** "Add a task to buy groceries"

**Expected Tool Call:**
```json
{
  "tool": "add_task",
  "parameters": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "buy groceries",
    "description": null
  }
}
```

**Expected Response:**
"Added 'buy groceries' to your tasks for abdul@example.com!"

### Example 2: List Incomplete Tasks
**User Input:** "Show me my incomplete tasks"

**Expected Tool Call:**
```json
{
  "tool": "list_tasks",
  "parameters": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "incomplete"
  }
}
```

**Expected Response:**
"Here are your 3 incomplete tasks for abdul@example.com:
1. Buy groceries
2. Finish report
3. Call dentist"

### Example 3: Complete Task
**User Input:** "Mark the first task as done"

**Expected Tool Call:**
```json
{
  "tool": "complete_task",
  "parameters": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Expected Response:**
"Marked 'Buy groceries' as completed for abdul@example.com!"

### Example 4: Delete Task
**User Input:** "Delete task 2"

**Expected Tool Call:**
```json
{
  "tool": "delete_task",
  "parameters": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_id": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

**Expected Response:**
"Deleted 'Finish report' from your tasks for abdul@example.com!"

### Example 5: Update Task
**User Input:** "Change the title of task 1 to 'Buy milk and eggs'"

**Expected Tool Call:**
```json
{
  "tool": "update_task",
  "parameters": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy milk and eggs",
    "description": null
  }
}
```

**Expected Response:**
"Updated task title to 'Buy milk and eggs' for abdul@example.com!"

### Example 6: Ambiguous Intent
**User Input:** "task"

**Expected Behavior:**
AI asks clarifying question: "I'm not sure what you'd like to do. Would you like to:
1. Add a new task
2. List your existing tasks
3. Something else?"

## Acceptance Criteria

### AC-1: Intent Detection
- [ ] AI correctly identifies "add task" intent from natural language variations
- [ ] AI correctly identifies "list tasks" intent from natural language variations
- [ ] AI correctly identifies "complete task" intent from natural language variations
- [ ] AI correctly identifies "delete task" intent from natural language variations
- [ ] AI correctly identifies "update task" intent from natural language variations
- [ ] AI asks clarifying questions when intent is ambiguous

### AC-2: Parameter Extraction
- [ ] AI extracts task title from add task commands
- [ ] AI extracts status filter from list task commands (all/completed/incomplete)
- [ ] AI identifies tasks by ID or title from user input
- [ ] AI extracts fields to update from update task commands

### AC-3: Tool Execution
- [ ] All tool calls include user_id from Better Auth session
- [ ] Tool calls execute successfully and return results
- [ ] Tool errors are caught and handled gracefully
- [ ] Multiple tool calls can be chained in single conversation turn

### AC-4: Response Generation
- [ ] All responses include user email for personalization
- [ ] Responses are friendly and conversational
- [ ] Responses confirm the action taken
- [ ] Responses include relevant details (task title, count, etc.)
- [ ] Error messages are user-friendly and actionable

### AC-5: Conversation History
- [ ] All user messages stored in database with role="user"
- [ ] All AI responses stored in database with role="assistant"
- [ ] Conversation history loads on chat page load
- [ ] Messages display in chronological order
- [ ] Conversation can resume after server restart

### AC-6: User Personalization
- [ ] User email extracted from Better Auth session
- [ ] User email included in all AI responses
- [ ] User_id used to filter all task operations
- [ ] No cross-user data leakage

### AC-7: Error Handling
- [ ] Invalid task IDs return user-friendly error
- [ ] Missing required parameters trigger clarification questions
- [ ] Cohere API errors handled gracefully
- [ ] Database errors don't crash the chat
- [ ] Network errors show retry option

### AC-8: UI Synchronization (Critical)
After successful complete_task tool call:
- [ ] The task's completed status must be updated in the Neon DB
- [ ] The frontend main /tasks page must automatically refetch or invalidate the tasks query to show the updated status (e.g., from Active to Completed)
- [ ] Use TanStack Query invalidateQueries(['tasks']) or equivalent to sync the UI
- [ ] No manual refresh required — sync happens in real-time after chat operation
- [ ] Same synchronization applies to add_task, delete_task, and update_task operations
- [ ] Chat UI shows rich confirmation with status badges (e.g., "Task ID 5 'Buy groceries' marked as complete! ✅")

## Technical Requirements

### Cohere API Integration
- Use Cohere's `chat` endpoint with tool calling support
- Format messages in Cohere's expected format
- Define all 5 MCP-style tools in Cohere tool schema
- Parse Cohere's tool_calls response
- Execute tools and format results for Cohere

### Stateless Design
- Server maintains no conversation state in memory
- All conversation history fetched from database on each request
- Tool execution is stateless (fetch from DB, execute, store result)
- Server can restart without losing conversation context

### Security
- JWT token validated on every chat request
- User_id extracted from validated token, never from request body
- All tool calls enforce user_id filtering
- No cross-user data access possible
- Conversation history isolated per user

### Performance
- Chat endpoint responds within 2 seconds (p95)
- Conversation history loads efficiently (pagination if >100 messages)
- Cohere API calls have 10-second timeout
- Database queries optimized with proper indexes

## User Personalization

### Email in Responses
Every AI response MUST include the user's email address for personalization and clarity.

**Pattern:** "Action for user@example.com"

**Examples:**
- "Added 'buy groceries' to your tasks for abdul@example.com!"
- "Here are your 3 tasks for abdul@example.com: ..."
- "Marked 'finish report' as completed for abdul@example.com!"
- "Deleted 'call mom' from your tasks for abdul@example.com!"

### Context Awareness
- AI knows user's email from Better Auth session
- AI can reference previous messages in conversation
- AI maintains context across multiple turns
- AI personalizes responses based on user's task history

## Error Handling

### Task Not Found
**User Input:** "Complete task 999"

**Expected Response:**
"I couldn't find task 999 in your tasks for abdul@example.com. Would you like to see all your tasks?"

### Ambiguous Command
**User Input:** "task"

**Expected Response:**
"I'm not sure what you'd like to do with your tasks. Would you like to:
1. Add a new task
2. List your existing tasks
3. Complete a task
4. Delete a task"

### Missing Information
**User Input:** "Add a task"

**Expected Response:**
"What would you like to add to your tasks for abdul@example.com?"

### Cohere API Error
**Expected Response:**
"I'm having trouble processing your request right now. Please try again in a moment."

### Database Error
**Expected Response:**
"I couldn't access your tasks at the moment. Please try again."

## Edge Cases

### Empty Task List
**User Input:** "Show me my tasks"

**Expected Response:**
"You don't have any tasks yet for abdul@example.com. Would you like to add one?"

### All Tasks Completed
**User Input:** "Show me my incomplete tasks"

**Expected Response:**
"Great job! You've completed all your tasks for abdul@example.com. 🎉"

### Duplicate Task Titles
**User Input:** "Complete 'buy groceries'"

**Expected Behavior:**
If multiple tasks have the same title, AI asks: "You have 2 tasks with that title. Which one would you like to complete? (Task 1 or Task 2)"

### Very Long Task Title
**User Input:** "Add a task to [300 character title]"

**Expected Behavior:**
AI truncates to 255 characters and confirms: "Added '[truncated title]...' to your tasks for abdul@example.com!"

## Success Metrics

### Functional Metrics
- 95% of add task commands execute successfully
- 95% of list task commands return correct results
- 95% of complete task commands update status correctly
- 95% of delete task commands remove tasks successfully
- 95% of update task commands modify tasks correctly

### User Experience Metrics
- Average response time < 2 seconds
- 90% of intents correctly identified on first try
- 95% of responses include user email
- 100% of conversations persist across sessions

### Technical Metrics
- 99.9% uptime for chat endpoint
- < 1% Cohere API error rate
- < 0.1% cross-user data leakage incidents
- 100% of tool calls enforce user_id isolation

## Related Specifications
- `@specs/api/mcp-tools.md` - Tool definitions and schemas
- `@specs/api/rest-endpoints.md` - Chat endpoint specification
- `@specs/integration/ai-cohere.md` - Cohere API integration details
- `@specs/database/schema.md` - Conversation and message models
- `@specs/ui/chat-interface.md` - Chat UI design
