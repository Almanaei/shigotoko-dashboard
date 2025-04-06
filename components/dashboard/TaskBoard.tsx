"use client";

import { Search, Filter, LayoutGrid, List, Calendar as CalendarIcon, Clock, MoreVertical, Plus } from 'lucide-react';
import { useDashboard, ACTIONS, Task } from '@/lib/DashboardProvider';
import { useState, useRef } from 'react';

interface TaskColumnProps {
  title: string;
  count: number;
  tasks: Task[];
  status: Task['status'];
  onDrop: (taskId: string, newStatus: Task['status']) => void;
}

const TaskColumn = ({ title, count, tasks, status, onDrop }: TaskColumnProps) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    onDrop(taskId, status);
  };

  return (
    <div 
      className={`bg-gray-50 dark:bg-gray-800/40 rounded-lg ${isOver ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
          <span className="bg-white dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-2">
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}

          {tasks.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No tasks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
}

const TaskCard = ({ task }: TaskCardProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="bg-white dark:bg-dark-card p-3 rounded-md shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow dark:hover:border-gray-600 animate-slide-up"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
          <div className="flex mt-2 space-x-1">
            {task.priority === 'Important' && (
              <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>
                Important
              </span>
            )}
            {task.priority === 'Medium' && (
              <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                Medium
              </span>
            )}
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {task.type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

type ViewMode = 'board' | 'list' | 'calendar' | 'timeline';

export default function TaskBoard() {
  const { state, dispatch } = useDashboard();
  const { tasks } = state;
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered tasks
  const filteredTasks = searchTerm 
    ? tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.priority.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : tasks;

  // Grouped tasks by status
  const todoTasks = filteredTasks.filter(task => task.status === 'todo');
  const progressTasks = filteredTasks.filter(task => task.status === 'progress');
  const reviewTasks = filteredTasks.filter(task => task.status === 'review');
  const completeTasks = filteredTasks.filter(task => task.status === 'complete');

  // Handle task drop to change status
  const handleTaskDrop = (taskId: string, newStatus: Task['status']) => {
    dispatch({
      type: ACTIONS.UPDATE_TASK,
      payload: { id: taskId, task: { status: newStatus } }
    });
  };

  // Create a new task
  const handleCreateTask = () => {
    const newId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newId,
      title: 'New Task',
      priority: 'Medium',
      type: 'Stagging',
      status: 'todo'
    };
    
    dispatch({
      type: ACTIONS.ADD_TASK,
      payload: newTask
    });
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark animate-slide-in">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-dark-border">
        <div className="flex flex-col">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Task</h2>
          <div className="flex items-center mt-1">
            <MoreVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            onClick={handleCreateTask}
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-100 dark:border-dark-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">February</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Today is Wednesday, Feb 28th, 2024</p>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-2">
                <div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">A</div>
                <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">B</div>
                <div className="h-6 w-6 rounded-full bg-purple-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">C</div>
                <div className="h-6 w-6 rounded-full bg-gray-400 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">+3</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Board - Daily Task</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button 
              className={`flex items-center justify-center px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'board' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Board
            </button>
            <button 
              className={`flex items-center justify-center px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </button>
            <button 
              className={`flex items-center justify-center px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Calendar
            </button>
            <button 
              className={`flex items-center justify-center px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
              onClick={() => setViewMode('timeline')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Timeline
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search task"
                className="block w-48 pl-10 pr-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <Filter className="h-4 w-4 mr-1.5" />
              Filter
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TaskColumn 
          title="To-do" 
          count={todoTasks.length} 
          tasks={todoTasks}
          status="todo"
          onDrop={handleTaskDrop}
        />
        <TaskColumn 
          title="Progress" 
          count={progressTasks.length} 
          tasks={progressTasks}
          status="progress"
          onDrop={handleTaskDrop}
        />
        <TaskColumn 
          title="Review" 
          count={reviewTasks.length} 
          tasks={reviewTasks}
          status="review"
          onDrop={handleTaskDrop}
        />
        <TaskColumn 
          title="Complete" 
          count={completeTasks.length} 
          tasks={completeTasks}
          status="complete"
          onDrop={handleTaskDrop}
        />
      </div>
    </div>
  );
} 