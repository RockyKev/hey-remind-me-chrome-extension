# Hey Dont Forget - Chrome Extension

**Don't forget to do that thing in the future. No cloud, no telemetry — all local.**

A lightweight, privacy-focused Chrome extension that helps you create future reminders without setting up calendars or cloud accounts. All data is stored locally on your device.

## Features

### 🚀 Core Functionality
- **Quick Reminder Creation**: Create reminders with simple rating system (1-5) or custom days
- **Smart Scheduling**: Rating-based scheduling with configurable day ranges
- **Daily Digest**: Get notified at 9:00 AM about reminders that need attention
- **Local Storage**: 100% local - no cloud, no telemetry, no network calls

### ⚙️ Settings & Customization
- **Daily Reminder Time**: Configure when you want to be notified (default: 9:00 AM)
- **Date Display Format**: Choose between YYYY-MM-DD or MM-DD-YYYY
- **Rating Ranges**: Customize the day ranges for each rating
- **Data Management**: Export/import your data with merge-by-id functionality

### 📊 History Tracking
- **Complete History**: Track all completed and rescheduled reminders
- **Search & Filter**: Find specific reminders by title, reference, or notes
- **Resolution Types**: See whether reminders were marked "Done" or "Scheduled Again"

## Installation

### For Development
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your toolbar

### For Users
1. Download the extension from the Chrome Web Store (when published)
2. Click "Add to Chrome"
3. The extension will be installed and ready to use

## Usage

### Creating Reminders
1. Click the extension icon in your toolbar
2. Click "+ New Reminder"
3. Fill in the title (required)
4. Choose a rating or custom days
5. Add optional reference text and notes
6. Click "Save"

### Managing Due Reminders
- **Daily at 9:00 AM**: You'll get a notification if you have reminders due
- **Click the notification**: Opens the popup showing reminders that need attention
- **Mark as Done**: Complete the reminder and optionally schedule it again
- **Snooze**: Dismiss for now (reminder stays in "Need Attention")

### Settings & History
- Click the ⚙️ button in the popup to open options
- **Settings Tab**: Configure reminder times, date formats, and rating ranges
- **History Tab**: View, search, and filter your reminder history

## File Structure

```
/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for alarms & notifications
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── options.html          # Settings & history page
├── options.js            # Options page functionality
├── styles.css            # Main stylesheet
├── lib/
│   ├── storage.js        # Chrome storage utilities
│   ├── scheduler.js      # Date calculations & scheduling
│   ├── exportImport.js   # Data export/import functionality
│   └── clipboard.js      # Clipboard operations
└── assets/
    ├── icon16.png        # 16x16 icon (placeholder)
    ├── icon48.png        # 48x48 icon (placeholder)
    └── icon128.png       # 128x128 icon (placeholder)
```

## Technical Details

### Architecture
- **Manifest V3**: Latest Chrome extension manifest version
- **Service Worker**: Background script for alarms and notifications
- **ES6 Modules**: Modern JavaScript with import/export
- **Vanilla CSS**: Clean, accessible styling with CSS variables
- **Local Storage**: Chrome storage.local for data persistence

### Permissions
- `action`: Toolbar popup
- `storage`: Local data storage
- `alarms`: Daily reminder scheduling
- `notifications`: Toast notifications
- `downloads`: Data export functionality

### Data Model
- **Reminders**: Active reminders with scheduling information
- **Settings**: User preferences and configuration
- **History**: Completed and rescheduled reminders
- **Export Format**: JSON with schema versioning

## Development

### Prerequisites
- Chrome browser (latest version)
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh button on the extension
4. Test your changes

### Building for Production
1. Replace placeholder icons in `assets/` with real PNG files
2. Test thoroughly
3. Package for Chrome Web Store submission

## Browser Compatibility

- **Chrome**: 88+ (Manifest V3 support)
- **Edge**: 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with Manifest V3 support

## Privacy & Security

- **100% Local**: No data leaves your device
- **No Telemetry**: No tracking or analytics
- **No Network Calls**: Extension works completely offline
- **Open Source**: Code is transparent and auditable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. See LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation
- Review the code

---

**Hey Dont Forget** - Because sometimes you just need a gentle nudge to remember the important things in life. 🧠✨
