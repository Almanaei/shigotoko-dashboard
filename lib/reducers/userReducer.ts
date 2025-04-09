export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'manager';
  lastLogin?: string;
  isActive: boolean;
}

export type FilterCriteria = {
  role?: 'admin' | 'user' | 'manager' | 'all';
  searchTerm?: string;
  activeOnly?: boolean;
};

export type SortField = 'name' | 'email' | 'role' | 'lastLogin';

export interface UserState {
  users: User[];
  filteredUsers: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: Error | null;
  filter: FilterCriteria;
  sortBy: SortField;
  sortDirection: 'asc' | 'desc';
}

export type UserAction =
  | { type: 'FETCH_USERS_REQUEST' }
  | { type: 'FETCH_USERS_SUCCESS'; payload: User[] }
  | { type: 'FETCH_USERS_FAILURE'; payload: Error }
  | { type: 'SELECT_USER'; payload: User | null }
  | { type: 'CREATE_USER_REQUEST'; payload: Omit<User, 'id'> }
  | { type: 'CREATE_USER_SUCCESS'; payload: User }
  | { type: 'CREATE_USER_FAILURE'; payload: Error }
  | { type: 'UPDATE_USER_REQUEST'; payload: User }
  | { type: 'UPDATE_USER_SUCCESS'; payload: User }
  | { type: 'UPDATE_USER_FAILURE'; payload: Error }
  | { type: 'DELETE_USER_REQUEST'; payload: string }
  | { type: 'DELETE_USER_SUCCESS'; payload: string }
  | { type: 'DELETE_USER_FAILURE'; payload: Error }
  | { type: 'SET_FILTER'; payload: FilterCriteria }
  | { type: 'SET_SORT'; payload: { field: SortField; direction: 'asc' | 'desc' } };

export const initialUserState: UserState = {
  users: [],
  filteredUsers: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  filter: {
    role: 'all',
    searchTerm: '',
    activeOnly: false
  },
  sortBy: 'name',
  sortDirection: 'asc'
};

// Helper function to filter users based on criteria
const filterUsers = (users: User[], criteria: FilterCriteria): User[] => {
  return users.filter(user => {
    // Filter by role
    if (criteria.role && criteria.role !== 'all' && user.role !== criteria.role) {
      return false;
    }
    
    // Filter by active status
    if (criteria.activeOnly && !user.isActive) {
      return false;
    }
    
    // Filter by search term (name or email)
    if (criteria.searchTerm && criteria.searchTerm.trim() !== '') {
      const term = criteria.searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
};

// Helper function to sort users
const sortUsers = (users: User[], field: SortField, direction: 'asc' | 'desc'): User[] => {
  return [...users].sort((a, b) => {
    // Handle special case for lastLogin which might be undefined
    if (field === 'lastLogin') {
      const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      return direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    // For other fields, use string comparison
    const valueA = a[field].toString().toLowerCase();
    const valueB = b[field].toString().toLowerCase();
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// User reducer function
export const userReducer = (state: UserState = initialUserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'FETCH_USERS_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      };
      
    case 'FETCH_USERS_SUCCESS': {
      const filteredUsers = filterUsers(action.payload, state.filter);
      const sortedUsers = sortUsers(filteredUsers, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        users: action.payload,
        filteredUsers: sortedUsers,
        isLoading: false,
        error: null
      };
    }
    
    case 'FETCH_USERS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'SELECT_USER':
      return {
        ...state,
        selectedUser: action.payload
      };
    
    case 'CREATE_USER_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'CREATE_USER_SUCCESS': {
      const updatedUsers = [...state.users, action.payload];
      const filteredUsers = filterUsers(updatedUsers, state.filter);
      const sortedUsers = sortUsers(filteredUsers, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        users: updatedUsers,
        filteredUsers: sortedUsers,
        isLoading: false,
        error: null
      };
    }
    
    case 'CREATE_USER_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'UPDATE_USER_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'UPDATE_USER_SUCCESS': {
      const updatedUsers = state.users.map(user => 
        user.id === action.payload.id ? action.payload : user
      );
      const filteredUsers = filterUsers(updatedUsers, state.filter);
      const sortedUsers = sortUsers(filteredUsers, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        users: updatedUsers,
        filteredUsers: sortedUsers,
        selectedUser: action.payload.id === state.selectedUser?.id ? action.payload : state.selectedUser,
        isLoading: false,
        error: null
      };
    }
    
    case 'UPDATE_USER_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'DELETE_USER_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case 'DELETE_USER_SUCCESS': {
      const updatedUsers = state.users.filter(user => user.id !== action.payload);
      const filteredUsers = filterUsers(updatedUsers, state.filter);
      const sortedUsers = sortUsers(filteredUsers, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        users: updatedUsers,
        filteredUsers: sortedUsers,
        selectedUser: state.selectedUser?.id === action.payload ? null : state.selectedUser,
        isLoading: false,
        error: null
      };
    }
    
    case 'DELETE_USER_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    
    case 'SET_FILTER': {
      const newFilter = { ...state.filter, ...action.payload };
      const filteredUsers = filterUsers(state.users, newFilter);
      const sortedUsers = sortUsers(filteredUsers, state.sortBy, state.sortDirection);
      
      return {
        ...state,
        filter: newFilter,
        filteredUsers: sortedUsers
      };
    }
    
    case 'SET_SORT': {
      const { field, direction } = action.payload;
      const sortedUsers = sortUsers(state.filteredUsers, field, direction);
      
      return {
        ...state,
        sortBy: field,
        sortDirection: direction,
        filteredUsers: sortedUsers
      };
    }
    
    default:
      return state;
  }
}; 