import { useState, useCallback } from 'react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface SessionTaskListProps {
  className?: string;
}

export function SessionTaskList({ className = '' }: SessionTaskListProps) {
  // In-memory state only - no persistence
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Add new task
  const addTask = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedText = inputValue.trim();
    if (!trimmedText) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: trimmedText,
      completed: false,
      createdAt: Date.now()
    };

    setTasks((prev) => [newTask, ...prev]);
    setInputValue('');
  }, [inputValue]);

  // Toggle task completion
  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);

  // Delete task
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  // Clear all completed tasks
  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  }, []);

  // Clear all tasks
  const clearAll = useCallback(() => {
    if (tasks.length > 0 && confirm('Clear all tasks?')) {
      setTasks([]);
    }
  }, [tasks.length]);

  // Filtered tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Session Tasks
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {completedTasks}/{totalTasks}
          </span>
          {totalTasks > 0 && (
            <button
              onClick={clearAll}
              className="text-red-500 hover:text-red-600 transition-colors"
              title="Clear all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-brand-600 dark:text-brand-400 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={addTask} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-4 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Tasks are stored in memory only and will be cleared on page refresh.
        </p>
      </form>

      {/* Filter Tabs */}
      {totalTasks > 0 && (
        <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-gray-600 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f}
              <span className="ml-1.5 text-xs">
                {f === 'all' ? totalTasks : f === 'active' ? activeTasks : completedTasks}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">
              {filter === 'completed' ? '⏳' : filter === 'active' ? '✅' : '📝'}
            </span>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'completed' 
                ? 'No completed tasks yet'
                : filter === 'active'
                ? 'All tasks completed!'
                : 'No tasks added yet'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {filter === 'all' && "Add a task above to get started"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                task.completed
                  ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-500'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-colors flex items-center justify-center ${
                  task.completed
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-gray-300 dark:border-gray-500 hover:border-brand-400'
                }`}
              >
                {task.completed && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Task Text */}
              <span
                className={`flex-1 text-sm ${
                  task.completed
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                {task.text}
              </span>

              {/* Delete Button */}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clear Completed Button */}
      {completedTasks > 0 && (
        <button
          onClick={clearCompleted}
          className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Clear {completedTasks} completed {completedTasks === 1 ? 'task' : 'tasks'}
        </button>
      )}

      {/* Stats Footer */}
      {totalTasks > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{activeTasks} active</span>
            <span>{completedTasks} done</span>
          </div>
        </div>
      )}
    </div>
  );
}
