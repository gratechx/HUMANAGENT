// Comet-X Background Service Worker
import { AzureOpenAIClient } from '../lib/azure-client';
import type { ExtensionMessage, ExtensionResponse, PageContext } from '../types';

// Initialize Azure OpenAI Client
let aiClient: AzureOpenAIClient | null = null;

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('🚀 Comet-X installed');
  
  // Set default settings
  const defaultSettings = {
    apiEndpoint: 'https://uaenorth.api.cognitive.microsoft.com/',
    apiKey: '',
    defaultModel: 'gpt-4o',
    theme: 'dark',
    language: 'ar',
    enableContextMenu: true,
    enableKeyboardShortcuts: true,
    maxTokens: 4096,
    temperature: 0.7,
  };
  
  const existing = await chrome.storage.sync.get('settings');
  if (!existing.settings) {
    await chrome.storage.sync.set({ settings: defaultSettings });
  }
  
  // Create context menus
  createContextMenus();
});

// Setup Side Panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Handle action click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Create context menus
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'comet-x-ask',
      title: '🤖 اسأل Comet-X',
      contexts: ['selection'],
    });
    
    chrome.contextMenus.create({
      id: 'comet-x-explain',
      title: '💡 اشرح هذا',
      contexts: ['selection'],
    });
    
    chrome.contextMenus.create({
      id: 'comet-x-translate',
      title: '🌐 ترجم إلى العربية',
      contexts: ['selection'],
    });
    
    chrome.contextMenus.create({
      id: 'comet-x-summarize',
      title: '📝 لخص الصفحة',
      contexts: ['page'],
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  
  // Open side panel first
  await chrome.sidePanel.open({ tabId: tab.id });
  
  // Wait a bit for panel to open
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Send message based on action
  const actionMap: Record<string, string> = {
    'comet-x-ask': 'ASK',
    'comet-x-explain': 'EXPLAIN',
    'comet-x-translate': 'TRANSLATE',
    'comet-x-summarize': 'SUMMARIZE',
  };
  
  const action = actionMap[info.menuItemId as string];
  if (action) {
    chrome.runtime.sendMessage({
      type: action,
      payload: {
        text: info.selectionText,
        pageUrl: info.pageUrl,
      },
    });
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (!tab?.id) return;
  
  if (command === 'ask-ai') {
    await chrome.sidePanel.open({ tabId: tab.id });
    
    // Get selection and send to panel
    const selection = await getPageSelection(tab.id);
    if (selection) {
      chrome.runtime.sendMessage({
        type: 'ASK',
        payload: { text: selection },
      });
    }
  }
});

// Message handler
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        console.error('Message handler error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
);

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<ExtensionResponse> {
  console.log('📩 Received message:', message.type);
  
  switch (message.type) {
    case 'CHAT':
      return handleChat(message.payload as { messages: any[]; context?: PageContext });
    
    case 'ANALYZE_PAGE':
      return handleAnalyzePage(message.tabId || sender.tab?.id);
    
    case 'GET_SELECTION':
      return handleGetSelection(message.tabId || sender.tab?.id);
    
    case 'GET_SETTINGS':
      return handleGetSettings();
    
    case 'SAVE_SETTINGS':
      return handleSaveSettings(message.payload);
    
    default:
      return { success: false, error: `Unknown message type: ${message.type}` };
  }
}

async function handleChat(payload: { messages: any[]; context?: PageContext }): Promise<ExtensionResponse> {
  const client = await getAIClient();
  if (!client) {
    return { success: false, error: 'AI Client not configured. Please set your API key in settings.' };
  }
  
  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(payload.context);
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...payload.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];
    
    const response = await client.chat(messages);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Chat error:', error);
    return { success: false, error: error.message };
  }
}

async function handleAnalyzePage(tabId?: number): Promise<ExtensionResponse> {
  if (!tabId) {
    return { success: false, error: 'No tab ID provided' };
  }
  
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent,
    });
    
    return { success: true, data: result.result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function handleGetSelection(tabId?: number): Promise<ExtensionResponse> {
  if (!tabId) {
    return { success: false, error: 'No tab ID provided' };
  }
  
  const selection = await getPageSelection(tabId);
  return { success: true, data: selection };
}

async function handleGetSettings(): Promise<ExtensionResponse> {
  const { settings } = await chrome.storage.sync.get('settings');
  return { success: true, data: settings };
}

async function handleSaveSettings(payload: unknown): Promise<ExtensionResponse> {
  await chrome.storage.sync.set({ settings: payload });
  // Reinitialize client with new settings
  aiClient = null;
  return { success: true };
}

// Helper functions
async function getAIClient(): Promise<AzureOpenAIClient | null> {
  if (aiClient) return aiClient;
  
  const { settings } = await chrome.storage.sync.get('settings');
  if (!settings?.apiKey) return null;
  
  aiClient = new AzureOpenAIClient({
    endpoint: settings.apiEndpoint,
    apiKey: settings.apiKey,
    deploymentName: settings.defaultModel,
    apiVersion: '2024-08-01-preview',
  });
  
  return aiClient;
}

async function getPageSelection(tabId: number): Promise<string | null> {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.getSelection()?.toString() || null,
    });
    return result.result;
  } catch {
    return null;
  }
}

function extractPageContent(): PageContext {
  const title = document.title;
  const url = window.location.href;
  
  // Get main content (simplified)
  const mainContent = document.body.innerText.slice(0, 10000);
  
  // Get metadata
  const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
  const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
  
  return {
    url,
    title,
    content: mainContent,
    metadata: {
      description: metaDesc || undefined,
      keywords: metaKeywords?.split(',').map(k => k.trim()),
    },
  };
}

function buildSystemPrompt(context?: PageContext): string {
  let prompt = `أنت Comet-X، مساعد ذكي للمتصفح. تساعد المستخدمين في فهم المحتوى والإجابة على الأسئلة.

قواعد مهمة:
- أجب بنفس لغة السؤال
- كن موجزاً ودقيقاً
- استخدم Markdown للتنسيق عند الحاجة
- إذا لم تعرف الإجابة، قل ذلك بوضوح`;

  if (context) {
    prompt += `\n\n--- سياق الصفحة الحالية ---
العنوان: ${context.title}
الرابط: ${context.url}
${context.selectedText ? `النص المحدد: ${context.selectedText}` : ''}
${context.metadata?.description ? `الوصف: ${context.metadata.description}` : ''}

محتوى الصفحة (مختصر):
${context.content.slice(0, 3000)}...`;
  }

  return prompt;
}

console.log('🌟 Comet-X Service Worker loaded');
