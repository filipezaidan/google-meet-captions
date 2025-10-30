# 🎙️ Google Meet Captions Recorder

A Chrome extension that captures and saves Google Meet captions with persistent storage, multi-language support, and a beautiful interface for browsing your conversation history.

## ✨ Features

### 🌍 Multi-Language Support
- **English** - "Captions"
- **Portuguese** - "Legendas"
- **Spanish** - "Subtítulos"
- **French** - "Sous-titres"

### 💾 Persistent Storage
- Automatic backup every 5 seconds
- All sessions saved in IndexedDB
- Data persists even after closing the extension
- Never lose your captions!

### 🎨 Modern UI
- **Main Screen**: Real-time recording status with live caption count
- **Sessions List**: Browse all recorded sessions sorted by date
- **Session Details**: Read through complete conversations with timestamps
- Beautiful, responsive design with smooth navigation

### 🔄 Smart Recording
- Continues recording even when popup is closed
- Auto-saves sessions with meeting URL and timestamps
- Debounced caption processing for optimal performance
- Proper speaker name extraction

## 📦 Installation

### For Users

1. **Download the Extension**
   - Clone or download this repository
   - Or download the latest release

2. **Build the Extension**
   ```bash
   pnpm install
   pnpm run build
   ```

3. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from this project

4. **You're Ready!**
   - The extension icon will appear in your toolbar
   - Go to a Google Meet call and start recording!

## 🚀 Usage

### Recording Captions

1. **Join a Google Meet Call**
   - Open any Google Meet meeting
   - **Important**: Enable captions by clicking the "CC" button in the meeting

2. **Start Recording**
   - Click the extension icon in Chrome toolbar
   - Click the **▶ Start** button
   - The extension will begin capturing captions automatically

3. **Recording Continues in Background**
   - You can close the popup window
   - Recording continues automatically
   - Auto-saves every 5 seconds

4. **Stop Recording**
   - Open the extension popup again
   - Click **⏹ Stop** when done
   - Your session is safely saved

### Managing Sessions

1. **View All Sessions**
   - Click **📚 View All Sessions** button
   - See all your recorded meetings
   - Sessions are sorted by most recent

2. **Browse Session Details**
   - Click **👁 View** on any session
   - Read through the entire conversation
   - See speaker names and timestamps

3. **Download Sessions**
   - Click **📥 Download** to export as JSON
   - Each session saves as a separate file
   - Import into other tools for analysis

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Storage**: IndexedDB for persistent data
- **Extension API**: Chrome Extensions Manifest V3

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

### Project Structure

```
google-meet-captions/
├── src/
│   ├── components/      # React components (UI)
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utility functions
│   ├── App.tsx          # Main popup UI
│   ├── content.ts       # Content script (caption capture)
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── public/
│   ├── manifest.json    # Extension manifest
│   └── icon.png         # Extension icon
├── dist/                # Built extension (generated)
└── vite.config.ts       # Vite configuration
```

### How It Works

1. **Content Script** (`content.ts`):
   - Detects caption container using multi-language selectors
   - Observes DOM changes with MutationObserver
   - Parses speaker names and caption text
   - Saves to IndexedDB with auto-backup

2. **Popup UI** (`App.tsx`):
   - Communicates with content script via Chrome messages
   - Displays real-time recording status
   - Provides session management interface
   - Handles session downloads

## 📝 Data Format

Each session is stored with:

```typescript
{
  sessionId: string,        // e.g., "abc-defg-hij-1234567890"
  meetingUrl: string,       // Full Google Meet URL
  started: string,          // ISO timestamp
  updated: string,          // Last updated timestamp
  recordCount: number,      // Total number of captions
  records: [
    {
      id: number,           // Unique ID
      speaker: string,      // Speaker name
      text: string,         // Caption text
      timestamp: string     // ISO timestamp
    }
  ]
}
```

## 🐛 Troubleshooting

### Captions Not Being Captured

1. **Make sure captions are enabled** in Google Meet (CC button)
2. **Reload the extension** in `chrome://extensions/`
3. **Check the console** (F12) for error messages
4. Make sure someone is speaking (captions need to appear on screen)

### Extension Not Working

1. Verify you're on `meet.google.com`
2. Reload the extension
3. Refresh the Google Meet page
4. Check that you have the latest build

## 🎯 Future Enhancements

- [ ] Export as TXT or CSV formats
- [ ] Search and filter captions
- [ ] Delete/merge sessions
- [ ] Copy captions to clipboard
- [ ] Real-time translation
- [ ] Keyword highlighting
- [ ] Session sharing

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


