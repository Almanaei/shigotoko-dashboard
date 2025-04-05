"use client";

import { Send, MessagesSquare, User, Paperclip, Smile, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { formatDistanceToNow } from 'date-fns';
import { ACTIONS } from '@/lib/DashboardProvider';

export default function Chat() {
  const { state, dispatch } = useDashboard();
  const { messages, currentUser } = state;
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);

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

  // Generate a bot response based on user message
  const generateResponse = (userMessage: string): string => {
    const keywords = {
      hello: "Hello! How can I help you today?",
      hi: "Hi there! What can I assist you with?",
      help: "I'm here to help! What do you need assistance with?",
      task: "You can create or manage tasks in the Task Board section of the dashboard.",
      project: "You can view and manage all projects in the Projects page. Would you like me to show you how?",
      employee: "Employee information can be found in the Employees page. You can add, edit, or view employee details there.",
      department: "You can manage departments in the Departments page, including creating new ones or assigning employees.",
      schedule: "The Schedule page shows a calendar view of your projects and deadlines.",
      message: "You can send messages to team members using this chat interface.",
      settings: "You can adjust your profile and application settings in the Settings page.",
      dark: "You can toggle between light and dark mode using the moon/sun icon in the top bar.",
      light: "You can toggle between light and dark mode using the moon/sun icon in the top bar.",
      logout: "To logout, you can click your profile icon in the top right and select Logout.",
      thanks: "You're welcome! Let me know if you need anything else.",
      thank: "You're welcome! Let me know if you need anything else.",
    };

    // Default responses if no keyword match
    const defaultResponses = [
      "I'm here to help with your dashboard needs. What would you like to know?",
      "How can I assist you with the dashboard today?",
      "Let me know if you need help navigating the dashboard or managing your data.",
      "I can help you with tasks, projects, employees, and other dashboard features. What do you need?",
    ];

    // Check for keyword matches
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [keyword, response] of Object.entries(keywords)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }
    
    // If no match, return a random default response
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '') return;
    
    const message = {
      id: `msg-${Date.now()}`,
      content: newMessage,
      sender: 'user' as const,
      timestamp: new Date().toISOString(),
    };
    
    dispatch({
      type: ACTIONS.ADD_MESSAGE,
      payload: message
    });
    
    setNewMessage('');
    setIsTyping(true);
    
    // Simulate a response after a short delay
    const responseDelay = 1000 + Math.random() * 1000; // Random delay between 1-2 seconds
    setTimeout(() => {
      const response = {
        id: `msg-${Date.now()}`,
        content: generateResponse(message.content),
        sender: 'assistant' as const,
        timestamp: new Date().toISOString(),
      };
      
      dispatch({
        type: ACTIONS.ADD_MESSAGE,
        payload: response
      });
      
      setIsTyping(false);
    }, responseDelay);
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

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark flex flex-col h-full animate-slide-in">
      {/* Chat header */}
      <div className="border-b border-gray-100 dark:border-dark-border p-3 flex justify-between items-center">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
          <MessagesSquare className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
          Team Chat
        </h2>
        <div className="flex -space-x-2">
          <div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">JD</div>
          <div className="h-6 w-6 rounded-full bg-green-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">SK</div>
          <div className="h-6 w-6 rounded-full bg-purple-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-white text-xs">MP</div>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Welcome to Team Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send a message to get started. You can chat with your team or ask for assistance.
              </p>
            </div>
          </div>
        )}
        
        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="flex items-end max-w-[80%]">
                  {/* Avatar for assistant messages */}
                  {message.sender !== 'user' && (
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2 mb-1 flex-shrink-0">
                      AI
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div 
                    className={`${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white rounded-tl-2xl rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-2xl rounded-tl-sm'
                    } p-3 rounded-bl-2xl rounded-br-2xl shadow-sm`}
                  >
                    <div className="flex items-start mb-1">
                      <span className="font-medium text-sm">
                        {message.sender === 'user' ? 'You' : 'Assistant'}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <div className={`text-xs opacity-70 mt-1 text-right ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </div>
                  </div>
                  
                  {/* Avatar for user messages */}
                  {message.sender === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-gray-500 dark:bg-gray-600 flex items-center justify-center text-white text-xs ml-2 mb-1 flex-shrink-0">
                      {currentUser?.name.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0">
                    AI
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            disabled={isTyping}
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
              newMessage.trim() === '' || isTyping
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
            disabled={newMessage.trim() === '' || isTyping}
          >
            {isTyping ? (
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