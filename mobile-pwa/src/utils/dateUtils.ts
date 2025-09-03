// Date utility functions to fix timezone issues
// These functions ensure dates are handled in local timezone, not UTC

/**
 * Get local date string in YYYY-MM-DD format
 * Fixes the common timezone bug with toISOString().split('T')[0]
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in local timezone as YYYY-MM-DD string
 */
export const getTodayLocal = (): string => {
  return getLocalDateString(new Date());
};

/**
 * Add days to a date and return local date string
 */
export const addDaysLocal = (date: Date, days: number): string => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return getLocalDateString(newDate);
};

/**
 * Subtract days from a date and return local date string
 */
export const subtractDaysLocal = (date: Date, days: number): string => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return getLocalDateString(newDate);
};

/**
 * Get start of week date (Monday) in local timezone
 */
export const getWeekStartLocal = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return getLocalDateString(d);
};

/**
 * Get start of month date in local timezone
 */
export const getMonthStartLocal = (date: Date = new Date()): string => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return getLocalDateString(d);
};
