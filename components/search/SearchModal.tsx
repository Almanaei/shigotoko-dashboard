"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Loader2, User, Building, FolderOpen, CheckSquare, FileText, MessageSquare } from 'lucide-react';
import { useSearch, SearchResult } from '@/lib/SearchContext';

export default function SearchModal() {
  const { 
    query, 
    setQuery, 
    results, 
    loading, 
    error, 
    isSearchOpen, 
    closeSearch, 
    performSearch 
  } = useSearch();
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  
  // Focus input when modal opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
      setSelectedIndex(-1);
    }
  }, [isSearchOpen]);
  
  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(results.length > 0 ? 0 : -1);
  }, [results]);
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (results.length === 0) return -1;
        if (prev === results.length - 1) return 0;
        return prev + 1;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => {
        if (results.length === 0) return -1;
        if (prev <= 0) return results.length - 1;
        return prev - 1;
      });
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault();
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    }
  };
  
  // Close modal on escape key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
      
      // Keyboard shortcut: Ctrl+K to open search
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!isSearchOpen) {
          // This would be handled by the Navbar component
        } else {
          closeSearch();
        }
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearchOpen, closeSearch]);
  
  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, closeSearch]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Debounce search
    const handler = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
    
    return () => clearTimeout(handler);
  };
  
  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    closeSearch();
    router.push(result.url);
  };
  
  // Get icon component for result type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'employee':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'department':
        return <Building className="h-4 w-4 text-purple-500" />;
      case 'project':
        return <FolderOpen className="h-4 w-4 text-green-500" />;
      case 'task':
        return <CheckSquare className="h-4 w-4 text-amber-500" />;
      case 'document':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-cyan-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format the description based on result type
  const formatDescription = (result: SearchResult) => {
    switch (result.type) {
      case 'employee':
        return result.description.replace(' - undefined', '').replace('undefined', '');
      case 'project':
        return result.description.replace(' - undefined', '').replace('undefined', '');
      default:
        return result.description;
    }
  };
  
  if (!isSearchOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 sm:pt-24">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeSearch} />
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="relative border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center px-4 py-3">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Search for anything..."
              className="w-full bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
              autoComplete="off"
            />
            {loading && <Loader2 className="h-5 w-5 text-gray-400 dark:text-gray-500 animate-spin ml-2" />}
            <button 
              onClick={closeSearch}
              className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Search results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {error && (
            <div className="px-4 py-8 text-center">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}
          
          {!loading && !error && results.length === 0 && query.trim() !== '' && (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
            </div>
          )}
          
          {!loading && !error && query.trim() === '' && (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Type to start searching...</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Search for employees, departments, projects, tasks, documents, and messages
              </p>
            </div>
          )}
          
          {results.length > 0 && (
            <ul>
              {results.map((result, index) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => handleResultClick(result)}
                    className={`w-full text-left px-4 py-3 flex items-start ${
                      selectedIndex === index 
                        ? 'bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {getIconForType(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {result.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {formatDescription(result)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Keyboard shortcuts */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <div>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-300 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-300 font-mono">↓</kbd> to navigate</div>
          <div>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-300 font-mono">Enter</kbd> to select</div>
          <div>Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-300 font-mono">Esc</kbd> to close</div>
        </div>
      </div>
    </div>
  );
} 