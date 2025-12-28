// Comet-X Content Script
console.log('🚀 Comet-X Content Script loaded');

// Listen for messages from background/sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SELECTION':
      sendResponse({ text: window.getSelection()?.toString() || '' });
      break;
      
    case 'GET_PAGE_CONTENT':
      sendResponse(extractPageContent());
      break;
      
    case 'HIGHLIGHT_TEXT':
      highlightText(message.payload.text);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true;
});

// Extract page content
function extractPageContent() {
  const title = document.title;
  const url = window.location.href;
  
  // Get main content areas
  const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post-content'];
  let mainContent = '';
  
  for (const selector of mainSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      mainContent = el.textContent || '';
      break;
    }
  }
  
  // Fallback to body
  if (!mainContent) {
    mainContent = document.body.innerText;
  }
  
  // Clean up content
  mainContent = mainContent
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15000);
  
  // Get metadata
  const getMeta = (name: string) => 
    document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
      ?.getAttribute('content') || '';
  
  return {
    url,
    title,
    content: mainContent,
    selectedText: window.getSelection()?.toString() || '',
    metadata: {
      description: getMeta('description') || getMeta('og:description'),
      author: getMeta('author'),
      keywords: getMeta('keywords')?.split(',').map(k => k.trim()),
      image: getMeta('og:image'),
    },
  };
}

// Highlight text on page
function highlightText(text: string) {
  if (!text) return;
  
  // Remove existing highlights
  document.querySelectorAll('.comet-x-highlight').forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      parent.normalize();
    }
  });
  
  // Find and highlight text
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );
  
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    if (node.textContent?.toLowerCase().includes(text.toLowerCase())) {
      textNodes.push(node);
    }
  }
  
  textNodes.forEach(textNode => {
    const content = textNode.textContent || '';
    const index = content.toLowerCase().indexOf(text.toLowerCase());
    if (index === -1) return;
    
    const before = content.slice(0, index);
    const match = content.slice(index, index + text.length);
    const after = content.slice(index + text.length);
    
    const highlight = document.createElement('mark');
    highlight.className = 'comet-x-highlight';
    highlight.textContent = match;
    
    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));
    fragment.appendChild(highlight);
    if (after) fragment.appendChild(document.createTextNode(after));
    
    textNode.parentNode?.replaceChild(fragment, textNode);
  });
  
  // Scroll to first highlight
  const firstHighlight = document.querySelector('.comet-x-highlight');
  firstHighlight?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Inject styles for highlights
const style = document.createElement('style');
style.textContent = `
  .comet-x-highlight {
    background: linear-gradient(120deg, rgba(88, 166, 255, 0.3) 0%, rgba(88, 166, 255, 0.5) 100%);
    border-radius: 2px;
    padding: 0.1em 0.2em;
    animation: comet-x-pulse 2s ease-in-out infinite;
  }
  
  @keyframes comet-x-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;
document.head.appendChild(style);
