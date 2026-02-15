/**
 * Premium Message List with Auto-Scroll and Overflow Fix
 * Displays scrollable message history with proper height constraints
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { Sparkles } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    parameters: Record<string, any>;
    result: Record<string, any>;
  }>;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth"
      style={{
        maxHeight: 'calc(100vh - 280px)', // Fixed height to prevent overflow
        minHeight: '300px'
      }}
    >
      {/* Empty state */}
      {messages.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center px-6"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 blur-xl opacity-50 animate-pulse" />
          </div>

          <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            AI Task Assistant
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
            I can help you manage your tasks with natural language. Just tell me what you need!
          </p>

          <div className="space-y-3 text-xs text-gray-500 dark:text-gray-500 max-w-xs">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-indigo-500">💡</span>
              <span>"Add a task to buy groceries"</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-purple-500">📋</span>
              <span>"Show me my incomplete tasks"</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-pink-500">✅</span>
              <span>"Mark task 5 as complete"</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
          toolCalls={message.toolCalls}
        />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start mb-4"
        >
          <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex space-x-1">
                <motion.div
                  className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                AI is thinking...
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
