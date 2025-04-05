"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'inactive';
  joinDate: string;
  performance: number;
}

export type TaskStatus = 'todo' | 'progress' | 'review' | 'complete';

export interface Task {
  id: string;
  title: string;
  priority: 'Important' | 'Medium' | 'Low';
  type: 'Stagging' | 'Production';
  status: TaskStatus;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'message' | 'alert' | 'update';
  read: boolean;
}

export interface Stats {
  totalEmployees: number;
  totalRevenue: string;
  turnoverRate: string;
  attendanceRate: string;
  teamKPI: string;
}

export interface DashboardState {
  currentUser: User | null;
  employees: Employee[];
  tasks: Task[];
  stats: Stats;
  notifications: Notification[];
  messages: Message[];
  loading: boolean;
  error: string | null;
}

// Types for Actions
type Action = 
  | { type: 'SET_CURRENT_USER'; payload: User }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: { id: string; data: Partial<Task> } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_STATS'; payload: Stats }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

type DashboardDispatch = (action: Action) => void;

// Initial state
const initialState: DashboardState = {
  currentUser: null,
  employees: [],
  tasks: [],
  stats: {
    totalEmployees: 0,
    totalRevenue: '$0',
    turnoverRate: '0%',
    attendanceRate: '0%',
    teamKPI: '0%'
  },
  notifications: [],
  messages: [],
  loading: false,
  error: null
};

// Creating Context
const DashboardStateContext = createContext<DashboardState | undefined>(undefined);
const DashboardDispatchContext = createContext<DashboardDispatch | undefined>(undefined);

// Reducer function
function dashboardReducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id 
            ? { ...task, ...action.payload.data } 
            : task
        )
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Provider component
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Initialize mock data
  React.useEffect(() => {
    initializeMockData(dispatch);
  }, []);

  return (
    <DashboardStateContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardStateContext.Provider>
  );
}

// Custom hooks to use the context
export function useDashboardState() {
  const context = useContext(DashboardStateContext);
  if (context === undefined) {
    throw new Error('useDashboardState must be used within a DashboardProvider');
  }
  return context;
}

export function useDashboardDispatch() {
  const context = useContext(DashboardDispatchContext);
  if (context === undefined) {
    throw new Error('useDashboardDispatch must be used within a DashboardProvider');
  }
  return context;
}

export function useDashboard() {
  return {
    state: useDashboardState(),
    dispatch: useDashboardDispatch()
  };
}

// Mock data initialization
function initializeMockData(dispatch: DashboardDispatch) {
  // Mock employee data
  const mockEmployees: Employee[] = [
    {
      id: '1',
      name: "Ann Bergson",
      position: "Lead Designer",
      department: "Design",
      email: "ann.bergson@example.com",
      phone: "+1-202-555-0101",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2020-05-01",
      performance: 85
    },
    {
      id: '2',
      name: "Kierra Rosser",
      position: "UI Designer",
      department: "Design",
      email: "kierra.rosser@example.com",
      phone: "+1-202-555-0102",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2021-03-15",
      performance: 90
    },
    {
      id: '3',
      name: "Terry Philips",
      position: "UI Designer",
      department: "Design",
      email: "terry.philips@example.com",
      phone: "+1-202-555-0103",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2022-01-01",
      performance: 88
    },
    {
      id: '4',
      name: "Jennifer Wilson",
      position: "Frontend Developer",
      department: "Engineering",
      email: "jennifer.wilson@example.com",
      phone: "+1-202-555-0104",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2020-08-15",
      performance: 92
    },
    {
      id: '5',
      name: "Michael Chen",
      position: "Backend Developer",
      department: "Engineering",
      email: "michael.chen@example.com",
      phone: "+1-202-555-0105",
      avatar: "/avatar-placeholder.png",
      status: "on-leave",
      joinDate: "2019-11-05",
      performance: 78
    },
    {
      id: '6',
      name: "Sara Johnson",
      position: "DevOps Engineer",
      department: "Engineering",
      email: "sara.johnson@example.com",
      phone: "+1-202-555-0106",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2021-06-22",
      performance: 81
    },
    {
      id: '7',
      name: "David Kim",
      position: "Marketing Specialist",
      department: "Marketing",
      email: "david.kim@example.com",
      phone: "+1-202-555-0107",
      avatar: "/avatar-placeholder.png",
      status: "inactive",
      joinDate: "2020-03-10",
      performance: 65
    },
    {
      id: '8',
      name: "Melissa Garcia",
      position: "HR Manager",
      department: "HR",
      email: "melissa.garcia@example.com",
      phone: "+1-202-555-0108",
      avatar: "/avatar-placeholder.png",
      status: "active",
      joinDate: "2018-07-19",
      performance: 94
    }
  ];

  // Mock tasks
  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Review employee appraisals',
      priority: 'Important',
      type: 'Stagging',
      status: 'todo'
    },
    {
      id: 'task-2',
      title: 'Onboard new employees',
      priority: 'Medium',
      type: 'Production',
      status: 'progress'
    },
    {
      id: 'task-3',
      title: 'Approve leave requests',
      priority: 'Important',
      type: 'Stagging',
      status: 'review'
    },
    {
      id: 'task-4',
      title: 'Review department budget',
      priority: 'Important',
      type: 'Stagging',
      status: 'complete'
    }
  ];

  // Mock messages
  const mockMessages: Message[] = [
    {
      id: 'msg-1',
      content: 'Hello! How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: 'msg-2',
      content: 'I need help with the employee onboarding process.',
      sender: 'user',
      timestamp: new Date(Date.now() - 3000000).toISOString() // 50 minutes ago
    },
    {
      id: 'msg-3',
      content: 'Sure, I can help with that. What specific part of the onboarding process do you need assistance with?',
      sender: 'assistant',
      timestamp: new Date(Date.now() - 2700000).toISOString() // 45 minutes ago
    }
  ];

  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      title: 'New Message',
      description: 'You have a new message from HR department',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'message',
      read: false
    },
    {
      id: 'notif-2',
      title: 'Task Update',
      description: 'Your task "Review employee appraisals" is due tomorrow',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'alert',
      read: false
    },
    {
      id: 'notif-3',
      title: 'System Update',
      description: 'The system will undergo maintenance tonight at 10 PM',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'update',
      read: true
    }
  ];

  // Mock stats
  const mockStats: Stats = {
    totalEmployees: 323,
    totalRevenue: '$8,903.44',
    turnoverRate: '8%',
    attendanceRate: '94%',
    teamKPI: '82.10%'
  };

  // Mock current user
  const mockUser: User = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '/avatar-placeholder.png',
    role: 'HR Manager'
  };

  dispatch({ type: 'SET_CURRENT_USER', payload: mockUser });
  dispatch({ type: 'SET_EMPLOYEES', payload: mockEmployees });
  dispatch({ type: 'SET_TASKS', payload: mockTasks });
  dispatch({ type: 'SET_STATS', payload: mockStats });
  dispatch({ type: 'SET_NOTIFICATIONS', payload: mockNotifications });
  dispatch({ type: 'SET_MESSAGES', payload: mockMessages });
} 