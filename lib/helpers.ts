/**
 * Helper functions for common utilities across the application
 */

/**
 * Generates an avatar URL based on a user's name using UI Avatars service
 * @param name User's full name to generate initials from
 * @returns URL string for the avatar image
 */
export function generateAvatarUrl(name: string): string {
  if (!name) return `https://ui-avatars.com/api/?name=US&background=0D8ABC&color=fff&size=256&bold=true`;
  
  // Extract initials from name (up to 2 characters)
  const nameParts = name.split(' ');
  let initials = '';
  
  if (nameParts.length >= 2) {
    // If there are multiple name parts, take first letter from first and last name
    initials = nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
  } else if (name.length >= 2) {
    // If single name but at least 2 chars, take first two letters
    initials = name.substring(0, 2);
  } else {
    // For single character names, add 'U' as second character
    initials = name.charAt(0) + 'U';
  }
  
  // Ensure uppercase
  initials = initials.toUpperCase();
  
  // Preset colors that look good as avatar backgrounds
  const colors = ['0D8ABC', '27AE60', 'E74C3C', 'F1C40F', '8E44AD', 'D35400'];
  
  // Use the first character of the name to deterministically select a color
  // This ensures the same user always gets the same color
  const charCode = name.charCodeAt(0) || 0;
  const background = colors[charCode % colors.length];
  
  // Generate URL with properly encoded parameters
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${background}&color=fff&size=256&bold=true`;
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