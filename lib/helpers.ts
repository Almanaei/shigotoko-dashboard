/**
 * Helper functions for common utilities across the application
 */

/**
 * Generates an avatar URL based on a user's name using UI Avatars service
 * @param name User's full name to generate initials from
 * @returns URL string for the avatar image
 */
export function generateAvatarUrl(name: string): string {
  if (!name) return `https://ui-avatars.com/api/?name=U&background=0D8ABC&color=fff&size=256&bold=true`;
  
  // Extract initials from name (up to 2 characters)
  const initials = name.split(' ')
    .map((part: string) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  // Preset colors that look good as avatar backgrounds
  const colors = ['0D8ABC', '27AE60', 'E74C3C', 'F1C40F', '8E44AD', 'D35400'];
  
  // Use the first character of the name to deterministically select a color
  // This ensures the same user always gets the same color
  const charCode = name.charCodeAt(0) || 0;
  const background = colors[charCode % colors.length];
  
  // Make sure we have at least one character for the initials
  const displayInitials = initials || 'U';
  
  // Generate URL with properly encoded parameters
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayInitials)}&background=${background}&color=fff&size=256&bold=true`;
}

/**
 * Format a date for display
 * @param date Date string or Date object
 * @param format Format style ('short', 'long', etc)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    return dateObj.toLocaleDateString();
  } else {
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Truncate text with ellipsis if it exceeds the maximum length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
} 