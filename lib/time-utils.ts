/**
 * Time format utilities for converting between colon-based time and decimal minutes
 */

/**
 * Parse time string to decimal minutes
 * Accepts formats:
 * - "HH:MM:SS" (e.g., "1:23:45" = 83.75 min)
 * - "MM:SS" (e.g., "23:45" = 23.75 min)
 * - "M:SS" (e.g., "5:30" = 5.5 min)
 * - "SS" (e.g., "45" = 0.75 min)
 *
 * @param timeString - Time in colon format
 * @returns Decimal minutes, or null if invalid
 */
export function parseTimeToMinutes(timeString: string): number | null {
  if (!timeString || typeof timeString !== 'string') return null;

  const trimmed = timeString.trim();
  if (!trimmed) return null;

  // Remove all non-digit and non-colon characters
  const cleaned = trimmed.replace(/[^\d:]/g, '');
  if (!cleaned) return null;

  const parts = cleaned.split(':').map(p => parseInt(p, 10));

  // Filter out NaN values
  if (parts.some(p => isNaN(p))) return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS
    [hours, minutes, seconds] = parts;
  } else if (parts.length === 2) {
    // MM:SS (default interpretation)
    [minutes, seconds] = parts;
  } else if (parts.length === 1) {
    // SS (seconds only)
    seconds = parts[0];
  } else {
    return null;
  }

  // Validate ranges
  if (seconds < 0 || seconds >= 60) return null;
  if (minutes < 0 || (parts.length === 3 && minutes >= 60)) return null;
  if (hours < 0) return null;

  // Convert to decimal minutes
  const totalMinutes = hours * 60 + minutes + seconds / 60;

  // Round to 2 decimal places to avoid floating point issues
  return Math.round(totalMinutes * 100) / 100;
}

/**
 * Format decimal minutes to time string
 * Returns "HH:MM:SS" if >= 60 minutes
 * Returns "MM:SS" if < 60 minutes
 *
 * @param minutes - Decimal minutes
 * @returns Time string in format HH:MM:SS or MM:SS
 */
export function formatMinutesToTime(minutes: number): string {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) {
    return '0:00';
  }

  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate time string format
 * @param timeString - Time string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTimeString(timeString: string): string | null {
  if (!timeString || !timeString.trim()) {
    return 'Time is required';
  }

  const parsed = parseTimeToMinutes(timeString);

  if (parsed === null) {
    return 'Invalid time format. Use MM:SS or HH:MM:SS';
  }

  if (parsed <= 0) {
    return 'Time must be greater than 0';
  }

  if (parsed > 1440) { // 24 hours
    return 'Time cannot exceed 24 hours';
  }

  return null;
}

/**
 * Get placeholder text based on expected duration range
 * @param shortForm - If true, use short format (MM:SS), else allow both
 */
export function getTimePlaceholder(shortForm: boolean = false): string {
  return shortForm ? 'MM:SS (e.g., 23:45)' : 'MM:SS or HH:MM:SS';
}
