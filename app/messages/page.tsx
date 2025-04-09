"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/dashboard/Layout';
import { useDashboard } from '@/lib/DashboardProvider';
import { formatDistanceToNow } from 'date-fns';
import { Archive, MessagesSquare, Download, Loader2, CalendarIcon, PlusCircle, Settings, X } from 'lucide-react';

// Define types for archived messages
interface ArchivedMessage {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: string;
  isEmployee: boolean;
  archiveMonth: string;
}

export default function MessagesArchivePage() {
  const { state } = useDashboard();
  const { currentUser, employees } = state;
  
  // State for archived messages
  const [archives, setArchives] = useState<ArchivedMessage[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // State for archive creation
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isCreatingArchive, setIsCreatingArchive] = useState(false);
  const [newArchiveMonth, setNewArchiveMonth] = useState(
    new Date().toISOString().substring(0, 7) // Current month in YYYY-MM format
  );
  const [newArchiveName, setNewArchiveName] = useState('');
  const [createArchiveError, setCreateArchiveError] = useState<string | null>(null);
  
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'Admin';
  
  // Load available archive months
  useEffect(() => {
    const loadAvailableMonths = async () => {
      try {
        const response = await fetch('/api/messages/archives/months');
        if (response.ok) {
          const data = await response.json();
          setAvailableMonths(data.months);
          if (data.months.length > 0) {
            setSelectedMonth(data.months[0]);
          }
        } else {
          console.error('Error fetching archive months:', response.status);
          setArchiveError('Failed to load archive months.');
        }
      } catch (error) {
        console.error('Error fetching archive months:', error);
        setArchiveError('Failed to load archive months. Please try again.');
      }
    };
    
    loadAvailableMonths();
  }, []);
  
  // Load archived messages when selected month changes
  useEffect(() => {
    if (!selectedMonth) return;
    
    const loadArchives = async () => {
      setIsLoadingArchives(true);
      setArchiveError(null);
      
      try {
        const response = await fetch(`/api/messages/archives?month=${selectedMonth}`);
        if (response.ok) {
          const data = await response.json();
          setArchives(data.messages);
        } else {
          console.error('Error fetching archive messages:', response.status);
          setArchiveError('Failed to load archived messages.');
        }
      } catch (error) {
        console.error('Error fetching archive messages:', error);
        setArchiveError('Failed to load archived messages. Please try again.');
      } finally {
        setIsLoadingArchives(false);
      }
    };
    
    loadArchives();
  }, [selectedMonth]);
  
  // Format archive month for display
  const formatArchiveMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`;
  };
  
  // Group archived messages by date
  const groupMessagesByDate = (messageList: ArchivedMessage[]) => {
    const groups: {date: string, messages: ArchivedMessage[]}[] = [];
    
    // Clone and ensure messages are in chronological order
    const orderedMessages = [...messageList].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    orderedMessages.forEach(message => {
      const messageDate = new Date(message.timestamp);
      const dateString = messageDate.toDateString();
      
      // Find existing group or create new one
      let group = groups.find(g => g.date === dateString);
      if (!group) {
        group = { date: dateString, messages: [] };
        groups.push(group);
      }
      
      group.messages.push(message);
    });
    
    // Sort groups by date (oldest first)
    groups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return groups;
  };
  
  // Helper to get sender info
  const getSenderInfo = (senderId: string, messageSenderName?: string, messageSenderAvatar?: string | null) => {
    // Check if it's the current user
    if (currentUser && senderId === currentUser.id) {
      return {
        name: 'You',
        avatar: currentUser.avatar,
        isCurrentUser: true
      };
    }
    
    // Look in employees
    const employee = employees.find(emp => emp.id === senderId);
    if (employee) {
      return {
        name: employee.name,
        avatar: employee.avatar,
        isCurrentUser: false
      };
    }
    
    // Use the message's senderName and avatar if provided, or fallback to defaults
    return {
      name: messageSenderName || 'Team Member',
      avatar: messageSenderAvatar || '/avatar-placeholder.png',
      isCurrentUser: false
    };
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    
    // If it's today, just show the time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show relative time
    return formatDistanceToNow(messageDate, { addSuffix: true });
  };
  
  // Export archives to CSV
  const exportToCSV = () => {
    if (archives.length === 0 || !selectedMonth) return;
    
    setIsExporting(true);
    
    try {
      // Sort messages by timestamp (oldest first)
      const sortedMessages = [...archives].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Create CSV header
      const csvHeader = ['Date', 'Time', 'Sender', 'Message'];
      
      // Create CSV content
      const csvContent = sortedMessages.map(message => {
        const date = new Date(message.timestamp);
        const dateStr = date.toLocaleDateString();
        const timeStr = date.toLocaleTimeString();
        const sender = message.senderName || 'Unknown User';
        // Escape quotes in content and wrap in quotes
        const escapedContent = `"${message.content.replace(/"/g, '""')}"`;
        
        return [dateStr, timeStr, sender, escapedContent].join(',');
      });
      
      // Combine header and content
      const csv = [csvHeader.join(','), ...csvContent].join('\n');
      
      // Create file object and download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set file name with month and date
      const fileName = `message-archive-${selectedMonth}.csv`;
      
      // Configure and trigger download
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Success message
      alert(`Export successful! Downloaded ${archives.length} messages.`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export messages. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Create a new archive manually
  const createArchive = async () => {
    setCreateArchiveError(null);
    setIsCreatingArchive(true);
    
    try {
      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(newArchiveMonth)) {
        setCreateArchiveError('Invalid month format. Use YYYY-MM.');
        setIsCreatingArchive(false);
        return;
      }
      
      // Create archive with the API
      const response = await fetch('/api/messages/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: newArchiveMonth,
          customName: newArchiveName.trim() || undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh available months and select the new one
        const monthsResponse = await fetch('/api/messages/archives/months');
        if (monthsResponse.ok) {
          const monthsData = await monthsResponse.json();
          setAvailableMonths(monthsData.months);
          setSelectedMonth(newArchiveMonth);
        }
        
        // Success message and close panel
        alert(`Successfully created archive for ${formatArchiveMonth(newArchiveMonth)}${newArchiveName ? ` named "${newArchiveName}"` : ''}.`);
        setShowAdminPanel(false);
        setNewArchiveName('');
      } else {
        setCreateArchiveError(data.error || 'Failed to create archive.');
      }
    } catch (error) {
      console.error('Error creating archive:', error);
      setCreateArchiveError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreatingArchive(false);
    }
  };
  
  const groupedArchives = groupMessagesByDate(archives);
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Archives</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Access and review past team conversations
          </p>
        </div>
        
        {/* Admin panel for creating archives */}
        {isAdmin && showAdminPanel && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-blue-500" />
                Create New Archive
              </h3>
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Month to Archive (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={newArchiveMonth}
                    onChange={(e) => setNewArchiveMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                    disabled={isCreatingArchive}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the month you want to archive. This will create a new archive for all current messages.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Archive Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newArchiveName}
                    onChange={(e) => setNewArchiveName(e.target.value)}
                    placeholder="E.g. Project Launch, Team Offsite"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                    disabled={isCreatingArchive}
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Optionally add a descriptive name to this archive to make it easier to identify.
                  </p>
                </div>
              </div>
              
              {createArchiveError && (
                <div className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
                  {createArchiveError}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={isCreatingArchive}
                >
                  Cancel
                </button>
                <button
                  onClick={createArchive}
                  disabled={isCreatingArchive || !newArchiveMonth}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isCreatingArchive ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Archive...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Create Archive
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-500" />
              Archived Conversations
            </h2>
            <div className="flex items-center gap-3">
              {isAdmin && !showAdminPanel && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="inline-flex items-center px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 shadow-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Create Archive"
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Create Archive
                </button>
              )}
              <label className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Select Month:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
                disabled={isLoadingArchives || availableMonths.length === 0}
              >
                {availableMonths.length === 0 ? (
                  <option value="">No archives available</option>
                ) : (
                  availableMonths.map(month => (
                    <option key={month} value={month}>
                      {formatArchiveMonth(month)}
                    </option>
                  ))
                )}
              </select>
              <button 
                onClick={exportToCSV}
                disabled={isExporting || archives.length === 0 || isLoadingArchives}
                className={`p-2 rounded-full ${
                  archives.length === 0 || isLoadingArchives
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Export as CSV"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {archiveError && (
              <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
                {archiveError}
              </div>
            )}
            
            {isLoadingArchives ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading archived messages...</p>
              </div>
            ) : archives.length === 0 && !archiveError ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Archive className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Messages Found</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md">
                  {availableMonths.length === 0 
                    ? "There are no archived messages yet. Archives will be created automatically each month."
                    : "No messages found for the selected month."}
                </p>
                {isAdmin && availableMonths.length === 0 && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="mt-4 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Archive
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 overflow-y-auto" style={{ maxHeight: '600px' }}>
                {groupedArchives.map((group, groupIndex) => (
                  <div key={group.date} className="mb-6">
                    {/* Date divider */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(group.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    {/* Messages for this date */}
                    <div className="space-y-4">
                      {group.messages.map((message, messageIndex) => {
                        const senderInfo = getSenderInfo(message.sender, message.senderName, message.senderAvatar);
                        const isCurrentUser = message.sender === currentUser?.id;
                        
                        return (
                          <div 
                            key={message.id} 
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex items-end max-w-[80%]">
                              {/* Avatar for other users' messages */}
                              {!isCurrentUser && (
                                <div 
                                  className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2 mb-1 flex-shrink-0 overflow-hidden"
                                  style={{
                                    backgroundColor: message.sender.charCodeAt(0) % 2 === 0 ? '#3b82f6' : 
                                                 message.sender.charCodeAt(0) % 3 === 0 ? '#10b981' : 
                                                 message.sender.charCodeAt(0) % 5 === 0 ? '#8b5cf6' : '#f59e0b'
                                  }}
                                >
                                  {senderInfo.avatar ? 
                                    <img src={senderInfo.avatar} alt={senderInfo.name} className="w-full h-full object-cover" /> :
                                    getInitials(senderInfo.name)
                                  }
                                </div>
                              )}
                              
                              {/* Message bubble */}
                              <div 
                                className={`${
                                  isCurrentUser 
                                    ? 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tr-2xl rounded-tl-sm'
                                } p-3 rounded-bl-2xl rounded-br-2xl shadow-sm`}
                              >
                                <div className="flex items-start mb-1">
                                  <span className="font-medium text-sm">
                                    {senderInfo.name}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                <div className={`text-xs opacity-70 mt-1 text-right ${
                                  isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatMessageTime(message.timestamp)}
                                </div>
                              </div>
                              
                              {/* Avatar for current user's messages */}
                              {isCurrentUser && (
                                <div className="h-8 w-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-xs ml-2 mb-1 flex-shrink-0 overflow-hidden">
                                  {currentUser?.avatar ? 
                                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" /> :
                                    getInitials(currentUser?.name || 'U')
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 