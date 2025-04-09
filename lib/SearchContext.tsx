"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { 
  User, Employee, Department, Project, Task, Document, Message 
} from '@/lib/DashboardProvider';
import { useDashboard } from '@/lib/DashboardProvider';
import { API } from '@/lib/api';

// Define search result types
export interface SearchResult {
  id: string;
  type: 'employee' | 'department' | 'project' | 'task' | 'document' | 'message';
  title: string;
  description: string;
  icon: string;
  url: string;
  relevance: number;
}

interface SearchContextType {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  performSearch: (searchTerm?: string) => Promise<void>;
  clearResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { state: dashboardState } = useDashboard();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  // Function to search directly using API endpoints
  const searchData = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchResults: SearchResult[] = [];
      const lowerQuery = searchTerm.toLowerCase();
      
      // Fetch employees directly from API
      try {
        const response = await fetch(`/api/employees?search=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.employees && Array.isArray(data.employees)) {
            data.employees.forEach((employee: any) => {
              if (employee.id && employee.name) {
                searchResults.push({
                  id: employee.id,
                  type: 'employee',
                  title: employee.name,
                  description: `${employee.position || ''} ${employee.department ? `- ${employee.department}` : ''}`.trim(),
                  icon: '👤',
                  url: `/employees/${employee.id}`,
                  relevance: 3,
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error searching employees:', error);
        // Fallback to dashboard state for employees
        if (dashboardState?.employees && Array.isArray(dashboardState.employees)) {
          // Only use records with valid IDs and without example.com emails
          dashboardState.employees
            .filter(emp => 
              emp.id && 
              emp.name && 
              emp.email && 
              !emp.email.includes('example.com') &&
              // Filter for the search term
              (emp.name.toLowerCase().includes(lowerQuery) || 
               emp.position?.toLowerCase().includes(lowerQuery) || 
               emp.email.toLowerCase().includes(lowerQuery))
            )
            .slice(0, 5) // Limit to avoid overwhelming results
            .forEach(employee => {
              searchResults.push({
                id: employee.id,
                type: 'employee',
                title: employee.name,
                description: `${employee.position || ''} ${employee.department ? `- ${employee.department}` : ''}`.trim(),
                icon: '👤',
                url: `/employees/${employee.id}`,
                relevance: 2,
              });
            });
        }
      }
      
      // Fetch departments directly from API
      try {
        const response = await fetch(`/api/departments?search=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.departments && Array.isArray(data.departments)) {
            data.departments.forEach((dept: any) => {
              if (dept.id && dept.name) {
                searchResults.push({
                  id: dept.id,
                  type: 'department',
                  title: dept.name,
                  description: dept.description || `Department with ${dept.employeeCount || 0} employees`,
                  icon: '🏢',
                  url: `/departments/${dept.id}`,
                  relevance: 2.5,
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Error searching departments:', error);
        // No fallback needed as departments are less critical
      }
      
      // Add projects search - direct to projects page with filter
      if (dashboardState?.projects && Array.isArray(dashboardState.projects)) {
        dashboardState.projects
          .filter(project => 
            project.id && 
            project.name && 
            (project.name.toLowerCase().includes(lowerQuery) || 
             project.description?.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 3)
          .forEach(project => {
            searchResults.push({
              id: project.id,
              type: 'project',
              title: project.name,
              description: project.description || `Project due on ${new Date(project.dueDate).toLocaleDateString()}`,
              icon: '📂',
              url: `/projects?id=${project.id}`,
              relevance: 2,
            });
          });
      }
      
      // Add documents search - direct to documents page with filter
      if (dashboardState?.documents && Array.isArray(dashboardState.documents)) {
        dashboardState.documents
          .filter(doc => 
            doc.id && 
            doc.name && 
            (doc.name.toLowerCase().includes(lowerQuery) || 
             doc.description?.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 3)
          .forEach(doc => {
            searchResults.push({
              id: doc.id,
              type: 'document',
              title: doc.name,
              description: doc.description || `Created on ${doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'unknown date'}`,
              icon: '📄',
              url: `/documents?id=${doc.id}`,
              relevance: 1.5,
            });
          });
      }
      
      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance);
      
      // Limit results to avoid overwhelming the UI
      setResults(searchResults.slice(0, 8));
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search');
    } finally {
      setLoading(false);
    }
  }, [dashboardState]);

  // Unified search function with debounce
  const performSearch = useCallback(async (searchTerm?: string) => {
    const termToSearch = searchTerm !== undefined ? searchTerm : query;
    if (!termToSearch.trim()) {
      setResults([]);
      return;
    }
    
    await searchData(termToSearch);
  }, [query, searchData]);

  const value = {
    query,
    setQuery,
    results,
    loading,
    error,
    isSearchOpen,
    openSearch,
    closeSearch,
    performSearch,
    clearResults
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 