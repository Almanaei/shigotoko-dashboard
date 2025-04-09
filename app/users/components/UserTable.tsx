"use client";

import React, { useEffect, useMemo } from 'react';
import { SortField, User } from '../../../lib/reducers/userReducer';
import useUserManagement from '../../../hooks/useUserManagement';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface UserTableProps {
  sortConfig: {
    field: SortField;
    direction: 'asc' | 'desc';
  };
  onSortChange: (config: { field: SortField; direction: 'asc' | 'desc' }) => void;
  onSelectUser: (userId: string | null) => void;
  onEditUser: () => void;
}

const UserTable: React.FC<UserTableProps> = ({
  sortConfig,
  onSortChange,
  onSelectUser,
  onEditUser,
}) => {
  const { 
    state: { filteredUsers, selectedUser },
    fetchUsers,
    selectUser,
    deleteUser,
    setSort,
    isLoading,
    error
  } = useUserManagement();

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Apply sorting
  useEffect(() => {
    setSort(sortConfig.field, sortConfig.direction);
  }, [sortConfig, setSort]);

  // Handle sort click
  const handleSortClick = (field: SortField) => {
    const direction = 
      field === sortConfig.field && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    onSortChange({ field, direction });
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field: SortField) => {
    if (field !== sortConfig.field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortConfig.direction === 'asc' 
      ? <span className="text-blue-600">↑</span> 
      : <span className="text-blue-600">↓</span>;
  };

  // Handle row click for selection
  const handleRowClick = (user: User) => {
    if (selectedUser?.id === user.id) {
      selectUser(null);
      onSelectUser(null);
    } else {
      selectUser(user);
      onSelectUser(user.id);
    }
  };

  // Handle edit click
  const handleEditClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation(); // Prevent row click
    selectUser(user);
    onSelectUser(user.id);
    onEditUser();
  };

  // Handle delete click
  const handleDeleteClick = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Prevent row click
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      const success = await deleteUser(userId);
      if (success && selectedUser?.id === userId) {
        selectUser(null);
        onSelectUser(null);
      }
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 border border-red-200">
        <p className="font-semibold">Error loading users</p>
        <p className="text-sm">{error.message}</p>
        <button 
          onClick={() => fetchUsers()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading && filteredUsers.length === 0) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('email')}
              >
                <div className="flex items-center space-x-1">
                  <span>Email</span>
                  {getSortIcon('email')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('role')}
              >
                <div className="flex items-center space-x-1">
                  <span>Role</span>
                  {getSortIcon('role')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('lastLogin')}
              >
                <div className="flex items-center space-x-1">
                  <span>Last Login</span>
                  {getSortIcon('lastLogin')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr 
                  key={user.id} 
                  onClick={() => handleRowClick(user)}
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                    ${selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                      ${user.role === 'manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                      ${user.role === 'user' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                    `}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}
                    `}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => handleEditClick(e, user)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, user.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {isLoading && filteredUsers.length > 0 && (
        <div className="flex justify-center p-4 border-t border-gray-200 dark:border-gray-700">
          <LoadingSpinner size="sm" text="Refreshing data..." />
        </div>
      )}
    </div>
  );
};

export default UserTable; 