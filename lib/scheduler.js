// Scheduler utility library for Hey Dont Forget
// Handles date calculations and random scheduling

// Generate a unique ID (ULID-like)
export function generateId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${timestamp}-${random}`;
}

// Get today's date in YYYY-MM-DD format
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Add days to a date string
export function addDaysToDate(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Pick a random date within a range (uniform distribution)
export function pickRandomDateInRange(minDays, maxDays) {
  const randomDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  return addDaysToDate(getTodayString(), randomDays);
}

// Format date for display based on user preference
export function formatDateForDisplay(dateString, format = 'YYYY-MM-DD') {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (format === 'MM-DD-YYYY') {
    return `${month}-${day}-${year}`;
  }
  
  // Default: YYYY-MM-DD
  return `${year}-${month}-${day}`;
}

// Parse date from display format back to YYYY-MM-DD
export function parseDateFromDisplay(displayDate, format = 'YYYY-MM-DD') {
  if (!displayDate) return '';
  
  if (format === 'MM-DD-YYYY') {
    const [month, day, year] = displayDate.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Default: YYYY-MM-DD
  return displayDate;
}

// Check if a date is today or in the past
export function isDateDue(dateString) {
  const today = getTodayString();
  return dateString <= today;
}

// Get relative date description
export function getRelativeDateDescription(dateString) {
  const today = new Date(getTodayString());
  const target = new Date(dateString);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `In ${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  
  return 'Today';
}

// Validate date string format
export function isValidDateString(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// Get rating description
export function getRatingDescription(rating) {
  const descriptions = {
    1: 'Soon (1-2 days)',
    2: 'In a week (3-10 days)',
    3: 'In two weeks (11-22 days)',
    4: 'In a month (23-40 days)',
    5: 'In a few months (41-70 days)'
  };
  
  return descriptions[rating] || 'Custom';
}
