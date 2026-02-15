/**
 * React Query hooks for task management
 * Provides data fetching, caching, and synchronization
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskComplete, Task, TaskCreate, TaskUpdate } from '@/lib/api';

export const TASKS_QUERY_KEY = 'tasks';

/**
 * Hook to fetch tasks with caching and auto-refetch
 */
export function useTasks(userId: string | undefined, status?: 'all' | 'pending' | 'completed', sort?: 'created_at' | 'title') {
  return useQuery({
    queryKey: [TASKS_QUERY_KEY, userId, status, sort],
    queryFn: () => {
      if (!userId) throw new Error('User ID required');
      return getTasks(userId, status, sort);
    },
    enabled: !!userId,
    staleTime: 0, // Always consider data stale - refetch immediately on invalidation
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskCreate) => {
      if (!userId) throw new Error('User ID required');
      return createTask(userId, data);
    },
    onSuccess: () => {
      // Invalidate all task queries to refetch
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: number; data: TaskUpdate }) => {
      if (!userId) throw new Error('User ID required');
      return updateTask(userId, taskId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => {
      if (!userId) throw new Error('User ID required');
      return deleteTask(userId, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to toggle task completion
 */
export function useToggleTaskComplete(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => {
      if (!userId) throw new Error('User ID required');
      return toggleTaskComplete(userId, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    },
  });
}

/**
 * Hook to manually refetch tasks (useful after chat operations)
 * Handles cases where QueryClient might not be available
 */
export function useRefetchTasks() {
  let queryClient;

  try {
    queryClient = useQueryClient();
  } catch (error) {
    console.warn('[useTasks] QueryClient not available, refetch will be no-op');
    return () => {
      console.warn('[useTasks] Refetch called but QueryClient not available');
    };
  }

  return () => {
    try {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      console.log('[useTasks] Tasks cache invalidated successfully');
    } catch (error) {
      console.error('[useTasks] Failed to invalidate tasks cache:', error);
    }
  };
}
