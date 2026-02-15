/**
 * Updated Tasks Page with React Query Integration
 * Uses TanStack Query for automatic data sync with chat
 */

'use client';

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import TaskList from './components/TaskList';
import FilterBar from './components/FilterBar';
import SortDropdown from './components/SortDropdown';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorAlert from '@/components/feedback/ErrorAlert';
import SuccessMessage from '@/components/feedback/SuccessMessage';
import { TasksErrorBoundary } from './components/TasksErrorBoundary';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTasks, useDeleteTask, useToggleTaskComplete } from '@/lib/hooks/useTasks';

function TasksPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use React Query hooks for automatic data management
  const apiFilter = filter === 'all' ? undefined : filter;
  const { data: tasks = [], isLoading, error, refetch } = useTasks(user?.id, apiFilter, sortBy);
  const deleteTaskMutation = useDeleteTask(user?.id);
  const toggleTaskMutation = useToggleTaskComplete(user?.id);

  // Handle task deletion
  const handleDelete = async (taskId: string) => {
    if (!user?.id) {
      router.push('/signin');
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await deleteTaskMutation.mutateAsync(parseInt(taskId));
      setSuccessMessage('Task deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Handle toggle complete
  const handleToggleComplete = async (taskId: string) => {
    if (!user?.id) {
      router.push('/signin');
      return;
    }

    try {
      const updatedTask = await toggleTaskMutation.mutateAsync(parseInt(taskId));
      setSuccessMessage(updatedTask.completed ? 'Task marked as completed' : 'Task marked as active');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Convert API tasks to component format
  const convertedTasks = tasks.map(task => ({
    id: task.id.toString(),
    title: task.title,
    description: task.description || '',
    status: task.completed ? 'completed' as const : 'active' as const,
    createdAt: new Date(task.created_at),
  }));

  // Calculate task counts for all filters
  const taskCounts = {
    all: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 shadow-glass">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">
            My Tasks
          </h1>
          <p className="text-slate-300 mb-6">
            Manage your tasks with style and efficiency
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => router.push('/tasks/new')}
            className="shadow-glow-primary-lg"
          >
            New Task
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
      </div>

      {/* Success message */}
      {successMessage && (
        <SuccessMessage
          title="Success"
          message={successMessage}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="space-y-3">
          <ErrorAlert
            message={error instanceof Error ? error.message : 'Failed to load tasks'}
            onDismiss={() => refetch()}
          />
          <div className="flex justify-center">
            <Button
              variant="primary"
              onClick={() => refetch()}
              disabled={isLoading}
              loading={isLoading}
            >
              Retry Loading Tasks
            </Button>
          </div>
        </div>
      )}

      {/* Filters and sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <FilterBar
          activeFilter={filter === 'pending' ? 'active' : filter}
          onFilterChange={(f) => setFilter(f === 'active' ? 'pending' : f)}
          taskCounts={taskCounts}
        />
        <SortDropdown
          value={sortBy === 'created_at' ? 'newest' : sortBy === 'title' ? 'a-z' : 'newest'}
          onChange={(v) => setSortBy(v === 'newest' || v === 'oldest' ? 'created_at' : 'title')}
        />
      </div>

      {/* Task list */}
      <TaskList
        tasks={convertedTasks}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <TasksErrorBoundary>
      <TasksPageContent />
    </TasksErrorBoundary>
  );
}
