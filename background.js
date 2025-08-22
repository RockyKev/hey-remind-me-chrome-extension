// Background service worker for Hey Dont Forget
// Handles daily alarms and notifications

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  // Set up default daily alarm at 9:00 AM
  await chrome.alarms.create('dailyReminder', {
    delayInMinutes: getMinutesUntil9AM(),
    periodInMinutes: 24 * 60 // 24 hours
  });
  
  // Initialize default settings if they don't exist
  const settings = await chrome.storage.local.get('settings');
  if (!settings.settings) {
    await chrome.storage.local.set({
      settings: {
        schemaVersion: 1,
        dailyReminderTime: "09:00",
        dateDisplayFormat: "YYYY-MM-DD",
        ratingRanges: {
          "1": { minDays: 1, maxDays: 2 },
          "2": { minDays: 3, maxDays: 10 },
          "3": { minDays: 11, maxDays: 22 },
          "4": { minDays: 23, maxDays: 40 },
          "5": { minDays: 41, maxDays: 70 }
        }
      }
    });
  }
});

// Handle alarm firing
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReminder') {
    await checkDueReminders();
  }
});

// Check for reminders that need attention
async function checkDueReminders() {
  try {
    const data = await chrome.storage.local.get(['reminders', 'settings']);
    const reminders = data.reminders || [];
    const settings = data.settings;
    
    if (!settings) return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dueReminders = reminders.filter(reminder => 
      reminder.status === 'pending' && 
      reminder.scheduledDate <= today
    );
    
    if (dueReminders.length > 0) {
      // Update lastFiredAt for all due reminders
      const updatedReminders = reminders.map(reminder => {
        if (reminder.status === 'pending' && reminder.scheduledDate <= today) {
          return { ...reminder, lastFiredAt: new Date().toISOString() };
        }
        return reminder;
      });
      
      await chrome.storage.local.set({ reminders: updatedReminders });
      
      // Show notification
      const firstReminder = dueReminders[0];
      const otherCount = dueReminders.length - 1;
      
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/icon48.png',
        title: 'Reminders Need Attention',
        message: `${firstReminder.title}${otherCount > 0 ? ` +${otherCount} other reminders in Need Attention` : ''}`,
        requireInteraction: true
      });
    }
  } catch (error) {
    console.error('Error checking due reminders:', error);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup();
});

// Calculate minutes until 9:00 AM
function getMinutesUntil9AM() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(9, 0, 0, 0);
  
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return Math.floor((target - now) / (1000 * 60));
}

// Handle settings changes (update alarm time)
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.settings) {
    const newSettings = changes.settings.newValue;
    if (newSettings && newSettings.dailyReminderTime) {
      // Clear existing alarm and create new one
      await chrome.alarms.clear('dailyReminder');
      await chrome.alarms.create('dailyReminder', {
        delayInMinutes: getMinutesUntil9AM(),
        periodInMinutes: 24 * 60
      });
    }
  }
});
