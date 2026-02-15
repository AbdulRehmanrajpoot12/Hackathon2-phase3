# Chat Interface UI Specification

## Overview
This specification defines the user interface for the AI chatbot assistant using a **floating chatbot icon** that triggers a modal/dialog window. The chatbot is accessible from anywhere in the application after login, providing seamless task management through natural language.

## Design Goals
- **Always Accessible**: Floating icon visible on all pages after login
- **Non-Intrusive**: Icon stays out of the way until needed
- **Intuitive**: Familiar chat interface pattern in modal
- **Responsive**: Full-screen on mobile, fixed-size modal on desktop
- **Accessible**: Keyboard navigation and screen reader support
- **Performant**: Smooth animations and instant feedback
- **Persistent**: Conversation state maintained across modal open/close

## Architecture Overview

### Floating Icon + Modal Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Application Layout (Dashboard, Tasks, etc.)            │
│                                                          │
│  [Main Content Area]                                    │
│                                                          │
│                                                          │
│                                                          │
│                                              ┌────────┐ │
│                                              │  💬    │ │ ← Floating Icon
│                                              │ [Icon] │ │   (bottom-right)
│                                              └────────┘ │
└─────────────────────────────────────────────────────────┘

When Icon Clicked:

┌─────────────────────────────────────────────────────────┐
│  [Overlay/Backdrop - semi-transparent]                  │
│                                                          │
│                    ┌──────────────────────────────┐     │
│                    │  Chat Assistant        [X]   │     │ ← Modal Header
│                    ├──────────────────────────────┤     │
│                    │  [Message List]              │     │
│                    │  - User message              │     │
│                    │  - Assistant response        │     │ ← Modal Body
│                    │  - Tool results              │     │
│                    │  ↓ Auto-scroll               │     │
│                    ├──────────────────────────────┤     │
│                    │  [Input] [Send]              │     │ ← Modal Footer
│                    └──────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Floating Chatbot Icon

**Purpose**: Always-visible entry point to the chatbot assistant

**Position**: Fixed bottom-right corner of viewport

**Layout**:
```tsx
import { MessageCircle } from 'lucide-react';

<button
  onClick={openChatModal}
  className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-300 flex items-center justify-center group"
  aria-label="Open chat assistant"
>
  <MessageCircle className="w-6 h-6" />

  {/* Pulse animation for new messages */}
  {hasUnreadMessages && (
    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
  )}
</button>
```

**Visual Design**:
- **Icon**: MessageCircle from lucide-react (chat bubble symbol)
- **Size**: 56px × 56px (w-14 h-14)
- **Color**: Blue background (#2563eb), white icon
- **Position**: 24px from bottom, 24px from right (bottom-6 right-6)
- **Z-index**: 50 (above most content, below modals)
- **Shape**: Circular (rounded-full)
- **Shadow**: Large shadow (shadow-lg) that expands on hover (shadow-xl)

**Animations**:

1. **Hover Effect**:
   ```css
   /* Glow effect on hover */
   .hover\:shadow-xl:hover {
     box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.3),
                 0 10px 10px -5px rgba(37, 99, 235, 0.2);
   }

   /* Scale slightly on hover */
   .group:hover {
     transform: scale(1.05);
   }
   ```

2. **Pulse Animation** (when new message available):
   ```tsx
   {hasUnreadMessages && (
     <span className="absolute -top-1 -right-1 flex h-3 w-3">
       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
       <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
     </span>
   )}
   ```

3. **Entrance Animation** (on page load):
   ```tsx
   <button
     className="... animate-in slide-in-from-bottom-5 fade-in duration-500"
   >
   ```

**Visibility Rules**:
- **Hidden**: On login/signup pages, public pages
- **Visible**: On all authenticated pages (dashboard, tasks, profile, etc.)
- **Implementation**:
  ```tsx
  const { userId } = useAuth();

  if (!userId) return null; // Don't show if not logged in

  return <FloatingChatIcon />;
  ```

**Requirements**:
- [ ] Icon visible on all pages after login
- [ ] Icon hidden on login/signup pages
- [ ] Smooth hover animation (glow + scale)
- [ ] Pulse animation when new messages available
- [ ] Click opens chat modal
- [ ] Accessible with keyboard (Tab to focus, Enter to open)
- [ ] ARIA label for screen readers

---

### 2. Chat Modal/Dialog

**Purpose**: Container for the chat interface, opened by floating icon

**Component**: Use shadcn/ui Dialog component

**Layout**:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
    {/* Header */}
    <DialogHeader className="border-b p-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <DialogTitle>Chat Assistant</DialogTitle>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-gray-500">Ask me to manage your tasks</p>
    </DialogHeader>

    {/* Body - Message List */}
    <div className="flex-1 overflow-y-auto p-4">
      <MessageList messages={messages} />
      {isLoading && <LoadingIndicator />}
    </div>

    {/* Footer - Input */}
    <div className="border-t p-4 flex-shrink-0">
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  </DialogContent>
</Dialog>
```

**Modal Specifications**:

**Desktop**:
- **Width**: 500px (sm:max-w-[500px])
- **Height**: 600px (h-[600px])
- **Position**: Centered on screen
- **Backdrop**: Semi-transparent overlay (rgba(0, 0, 0, 0.5))
- **Animation**: Fade in + scale from 95% to 100%

**Mobile** (< 640px):
- **Width**: Full screen (100vw)
- **Height**: Full screen (100vh)
- **Position**: Covers entire viewport
- **Animation**: Slide up from bottom

**Responsive Implementation**:
```tsx
<DialogContent className="
  sm:max-w-[500px] sm:h-[600px]
  max-sm:w-full max-sm:h-full max-sm:max-w-full max-sm:rounded-none
  flex flex-col p-0
">
```

**Close Behavior**:
- Click X button in header
- Click outside modal (on backdrop)
- Press Escape key
- All methods call `setIsOpen(false)`

**State Persistence**:
```tsx
// Conversation state persists when modal closes
const [conversationId, setConversationId] = useState<string | null>(null);
const [messages, setMessages] = useState<Message[]>([]);

// Load conversation on mount
useEffect(() => {
  const savedConversationId = sessionStorage.getItem('chat_conversation_id');
  if (savedConversationId) {
    setConversationId(savedConversationId);
    // Optionally: fetch conversation history
  }
}, []);

// Save conversation ID when it changes
useEffect(() => {
  if (conversationId) {
    sessionStorage.setItem('chat_conversation_id', conversationId);
  }
}, [conversationId]);
```

**Requirements**:
- [ ] Modal opens when floating icon clicked
- [ ] Modal closes with X button, backdrop click, or Escape key
- [ ] Desktop: 500px × 600px centered modal
- [ ] Mobile: Full-screen modal
- [ ] Smooth open/close animations
- [ ] Conversation state persists across open/close
- [ ] Focus trapped within modal when open
- [ ] Backdrop prevents interaction with page content

---

### 3. Message List

**Purpose**: Display conversation history with auto-scroll

**Layout**:
```tsx
<div className="flex-1 overflow-y-auto space-y-4">
  {messages.length === 0 && (
    <EmptyState />
  )}

  {messages.map((message) => (
    <MessageBubble key={message.id} message={message} />
  ))}

  <div ref={messagesEndRef} />
</div>
```

**Requirements**:
- Scrollable container with overflow-y-auto
- Auto-scroll to bottom on new messages
- Empty state for new conversations
- Proper spacing between messages (space-y-4)
- Smooth scrolling behavior

**Auto-Scroll Implementation**:
```tsx
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

---

### 4. Message Bubble

**Purpose**: Display individual user or assistant messages

**User Message Layout**:
```tsx
<div className="flex justify-end">
  <div className="max-w-[80%] rounded-lg p-3 bg-blue-500 text-white">
    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
    <span className="text-xs opacity-75 mt-1 block">
      {formatTime(message.created_at)}
    </span>
  </div>
</div>
```

**Assistant Message Layout**:
```tsx
<div className="flex justify-start">
  <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900">
    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
    {message.tool_calls && message.tool_calls.length > 0 && (
      <ToolResultsDisplay toolCalls={message.tool_calls} />
    )}
    <span className="text-xs text-gray-500 mt-1 block">
      {formatTime(message.created_at)}
    </span>
  </div>
</div>
```

**Requirements**:
- User messages: right-aligned, blue background, white text
- Assistant messages: left-aligned, gray background, dark text
- Max width 80% for readability
- Rounded corners (rounded-lg)
- Padding for comfortable reading (p-3)
- Preserve line breaks (whitespace-pre-wrap)
- Display timestamp in small text
- Include tool results for assistant messages

---

### 5. Tool Results Display

**Purpose**: Render tool execution results within assistant messages

**Task List Display**:
```tsx
<div className="bg-white border rounded-lg p-3 mt-2">
  <h4 className="font-semibold text-sm mb-2">Your Tasks</h4>
  {tasks.length === 0 ? (
    <p className="text-gray-500 text-sm">No tasks found</p>
  ) : (
    <ul className="space-y-2">
      {tasks.map((task, index) => (
        <li key={task.id} className="flex items-start gap-2">
          <span className="text-gray-500 text-sm">{index + 1}.</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.completed}
                readOnly
                className="rounded"
              />
              <span className={task.completed ? 'line-through text-gray-500 text-sm' : 'text-sm'}>
                {task.title}
              </span>
            </div>
            {task.description && (
              <p className="text-xs text-gray-600 mt-1 ml-6">
                {task.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )}
</div>
```

**Task Added Confirmation**:
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
  <p className="text-green-800 text-xs">
    ✓ Added task: <strong>{task.title}</strong>
  </p>
</div>
```

**Task Completed Confirmation**:
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
  <p className="text-blue-800 text-xs">
    ✓ Completed task: <strong>{task.title}</strong>
  </p>
</div>
```

**Task Deleted Confirmation**:
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
  <p className="text-red-800 text-xs">
    ✓ Deleted task: <strong>{task.title}</strong>
  </p>
</div>
```

**Requirements**:
- Render based on tool type (add_task, list_tasks, complete_task, delete_task, update_task)
- Task lists show checkboxes and completion status
- Confirmations use color-coded backgrounds (green=add, blue=complete, red=delete)
- Clear visual distinction from regular message text
- Compact design for modal space

---

### 6. Chat Input

**Purpose**: Allow users to type and send messages

**Layout**:
```tsx
<form onSubmit={handleSubmit} className="flex gap-2">
  <input
    type="text"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type your message..."
    disabled={isLoading}
    className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
  />
  <button
    type="submit"
    disabled={isLoading || !message.trim()}
    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {isLoading ? 'Sending...' : 'Send'}
  </button>
</form>
```

**Requirements**:
- Text input with placeholder
- Send button (disabled when loading or empty)
- Submit on Enter key
- Disabled state during API calls
- Clear input after successful send
- Focus ring for accessibility
- Compact design for modal footer

**Keyboard Shortcuts**:
- Enter: Send message
- Escape: Close modal (handled by Dialog component)

---

### 7. Loading Indicator

**Purpose**: Show typing indicator while waiting for AI response

**Layout**:
```tsx
<div className="flex justify-start">
  <div className="bg-gray-100 rounded-lg p-3">
    <div className="flex space-x-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
    </div>
  </div>
</div>
```

**Requirements**:
- Animated dots (bounce animation)
- Positioned like assistant message
- Visible only during API calls
- Smooth appearance/disappearance

---

### 8. Empty State

**Purpose**: Guide users when starting a new conversation

**Layout**:
```tsx
<div className="text-center text-gray-500 py-8">
  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
  <h3 className="text-base font-medium mb-2">Start a conversation</h3>
  <p className="text-sm mb-3">
    I can help you manage your tasks. Try asking:
  </p>
  <ul className="text-sm space-y-1">
    <li>• "Add a task to buy groceries"</li>
    <li>• "Show me my incomplete tasks"</li>
    <li>• "Mark task 1 as done"</li>
  </ul>
</div>
```

**Requirements**:
- Centered layout
- Icon or illustration
- Helpful examples
- Only shown when messages.length === 0
- Compact design for modal

---

### 9. Error Display

**Purpose**: Show user-friendly error messages

**Layout**:
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg mb-3">
    <div className="flex items-start gap-2">
      <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /* error icon */ />
      <div className="flex-1">
        <p className="font-medium text-sm">Error</p>
        <p className="text-xs">{error}</p>
      </div>
      <button
        onClick={() => setError(null)}
        className="text-red-500 hover:text-red-700"
      >
        ×
      </button>
    </div>
  </div>
)}
```

**Requirements**:
- Red background for visibility
- Error icon
- Dismissible (X button)
- Clear error message
- Positioned at top of message list

---

## State Management

### Chat State

```tsx
interface ChatState {
  isOpen: boolean;
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

const [isOpen, setIsOpen] = useState(false);
const [messages, setMessages] = useState<Message[]>([]);
const [conversationId, setConversationId] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Persistence Across Modal Open/Close

```tsx
// Save conversation ID to sessionStorage
useEffect(() => {
  if (conversationId) {
    sessionStorage.setItem('chat_conversation_id', conversationId);
  }
}, [conversationId]);

// Restore conversation ID on mount
useEffect(() => {
  const savedId = sessionStorage.getItem('chat_conversation_id');
  if (savedId) {
    setConversationId(savedId);
  }
}, []);

// Messages persist in state even when modal closes
// They're not cleared when isOpen becomes false
```

### Message Type

```tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCall[];
  created_at: string;
}

interface ToolCall {
  id: string;
  function: string;
  arguments: string;
}
```

---

## API Integration

### Send Message Function

```tsx
async function sendMessage(message: string) {
  setIsLoading(true);
  setError(null);

  // Optimistic update
  const userMessage: Message = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content: message,
    created_at: new Date().toISOString()
  };
  setMessages(prev => [...prev, userMessage]);

  try {
    const response = await fetch(`/api/${userId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();

    // Update conversation ID
    if (!conversationId) {
      setConversationId(data.conversation_id);
    }

    // Add assistant message
    const assistantMessage: Message = {
      id: data.message_id,
      role: 'assistant',
      content: data.message,
      tool_calls: data.tool_calls,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev.slice(0, -1), userMessage, assistantMessage]);

    // CRITICAL: Sync tasks with main /tasks page after task operations
    // After successful complete_task tool call:
    // - The task's completed status must be updated in the Neon DB
    // - The frontend main /tasks page must automatically refetch or invalidate the tasks query
    // - Use TanStack Query invalidateQueries(['tasks']) or equivalent to sync the UI
    // - No manual refresh required — sync happens in real-time after chat operation
    const taskTools = ['add_task', 'complete_task', 'delete_task', 'update_task'];
    const hasTaskOperation = data.tool_calls?.some(tc =>
      taskTools.includes(tc.function)
    );

    if (hasTaskOperation) {
      // Invalidate React Query cache to trigger automatic refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      console.log('[Chat] Tasks cache invalidated - /tasks page will auto-update');
    }
  } catch (err) {
    setError(err.message || 'Failed to send message');
    // Remove optimistic user message
    setMessages(prev => prev.slice(0, -1));
  } finally {
    setIsLoading(false);
  }
}
```

### Task Synchronization Requirements

**Critical: Real-Time UI Updates**

After successful complete_task tool call:
- The task's completed status must be updated in the Neon DB
- The frontend main /tasks page must automatically refetch or invalidate the tasks query to show the updated status (e.g., from Active to Completed)
- Use TanStack Query invalidateQueries(['tasks']) or equivalent to sync the UI
- No manual refresh required — sync happens in real-time after chat operation

**Implementation Details:**
1. Check if response contains task-related tool calls (add_task, complete_task, delete_task, update_task)
2. If yes, invalidate the tasks query cache using `queryClient.invalidateQueries({ queryKey: ['tasks'] })`
3. React Query will automatically refetch tasks in the background
4. Main /tasks page updates without user intervention

**Visual Confirmation:**
- Chat UI should show rich status badges (e.g., "Task ID 5 'Buy groceries' marked as complete! ✅")
- Use color-coded confirmations (green for complete, blue for add, red for delete)
- Display task IDs prominently in all responses

---

## Responsive Design

### Desktop (≥ 640px)

**Floating Icon**:
- Position: Fixed bottom-right (24px from edges)
- Size: 56px × 56px
- Always visible (z-index: 50)

**Modal**:
- Width: 500px
- Height: 600px
- Position: Centered on screen
- Backdrop: Semi-transparent overlay

### Mobile (< 640px)

**Floating Icon**:
- Position: Fixed bottom-right (16px from edges)
- Size: 56px × 56px
- Always visible

**Modal**:
- Width: 100vw (full screen)
- Height: 100vh (full screen)
- Position: Covers entire viewport
- No rounded corners
- Slide up animation from bottom

**Responsive Implementation**:
```tsx
// Floating Icon
<button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 ...">

// Modal
<DialogContent className="
  sm:max-w-[500px] sm:h-[600px] sm:rounded-lg
  max-sm:w-full max-sm:h-full max-sm:max-w-full max-sm:rounded-none
  ...
">
```

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate to floating icon
- **Enter/Space**: Open modal (when icon focused)
- **Tab**: Navigate within modal (input → send button)
- **Enter**: Send message (when input focused)
- **Escape**: Close modal

### Screen Reader Support

```tsx
// Floating Icon
<button
  aria-label="Open chat assistant"
  aria-expanded={isOpen}
  aria-haspopup="dialog"
>

// Modal
<Dialog>
  <DialogContent aria-describedby="chat-description">
    <DialogTitle>Chat Assistant</DialogTitle>
    <p id="chat-description" className="sr-only">
      AI assistant for managing your tasks through natural language
    </p>
  </DialogContent>
</Dialog>

// Message List
<div role="log" aria-live="polite" aria-atomic="false">
  {messages.map(message => (
    <div key={message.id} role="article" aria-label={`${message.role} message`}>
      {message.content}
    </div>
  ))}
</div>
```

### ARIA Labels

- Floating icon: `aria-label="Open chat assistant"`
- Close button: `aria-label="Close chat"`
- Input: `aria-label="Type your message"`
- Send button: `aria-label="Send message"`
- Loading indicator: `aria-label="AI is typing"`

---

## Performance Optimization

### Lazy Loading

```tsx
// Lazy load chat modal to reduce initial bundle size
const ChatModal = lazy(() => import('@/components/chat/ChatModal'));

// Render with Suspense
<Suspense fallback={null}>
  {isOpen && <ChatModal />}
</Suspense>
```

### Optimistic Updates

- Add user message immediately to UI
- Show loading indicator
- Update with server response
- Rollback on error

### Message List Optimization

```tsx
// Use React.memo for message bubbles
const MessageBubble = React.memo(({ message }: { message: Message }) => {
  // ... component code
});

// Virtual scrolling for very long conversations (future enhancement)
```

---

## Integration with Existing App

### Global Layout Integration

```tsx
// app/layout.tsx or components/Layout.tsx
import { FloatingChatIcon } from '@/components/chat/FloatingChatIcon';

export default function Layout({ children }) {
  return (
    <div>
      {/* Main content */}
      {children}

      {/* Floating chat icon - visible on all pages after login */}
      <FloatingChatIcon />
    </div>
  );
}
```

### Route Protection

```tsx
// components/chat/FloatingChatIcon.tsx
export function FloatingChatIcon() {
  const { userId, loading } = useAuth();

  // Don't show during auth check
  if (loading) return null;

  // Don't show if not logged in
  if (!userId) return null;

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="...">
        <MessageCircle />
      </button>

      <ChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

### Z-Index Management

```tsx
// Ensure proper stacking order
const zIndexLayers = {
  floatingIcon: 50,      // Above content, below modals
  modalBackdrop: 100,    // Modal backdrop
  modalContent: 101,     // Modal content
};
```

---

## Animation Specifications

### Floating Icon Animations

**Hover Glow**:
```css
.floating-icon:hover {
  box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.3),
              0 10px 10px -5px rgba(37, 99, 235, 0.2);
  transform: scale(1.05);
  transition: all 0.3s ease;
}
```

**Pulse for New Messages**:
```tsx
{hasUnreadMessages && (
  <span className="absolute -top-1 -right-1 flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
  </span>
)}
```

**Entrance Animation**:
```tsx
<button className="... animate-in slide-in-from-bottom-5 fade-in duration-500">
```

### Modal Animations

**Open Animation** (Desktop):
```css
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Open Animation** (Mobile):
```css
@keyframes modal-slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
```

**Close Animation**:
```css
@keyframes modal-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

---

## Testing Requirements

### Component Tests

- Floating icon renders correctly
- Icon opens modal on click
- Modal closes with X button, backdrop click, Escape key
- Message bubbles render for user/assistant
- Tool results display properly
- Empty state shows when no messages
- Loading indicator appears during API calls
- Error messages display and dismiss

### Integration Tests

- Send message and receive response
- Conversation ID persists across modal open/close
- Auto-scroll works on new messages
- Optimistic updates rollback on error
- Icon pulse animation shows for new messages

### Accessibility Tests

- Keyboard navigation works (Tab, Enter, Escape)
- Screen reader announces messages
- ARIA labels present and correct
- Focus management correct (trapped in modal when open)

---

## Related Specifications
- `@specs/features/chatbot.md` - Chatbot feature requirements
- `@specs/api/rest-endpoints.md` - Chat API endpoint
- `@specs/integration/frontend-backend.md` - Frontend-backend integration
- `@specs/ui/theme.md` - UI theme and styling guidelines
- `@specs/integration/ai-cohere.md` - Cohere API integration
