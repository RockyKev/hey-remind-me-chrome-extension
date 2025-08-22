// Export/Import utility library for Hey Dont Forget
// Handles JSON export/import with merge-by-id functionality

import { getReminders, getSettings, getHistory, setReminders, setSettings, setHistory } from './storage.js';

// Export all data to JSON
export async function exportData() {
  try {
    const [reminders, settings, history] = await Promise.all([
      getReminders(),
      getSettings(),
      getHistory()
    ]);
    
    const exportData = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      settings,
      reminders,
      history
    };
    
    // Create filename with current date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0].replace(/-/g, '');
    const filename = `reminders-export-${dateString}.json`;
    
    // Convert to JSON and download
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    });
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    return false;
  }
}

// Import data from JSON
export async function importData(jsonString) {
  try {
    const importData = JSON.parse(jsonString);
    
    // Validate schema version
    if (!importData.schemaVersion || importData.schemaVersion !== 1) {
      throw new Error('Invalid schema version. Expected version 1.');
    }
    
    // Validate required fields
    if (!importData.settings || !importData.reminders || !importData.history) {
      throw new Error('Invalid import file. Missing required data sections.');
    }
    
    // Get current data
    const [currentReminders, currentSettings, currentHistory] = await Promise.all([
      getReminders(),
      getSettings(),
      getHistory()
    ]);
    
    // Merge settings (imported override existing)
    const mergedSettings = { ...currentSettings, ...importData.settings };
    
    // Merge reminders by ID (imported override existing)
    const mergedReminders = mergeById(currentReminders, importData.reminders);
    
    // Merge history by ID (imported override existing)
    const mergedHistory = mergeById(currentHistory, importData.history);
    
    // Save merged data
    await Promise.all([
      setSettings(mergedSettings),
      setReminders(mergedReminders),
      setHistory(mergedHistory)
    ]);
    
    return {
      success: true,
      imported: {
        reminders: importData.reminders.length,
        history: importData.history.length,
        settings: true
      },
      total: {
        reminders: mergedReminders.length,
        history: mergedHistory.length
      }
    };
    
  } catch (error) {
    console.error('Error importing data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Merge arrays by ID (imported items override existing)
function mergeById(existing, imported) {
  const existingMap = new Map(existing.map(item => [item.id, item]));
  
  // Imported items override existing ones
  imported.forEach(item => {
    if (item.id) {
      existingMap.set(item.id, item);
    }
  });
  
  return Array.from(existingMap.values());
}

// Validate import file before processing
export function validateImportFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);
        
        // Basic validation
        if (data.schemaVersion !== 1) {
          resolve({ valid: false, error: 'Invalid schema version' });
          return;
        }
        
        if (!data.settings || !data.reminders || !data.history) {
          resolve({ valid: false, error: 'Missing required data sections' });
          return;
        }
        
        resolve({ valid: true, data });
        
      } catch (error) {
        resolve({ valid: false, error: 'Invalid JSON file' });
      }
    };
    
    reader.onerror = () => {
      resolve({ valid: false, error: 'Error reading file' });
    };
    
    reader.readAsText(file);
  });
}
