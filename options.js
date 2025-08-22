// Options page JavaScript for Hey Dont Forget
// Handles settings management, history display, and export/import

import { 
    getSettings, 
    setSettings, 
    getHistory 
} from './lib/storage.js';

import { 
    exportData, 
    importData, 
    validateImportFile 
} from './lib/exportImport.js';

import { formatDateForDisplay } from './lib/scheduler.js';

// Global state
let currentSettings = {};
let currentHistory = [];

// DOM elements
const elements = {
    dailyTime: document.getElementById('dailyTime'),
    dateFormat: document.getElementById('dateFormat'),
    rating1Min: document.getElementById('rating1Min'),
    rating1Max: document.getElementById('rating1Max'),
    rating2Min: document.getElementById('rating2Min'),
    rating2Max: document.getElementById('rating2Max'),
    rating3Min: document.getElementById('rating3Min'),
    rating3Max: document.getElementById('rating3Max'),
    rating4Min: document.getElementById('rating4Min'),
    rating4Max: document.getElementById('rating4Max'),
    rating5Min: document.getElementById('rating5Min'),
    rating5Max: document.getElementById('rating5Max'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    historySearch: document.getElementById('historySearch'),
    historyFilter: document.getElementById('historyFilter'),
    historyTableBody: document.getElementById('historyTableBody'),
    historyEmpty: document.getElementById('historyEmpty'),
    importModal: document.getElementById('importModal'),
    importResults: document.getElementById('importResults'),
    enableDevTools: document.getElementById('enableDevTools'),
    devToolsButtons: document.getElementById('devToolsButtons')
};

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    renderHistory();
});

// Load data from storage
async function loadData() {
    try {
        [currentSettings, currentHistory] = await Promise.all([
            getSettings(),
            getHistory()
        ]);
        
        populateSettingsForm();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Populate settings form with current values
function populateSettingsForm() {
    elements.dailyTime.value = currentSettings.dailyReminderTime || '09:00';
    elements.dateFormat.value = currentSettings.dateDisplayFormat || 'YYYY-MM-DD';
    
    // Populate rating ranges
    const ranges = currentSettings.ratingRanges || {};
    elements.rating1Min.value = ranges['1']?.minDays || 1;
    elements.rating1Max.value = ranges['1']?.maxDays || 2;
    elements.rating2Min.value = ranges['2']?.minDays || 3;
    elements.rating2Max.value = ranges['2']?.maxDays || 10;
    elements.rating3Min.value = ranges['3']?.minDays || 11;
    elements.rating3Max.value = ranges['3']?.maxDays || 22;
    elements.rating4Min.value = ranges['4']?.minDays || 23;
    elements.rating4Max.value = ranges['4']?.maxDays || 40;
    elements.rating5Min.value = ranges['5']?.minDays || 41;
    elements.rating5Max.value = ranges['5']?.maxDays || 70;
    
    // Populate developer tools setting
    const devToolsEnabled = currentSettings.enableDevTools || false;
    elements.enableDevTools.checked = devToolsEnabled;
    toggleDevTools(devToolsEnabled);
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Export button
    elements.exportBtn.addEventListener('click', handleExport);
    
    // Import button
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', handleImport);
    
    // Save settings button
    elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);
    
    // Developer tools toggle
    elements.enableDevTools.addEventListener('change', handleDevToolsToggle);
    
    // History search and filter
    elements.historySearch.addEventListener('input', filterHistory);
    elements.historyFilter.addEventListener('change', filterHistory);
    
    // Import modal close
    document.getElementById('closeImportModal').addEventListener('click', closeImportModal);
    document.getElementById('closeImportBtn').addEventListener('click', closeImportModal);
    
    // Developer tools
    document.getElementById('populateTestDataBtn').addEventListener('click', populateTestData);
    document.getElementById('forceNotificationBtn').addEventListener('click', forceNotificationTest);
    document.getElementById('randomDueBtn').addEventListener('click', randomReminderToDue);
    document.getElementById('clearAllDataBtn').addEventListener('click', clearAllData);
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}Tab`);
    });
    
    // Refresh data if switching to history tab
    if (tabName === 'history') {
        renderHistory();
    }
}

// Handle export
async function handleExport() {
    // Show loading state
    const exportBtn = elements.exportBtn;
    const originalText = exportBtn.textContent;
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting...';
    
    try {
        await exportData();
        // Show success feedback
        exportBtn.textContent = 'Exported!';
        setTimeout(() => {
            exportBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
        exportBtn.textContent = originalText;
    } finally {
        exportBtn.disabled = false;
    }
}

// Handle import
async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show loading state
    const importBtn = elements.importBtn;
    const originalText = importBtn.textContent;
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';
    
    try {
        const result = await importData(file);
        
        if (result.success) {
            // Reload data and show results
            await loadData();
            renderHistory();
            
            // Show success feedback
            importBtn.textContent = 'Imported!';
            setTimeout(() => {
                importBtn.textContent = originalText;
            }, 2000);
            
            // Show import results modal
            showImportResults(result);
        } else {
            alert(`Import failed: ${result.error}`);
            importBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please try again.');
        importBtn.textContent = originalText;
    } finally {
        importBtn.disabled = false;
        // Reset file input
        elements.importFile.value = '';
    }
}

// Read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Show import results
function showImportResults(result) {
    elements.importResults.innerHTML = `
        <p><strong>Import completed successfully!</strong></p>
        <ul>
            <li>Settings: Updated</li>
            <li>Reminders: ${result.imported.reminders} imported (${result.total.reminders} total)</li>
            <li>History: ${result.imported.history} imported (${result.total.history} total)</li>
        </ul>
    `;
    
    elements.importModal.classList.add('active');
}

// Close import modal
function closeImportModal() {
    elements.importModal.classList.remove('active');
}

// Handle settings save
async function handleSaveSettings() {
    // Show loading state
    const saveBtn = elements.saveSettingsBtn;
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        const newSettings = {
            schemaVersion: 1,
            dailyReminderTime: elements.dailyTime.value,
            dateDisplayFormat: elements.dateFormat.value,
            enableDevTools: elements.enableDevTools.checked,
            ratingRanges: {
                "1": { minDays: parseInt(elements.rating1Min.value), maxDays: parseInt(elements.rating1Max.value) },
                "2": { minDays: parseInt(elements.rating2Min.value), maxDays: parseInt(elements.rating2Max.value) },
                "3": { minDays: parseInt(elements.rating3Min.value), maxDays: parseInt(elements.rating3Max.value) },
                "4": { minDays: parseInt(elements.rating4Min.value), maxDays: parseInt(elements.rating4Max.value) },
                "5": { minDays: parseInt(elements.rating5Min.value), maxDays: parseInt(elements.rating5Max.value) }
            }
        };
        
        await setSettings(newSettings);
        currentSettings = newSettings;
        
        // Show success feedback
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings. Please try again.');
        saveBtn.textContent = originalText;
    } finally {
        saveBtn.disabled = false;
    }
}

// Handle developer tools toggle
function handleDevToolsToggle() {
    const enabled = elements.enableDevTools.checked;
    toggleDevTools(enabled);
    
    // Save the setting immediately
    if (currentSettings) {
        currentSettings.enableDevTools = enabled;
        setSettings(currentSettings).catch(console.error);
    }
}

// Toggle developer tools visibility
function toggleDevTools(enabled) {
    elements.devToolsButtons.style.display = enabled ? 'block' : 'none';
}

// Validate rating ranges
function validateRatingRanges() {
    const ranges = [
        [elements.rating1Min, elements.rating1Max],
        [elements.rating2Min, elements.rating2Max],
        [elements.rating3Min, elements.rating3Max],
        [elements.rating4Min, elements.rating4Max],
        [elements.rating5Min, elements.rating5Max]
    ];
    
    for (const [min, max] of ranges) {
        const minVal = parseInt(min.value);
        const maxVal = parseInt(max.value);
        
        if (isNaN(minVal) || isNaN(maxVal) || minVal < 1 || maxVal < 1 || minVal > maxVal) {
            return false;
        }
    }
    
    return true;
}

// Render history table
function renderHistory() {
    const searchTerm = elements.historySearch.value.toLowerCase();
    const filterValue = elements.historyFilter.value;
    
    let filteredHistory = currentHistory;
    
    // Apply search filter
    if (searchTerm) {
        filteredHistory = filteredHistory.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm) ||
            (entry.reference && entry.reference.toLowerCase().includes(searchTerm)) ||
            (entry.notes && entry.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply resolution filter
    if (filterValue !== 'all') {
        filteredHistory = filteredHistory.filter(entry => entry.resolution === filterValue);
    }
    
    // Sort by resolved date (newest first)
    filteredHistory.sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
    
    // Render table
    if (filteredHistory.length === 0) {
        elements.historyTableBody.innerHTML = '';
        elements.historyEmpty.style.display = 'block';
        return;
    }
    
    elements.historyEmpty.style.display = 'none';
    
    const tableHTML = filteredHistory.map(entry => `
        <tr>
            <td>${formatDateForDisplay(entry.createdAt, currentSettings.dateDisplayFormat)}</td>
            <td>${formatDateForDisplay(entry.scheduledDate, currentSettings.dateDisplayFormat)}</td>
            <td>${escapeHtml(entry.title)}</td>
            <td>${escapeHtml(entry.reference || '')}</td>
            <td>${escapeHtml(entry.notes || '')}</td>
            <td>${entry.resolution}</td>
            <td>${formatDateForDisplay(entry.resolvedAt, currentSettings.dateDisplayFormat)}</td>
        </tr>
    `).join('');
    
    elements.historyTableBody.innerHTML = tableHTML;
}

// Filter history
function filterHistory() {
    renderHistory();
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    // Style the message
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    // Set background color based on type
    if (type === 'success') messageDiv.style.background = '#4CAF50';
    else if (type === 'error') messageDiv.style.background = '#f44336';
    else messageDiv.style.background = '#2196F3';
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Developer Tools Functions

// Auto-populate test data
async function populateTestData() {
    if (!confirm('This will add 10 test reminders. Continue?')) return;
    
    const testReminders = [
        {
            id: 'test-1',
            title: 'Test Reminder - Due Today',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date().toISOString().split('T')[0], // Today
            rating: 1,
            customDays: null,
            reference: 'Test reference',
            notes: 'This is a test reminder due today',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-2',
            title: 'Test Reminder - Due Tomorrow',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
            rating: 2,
            customDays: null,
            reference: 'Tomorrow task',
            notes: 'This reminder is due tomorrow',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-3',
            title: 'Test Reminder - Next Week',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
            rating: 3,
            customDays: null,
            reference: 'Weekly task',
            notes: 'This is scheduled for next week',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-4',
            title: 'Test Reminder - Custom Days',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days
            rating: 1,
            customDays: 5,
            reference: 'Custom timing',
            notes: 'This uses custom days (5)',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-5',
            title: 'Test Reminder - Long Title Example',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks
            rating: 4,
            customDays: null,
            reference: 'Long title test',
            notes: 'This reminder has a very long title to test UI layout and text wrapping capabilities',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-6',
            title: 'Test Reminder - No Reference',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 weeks
            rating: 5,
            customDays: null,
            reference: '',
            notes: 'This reminder has no reference field',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-7',
            title: 'Test Reminder - No Notes',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 month
            rating: 4,
            customDays: null,
            reference: 'No notes test',
            notes: '',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-8',
            title: 'Test Reminder - Edge Case',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 months
            rating: 5,
            customDays: null,
            reference: 'Edge case testing',
            notes: 'Testing edge cases and boundary conditions',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-9',
            title: 'Test Reminder - Special Characters',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days
            rating: 2,
            customDays: null,
            reference: 'Special chars: !@#$%^&*()',
            notes: 'Testing special characters: !@#$%^&*()_+-=[]{}|;:,.<>?',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        },
        {
            id: 'test-10',
            title: 'Test Reminder - Very Long Notes',
            createdAt: new Date().toISOString(),
            scheduledDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1.5 months
            rating: 3,
            customDays: null,
            reference: 'Long notes test',
            notes: 'This is a very long note that tests how the UI handles extensive text content. It should wrap properly and not break the layout. The note contains multiple sentences to simulate real-world usage where users might write detailed descriptions of their reminders. This helps ensure the interface remains clean and readable even with substantial content.',
            status: 'pending',
            lastFiredAt: null,
            resolved: null
        }
    ];
    
    try {
        // Get existing reminders and add test ones
        const { getReminders, addReminder } = await import('./lib/storage.js');
        const existingReminders = await getReminders();
        
        // Filter out any existing test reminders
        const nonTestReminders = existingReminders.filter(r => !r.id.startsWith('test-'));
        
        // Add test reminders
        for (const reminder of testReminders) {
            await addReminder(reminder);
        }
        
        alert(`Added ${testReminders.length} test reminders! Refresh the popup to see them.`);
        
        // Reload data to show new reminders
        await loadData();
        renderHistory();
        
    } catch (error) {
        console.error('Error populating test data:', error);
        alert('Error adding test data. Please try again.');
    }
}

// Force notification test
async function forceNotificationTest() {
    try {
        // Send a test notification
        await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon48.png',
            title: 'Test Notification',
            message: 'This is a test notification to verify the system works',
            requireInteraction: true
        });
        
        alert('Test notification sent! Check your system notifications.');
        
    } catch (error) {
        console.error('Error sending test notification:', error);
        alert('Error sending test notification. Check console for details.');
    }
}

// Clear all data
async function clearAllData() {
    if (!confirm('This will delete ALL reminders, settings, and history. This action cannot be undone. Continue?')) return;
    
    if (!confirm('Are you absolutely sure? This will completely reset the extension.')) return;
    
    try {
        await chrome.storage.local.clear();
        alert('All data cleared! The extension has been reset to default state.');
        
        // Reload data
        await loadData();
        renderHistory();
        
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
    }
}

// Random reminder to due (chaotic debug tool)
async function randomReminderToDue() {
    try {
        // Get all pending reminders
        const { getReminders, updateReminder } = await import('./lib/storage.js');
        const reminders = await getReminders();
        
        // Filter for reminders that are NOT due today (coming up)
        const today = new Date().toISOString().split('T')[0];
        const comingUpReminders = reminders.filter(r => 
            r.status === 'pending' && r.scheduledDate > today
        );
        
        if (comingUpReminders.length === 0) {
            alert('No reminders in "Coming Up" to make due. Create some reminders first!');
            return;
        }
        
        // Pick a random reminder
        const randomIndex = Math.floor(Math.random() * comingUpReminders.length);
        const randomReminder = comingUpReminders[randomIndex];
        
        // Make it due today (chaotic!)
        const updatedReminder = {
            ...randomReminder,
            scheduledDate: today
        };
        
        await updateReminder(updatedReminder);
        
        alert(`Chaos! "${randomReminder.title}" is now due today! 🎲`);
        
    } catch (error) {
        console.error('Error making random reminder due:', error);
        alert('Error making random reminder due. Please try again.');
    }
}
