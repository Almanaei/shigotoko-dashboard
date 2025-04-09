"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard } from '@/lib/DashboardProvider';
import { Project, ProjectStatus } from '@/lib/DashboardProvider';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Search, 
  FolderKanban, 
  Clock, 
  X,
  List,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';

// Days of the week
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SchedulePage() {
  const { state, dispatch } = useDashboard();
  const { projects, departments } = state;

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  // Filter state
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Event detail state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  // API state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from API when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Only fetch projects if we don't already have them
        if (projects.length === 0) {
          const response = await fetch('/api/projects');
          if (!response.ok) throw new Error('Failed to fetch projects');
          const data = await response.json();
          
          // Update the dashboard state with projects
          dispatch({ type: 'SET_PROJECTS', payload: data });
        }
      } catch (err) {
        setError('Failed to load project data. Please try again later.');
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [dispatch, projects.length]);

  // Generate calendar days when month or view mode changes
  useEffect(() => {
    if (viewMode === 'month') {
      generateMonthDays(currentDate);
    } else {
      generateWeekDays(currentDate);
    }
  }, [currentDate, viewMode]);

  // Generate days for month view
  const generateMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Generate array of dates for the month view calendar
    const days: Date[] = [];
    
    // Add previous month's days to fill the first row
    for (let i = firstDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete the grid (up to 42 days for 6 rows)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    setCalendarDays(days);
  };

  // Generate days for week view
  const generateWeekDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const currentDayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    const days: Date[] = [];
    
    // Start from Sunday of the current week
    for (let i = 0; i < 7; i++) {
      days.push(new Date(year, month, day - currentDayOfWeek + i));
    }
    
    setCalendarDays(days);
  };

  // Navigate to previous month/week
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate to next month/week
  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Switch between month and week view
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'month' ? 'week' : 'month');
  };

  // Filter projects based on search term, department and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = departmentFilter === 'all' || project.departmentId === departmentFilter;
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Check if a project has an event on a specific day (start date, due date)
  const getProjectsForDay = (day: Date) => {
    const dayEvents: { project: Project; type: 'start' | 'due' }[] = [];
    
    filteredProjects.forEach(project => {
      const startDate = new Date(project.startDate);
      const dueDate = new Date(project.dueDate);
      
      // Reset time part for comparison
      startDate.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(day);
      compareDate.setHours(0, 0, 0, 0);
      
      if (startDate.getTime() === compareDate.getTime()) {
        dayEvents.push({ project, type: 'start' });
      }
      
      if (dueDate.getTime() === compareDate.getTime()) {
        dayEvents.push({ project, type: 'due' });
      }
    });
    
    return dayEvents;
  };

  // Get department color by id
  const getDepartmentColor = (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department?.color || '#64748b';
  };

  // Get department name by id
  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(dept => dept.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Show project details modal
  const showProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  // Get status style based on project status
  const getStatusStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'on-hold':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();
  };

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear();
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule</h1>
          
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {/* Department filter */}
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              disabled={isLoading}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            
            {/* Status filter */}
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              disabled={isLoading}
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            {/* View toggle */}
            <button
              onClick={toggleViewMode}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              disabled={isLoading}
            >
              {viewMode === 'month' ? (
                <>
                  <List className="h-4 w-4" />
                  <span>Week View</span>
                </>
              ) : (
                <>
                  <CalendarDays className="h-4 w-4" />
                  <span>Month View</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-md text-red-700 dark:text-red-400 flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {isLoading ? (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark mb-6 p-8 flex justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-blue-600 dark:text-blue-400 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark mb-6 overflow-hidden">
            {/* Calendar header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevious}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <button
                  onClick={goToNext}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewMode === 'month'
                    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    : `Week of ${formatDate(calendarDays[0] || new Date())}`
                  }
                </h2>
              </div>
              
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Today
              </button>
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50">
              {DAYS.map(day => (
                <div 
                  key={day} 
                  className="py-2 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'grid-rows-6' : 'grid-rows-1'}`}>
              {calendarDays.map((day, index) => {
                const isCurrentDay = isToday(day);
                const inCurrentMonth = isCurrentMonth(day);
                const projectsForDay = getProjectsForDay(day);
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[100px] p-2 border-b border-r border-gray-200 dark:border-dark-border relative ${
                      !inCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/30 text-gray-400 dark:text-gray-600' : ''
                    }`}
                  >
                    <div className={`flex justify-between items-center mb-1`}>
                      <span className={`text-sm font-medium ${
                        isCurrentDay 
                          ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {day.getDate()}
                      </span>
                      {projectsForDay.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {projectsForDay.length} event{projectsForDay.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1.5 overflow-y-auto max-h-[80px]">
                      {projectsForDay.map((event, i) => (
                        <div 
                          key={`${event.project.id}-${event.type}-${i}`}
                          onClick={() => showProjectDetail(event.project)}
                          className="text-xs p-1.5 rounded cursor-pointer truncate flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: `${getDepartmentColor(event.project.departmentId)}20` }}
                        >
                          {event.type === 'start' ? (
                            <FolderKanban className="h-3 w-3 shrink-0" style={{ color: getDepartmentColor(event.project.departmentId) }} />
                          ) : (
                            <Clock className="h-3 w-3 shrink-0" style={{ color: getDepartmentColor(event.project.departmentId) }} />
                          )}
                          <span style={{ color: getDepartmentColor(event.project.departmentId) }}>
                            {event.type === 'start' ? 'Start: ' : 'Due: '}
                            {event.project.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {projects.length === 0 && !isLoading && (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600 opacity-60" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">No projects available</h3>
            <p className="text-gray-600 dark:text-gray-400">There are no projects to display on the calendar.</p>
          </div>
        )}
        
        {/* Project details modal */}
        {showProjectDetails && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full animate-scale-in">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedProject.name}</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowProjectDetails(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex items-start mb-4">
                  <div 
                    className="w-10 h-10 rounded-md flex items-center justify-center mr-3 shrink-0" 
                    style={{ backgroundColor: getDepartmentColor(selectedProject.departmentId) }}
                  >
                    <FolderKanban className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {selectedProject.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(selectedProject.status)}`}>
                        {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1).replace('-', ' ')}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {getDepartmentName(selectedProject.departmentId)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProject.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</h4>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(new Date(selectedProject.startDate))}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</h4>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(new Date(selectedProject.dueDate))}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedProject.priority}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mr-2">
                        <div 
                          className="h-2.5 rounded-full" 
                          style={{ 
                            width: `${selectedProject.progress}%`,
                            backgroundColor: getDepartmentColor(selectedProject.departmentId)
                          }}
                        ></div>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">{selectedProject.progress}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Members</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 ? (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {selectedProject.teamMembers.length} team members assigned
                      </p>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No team members assigned
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latest Activity</h4>
                  {selectedProject.logs && selectedProject.logs.length > 0 ? (
                    <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {selectedProject.logs[selectedProject.logs.length - 1].userName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(selectedProject.logs[selectedProject.logs.length - 1].timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedProject.logs[selectedProject.logs.length - 1].action}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">No activity recorded</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-dark-border">
                <button
                  onClick={() => setShowProjectDetails(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 