/**
 * Premium Message Bubble with Rich Content Rendering
 * Displays messages with gradients, task cards, and tool results
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
  result: {
    status: string;
    message?: string;
    error?: string;
    task?: {
      id: string;
      title: string;
      description?: string;
      completed: boolean;
    };
    tasks?: Array<{
      id: string;
      title: string;
      description?: string;
      completed: boolean;
    }>;
    count?: number;
  };
}

export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  toolCalls?: Array<{
    name: string;
    parameters: Record<string, any>;
    result: Record<string, any>;
  }>;
  isLoading?: boolean;
}

export function MessageBubble({ role, content, timestamp, toolCalls, isLoading }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-5 py-3 shadow-lg',
          isUser
            ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white'
            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-100'
        )}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {content}
        </div>

        {/* Tool calls display (for assistant messages) */}
        {!isUser && toolCalls && toolCalls.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {toolCalls.map((tool, index) => (
              <ToolCallDisplay key={index} toolCall={tool} />
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 mt-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Processing...</span>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div
            className={cn(
              'text-xs mt-2',
              isUser ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {formatTimestamp(timestamp)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Display tool call results with rich formatting
 */
function ToolCallDisplay({ toolCall }: { toolCall: { name: string; parameters: Record<string, any>; result: Record<string, any> } }) {
  const { name, result } = toolCall;
  const isSuccess = result.status === 'success';

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
      {/* Tool name header */}
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {formatToolName(name)}
        </span>
      </div>

      {/* Result message */}
      {result.message && (
        <p className={cn(
          'text-sm',
          isSuccess ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
        )}>
          {result.message}
        </p>
      )}

      {/* Error message */}
      {result.error && (
        <p className="text-sm text-red-700 dark:text-red-400">
          {result.error}
        </p>
      )}

      {/* Single task display */}
      {result.task && (
        <TaskCard task={result.task} />
      )}

      {/* Multiple tasks display */}
      {result.tasks && result.tasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {result.count || result.tasks.length} task{result.tasks.length !== 1 ? 's' : ''}
          </p>
          {result.tasks.slice(0, 5).map((task: any) => (
            <TaskCard key={task.id} task={task} compact />
          ))}
          {result.tasks.length > 5 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              + {result.tasks.length - 5} more tasks
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Task card component for displaying tasks in chat
 */
function TaskCard({ task, compact = false }: { task: any; compact?: boolean }) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
      compact ? 'p-3' : 'p-4'
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className={cn(
          'flex-shrink-0 rounded-full border-2 flex items-center justify-center',
          compact ? 'w-5 h-5' : 'w-6 h-6',
          task.completed
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 border-transparent'
            : 'border-gray-300 dark:border-gray-600'
        )}>
          {task.completed && (
            <CheckCircle className={cn('text-white', compact ? 'w-3 h-3' : 'w-4 h-4')} />
          )}
        </div>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-semibold truncate',
            compact ? 'text-sm' : 'text-base',
            task.completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-gray-100'
          )}>
            {task.title}
          </h4>
          {!compact && task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        {/* Status badge */}
        <span className={cn(
          'flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium',
          task.completed
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        )}>
          {task.completed ? 'Done' : 'Active'}
        </span>
      </div>
    </div>
  );
}

/**
 * Format tool name for display
 */
function formatToolName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  } catch {
    return '';
  }
}
