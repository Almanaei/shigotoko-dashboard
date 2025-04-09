import { useReducer, useCallback } from 'react';
import { 
  userReducer, 
  initialUserState, 
  User, 
  FilterCriteria, 
  SortField, 
  UserState 
} from '../lib/reducers/userReducer';
import useAsync from './useAsync';

// Simulated API functions - in a real app, these would call actual API endpoints
const mockApiCalls = {
  fetchUsers: async (): Promise<User[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Normally this would be an API call
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        lastLogin: new Date().toISOString(),
        isActive: true
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        role: 'manager',
        lastLogin: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: false
      }
    ];
  },
  
  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Normally this would be an API call
    return {
      id: Math.random().toString(36).substring(2, 9),
      ...userData
    };
  },
  
  updateUser: async (user: User): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Normally this would be an API call
    return { ...user };
  },
  
  deleteUser: async (userId: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Normally this would be an API call
    return userId;
  }
};

/**
 * Custom hook for user management with reducer-based state management
 * Provides methods for fetching, creating, updating, and deleting users,
 * as well as filtering and sorting functionality
 */
const useUserManagement = () => {
  // Use the userReducer to manage state
  const [state, dispatch] = useReducer(userReducer, initialUserState);
  
  // Create async handlers with useAsync
  const fetchUsersAsync = useAsync(mockApiCalls.fetchUsers);
  const createUserAsync = useAsync(mockApiCalls.createUser);
  const updateUserAsync = useAsync(mockApiCalls.updateUser);
  const deleteUserAsync = useAsync(mockApiCalls.deleteUser);
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    dispatch({ type: 'FETCH_USERS_REQUEST' });
    
    try {
      const users = await fetchUsersAsync.execute();
      if (users) {
        dispatch({ type: 'FETCH_USERS_SUCCESS', payload: users });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_USERS_FAILURE', payload: error as Error });
    }
  }, [fetchUsersAsync]);
  
  // Select a user
  const selectUser = useCallback((user: User | null) => {
    dispatch({ type: 'SELECT_USER', payload: user });
  }, []);
  
  // Create a new user
  const createUser = useCallback(async (userData: Omit<User, 'id'>) => {
    dispatch({ type: 'CREATE_USER_REQUEST', payload: userData });
    
    try {
      const newUser = await createUserAsync.execute(userData);
      if (newUser) {
        dispatch({ type: 'CREATE_USER_SUCCESS', payload: newUser });
        return newUser;
      }
      return null;
    } catch (error) {
      dispatch({ type: 'CREATE_USER_FAILURE', payload: error as Error });
      return null;
    }
  }, [createUserAsync]);
  
  // Update a user
  const updateUser = useCallback(async (user: User) => {
    dispatch({ type: 'UPDATE_USER_REQUEST', payload: user });
    
    try {
      const updatedUser = await updateUserAsync.execute(user);
      if (updatedUser) {
        dispatch({ type: 'UPDATE_USER_SUCCESS', payload: updatedUser });
        return updatedUser;
      }
      return null;
    } catch (error) {
      dispatch({ type: 'UPDATE_USER_FAILURE', payload: error as Error });
      return null;
    }
  }, [updateUserAsync]);
  
  // Delete a user
  const deleteUser = useCallback(async (userId: string) => {
    dispatch({ type: 'DELETE_USER_REQUEST', payload: userId });
    
    try {
      const deletedUserId = await deleteUserAsync.execute(userId);
      if (deletedUserId) {
        dispatch({ type: 'DELETE_USER_SUCCESS', payload: deletedUserId });
        return true;
      }
      return false;
    } catch (error) {
      dispatch({ type: 'DELETE_USER_FAILURE', payload: error as Error });
      return false;
    }
  }, [deleteUserAsync]);
  
  // Set filter criteria
  const setFilter = useCallback((filter: FilterCriteria) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);
  
  // Set sort criteria
  const setSort = useCallback((field: SortField, direction: 'asc' | 'desc') => {
    dispatch({ 
      type: 'SET_SORT', 
      payload: { field, direction } 
    });
  }, []);
  
  // Return the state and action methods
  return {
    state,
    fetchUsers,
    selectUser,
    createUser,
    updateUser,
    deleteUser,
    setFilter,
    setSort,
    // Include loading states from async hooks
    isLoading: state.isLoading || 
      fetchUsersAsync.loading || 
      createUserAsync.loading || 
      updateUserAsync.loading || 
      deleteUserAsync.loading,
    error: state.error || 
      fetchUsersAsync.error || 
      createUserAsync.error || 
      updateUserAsync.error || 
      deleteUserAsync.error
  };
};

export default useUserManagement; 