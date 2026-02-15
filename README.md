# Hackathon Todo - Phase III: AI Chatbot Integration

A full-stack task management application with natural language AI chatbot powered by Cohere.

## Features

### Phase I & II (Existing)
- User authentication with Better Auth (JWT)
- CRUD operations for tasks
- User isolation and security
- Responsive UI with Tailwind CSS

### Phase III (New)
- **AI Chatbot Assistant**: Natural language task management
- **5 MCP-Style Tools**: Add, list, complete, delete, and update tasks via chat
- **Conversation Persistence**: Chat history stored in PostgreSQL
- **Stateless Architecture**: All state in database, no in-memory sessions
- **User Personalization**: Responses include user email
- **Floating Chat Widget**: Accessible from all protected pages
- **Keyboard Shortcuts**: Ctrl+K (Windows/Linux) or Cmd+K (Mac) to toggle chat

## Tech Stack

### Backend
- **FastAPI**: Python web framework
- **SQLModel**: ORM for PostgreSQL
- **Cohere API**: Natural language understanding and tool calling
- **PostgreSQL**: Database (Neon serverless)
- **Better Auth**: JWT authentication

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL database (or Neon account)
- Cohere API key (free tier available at https://cohere.com)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Phase-3
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your credentials:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-key-here
COHERE_API_KEY=your-cohere-api-key-here
```

**Get a Cohere API Key:**
1. Sign up at https://cohere.com
2. Navigate to API Keys section
3. Copy your API key
4. Paste into `COHERE_API_KEY` in `.env`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
BETTER_AUTH_SECRET=your-secret-key-here
```

**Note**: Use the same `BETTER_AUTH_SECRET` in both backend and frontend.

### 4. Database Setup

The database tables will be created automatically on first run. The application creates:
- `tasks`: User tasks
- `conversations`: Chat conversations
- `messages`: Chat message history

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8080
```

Backend will be available at: http://localhost:8080

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

## Using the Chatbot

### Access the Chat
1. Sign in to the application
2. Click the floating blue chat icon (bottom-right corner)
3. Or press **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac)

### Natural Language Commands

**Add Tasks:**
- "Add a task to buy groceries"
- "Create a task: finish the report by Friday"
- "Remind me to call mom"

**List Tasks:**
- "Show me my tasks"
- "List all incomplete tasks"
- "What tasks do I have?"

**Complete Tasks:**
- "Mark task 5 as complete"
- "Complete the grocery shopping task"
- "I finished task 3"

**Delete Tasks:**
- "Delete task 7"
- "Remove the task about calling mom"

**Update Tasks:**
- "Update task 2 title to 'Buy milk and eggs'"
- "Change the description of task 4"

### Chat Features
- **Conversation History**: Your chat history persists across sessions
- **Tool Call Display**: See which actions the AI performed
- **Error Handling**: User-friendly error messages
- **Auto-scroll**: Messages automatically scroll into view
- **Clear History**: Clear button to start fresh conversation

## Architecture

### Stateless Design
- No in-memory sessions or state
- All conversation history stored in PostgreSQL
- Server can restart without losing data
- Horizontal scaling ready

### Security
- **JWT Authentication**: All endpoints require valid tokens
- **User Isolation**: Users can only access their own data
- **User ID Validation**: Token user_id must match request user_id
- **SQL Injection Protection**: SQLModel ORM prevents injection attacks

### MCP-Style Tools
Each tool is a stateless function that:
1. Accepts database session and user_id
2. Enforces user isolation
3. Returns structured results
4. Handles errors gracefully

## API Endpoints

### Chat Endpoint
```
POST /api/{user_id}/chat
Authorization: Bearer <jwt-token>

Request:
{
  "message": "Add a task to buy milk",
  "conversation_id": "optional-uuid"
}

Response:
{
  "message": "I've added the task 'buy milk' for you.",
  "tool_calls": [
    {
      "name": "add_task",
      "parameters": {"title": "buy milk"},
      "result": {"status": "success", "task": {...}}
    }
  ],
  "conversation_id": "uuid",
  "message_id": "uuid"
}
```

### Task Endpoints (Existing)
- `GET /api/{user_id}/tasks` - List all tasks
- `POST /api/{user_id}/tasks` - Create task
- `GET /api/{user_id}/tasks/{task_id}` - Get task
- `PUT /api/{user_id}/tasks/{task_id}` - Update task
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete task
- `PATCH /api/{user_id}/tasks/{task_id}/complete` - Toggle completion

## Development

### Project Structure

```
Phase-3/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── db.py                   # Database setup
│   ├── models/                 # SQLModel models
│   │   ├── task.py
│   │   ├── conversation.py
│   │   └── message.py
│   ├── routers/                # API routes
│   │   ├── tasks.py
│   │   └── chat.py
│   ├── services/               # Business logic
│   │   ├── cohere_client.py   # Cohere API integration
│   │   └── tool_executor.py   # Tool dispatcher
│   └── tools/                  # MCP-style tools
│       └── task_tools.py       # 5 task management tools
├── frontend/
│   ├── app/                    # Next.js App Router
│   ├── components/
│   │   ├── chat/              # Chat UI components
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ChatModal.tsx
│   │   │   ├── FloatingChatIcon.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   └── layout/            # Layout components
│   └── lib/
│       ├── api/               # API clients
│       │   └── chat.ts
│       └── api.ts             # Task API client
└── README.md
```

### Running Tests

The application includes comprehensive integration tests covering:
- User story validation (all 5 MCP tools)
- Stateless verification (server restart, concurrent users)
- Error handling (invalid inputs, timeouts, auth failures)
- Security (JWT validation, user isolation, SQL injection)
- Performance (response times, concurrent requests)

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Verify COHERE_API_KEY is valid
- Ensure PostgreSQL is accessible

### Chat not responding
- Check browser console for errors
- Verify backend is running on port 8080
- Check COHERE_API_KEY has available credits

### Authentication issues
- Ensure BETTER_AUTH_SECRET matches in both .env files
- Clear browser cookies and localStorage
- Check JWT token hasn't expired

### Database connection errors
- Verify PostgreSQL is running
- Check DATABASE_URL format
- For Neon: ensure connection pooler is enabled

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the API documentation
- Open an issue on GitHub
"# Hackathon2-phase3" 
"# Hackathon2-phase3" 
"# Hackathon2-phase3" 
