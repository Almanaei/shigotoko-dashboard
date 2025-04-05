"use client";

import { Send, User, MessagesSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDashboard } from '@/lib/DashboardProvider';
import { formatDistanceToNow } from 'date-fns';

export default function Chat() {
  const { state, dispatch } = useDashboard();
  const { messages } = state;
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      type: 'ADD_MESSAGE',
      payload: message
    });
    
    setNewMessage('');
    
    // Simulate a response after a short delay
    setTimeout(() => {
      const response = {
        id: `msg-${Date.now()}`,
        content: "Thanks for your message! This is an automated response from the system.",
        sender: 'assistant' as const,
        timestamp: new Date().toISOString(),
      };
      
      dispatch({
        type: 'ADD_MESSAGE',
        payload: response
      });
    }, 1000);
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm dark:shadow-card-dark flex flex-col h-full animate-slide-in">
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
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs md:max-w-md ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-tl-xl rounded-tr-none'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-xl rounded-tl-none'
              } p-3 rounded-bl-xl rounded-br-xl shadow-sm`}
            >
              <div className="flex items-start mb-1">
                {message.sender !== 'user' && (
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                    AI
                  </div>
                )}
                <span className="font-medium text-sm">
                  {message.sender === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              <div className="text-xs opacity-70 mt-1 text-right">
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-100 dark:border-dark-border p-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 py-2 px-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="inline-flex items-center justify-center p-2 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
} 