// Main popup JavaScript for Hey Dont Forget
// Handles UI interactions, reminder management, and modal functionality

import { 
    getReminders, 
    addReminder, 
    updateReminder, 
    deleteReminder,
    addHistoryEntry,
    getSettings 
} from './lib/storage.js';

import { 
    generateId, 
    getTodayString, 
    pickRandomDateInRange, 
    addDaysToDate,
    formatDateForDisplay,
    isDateDue 
} from './lib/scheduler.js';

import { copyReminderReference } from './lib/clipboard.js';

// Global state
let currentReminders = [];
let currentSettings = {};
let editingReminder = null;
let currentDueItem = null;

// DOM elements
const elements = {
    needAttentionList: document.getElementById('needAttentionList'),
    comingUpList: document.getElementById('comingUpList'),
    needAttentionEmpty: document.getElementById('needAttentionEmpty'),
    comingUpEmpty: document.getElementById('comingUpEmpty'),
    reminderModal: document.getElementById('reminderModal'),
    dueItemModal: document.getElementById('dueItemModal'),
    reminderForm: document.getElementById('reminderForm'),
    titleInput: document.getElementById('title'),
    referenceInput: document.getElementById('reference'),
    notesInput: document.getElementById('notes'),
    customDaysInput: document.getElementById('customDays'),
    ratingInputs: document.querySelectorAll('input[name="rating"]'),
    scheduleAgainCheckbox: document.getElementById('scheduleAgainCheckbox'),
    dueItemTitle: document.getElementById('dueItemTitle'),
    dueItemReference: document.getElementById('dueItemReference'),
    dueItemNotes: document.getElementById('dueItemNotes')
};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    renderReminders();
});

// Load data from storage
async function loadData() {
    try {
        [currentReminders, currentSettings] = await Promise.all([
            getReminders(),
            getSettings()
        ]);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // New reminder button
    document.getElementById('newReminderBtn').addEventListener('click', () => {
        openReminderModal();
    });

    // Options button
    document.getElementById('openOptions').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeReminderModal);
    document.getElementById('closeDueModal').addEventListener('click', closeDueItemModal);
    document.getElementById('cancelBtn').addEventListener('click', closeReminderModal);

    // Form submission
    elements.reminderForm.addEventListener('submit', handleReminderSubmit);

    // Rating radio button changes
    elements.ratingInputs.forEach(input => {
        input.addEventListener('change', handleRatingChange);
    });

    // Due item actions
    document.getElementById('snoozeBtn').addEventListener('click', handleSnooze);
    document.getElementById('doneBtn').addEventListener('click', handleDone);
}

// Handle rating selection change
function handleRatingChange() {
    // The clock ratings are now purely visual - no special logic needed
    // The form will submit the selected rating value automatically
}

// Open reminder modal
function openReminderModal(reminder = null) {
    editingReminder = reminder;
    
    if (reminder) {
        // Edit mode
        document.getElementById('modalTitle').textContent = 'Edit Reminder';
        elements.titleInput.value = reminder.title;
        elements.referenceInput.value = reminder.reference || '';
        elements.notesInput.value = reminder.notes || '';
        
        // Select the appropriate rating
        if (reminder.customDays) {
            // For custom days, we'll need to handle this differently
            // For now, just select rating 1 and show custom days
            document.querySelector('input[name="rating"][value="1"]').checked = true;
            elements.customDaysInput.value = reminder.customDays;
        } else {
            document.querySelector(`input[name="rating"][value="${reminder.rating}"]`).checked = true;
            elements.customDaysInput.value = '';
        }
    } else {
        // New reminder mode
        document.getElementById('modalTitle').textContent = 'New Reminder';
        elements.reminderForm.reset();
        document.querySelector('input[name="rating"][value="1"]').checked = true;
        elements.customDaysInput.value = '';
    }
    
    elements.reminderModal.classList.add('active');
}

// Close reminder modal
function closeReminderModal() {
    elements.reminderModal.classList.remove('active');
    editingReminder = null;
    elements.reminderForm.reset();
}

// Open due item modal
function openDueItemModal(reminder) {
    currentDueItem = reminder;
    
    elements.dueItemTitle.textContent = reminder.title;
    elements.dueItemReference.textContent = reminder.reference || '';
    elements.dueItemNotes.textContent = reminder.notes || '';
    
    // Show/hide reference and notes based on content
    elements.dueItemReference.style.display = reminder.reference ? 'block' : 'none';
    elements.dueItemNotes.style.display = reminder.notes ? 'block' : 'none';
    
    elements.dueItemModal.classList.add('active');
}

// Close due item modal
function closeDueItemModal() {
    elements.dueItemModal.classList.remove('active');
    currentDueItem = null;
}

// Handle reminder form submission
async function handleReminderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(elements.reminderForm);
    const title = formData.get('title').trim();
    const rating = formData.get('rating');
    const customDays = formData.get('customDays');
    const reference = formData.get('reference').trim();
    const notes = formData.get('notes').trim();
    
    if (!title) return;
    
    // Show loading state
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    try {
        let scheduledDate;
        let reminderRating = rating;
        let reminderCustomDays = null;
        
        // Check if custom days are provided
        if (customDays && customDays.trim() !== '') {
            const days = parseInt(customDays);
            if (isNaN(days) || days < 1 || days > 365) {
                alert('Please enter a valid number of days (1-365)');
                return;
            }
            scheduledDate = addDaysToDate(getTodayString(), days);
            reminderCustomDays = days;
        } else {
            // Use the selected rating
            const ratingNum = parseInt(rating);
            const range = currentSettings.ratingRanges[ratingNum];
            scheduledDate = pickRandomDateInRange(range.minDays, range.maxDays);
            reminderRating = ratingNum;
        }
        
        const reminder = {
            id: editingReminder ? editingReminder.id : generateId(),
            title,
            createdAt: editingReminder ? editingReminder.createdAt : new Date().toISOString(),
            scheduledDate,
            rating: reminderRating,
            customDays: reminderCustomDays,
            reference,
            notes,
            status: 'pending',
            lastFiredAt: editingReminder ? editingReminder.lastFiredAt : null,
            resolved: null
        };
        
        if (editingReminder) {
            await updateReminder(reminder);
        } else {
            await addReminder(reminder);
        }
        
        await loadData();
        renderReminders();
        closeReminderModal();
        
    } catch (error) {
        console.error('Error saving reminder:', error);
        alert('Error saving reminder. Please try again.');
    } finally {
        // Restore button state
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// Handle snooze action
function handleSnooze() {
    closeDueItemModal();
}

// Handle done action
async function handleDone() {
    if (!currentDueItem) return;
    
    // Show loading state
    const doneBtn = document.getElementById('doneBtn');
    const originalText = doneBtn.textContent;
    doneBtn.disabled = true;
    doneBtn.textContent = 'Processing...';
    
    try {
        // Add to history
        await addHistoryEntry({
            id: currentDueItem.id,
            createdAt: currentDueItem.createdAt,
            scheduledDate: currentDueItem.scheduledDate,
            resolvedAt: new Date().toISOString(),
            resolution: 'Done',
            title: currentDueItem.title,
            reference: currentDueItem.reference,
            notes: currentDueItem.notes
        });
        
        // Mark as done
        const updatedReminder = { ...currentDueItem, status: 'done' };
        await updateReminder(updatedReminder);
        
        // Check if we should schedule again
        if (elements.scheduleAgainCheckbox.checked) {
            closeDueItemModal();
            openReminderModal({
                title: currentDueItem.title,
                reference: currentDueItem.reference,
                notes: currentDueItem.notes,
                rating: currentDueItem.customDays ? '1' : currentDueItem.rating,
                customDays: currentDueItem.customDays
            });
        } else {
            closeDueItemModal();
        }
        
        await loadData();
        renderReminders();
        
    } catch (error) {
        console.error('Error marking reminder as done:', error);
        alert('Error updating reminder. Please try again.');
    } finally {
        // Restore button state
        doneBtn.disabled = false;
        doneBtn.textContent = originalText;
    }
}

// Render reminders in the UI
function renderReminders() {
    const today = getTodayString();
    
    // Separate reminders into need attention and coming up
    const needAttention = currentReminders.filter(r => 
        r.status === 'pending' && isDateDue(r.scheduledDate)
    );
    
    const comingUp = currentReminders.filter(r => 
        r.status === 'pending' && !isDateDue(r.scheduledDate)
    ).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
    
    // Render need attention section
    renderReminderList(elements.needAttentionList, needAttention, 'needAttention', true);
    elements.needAttentionEmpty.style.display = needAttention.length > 0 ? 'none' : 'block';
    
    // Render coming up section
    renderReminderList(elements.comingUpList, comingUp, 'comingUp', false);
    elements.comingUpEmpty.style.display = comingUp.length > 0 ? 'none' : 'block';
}

// Render a list of reminders
function renderReminderList(container, reminders, sectionType, isNeedAttention) {
    container.innerHTML = '';
    
    reminders.forEach(reminder => {
        const reminderElement = createReminderElement(reminder, sectionType, isNeedAttention);
        container.appendChild(reminderElement);
    });
}

// Create a reminder element
function createReminderElement(reminder, sectionType, isNeedAttention) {
    const div = document.createElement('div');
    div.className = 'reminder-item';
    div.dataset.id = reminder.id;
    
    const displayDate = formatDateForDisplay(reminder.scheduledDate, currentSettings.dateDisplayFormat);
    
    div.innerHTML = `
        <div class="reminder-content">
            <div class="reminder-header">
				<span class="reminder-date">${displayDate}</span>
                <h3 class="reminder-title">${reminder.title}</h3>
            </div>
        </div>
        <div class="reminder-actions">
            ${reminder.reference ? `<button class="btn-icon" title="Copy reference">📋</button>` : ''}
            <button class="btn-icon" title="Edit">✏️</button>
            ${isNeedAttention ? `<button class="btn-icon" title="Mark done">✅</button>` : ''}
        </div>
    `;
    
    // Add event listeners
    const copyBtn = div.querySelector('button[title="Copy reference"]');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => copyReminderReference(reminder));
    }
    
    const editBtn = div.querySelector('button[title="Edit"]');
    editBtn.addEventListener('click', () => openReminderModal(reminder));
    
    if (isNeedAttention) {
        const doneBtn = div.querySelector('button[title="Mark done"]');
        doneBtn.addEventListener('click', () => openDueItemModal(reminder));
    }
    
    return div;
}
