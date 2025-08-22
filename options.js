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
    importResults: document.getElementById('importResults')
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
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    
    // History search and filter
    elements.historySearch.addEventListener('input', filterHistory);
    elements.historyFilter.addEventListener('change', filterHistory);
    
    // Import modal close
    document.getElementById('closeImportModal').addEventListener('click', closeImportModal);
    document.getElementById('closeImportBtn').addEventListener('click', closeImportModal);
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
    try {
        elements.exportBtn.disabled = true;
        elements.exportBtn.textContent = 'Exporting...';
        
        const success = await exportData();
        
        if (success) {
            showMessage('Export completed successfully!', 'success');
        } else {
            showMessage('Export failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Export error:', error);
        showMessage('Export failed. Please try again.', 'error');
    } finally {
        elements.exportBtn.disabled = false;
        elements.exportBtn.textContent = 'Export Data';
    }
}

// Handle import
async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        elements.importBtn.disabled = true;
        elements.importBtn.textContent = 'Importing...';
        
        // Validate file
        const validation = await validateImportFile(file);
        if (!validation.valid) {
            showMessage(`Import failed: ${validation.error}`, 'error');
            return;
        }
        
        // Read file content
        const content = await readFileAsText(file);
        
        // Import data
        const result = await importData(content);
        
        if (result.success) {
            showImportResults(result);
            // Reload data
            await loadData();
            renderHistory();
        } else {
            showMessage(`Import failed: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Import error:', error);
        showMessage('Import failed. Please try again.', 'error');
    } finally {
        elements.importBtn.disabled = false;
        elements.importBtn.textContent = 'Import Data';
        elements.importFile.value = ''; // Reset file input
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

// Save settings
async function saveSettings() {
    try {
        elements.saveSettingsBtn.disabled = true;
        elements.saveSettingsBtn.textContent = 'Saving...';
        
        // Validate rating ranges
        if (!validateRatingRanges()) {
            showMessage('Please fix the rating range values.', 'error');
            return;
        }
        
        // Build settings object
        const newSettings = {
            ...currentSettings,
            dailyReminderTime: elements.dailyTime.value,
            dateDisplayFormat: elements.dateFormat.value,
            ratingRanges: {
                "1": { minDays: parseInt(elements.rating1Min.value), maxDays: parseInt(elements.rating1Max.value) },
                "2": { minDays: parseInt(elements.rating2Min.value), maxDays: parseInt(elements.rating2Max.value) },
                "3": { minDays: parseInt(elements.rating3Min.value), maxDays: parseInt(elements.rating3Max.value) },
                "4": { minDays: parseInt(elements.rating4Min.value), maxDays: parseInt(elements.rating4Max.value) },
                "5": { minDays: parseInt(elements.rating5Min.value), maxDays: parseInt(elements.rating5Max.value) }
            }
        };
        
        // Save to storage
        await setSettings(newSettings);
        currentSettings = newSettings;
        
        showMessage('Settings saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Error saving settings. Please try again.', 'error');
    } finally {
        elements.saveSettingsBtn.disabled = false;
        elements.saveSettingsBtn.textContent = 'Save Settings';
    }
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
