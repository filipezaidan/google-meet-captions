// DEBUG HELPER - Paste this in the browser console on Google Meet
// This will help identify the correct selector and caption structure

console.log("🔍 DEBUG: Searching for captions container...");

const CAPTIONS_SELECTORS = [
  'div[role="region"][aria-label="Captions"]',      // English
  'div[role="region"][aria-label="Legendas"]',      // Portuguese
  'div[role="region"][aria-label="Subtítulos"]',    // Spanish
  'div[role="region"][aria-label="Sous-titres"]'    // French
];

let captionsContainer = null;
let foundSelector = null;

for (const selector of CAPTIONS_SELECTORS) {
  const element = document.querySelector(selector);
  if (element) {
    captionsContainer = element;
    foundSelector = selector;
    console.log(`✅ Found container with: ${selector}`);
    break;
  }
}

if (!captionsContainer) {
  console.error("❌ Captions container not found!");
  console.log("💡 Make sure captions are enabled in Google Meet");
  console.log("💡 Trying to find any element with 'caption' in aria-label...");
  
  const allWithCaptions = document.querySelectorAll('[aria-label*="caption" i], [aria-label*="legenda" i]');
  console.log("Found elements:", allWithCaptions);
  allWithCaptions.forEach((el, i) => {
    console.log(`  ${i}: ${el.tagName} [aria-label="${el.getAttribute('aria-label')}"]`, el);
  });
} else {
  console.log("📦 Container element:", captionsContainer);
  console.log("📦 Container HTML:", captionsContainer.outerHTML.substring(0, 200) + "...");
  
  const children = captionsContainer.querySelectorAll(":scope > div");
  console.log(`👶 Found ${children.length} child elements`);
  
  children.forEach((child, i) => {
    console.log(`\n--- Child ${i} ---`);
    console.log("Element:", child);
    console.log("Text content:", child.textContent);
    console.log("Inner text:", child.innerText);
    console.log("HTML:", child.innerHTML.substring(0, 200));
    
    const lines = (child.textContent || "").split("\n").map(s => s.trim()).filter(Boolean);
    console.log("Lines:", lines);
  });
  
  console.log("\n✅ SUMMARY:");
  console.log(`Found selector: ${foundSelector}`);
  console.log(`Number of caption nodes: ${children.length}`);
  
  if (children.length === 0) {
    console.log("\n💡 TIP: Make sure someone is speaking and captions are appearing on screen");
  }
}

console.log("\n📋 To manually test caption capture, run:");
console.log("setInterval(() => { const nodes = document.querySelectorAll('" + foundSelector + " > div'); console.log('Captions:', nodes.length, Array.from(nodes).map(n => n.textContent)); }, 2000);");

