# 🔍 Debugging Guide - Captions Not Appearing

## Quick Fix Steps

### 1. **Reload the Extension**
1. Go to `chrome://extensions/`
2. Find "Google Meet Captions"
3. Click the reload icon 🔄
4. Go back to your Google Meet tab

### 2. **Check Browser Console**
1. Open Google Meet
2. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
3. Go to the **Console** tab
4. Click the extension icon and press **Start**
5. Look for these messages:

**Good signs ✅:**
```
📡 Google Meet Captions extension loaded
✅ Found captions container with selector: div[role="region"][aria-label="Legendas"]
✅ Starting session: xxx-xxx-1234567890
📡 Caption observer started
🔍 Found X caption nodes
📝 Caption node text: ...
✅ Parsed caption: { speaker: "...", text: "..." }
```

**Problems ❌:**
```
❌ Captions container not found. Enable captions first.
🔍 Found 0 caption nodes
❌ Failed to parse node
```

### 3. **Run Debug Script**
1. Make sure captions are ON in Google Meet
2. Open the console (F12)
3. Copy the contents of `DEBUG_CAPTIONS.js`
4. Paste in the console and press Enter
5. Check what it finds

The script will tell you:
- If the captions container is found
- Which selector works
- How many caption nodes exist
- The structure of each caption node

### 4. **Common Issues**

#### Problem: "Captions container not found"
**Solution:**
- Make sure captions are enabled in Google Meet
- Click the "CC" button in the bottom toolbar
- Try switching caption language
- The captions box should be visible on screen

#### Problem: "Found 0 caption nodes"
**Solution:**
- Someone needs to be speaking
- Captions should be appearing on screen
- Try having someone speak in the meeting
- Wait a few seconds for captions to appear

#### Problem: Captions found but empty records
**Solution:**
- Check the console logs to see the caption structure
- The debug logs will show how the text is formatted
- Share the console output so we can adjust the parser

### 5. **Manual Test**

Run this in the console to see real-time caption detection:

```javascript
// Replace 'Legendas' with 'Captions' if using English
const container = document.querySelector('div[role="region"][aria-label="Legendas"]');
if (container) {
  setInterval(() => {
    const nodes = container.querySelectorAll(':scope > div');
    console.log(`📊 ${nodes.length} captions currently visible`);
    nodes.forEach((node, i) => {
      console.log(`  ${i}: ${node.textContent}`);
    });
  }, 2000);
} else {
  console.error('Container not found! Enable captions first.');
}
```

## Share Debug Info

If it's still not working, please share:

1. **Language**: What language are your captions in?
2. **Console output**: Copy the console messages
3. **Debug script results**: What did `DEBUG_CAPTIONS.js` find?
4. **Screenshot**: Can you see captions on the screen?

## Expected Caption Structure

Google Meet captions typically look like:

```
Speaker Name
Caption text here
```

Or sometimes just:
```
Caption text here
```

The extension now handles both formats!

## Testing Checklist

- [ ] Extension is loaded and reloaded
- [ ] I'm on a Google Meet call
- [ ] Captions are enabled (CC button is on)
- [ ] Captions are visible on screen
- [ ] Console shows "extension loaded"
- [ ] Console shows "captions container found"
- [ ] Console shows "Found X caption nodes" (X > 0)
- [ ] Console shows "Parsed caption" messages

If all checkboxes are ✅ but still no data, share the console output!

