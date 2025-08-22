// Storage utility library for Hey Dont Forget
// Thin wrappers around chrome.storage.local

// Get data from storage
export async function getStorageData(keys) {
  try {
    return await chrome.storage.local.get(keys);
  } catch (error) {
    console.error('Error getting storage data:', error);
    return {};
  }
}

// Set data in storage
export async function setStorageData(data) {
  try {
    await chrome.storage.local.set(data);
    return true;
  } catch (error) {
    console.error('Error setting storage data:', error);
    return false;
  }
}

// Remove data from storage
export async function removeStorageData(keys) {
  try {
    await chrome.storage.local.remove(keys);
    return true;
  } catch (error) {
    console.error('Error removing storage data:', error);
    return false;
  }
}

// Clear all storage
export async function clearStorage() {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

// Get reminders
export async function getReminders() {
  const data = await getStorageData('reminders');
  return data.reminders || [];
}

// Set reminders
export async function setReminders(reminders) {
  return await setStorageData({ reminders });
}

// Add a single reminder
export async function addReminder(reminder) {
  const reminders = await getReminders();
  reminders.push(reminder);
  return await setReminders(reminders);
}

// Update a single reminder
export async function updateReminder(updatedReminder) {
  const reminders = await getReminders();
  const index = reminders.findIndex(r => r.id === updatedReminder.id);
  if (index !== -1) {
    reminders[index] = updatedReminder;
    return await setReminders(reminders);
  }
  return false;
}

// Delete a reminder
export async function deleteReminder(reminderId) {
  const reminders = await getReminders();
  const filtered = reminders.filter(r => r.id !== reminderId);
  return await setReminders(filtered);
}

// Get settings
export async function getSettings() {
  const data = await getStorageData('settings');
  return data.settings || {
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
  };
}

// Set settings
export async function setSettings(settings) {
  return await setStorageData({ settings });
}

// Get history
export async function getHistory() {
  const data = await getStorageData('history');
  return data.history || [];
}

// Set history
export async function setHistory(history) {
  return await setStorageData({ history });
}

// Add history entry
export async function addHistoryEntry(entry) {
  const history = await getHistory();
  history.push(entry);
  return await setHistory(history);
}
