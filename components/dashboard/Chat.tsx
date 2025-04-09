"use client";

import { Send, MessagesSquare, User, Paperclip, Smile, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { formatDistanceToNow } from 'date-fns';
import { ACTIONS } from '@/lib/DashboardProvider';
import API from '@/lib/api';

// Define types for message handling
interface MessageData {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: string;
  senderAvatar?: string | null;
}

export default function Chat() {
  const { state, dispatch } = useDashboard();
  const { messages, currentUser, employees } = state;
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  
  // Load initial messages when component mounts
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      try {
        console.log('Chat: Loading initial messages');
        const initialMessages = await API.messages.getAll(30, 1);
        console.log(`Chat: Loaded ${initialMessages.length} initial messages`);
        
        if (initialMessages.length > 0) {
          // Update dashboard state with the messages (they should already be sorted oldest-first from the API)
          dispatch({
            type: ACTIONS.SET_MESSAGES,
            payload: initialMessages
          });
          
          // Set the last fetch time to the most recent message
          const latestMessage = [...initialMessages].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          if (latestMessage) {
            setLastFetchTime(latestMessage.timestamp);
          }
        }
      } catch (err) {
        console.error('Chat: Error loading initial messages:', err);
        setError('Failed to load messages. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialMessages();
  }, [dispatch]);
  
  // Use recent messages to determine last fetch time for polling
  useEffect(() => {
    if (messages.length > 0) {
      // Find the most recent message timestamp
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setLastFetchTime(sortedMessages[0].timestamp);
    }
  }, [messages]);
  
  // Temporary user structure - this would normally be fetched from context
  const mockUsers = [
    { id: currentUser?.id || 'user-1', name: currentUser?.name || 'Alex Johnson', avatar: currentUser?.avatar || '/avatar-placeholder.png' },
    { id: 'user-2', name: 'Emma Wilson', avatar: '/avatar-placeholder.png' },
    { id: 'user-3', name: 'Michael Brown', avatar: '/avatar-placeholder.png' }
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up scroll detection and visibility tracking
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollHeight - container.scrollTop - container.clientHeight > 100) {
        setShowScrollDownButton(true);
        // If user scrolls up, count new messages as unread
        setPollingEnabled(false);
      } else {
        setShowScrollDownButton(false);
        setUnreadCount(0);
        setPollingEnabled(true);
      }
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      setPollingEnabled(!document.hidden);
      if (!document.hidden) {
        // When tab becomes visible again, reset unread count if at bottom
        const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= 100;
        if (isAtBottom) {
          setUnreadCount(0);
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Poll for new messages
  useEffect(() => {
    // Set up polling for new messages every 10 seconds
    const pollInterval = setInterval(() => {
      if (lastFetchTime && pollingEnabled) {
        fetchNewMessages();
      }
    }, 10000); // 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [lastFetchTime, pollingEnabled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUnreadCount(0);
  };
  
  // Remove debug logging in production
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && messages.length > 0) {
      console.log(`Chat: Showing ${messages.length} messages`);
    }
  }, [messages]);
  
  // Function to fetch only new messages since last fetch
  const fetchNewMessages = async () => {
    if (!lastFetchTime) return;
    
    try {
      // Use the API module
      const newMessages = await API.messages.getAfter(lastFetchTime);
      
      if (newMessages.length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Chat: Received ${newMessages.length} new messages`);
        }
        
        // Track unread messages if user has scrolled up
        if (showScrollDownButton) {
          setUnreadCount(prev => prev + newMessages.length);
        }
        
        // Add each new message to the state in the order they were received (which should be chronological)
        newMessages.forEach(message => {
          const messageData: MessageData = {
            id: message.id,
            content: message.content,
            sender: message.sender,
            senderName: message.senderName,
            timestamp: message.timestamp,
            senderAvatar: message.senderAvatar
          };
          
          dispatch({
            type: ACTIONS.ADD_MESSAGE,
            payload: messageData
          });
        });
        
        // Update the timestamp of the latest message for the next poll
        const latestMessage = [...newMessages].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        if (latestMessage) {
          setLastFetchTime(latestMessage.timestamp);
        }
      }
    } catch (err) {
      console.error("Error polling for new messages:", err);
      // Don't show error for polling failures to avoid disrupting the user
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' || !currentUser || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      // Optimistically add the message to the UI before API response
      const tempMessage: MessageData = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sender: currentUser.id,
        senderName: currentUser.name,
        timestamp: new Date().toISOString(),
      };
      
      dispatch({
        type: ACTIONS.ADD_MESSAGE,
        payload: tempMessage
      });
      
      // Clear the input
      setNewMessage('');
      
      // Send the message using the API module
      const savedMessage = await API.messages.send(tempMessage.content);
      
      // Replace the temporary message with the saved one
      dispatch({
        type: ACTIONS.UPDATE_MESSAGE,
        payload: {
          oldId: tempMessage.id,
          message: {
            id: savedMessage.id,
            content: savedMessage.content,
            sender: savedMessage.sender,
            senderName: savedMessage.senderName,
            timestamp: savedMessage.timestamp,
            senderAvatar: savedMessage.senderAvatar
          }
        }
      });
      
      // Update the last fetch time
      setLastFetchTime(savedMessage.timestamp);
      
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      // Remove the temporary message if there was an error
      dispatch({
        type: ACTIONS.REMOVE_MESSAGE,
        payload: `temp-${Date.now()}`
      });
    } finally {
      setSendingMessage(false);
    }
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

  // Modify this function to better handle our updated Message interface
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

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: {date: string, messages: typeof messages}[] = [];
    
    // Clone and ensure messages are in chronological order
    const orderedMessages = [...messages];
    
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
  
  const messageGroups = groupMessagesByDate();

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark flex flex-col h-full animate-slide-in">
      {/* Chat header */}
      <div className="border-b border-gray-100 dark:border-dark-border px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <MessagesSquare className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          Team Chat • {mockUsers.length} online
        </h2>
        <div className="flex -space-x-2">
          {mockUsers.slice(0, 3).map((user, index) => (
            <div 
              key={user.id}
              className={`h-6 w-6 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs`}
              style={{ 
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index % 4],
                zIndex: mockUsers.length - index
              }}
              title={user.name}
            >
              {getInitials(user.name)}
            </div>
          ))}
          {mockUsers.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-gray-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">
              +{mockUsers.length - 3}
            </div>
          )}
        </div>
      </div>
      
      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
        style={{ minHeight: '300px', maxHeight: '400px' }}
      >
        {/* Error state */}
        {error && (
          <div className="flex justify-center items-center">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg max-w-sm mb-4">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Welcome message if no messages */}
        {messages.length === 0 && !isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center p-6 max-w-sm">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessagesSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Team Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with your team members in real-time. Send a message to get started.
              </p>
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date} className="space-y-4">
            {/* Date divider */}
            <div className="flex items-center justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-500 dark:text-gray-400 font-medium">
                {new Date(group.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short', 
                  day: 'numeric'
                })}
              </div>
            </div>
            
            {/* Messages for this date */}
            {group.messages.map((message, messageIndex) => {
              const senderInfo = getSenderInfo(message.sender, message.senderName, (message as any).senderAvatar);
              const isCurrentUser = senderInfo.isCurrentUser;
              
              // Determine if we should show the avatar (group messages by sender)
              const showAvatar = 
                messageIndex === 0 || 
                messageIndex === group.messages.length - 1 ||
                group.messages[messageIndex - 1].sender !== message.sender ||
                // If more than 5 minutes between messages, break the grouping
                (new Date(message.timestamp).getTime() - 
                 new Date(group.messages[messageIndex - 1].timestamp).getTime() > 5 * 60 * 1000);
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                >
                  <div className="flex items-end max-w-[80%]">
                    {/* Avatar for other users' messages */}
                    {!isCurrentUser && showAvatar && (
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
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-2xl rounded-tl-sm'
                      } p-3 rounded-bl-2xl rounded-br-2xl shadow-sm hover:shadow-md transition-shadow`}
                    >
                      {showAvatar && (
                        <div className="flex items-start mb-1">
                          <span className="font-medium text-sm">
                            {senderInfo.name}
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={`text-xs opacity-70 mt-1 text-right ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                      </div>
                    </div>
                    
                    {/* Avatar for current user's messages */}
                    {isCurrentUser && showAvatar && (
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
        ))}
        
        {/* Loading indicator when sending message */}
        {sendingMessage && (
          <div className="flex justify-center my-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs px-3 py-1 rounded-full">
              Sending message...
            </div>
          </div>
        )}
        
        {/* Scroll to bottom button */}
        {showScrollDownButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-blue-500 text-white rounded-full p-2 shadow-md hover:bg-blue-600 transition-colors"
            aria-label="Scroll to bottom"
          >
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef} />
        
        {/* Loading indicator for initial load */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-2 border-t-blue-500 border-blue-200 animate-spin mb-2"></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Online users */}
      <div className="border-t border-gray-100 dark:border-dark-border p-2 overflow-x-auto hide-scrollbar">
        <div className="flex space-x-2">
          {mockUsers.map(user => (
            <div key={user.id} className="flex flex-col items-center">
              <div className="relative">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {user.avatar ? 
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> :
                    <span className="text-xs font-medium">{getInitials(user.name)}</span>
                  }
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white dark:border-dark-card"></div>
              </div>
              <span className="text-xs mt-1 max-w-[60px] truncate">
                {user.id === currentUser?.id ? 'You' : user.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-100 dark:border-dark-border p-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button 
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendingMessage}
          />
          
          <button 
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Smile className="h-4 w-4" />
          </button>
          
          <button 
            type="submit"
            className={`inline-flex items-center justify-center p-2 rounded-lg shadow-sm text-white ${
              newMessage.trim() === '' || sendingMessage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
            disabled={newMessage.trim() === '' || sendingMessage}
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 