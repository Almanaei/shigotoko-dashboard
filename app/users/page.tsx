"use client";

import React, { Suspense, lazy, useState, useEffect } from 'react';
import ErrorBoundary from '../../components/dashboard/ErrorBoundary';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FilterCriteria, SortField } from '../../lib/reducers/userReducer';

// Lazy-loaded components with code splitting
const UserTable = lazy(() => import('./components/UserTable'));
const UserEditForm = lazy(() => import('./components/UserForm'));
const UserFilters = lazy(() => import('./components/UserFilters'));

// Page component
export default function UsersPage() {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    role: 'all',
    searchTerm: '',
    activeOnly: false
  });
  
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: 'asc' | 'desc';
  }>({
    field: 'name',
    direction: 'asc'
  });
  
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Fall-back component for error boundary
  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-semibold text-red-600">Something went wrong in the User Management section</h2>
      <p className="mb-4 text-red-600">Please try again later or contact support if the issue persists.</p>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium">Technical details</summary>
        <pre className="mt-2 whitespace-pre-wrap p-2 bg-gray-100 rounded">
          {error.message}
        </pre>
      </details>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <ErrorBoundary fallback={<ErrorFallback error={new Error("Unknown error in User Management")} />}>
        <div className="mb-6">
          <Suspense fallback={<LoadingSpinner text="Loading filters..." />}>
            <UserFilters 
              filters={filterCriteria} 
              onFilterChange={setFilterCriteria} 
            />
          </Suspense>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <Suspense fallback={<LoadingSpinner text="Loading user data..." />}>
              <UserTable 
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                onSelectUser={setSelectedUserId}
                onEditUser={() => setIsFormOpen(true)}
              />
            </Suspense>
          </div>
          
          {isFormOpen && (
            <div className="w-full lg:w-1/3">
              <Suspense fallback={<LoadingSpinner text="Loading user form..." />}>
                <UserEditForm 
                  userId={selectedUserId} 
                  onClose={() => {
                    setIsFormOpen(false);
                    setSelectedUserId(null);
                  }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}

// Add placeholders for code-split components - these will be created in separate files

// Placeholder for UserTable.tsx:
// - A data table with sorting and pagination
// - Uses the useUserManagement hook to fetch and display users
// - Handles selection and edit actions

// Placeholder for UserForm.tsx:
// - A form for creating and editing users
// - Uses the useUserManagement hook for data operations
// - Form validation and error handling

// Placeholder for UserFilters.tsx:
// - Filter controls for role, active status, and search term
// - Triggers filtering in the parent component 