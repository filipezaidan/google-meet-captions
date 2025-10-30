# Google Meet Captions Extension - Improvements

## 🎉 What's New

### Multi-Language Support
The extension now supports captions in multiple languages:
- ✅ **English** - "Captions"
- ✅ **Portuguese** - "Legendas"
- ✅ **Spanish** - "Subtítulos"
- ✅ **French** - "Sous-titres"

### Persistent Storage with IndexedDB
- All recording sessions are automatically saved to your browser's IndexedDB
- Sessions persist even if you close the extension or browser
- Auto-backup every 5 seconds while recording
- Never lose your captions data!

### Improved UI

#### Main Screen
- Real-time recording status (🔴 Recording / ⚫ Idle)
- Live caption count during recording
- Current session info (Session ID, start time, last update)
- Quick access to all saved sessions

#### Sessions List View
- Browse all your recorded sessions
- Sessions sorted by most recent
- See session details: ID, date, caption count
- Two actions per session:
  - **👁 View** - See all captions in detail
  - **📥 Download** - Export as JSON

#### Session Details View
- Read through all captions in a conversation
- See speaker names and timestamps
- Clean, scrollable interface
- Download individual sessions as JSON

## 🚀 How to Use

1. **Install the Extension**
   - Load the `dist` folder as an unpacked extension in Chrome

2. **Start Recording**
   - Open a Google Meet call
   - Enable captions (in any supported language)
   - Click the extension icon
   - Click **▶ Start** button

3. **Recording Continues Automatically**
   - The extension auto-saves every 5 seconds
   - You can close the popup and it keeps recording
   - Reopen to see live caption count

4. **Stop & Access Your Data**
   - Click **⏹ Stop** when done
   - Click **📚 View All Sessions** to see all recordings
   - Browse, view, or download any session

## 🔧 Technical Improvements

### Content Script (`content.ts`)
- Simplified architecture based on working code pattern
- Multi-language caption container detection
- Robust session management with persistent storage
- Auto-backup mechanism
- Better error handling and logging

### Popup UI (`App.tsx`)
- Modern, responsive interface with 3 views
- Real-time status updates (polls every 2 seconds)
- Session browsing and navigation
- Individual session details viewer
- TypeScript with proper typing throughout

## 📦 Database Schema

Each session is stored with:
```typescript
{
  sessionId: string,        // e.g., "abc-defg-hij-1234567890"
  meetingUrl: string,       // Full Google Meet URL
  started: string,          // ISO timestamp
  updated: string,          // Last updated timestamp
  recordCount: number,      // Total number of captions
  records: CaptionRecord[]  // Array of caption objects
}
```

Each caption record contains:
```typescript
{
  id: number,           // Unique ID within session
  speaker: string,      // Speaker name
  text: string,         // Caption text
  timestamp: string     // ISO timestamp when captured
}
```

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add search/filter in session list
- [ ] Export as TXT or CSV formats
- [ ] Delete old sessions
- [ ] Merge multiple sessions
- [ ] Copy captions to clipboard
- [ ] Share sessions between devices

## 📝 Notes

- The extension only works on `meet.google.com` pages
- Captions must be enabled in Google Meet
- All data is stored locally in your browser
- No data is sent to external servers

