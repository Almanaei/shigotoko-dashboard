"use client";

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard } from '@/lib/DashboardProvider';
import { ACTIONS, Document } from '@/lib/DashboardProvider';
import { API } from '@/lib/api';
import { 
  Search, 
  PlusCircle, 
  Filter, 
  FileText, 
  File, 
  FileArchive,
  Download,
  Share,
  Trash2,
  Edit2,
  ChevronDown,
  X,
  Check,
  Loader2,
  Upload,
  Tag,
  Globe,
  Users,
  FolderKanban,
  Image,
  FileCode,
  FileText as FileTextIcon,
  FileText as FilePdfIcon,
  FileText as FileSpreadsheetIcon,
  FileText as FileVideoIcon
} from 'lucide-react';

// File type icons mapping
const fileTypeIcons: Record<string, React.ComponentType<any>> = {
  'image': Image,
  'pdf': FilePdfIcon,
  'document': FileTextIcon,
  'spreadsheet': FileSpreadsheetIcon,
  'code': FileCode,
  'video': FileVideoIcon,
  'archive': FileArchive,
  'other': File
};

export default function DocumentsPage() {
  const { state, dispatch } = useDashboard();
  const { documents, employees, projects, currentUser } = state;
  
  // File input ref for hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'uploadDate' | 'size'>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // State for document operations
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State for document upload
  const [uploadForm, setUploadForm] = useState({
    name: '',
    file: null as File | null,
    description: '',
    projectId: '',
    tags: [] as string[],
    sharedWith: [] as string[]
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Helper to show success notification
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    
    const timer = setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  };
  
  // Load documents on page load
  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const documentsData = await API.documents.getAll();
        dispatch({
          type: ACTIONS.SET_DOCUMENTS,
          payload: documentsData as Document[]
        });
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError('Failed to load documents. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocuments();
  }, [dispatch]);
  
  // Filter documents based on search term and filters
  const filteredDocuments = documents.filter(doc => {
    // Filter by search term (name or description)
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Filter by project
    const matchesProject = 
      projectFilter === 'all' || 
      (projectFilter === 'none' && !doc.projectId) || 
      doc.projectId === projectFilter;
    
    // Filter by file type
    const matchesFileType = 
      fileTypeFilter === 'all' || 
      doc.fileType.includes(fileTypeFilter);
    
    return matchesSearch && matchesProject && matchesFileType;
  });
  
  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'uploadDate') {
      return sortOrder === 'asc'
        ? new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        : new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    } else if (sortBy === 'size') {
      return sortOrder === 'asc'
        ? a.size - b.size
        : b.size - a.size;
    }
    return 0;
  });
  
  // Helper to get project by ID
  const getProjectById = (id: string) => {
    return projects.find(project => project.id === id);
  };
  
  // Helper to get user by ID
  const getUserById = (id: string) => {
    return employees.find(employee => employee.id === id);
  };
  
  // Handle file upload button click
  const handleUploadClick = () => {
    setShowUploadModal(true);
  };
  
  // Handle file selection from file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Update upload form with file details
    setUploadForm(prev => ({
      ...prev,
      file,
      name: file.name, // Default name to file name
    }));
  };
  
  // Handle triggering file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle form input change
  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle tags input change (comma-separated)
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    setUploadForm(prev => ({
      ...prev,
      tags
    }));
  };
  
  // Handle shared users selection
  const handleSharedWithChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setUploadForm(prev => ({
      ...prev,
      sharedWith: selectedOptions
    }));
  };
  
  // Handle upload form submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const documentData = {
        name: uploadForm.name || uploadForm.file.name,
        file: uploadForm.file,
        description: uploadForm.description,
        projectId: uploadForm.projectId || undefined,
        tags: uploadForm.tags.length > 0 ? uploadForm.tags : undefined,
        sharedWith: uploadForm.sharedWith.length > 0 ? uploadForm.sharedWith : undefined
      };
      
      // Call API to upload document
      const uploadedDocument = await API.documents.upload(documentData);
      
      // Add document to state
      dispatch({
        type: ACTIONS.ADD_DOCUMENT,
        payload: uploadedDocument as Document
      });
      
      // Reset form
      setUploadForm({
        name: '',
        file: null,
        description: '',
        projectId: '',
        tags: [],
        sharedWith: []
      });
      
      // Close modal
      setShowUploadModal(false);
      
      // Show success message
      showSuccessNotification('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document share
  const handleShareDocument = async (userIds: string[]) => {
    if (!selectedDocument) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call API to share document
      await API.documents.shareWith(selectedDocument.id, userIds);
      
      // Update document in state
      dispatch({
        type: ACTIONS.UPDATE_DOCUMENT,
        payload: {
          id: selectedDocument.id,
          document: {
            sharedWith: userIds
          }
        }
      });
      
      // Close modal
      setShowShareModal(false);
      
      // Show success message
      showSuccessNotification('Document shared successfully');
    } catch (error) {
      console.error('Error sharing document:', error);
      setError('Failed to share document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle document delete
  const handleDeleteDocument = async () => {
    if (!selectedDocument) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call API to delete document
      await API.documents.delete(selectedDocument.id);
      
      // Remove document from state
      dispatch({
        type: ACTIONS.DELETE_DOCUMENT,
        payload: selectedDocument.id
      });
      
      // Close modal
      setShowDeleteModal(false);
      
      // Show success message
      showSuccessNotification('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            onClick={handleUploadClick}
          >
            <PlusCircle className="h-4 w-4" />
            Upload Document
          </button>
        </div>
        
        {/* Success notification */}
        {showSuccess && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-lg animate-slide-in-right z-50">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
            <button 
              className="ml-4 text-green-700"
              onClick={() => setShowSuccess(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-red-600 dark:text-red-400">
            <X className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button
              className="ml-auto text-red-600 dark:text-red-400"
              onClick={() => setError('')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Hidden file input */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Document</h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleUploadSubmit}>
                  {/* File Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      File
                    </label>
                    {!uploadForm.file ? (
                      <div 
                        onClick={triggerFileInput}
                        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/20"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Click to select a file or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Supports documents, images, PDFs, and more
                        </p>
                      </div>
                    ) : (
                      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-md flex items-center justify-center text-white bg-blue-500 mr-3">
                            <File className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {uploadForm.file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {uploadForm.file.type} • {(uploadForm.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Name */}
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={uploadForm.name}
                      onChange={handleUploadFormChange}
                      placeholder={uploadForm.file ? uploadForm.file.name : "Document name"}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={uploadForm.description}
                      onChange={handleUploadFormChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                      placeholder="Enter a description for the document"
                    ></textarea>
                  </div>
                  
                  {/* Project */}
                  <div className="mb-4">
                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project (optional)
                    </label>
                    <select
                      id="projectId"
                      name="projectId"
                      value={uploadForm.projectId}
                      onChange={handleUploadFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">No Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Tags */}
                  <div className="mb-4">
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={uploadForm.tags.join(', ')}
                      onChange={handleTagsChange}
                      placeholder="e.g. report, marketing, Q2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  
                  {/* Share with */}
                  <div className="mb-4">
                    <label htmlFor="sharedWith" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Share with (optional, hold Ctrl/Cmd to select multiple)
                    </label>
                    <select
                      id="sharedWith"
                      name="sharedWith"
                      multiple
                      value={uploadForm.sharedWith}
                      onChange={handleSharedWithChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                      size={3}
                    >
                      {employees.filter(emp => emp.id !== currentUser?.id).map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !uploadForm.file}
                      className={`
                        px-4 py-2 text-sm font-medium text-white rounded-lg
                        ${isLoading || !uploadForm.file
                          ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'}
                      `}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin inline-block" />
                          Uploading...
                        </>
                      ) : (
                        'Upload Document'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
          </div>
        ) : (
          <div>
            {/* Filters and search */}
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark mb-6 animate-slide-in">
              <div className="p-4 border-b border-gray-200 dark:border-dark-border">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Search bar */}
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                    />
                  </div>
                  
                  {/* Project filter */}
                  <div className="relative">
                    <div className="flex items-center">
                      <FolderKanban className="h-5 w-5 text-gray-400 mr-2" />
                      <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Projects</option>
                        <option value="none">No Project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* File type filter */}
                  <div className="relative">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      <select
                        value={fileTypeFilter}
                        onChange={(e) => setFileTypeFilter(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="pdf">PDFs</option>
                        <option value="document">Documents</option>
                        <option value="spreadsheet">Spreadsheets</option>
                        <option value="code">Code Files</option>
                        <option value="video">Videos</option>
                        <option value="archive">Archives</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Sort options */}
                  <div className="relative">
                    <div className="flex items-center">
                      <Filter className="h-5 w-5 text-gray-400 mr-2" />
                      <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                          const [newSortBy, newSortOrder] = e.target.value.split('-');
                          setSortBy(newSortBy as any);
                          setSortOrder(newSortOrder as any);
                        }}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="uploadDate-desc">Newest First</option>
                        <option value="uploadDate-asc">Oldest First</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="size-desc">Largest First</option>
                        <option value="size-asc">Smallest First</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Document list */}
            {sortedDocuments.length === 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark p-8 text-center animate-slide-in">
                <div className="flex flex-col items-center justify-center">
                  <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No documents found</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                    {searchTerm || projectFilter !== 'all' || fileTypeFilter !== 'all' 
                      ? "No documents match your search criteria. Try adjusting your filters."
                      : "You haven't uploaded any documents yet. Click 'Upload Document' to get started."}
                  </p>
                  <button
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-in">
                {sortedDocuments.map(document => {
                  // Get file icon based on type
                  const fileType = document.fileType;
                  let IconComponent: React.ComponentType<any> = File;
                  
                  if (fileType.includes('image')) {
                    IconComponent = fileTypeIcons.image;
                  } else if (fileType.includes('pdf')) {
                    IconComponent = fileTypeIcons.pdf;
                  } else if (fileType.includes('document') || fileType.includes('msword') || fileType.includes('wordprocessing')) {
                    IconComponent = fileTypeIcons.document;
                  } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
                    IconComponent = fileTypeIcons.spreadsheet;
                  } else if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css') || fileType.includes('json')) {
                    IconComponent = fileTypeIcons.code;
                  } else if (fileType.includes('video')) {
                    IconComponent = fileTypeIcons.video;
                  } else if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('compressed')) {
                    IconComponent = fileTypeIcons.archive;
                  } else {
                    IconComponent = fileTypeIcons.other;
                  }
                  
                  // Format date
                  const uploadDate = new Date(document.uploadDate);
                  const formattedDate = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }).format(uploadDate);
                  
                  // Format file size
                  const formatFileSize = (bytes: number) => {
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                  };
                  
                  return (
                    <div 
                      key={document.id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-card-dark overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-5">
                        <div className="flex items-start mb-3">
                          <div className="w-10 h-10 rounded-md flex items-center justify-center text-white bg-blue-500 mr-3">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                              {document.name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>{formattedDate}</span>
                              <span className="mx-2">•</span>
                              <span>{formatFileSize(document.size)}</span>
                              {document.projectId && (
                                <>
                                  <span className="mx-2">•</span>
                                  <FolderKanban className="h-3 w-3 mr-1" />
                                  <span>{getProjectById(document.projectId)?.name || 'Unknown Project'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {document.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        {/* Tags */}
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {document.tags.slice(0, 3).map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                +{document.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Shared with */}
                        {document.sharedWith && document.sharedWith.length > 0 && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <Users className="h-3 w-3 mr-1" />
                            <span>Shared with {document.sharedWith.length} {document.sharedWith.length === 1 ? 'user' : 'users'}</span>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button 
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowDetailsModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            View Details
                          </button>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Handle download logic
                                window.open(document.url, '_blank');
                              }}
                              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedDocument(document);
                                setShowShareModal(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Share"
                            >
                              <Share className="h-4 w-4" />
                            </button>
                            
                            {document.uploadedById === currentUser?.id && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedDocument(document);
                                    // Handle edit logic
                                  }}
                                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedDocument(document);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Document Details Modal */}
      {showDetailsModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Document Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6 flex items-start">
                <div className="w-16 h-16 rounded-md flex items-center justify-center text-white bg-blue-500 mr-4">
                  {(() => {
                    const fileType = selectedDocument.fileType;
                    let IconComponent: React.ComponentType<any> = File;
                    
                    if (fileType.includes('image')) {
                      IconComponent = fileTypeIcons.image;
                    } else if (fileType.includes('pdf')) {
                      IconComponent = fileTypeIcons.pdf;
                    } else if (fileType.includes('document') || fileType.includes('msword') || fileType.includes('wordprocessing')) {
                      IconComponent = fileTypeIcons.document;
                    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) {
                      IconComponent = fileTypeIcons.spreadsheet;
                    } else if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('html') || fileType.includes('css') || fileType.includes('json')) {
                      IconComponent = fileTypeIcons.code;
                    } else if (fileType.includes('video')) {
                      IconComponent = fileTypeIcons.video;
                    } else if (fileType.includes('zip') || fileType.includes('archive') || fileType.includes('compressed')) {
                      IconComponent = fileTypeIcons.archive;
                    }
                    
                    return <IconComponent className="h-8 w-8" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {selectedDocument.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedDocument.fileType} • {(selectedDocument.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Uploaded by
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedDocument.uploadedBy}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Upload date
                  </h4>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                  </p>
                </div>
                
                {selectedDocument.projectId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {getProjectById(selectedDocument.projectId)?.name || 'Unknown Project'}
                    </p>
                  </div>
                )}
                
                {selectedDocument.description && (
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </h4>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {selectedDocument.description}
                    </p>
                  </div>
                )}
                
                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDocument.sharedWith && selectedDocument.sharedWith.length > 0 && (
                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shared with
                    </h4>
                    <ul className="space-y-2">
                      {selectedDocument.sharedWith.map(userId => {
                        const user = employees.find(emp => emp.id === userId);
                        return (
                          <li key={userId} className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 mr-2">
                              {user?.name.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {user?.name || 'Unknown User'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Close
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      window.open(selectedDocument.url, '_blank');
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-lg flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowShareModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Share Document</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Select users to share &quot;{selectedDocument.name}&quot; with:
              </p>
              
              <div className="mb-6">
                <select
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:text-white"
                  size={6}
                  value={selectedDocument.sharedWith || []}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
                    setSelectedDocument({
                      ...selectedDocument,
                      sharedWith: selectedOptions
                    });
                  }}
                >
                  {employees.filter(emp => emp.id !== currentUser?.id).map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Hold Ctrl/Cmd to select multiple users
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleShareDocument(selectedDocument.sharedWith || [])}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-lg flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Share className="h-4 w-4 mr-2" />
                      Save Sharing Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Document</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Are you sure you want to delete &quot;{selectedDocument.name}&quot;? This action cannot be undone.
                </p>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <p>The document will be permanently deleted for all users.</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDocument}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-lg flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 