/**
 * Date utility functions
 */

/**
 * Format a date string to a readable format
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format a date string to a date only format
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

/**
 * Format a date string to a time only format
 */
export const formatTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
};

/**
 * Check if a date is today
 */
export const isToday = (dateString: string | Date): boolean => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const today = new Date();

  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is in the past
 */
export const isPast = (dateString: string | Date): boolean => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.getTime() < new Date().getTime();
};

/**
 * Check if a date is in the future
 */
export const isFuture = (dateString: string | Date): boolean => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.getTime() > new Date().getTime();
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add hours to a date
 */
export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Get the start of the day (midnight)
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of the day (23:59:59.999)
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Format date for API (ISO string)
 */
export const toApiDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Parse API date to local date
 */
export const fromApiDate = (dateString: string): Date => {
  return new Date(dateString);
};