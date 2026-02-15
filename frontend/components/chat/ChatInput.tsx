/**
 * Premium Chat Input with Gradient Send Button
 * Auto-resizing textarea with keyboard shortcuts
 */

'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-4">
      <div className="flex items-end gap-3">
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="chat-input-textarea w-full px-4 py-3 pr-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            style={{ minHeight: '48px', maxHeight: '120px' }}
            aria-label="Chat message input"
          />

          {/* Character count (shown when approaching limit) */}
          {message.length > 400 && (
            <div className="absolute bottom-2 right-3 text-xs text-gray-400 dark:text-gray-500">
              {message.length}/500
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          whileHover={{ scale: disabled || !message.trim() ? 1 : 1.05 }}
          whileTap={{ scale: disabled || !message.trim() ? 1 : 0.95 }}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-200 relative overflow-hidden group"
          aria-label="Send message"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Icon */}
          <div className="relative z-10">
            {disabled ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </div>
        </motion.button>
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {disabled && <span className="text-purple-500">Processing...</span>}
      </div>
    </div>
  );
}
