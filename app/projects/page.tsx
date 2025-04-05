"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard } from '@/lib/DashboardProvider';
import { 
  ACTIONS, 
  Project, 
  ProjectStatus, 
  ProjectLog, 
  Department, 
  Employee 
} from '@/lib/DashboardProvider';
import { 
  Search, 
  PlusCircle, 
  Filter, 
  ChevronDown, 
  Calendar, 
  Users, 
  Clock, 
  BarChart, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  FolderKanban,
  ClipboardList,
  AlertCircle,
  FileText,
  PauseCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function ProjectsPage() {
  const { state, dispatch } = useDashboard();
  const { projects, departments, employees, currentUser } = state;
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'dueDate' | 'progress'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // State for modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Form data for adding/editing projects
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    departmentId: '',
    teamMembers: [],
    startDate: '',
    dueDate: '',
    status: 'planning',
    progress: 0,
    priority: 'Medium',
    budget: undefined,
    logs: []
  });
  
  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    const matchesDepartment = departmentFilter === 'all' || project.departmentId === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });
  
  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'dueDate') {
      return sortOrder === 'asc' 
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    } else if (sortBy === 'progress') {
      return sortOrder === 'asc' 
        ? a.progress - b.progress 
        : b.progress - a.progress;
    }
    return 0;
  });

  // Get department and team member details
  const getDepartmentById = (id: string): Department | undefined => {
    return departments.find(dept => dept.id === id);
  };

  const getEmployeeById = (id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  };

  const getTeamMemberNames = (memberIds: string[]): string => {
    return memberIds
      .map(id => {
        const employee = getEmployeeById(id);
        return employee ? employee.name : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  // Handle project actions
  const handleAddProject = () => {
    // Reset form data
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      name: '',
      description: '',
      departmentId: departments.length > 0 ? departments[0].id : '',
      teamMembers: [],
      startDate: today,
      dueDate: '',
      status: 'planning',
      progress: 0,
      priority: 'Medium',
      budget: undefined,
      logs: []
    });
    setShowAddModal(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({ ...project });
    setShowEditModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const handleTeamMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({
      ...prev,
      teamMembers: selectedOptions
    }));
  };

  // Create project log entry
  const createLogEntry = (action: string, details?: string): ProjectLog => {
    const user = currentUser!;
    return {
      id: `log-${Date.now()}`,
      projectId: selectedProject?.id || '',
      userId: user.id,
      userName: user.name,
      action,
      timestamp: new Date().toISOString(),
      details
    };
  };

  // Submit handlers
  const handleSubmitAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new project with a unique ID
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: formData.name || '',
      description: formData.description || '',
      departmentId: formData.departmentId || '',
      teamMembers: formData.teamMembers || [],
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || '',
      status: formData.status as ProjectStatus || 'planning',
      progress: formData.progress || 0,
      priority: formData.priority as 'Low' | 'Medium' | 'High' | 'Urgent' || 'Medium',
      budget: formData.budget,
      logs: []
    };
    
    // Add creation log
    const logEntry = createLogEntry('Created project');
    newProject.logs.push(logEntry);
    
    // Dispatch actions
    dispatch({ type: ACTIONS.ADD_PROJECT, payload: newProject });
    
    // Close modal
    setShowAddModal(false);
  };

  const handleSubmitEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProject && formData.id) {
      // Create log for the edit action
      const logEntry = createLogEntry('Updated project details');
      
      // Update project with log
      dispatch({
        type: ACTIONS.UPDATE_PROJECT,
        payload: {
          id: formData.id,
          project: {
            ...formData,
            logs: [...(selectedProject.logs || []), logEntry]
          }
        }
      });
      
      // Close modal
      setShowEditModal(false);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedProject) {
      dispatch({
        type: ACTIONS.DELETE_PROJECT,
        payload: selectedProject.id
      });
      setShowDeleteModal(false);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ProjectStatus }) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    
    switch (status) {
      case 'planning':
        bgColor = 'bg-blue-100 dark:bg-blue-900/20';
        textColor = 'text-blue-700 dark:text-blue-400';
        icon = <ClipboardList className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'in-progress':
        bgColor = 'bg-amber-100 dark:bg-amber-900/20';
        textColor = 'text-amber-700 dark:text-amber-400';
        icon = <Clock className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'on-hold':
        bgColor = 'bg-purple-100 dark:bg-purple-900/20';
        textColor = 'text-purple-700 dark:text-purple-400';
        icon = <PauseCircle className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'completed':
        bgColor = 'bg-green-100 dark:bg-green-900/20';
        textColor = 'text-green-700 dark:text-green-400';
        icon = <CheckCircle className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'cancelled':
        bgColor = 'bg-red-100 dark:bg-red-900/20';
        textColor = 'text-red-700 dark:text-red-400';
        icon = <XCircle className="w-3.5 h-3.5 mr-1" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    let bgColor = '';
    let textColor = '';
    
    switch (priority) {
      case 'Low':
        bgColor = 'bg-gray-100 dark:bg-gray-800';
        textColor = 'text-gray-700 dark:text-gray-400';
        break;
      case 'Medium':
        bgColor = 'bg-blue-100 dark:bg-blue-900/20';
        textColor = 'text-blue-700 dark:text-blue-400';
        break;
      case 'High':
        bgColor = 'bg-amber-100 dark:bg-amber-900/20';
        textColor = 'text-amber-700 dark:text-amber-400';
        break;
      case 'Urgent':
        bgColor = 'bg-red-100 dark:bg-red-900/20';
        textColor = 'text-red-700 dark:text-red-400';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {priority}
      </span>
    );
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            onClick={handleAddProject}
          >
            <PlusCircle className="h-4 w-4" />
            Add Project
          </button>
        </div>

        {/* Filters and search */}
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark mb-6 animate-slide-in">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
                >
                  <option value="all">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy as 'name' | 'dueDate' | 'progress');
                    setSortOrder(newSortOrder as 'asc' | 'desc');
                  }}
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="dueDate-asc">Due Date (Earliest)</option>
                  <option value="dueDate-desc">Due Date (Latest)</option>
                  <option value="progress-asc">Progress (Low to High)</option>
                  <option value="progress-desc">Progress (High to Low)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Projects grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {sortedProjects.map(project => {
              const department = getDepartmentById(project.departmentId);
              const daysLeft = Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div 
                  key={project.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start">
                      <div 
                        className="w-10 h-10 rounded-md flex items-center justify-center mr-3 shrink-0" 
                        style={{ backgroundColor: department?.color || '#64748b' }}
                      >
                        <FolderKanban className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{project.name}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <StatusBadge status={project.status} />
                          <PriorityBadge priority={project.priority} />
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleDeleteProject(project)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1.5" />
                        <span>
                          {daysLeft > 0 
                            ? `${daysLeft} days left` 
                            : daysLeft === 0 
                              ? 'Due today' 
                              : `${Math.abs(daysLeft)} days overdue`
                          }
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 mr-1.5" />
                        <span>{project.teamMembers.length}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${project.progress}%`,
                            backgroundColor: department?.color || '#3b82f6'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <button
                      className="w-full text-center py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleViewDetails(project)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
            
            {sortedProjects.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <FolderKanban className="h-12 w-12 mb-3 opacity-20" />
                <p>No projects found</p>
                <button 
                  className="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  onClick={handleAddProject}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add a project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Project Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Project</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowAddModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitAddProject}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <select
                        name="departmentId"
                        required
                        value={formData.departmentId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        required
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        required
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        required
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="planning">Planning</option>
                        <option value="in-progress">In Progress</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Progress (%)
                      </label>
                      <input
                        type="number"
                        name="progress"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={handleNumberInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Budget (Optional)
                      </label>
                      <input
                        type="number"
                        name="budget"
                        min="0"
                        value={formData.budget || ''}
                        onChange={handleNumberInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Team Members
                      </label>
                      <select
                        multiple
                        name="teamMembers"
                        value={formData.teamMembers}
                        onChange={handleTeamMemberChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        size={4}
                      >
                        {employees
                          .filter(emp => emp.status === 'active')
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.position} ({emp.department})
                            </option>
                          ))
                        }
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Hold Ctrl/Cmd to select multiple members
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-dark-border gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Project Modal */}
        {showEditModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Project</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowEditModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmitEditProject}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Department
                      </label>
                      <select
                        name="departmentId"
                        required
                        value={formData.departmentId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        required
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        required
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        required
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="planning">Planning</option>
                        <option value="in-progress">In Progress</option>
                        <option value="on-hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Progress (%)
                      </label>
                      <input
                        type="number"
                        name="progress"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={handleNumberInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Budget (Optional)
                      </label>
                      <input
                        type="number"
                        name="budget"
                        min="0"
                        value={formData.budget || ''}
                        onChange={handleNumberInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Team Members
                      </label>
                      <select
                        multiple
                        name="teamMembers"
                        value={formData.teamMembers}
                        onChange={handleTeamMemberChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        size={4}
                      >
                        {employees
                          .filter(emp => emp.status === 'active')
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.position} ({emp.department})
                            </option>
                          ))
                        }
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Hold Ctrl/Cmd to select multiple members
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-dark-border gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full animate-scale-in p-6">
              <div className="flex items-start mb-4">
                <div className="mr-3 bg-red-100 dark:bg-red-900/20 p-2 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Delete Project</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete <span className="font-medium">{selectedProject.name}</span>? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  onClick={handleConfirmDelete}
                >
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Details Modal */}
        {showDetailsModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-4xl w-full animate-scale-in max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Project Details</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left column with project details */}
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-10 h-10 rounded-md flex items-center justify-center mr-3" 
                        style={{ backgroundColor: getDepartmentById(selectedProject.departmentId)?.color || '#64748b' }}
                      >
                        <FolderKanban className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProject.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <StatusBadge status={selectedProject.status} />
                          <PriorityBadge priority={selectedProject.priority} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                      <p className="text-gray-600 dark:text-gray-400">{selectedProject.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {getDepartmentById(selectedProject.departmentId)?.name || 'Unknown'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedProject.budget ? `$${selectedProject.budget.toLocaleString()}` : 'Not specified'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(selectedProject.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {new Date(selectedProject.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progress</h4>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Completion</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{selectedProject.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                          <div
                            className="h-2.5 rounded-full"
                            style={{ 
                              width: `${selectedProject.progress}%`,
                              backgroundColor: getDepartmentById(selectedProject.departmentId)?.color || '#3b82f6'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team Members</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedProject.teamMembers.length > 0 ? (
                          selectedProject.teamMembers.map(memberId => {
                            const employee = getEmployeeById(memberId);
                            return employee ? (
                              <div key={memberId} className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 overflow-hidden">
                                  {employee.avatar ? (
                                    <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">{employee.name.charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{employee.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{employee.position}</p>
                                </div>
                              </div>
                            ) : null;
                          })
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No team members assigned</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column with activity log */}
                  <div className="flex-1 border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-6 border-gray-200 dark:border-dark-border">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Activity Log
                    </h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {selectedProject.logs && selectedProject.logs.length > 0 ? (
                        [...selectedProject.logs]
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(log => (
                            <div key={log.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 py-1">
                              <div className="flex justify-between mb-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{log.userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(log.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{log.action}</p>
                              {log.details && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{log.details}</p>
                              )}
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No activity recorded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end p-6 border-t border-gray-200 dark:border-dark-border gap-3">
                <button
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditProject(selectedProject);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1.5" />
                  Edit Project
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                  onClick={() => setShowDetailsModal(false)}
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