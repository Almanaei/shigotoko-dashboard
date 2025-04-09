# Cursor Init 1 - Codebase Analysis

## Summary
This document presents an analysis of the shigotoko-dashboard project, a Next.js application with a React frontend and Prisma ORM for database access.

## Project Structure
- **Frontend**: Next.js 15.2.4 with React 19
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom auth implementation with session management
- **State Management**: Context API with useReducer pattern

## Key Issues Identified

### 1. State Management Complexity
The `DashboardProvider.tsx` is extremely large (1227 lines) and handles all application state. This leads to:
- Difficult maintenance
- Potential performance issues
- Complex re-render logic

### 2. Avatar Upload Issues
Previous conversations highlight problems with avatar uploads causing "Maximum update depth exceeded" errors. Key components involved:
- `app/settings/page.tsx` (avatar upload handler)
- `components/dashboard/Navbar.tsx` (avatar display)
- `lib/DashboardProvider.tsx` (state management)

The primary issue appears to be circular state updates between components, with multiple sources of truth for avatar data (component state, context state, localStorage).

### 3. Hook Implementation Issues
There are potential issues with React hook implementations:
- `useRef` hooks inside useEffect
- Missing or changing dependency arrays
- Event listeners that may cause re-renders

### 4. Authentication Complexity
The application uses a dual authentication system (user vs employee) that introduces complexity:
- Multiple auth endpoints
- Different session storage mechanisms
- Complex session refresh logic

## Recommendations

### 1. Refactor State Management
- Split the monolithic `DashboardProvider` into domain-specific contexts
- Move API calls out of components and into dedicated service files
- Consider using React Query for data fetching and caching

### 2. Fix Avatar Upload Flow
- Implement a clear, unidirectional data flow for avatar updates
- Use a single source of truth (context state or localStorage, not both)
- Add proper error handling and validation for image processing

### 3. Improve React Hook Usage
- Ensure hooks follow React's rules (no conditional hooks, proper dependency arrays)
- Move event listeners to appropriate lifecycle hooks
- Add proper cleanup functions to all useEffect hooks with listeners

### 4. Simplify Authentication
- Unify the authentication mechanisms where possible
- Create a dedicated AuthProvider separate from DashboardProvider
- Implement proper token refresh mechanisms

### 5. Performance Optimization
- Add memoization for expensive renders and calculations
- Implement proper loading states and error boundaries
- Consider code splitting for larger components

## Implementation Priorities
1. Fix the "Maximum update depth exceeded" error in avatar upload
2. Refactor state management architecture
3. Improve React hook implementations
4. Simplify authentication flow
5. Add performance optimizations

## Next Steps
The most immediate action should be addressing the avatar upload issues by implementing a clear, unidirectional data flow and removing circular dependencies between components. 