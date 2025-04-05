"use client";

import { Send, MessagesSquare, User, Paperclip, Smile, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { formatDistanceToNow } from 'date-fns';
import { ACTIONS } from '@/lib/DashboardProvider';

export default function Chat() {
  const { state, dispatch } = useDashboard();
  const { messages, currentUser, employees } = state;
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<{[key: string]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  
  // Mock active users (in a real app, this would come from a backend/websocket)
  const activeUsers = [
    { id: currentUser?.id || 'user-1', name: currentUser?.name || 'Alex Johnson', avatar: currentUser?.avatar || '/avatars/alex.jpg' },
    ...employees.slice(0, 3).map(emp => ({ id: emp.id, name: emp.name, avatar: emp.avatar }))
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollHeight - container.scrollTop - container.clientHeight > 100) {
        setShowScrollDownButton(true);
      } else {
        setShowScrollDownButton(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simulate someone typing (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly have someone start typing
      if (Math.random() > 0.9 && Object.keys(isTyping).length === 0) {
        const randomUser = employees[Math.floor(Math.random() * employees.length)];
        if (randomUser && randomUser.id !== currentUser?.id) {
          setIsTyping(prev => ({ ...prev, [randomUser.id]: true }));
          
          // Simulate typing duration
          setTimeout(() => {
            setIsTyping(prev => {
              const newState = { ...prev };
              delete newState[randomUser.id];
              
              // 50% chance to actually send a message after typing
              if (Math.random() > 0.5) {
                const randomMessages = [
                  "Has anyone looked at the Q2 projections yet?",
                  "I just updated the project timeline in the schedule.",
                  "Can someone review my latest design mockups?",
                  "The client meeting went well today!",
                  "Who's handling the deployment tomorrow?",
                  "Just a reminder about the team meeting at 3pm.",
                  "Great work on the latest release, team!",
                  "I need help with the backend integration.",
                  "Check out the updated documentation in the shared folder.",
                  "Anyone available for a quick call?"
                ];
                
                const message = {
                  id: `msg-${Date.now()}`,
                  content: randomMessages[Math.floor(Math.random() * randomMessages.length)],
                  sender: randomUser.id,
                  senderName: randomUser.name,
                  timestamp: new Date().toISOString(),
                };
                
                dispatch({
                  type: ACTIONS.ADD_MESSAGE,
                  payload: message
                });
              }
              
              return newState;
            });
          }, 2000 + Math.random() * 3000);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [employees, currentUser, dispatch, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '' || !currentUser) return;
    
    const message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      sender: currentUser.id,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
    };
    
    dispatch({
      type: ACTIONS.ADD_MESSAGE,
      payload: message
    });
    
    setNewMessage('');
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
  const getSenderInfo = (senderId: string) => {
    // Check if it's a legacy 'user' or 'assistant' type
    if (senderId === 'user') {
      return {
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || '/avatar-placeholder.png',
        isCurrentUser: true
      };
    }
    
    if (senderId === 'assistant') {
      return {
        name: 'Assistant',
        avatar: '/avatars/assistant.png',
        isCurrentUser: false
      };
    }
    
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
    
    // Fallback to senderName if available in the message
    return {
      name: 'Unknown User',
      avatar: '/avatar-placeholder.png',
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

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark flex flex-col h-full animate-slide-in">
      {/* Chat header */}
      <div className="border-b border-gray-100 dark:border-dark-border p-3 flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <MessagesSquare className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          Team Chat • {activeUsers.length} online
        </h2>
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 3).map((user, index) => (
            <div 
              key={user.id}
              className={`h-6 w-6 rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs`}
              style={{ 
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'][index % 4],
                zIndex: activeUsers.length - index
              }}
              title={user.name}
            >
              {getInitials(user.name)}
            </div>
          ))}
          {activeUsers.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-gray-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">
              +{activeUsers.length - 3}
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
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
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
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => {
              const senderInfo = getSenderInfo(message.sender);
              const isCurrentUser = senderInfo.isCurrentUser;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
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
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-2xl rounded-tl-sm'
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
            
            {/* Typing indicators */}
            {Object.entries(isTyping).map(([userId, isTyping]) => {
              if (!isTyping) return null;
              
              const typingUser = employees.find(emp => emp.id === userId);
              if (!typingUser) return null;
              
              return (
                <div className="flex justify-start" key={`typing-${userId}`}>
                  <div className="flex items-end">
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: userId.charCodeAt(0) % 2 === 0 ? '#3b82f6' : 
                                        userId.charCodeAt(0) % 3 === 0 ? '#10b981' : 
                                        userId.charCodeAt(0) % 5 === 0 ? '#8b5cf6' : '#f59e0b'
                      }}
                    >
                      {typingUser.avatar ? 
                        <img src={typingUser.avatar} alt={typingUser.name} className="w-full h-full object-cover" /> :
                        getInitials(typingUser.name)
                      }
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
                      <div className="flex flex-col">
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200 mb-1">
                          {typingUser.name}
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Scroll to bottom indicator */}
        {showScrollDownButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-blue-600 text-white rounded-full p-2 shadow-md hover:bg-blue-700 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Active users indicator - horizontal scrollable */}
      <div className="border-t border-gray-100 dark:border-dark-border p-2 overflow-x-auto hide-scrollbar">
        <div className="flex space-x-2">
          {activeUsers.map(user => (
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
              newMessage.trim() === ''
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
            disabled={newMessage.trim() === ''}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
} 