/**
 * Premium Chat Modal with Glassmorphism
 * Main chat interface with task sync and overflow fixes
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { MessageList, Message } from './MessageList';
import { ChatInput } from './ChatInput';
import { sendChatMessage, ChatResponse } from '@/lib/api/chat';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { TASKS_QUERY_KEY } from '@/lib/hooks/useTasks';

export interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get QueryClient safely
  let queryClient: QueryClient | undefined;
  try {
    queryClient = useQueryClient();
  } catch (e) {
    console.warn('[ChatModal] QueryClient not available');
  }

  // Helper function to refetch tasks
  const refetchTasks = () => {
    if (queryClient) {
      try {
        // Invalidate ALL task queries regardless of parameters
        queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
        // Force immediate refetch
        queryClient.refetchQueries({ queryKey: [TASKS_QUERY_KEY] });
        console.log('[ChatModal] Tasks cache invalidated and refetched');
      } catch (error) {
        console.error('[ChatModal] Failed to invalidate tasks:', error);
      }
    } else {
      console.warn('[ChatModal] Cannot refetch tasks - QueryClient not available');
    }
  };

  // Load conversation from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const savedConversationId = localStorage.getItem('chat_conversation_id');
      const savedMessages = localStorage.getItem('chat_messages');

      if (savedConversationId) {
        setConversationId(savedConversationId);
      }

      if (savedMessages) {
        try {
          const parsed = JSON.parse(savedMessages);
          setMessages(parsed);
        } catch (e) {
          // Failed to parse - start fresh
        }
      }

      // Focus input when modal opens
      setTimeout(() => {
        const textarea = document.querySelector('.chat-input-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Save conversation to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('chat_conversation_id', conversationId);
    }
    if (messages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    }
  }, [conversationId, messages]);

  const handleSendMessage = async (messageText: string) => {
    // Clear any previous errors
    setError(null);

    // Add user message to UI immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call chat API
      const response: ChatResponse = await sendChatMessage(messageText, conversationId);

      // Update conversation ID if this is a new conversation
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Add assistant message to UI
      const assistantMessage: Message = {
        id: response.message_id,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        toolCalls: response.tool_calls.length > 0 ? response.tool_calls : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // CRITICAL: Refetch tasks after any chat operation that modifies tasks
      // This ensures the main /tasks page shows updated data immediately
      const taskTools = ['add_task', 'complete_task', 'delete_task', 'update_task'];
      const hasTaskOperation = response.tool_calls?.some((tc: any) =>
        taskTools.includes(tc.name)
      );

      if (hasTaskOperation) {
        console.log('[ChatModal] Task operation detected, invalidating tasks cache');
        // Add small delay to ensure backend commit completes
        setTimeout(() => {
          refetchTasks();
        }, 300);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Add error message to chat
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Clear chat history? This cannot be undone.')) {
      setMessages([]);
      setConversationId(undefined);
      localStorage.removeItem('chat_conversation_id');
      localStorage.removeItem('chat_messages');
    }
  };

  const handleClose = () => {
    // Refetch tasks when closing modal to ensure main page is synced
    // Use longer delay to ensure all pending operations complete
    setTimeout(() => {
      refetchTasks();
    }, 500);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden md:bottom-6 md:right-6"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-modal-title"
          >
            {/* Dark mode background */}
            <div className="absolute inset-0 bg-gray-900/95 dark:block hidden -z-10" style={{ backdropFilter: 'blur(20px)' }} />

            {/* Header with gradient */}
            <div className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-50" />

              <div className="relative z-10 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                <h2 id="chat-modal-title" className="text-lg font-bold">
                  AI Task Assistant
                </h2>
              </div>

              <div className="relative z-10 flex items-center gap-2">
                {messages.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClearChat}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    aria-label="Clear chat history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Messages - with fixed height to prevent overflow */}
            <MessageList messages={messages} isLoading={isLoading} />

            {/* Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
              placeholder="Ask me to manage your tasks..."
            />
          </motion.div>

          {/* Mobile full-screen override */}
          <style jsx>{`
            @media (max-width: 768px) {
              .fixed.bottom-6.right-6.max-w-md {
                bottom: 0;
                right: 0;
                left: 0;
                max-width: 100%;
                height: 100vh;
                border-radius: 0;
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
