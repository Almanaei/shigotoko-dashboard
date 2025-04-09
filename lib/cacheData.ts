/**
 * Utility function for caching dashboard data in localStorage
 * This makes search functionality work efficiently without repeated API calls
 */

import type { DashboardState } from '@/lib/DashboardProvider';

/**
 * Update the cached dashboard data in localStorage
 * This should be called whenever the dashboard state changes
 */
export function updateCachedDashboardData(state: DashboardState): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Create a sanitized copy without circular references
    const cachableData = {
      employees: state.employees,
      departments: state.departments,
      projects: state.projects,
      tasks: state.tasks,
      documents: state.documents,
      messages: state.messages
    };
    
    localStorage.setItem('dashboardData', JSON.stringify(cachableData));
  } catch (error) {
    console.error('Failed to cache dashboard data:', error);
  }
}

/**
 * Get cached dashboard data from localStorage
 */
export function getCachedDashboardData(): Partial<DashboardState> | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem('dashboardData');
    if (!data) return null;
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to retrieve cached dashboard data:', error);
    return null;
  }
}

/**
 * Clear cached dashboard data (useful for logout)
 */
export function clearCachedDashboardData(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('dashboardData');
  } catch (error) {
    console.error('Failed to clear cached dashboard data:', error);
  }
} 