/**
 * Chat API Client
 * Handles communication with the chatbot backend endpoint
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface ToolCallResult {
  name: string;
  parameters: Record<string, any>;
  result: Record<string, any>;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  tool_calls: ToolCallResult[];
  conversation_id: string;
  message_id: string;
}

/**
 * Get authorization token from Better Auth
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Better Auth stores the session token in a cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'better-auth.session_token') {
      return decodeURIComponent(value);
    }
  }

  // Fallback: try localStorage
  const token = localStorage.getItem('better-auth.session_token');
  if (token) {
    return token;
  }

  return null;
}

/**
 * Decode JWT token to extract user_id
 */
function getUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('[Chat API] Invalid token structure');
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('[Chat API] Token expired');
      return null;
    }

    // Extract user ID (try multiple fields)
    const userId = payload.sub || payload.user_id || payload.id;
    if (!userId) {
      console.error('[Chat API] No user ID in token payload');
      return null;
    }

    return userId;
  } catch (error) {
    console.error('[Chat API] Token decode error:', error);
    return null;
  }
}

/**
 * Send a chat message to the backend and get AI response
 *
 * @param message - The user's message text
 * @param conversationId - Optional conversation ID to continue existing conversation
 * @returns ChatResponse with AI message, tool calls, and conversation metadata
 * @throws Error if authentication fails or request fails
 */
export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  // Get auth token
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated - please sign in');
  }

  // Extract user_id from token
  const userId = getUserIdFromToken(token);
  if (!userId) {
    throw new Error('Invalid authentication token');
  }

  // Prepare request body
  const requestBody: ChatRequest = {
    message,
    ...(conversationId && { conversation_id: conversationId }),
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for AI responses

  try {
    const response = await fetch(`${API_BASE_URL}/api/${userId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Chat request failed' }));

      // If 401, redirect to login
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
        throw new Error('Authentication required');
      }

      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the AI is taking too long to respond');
    }

    throw error;
  }
}
