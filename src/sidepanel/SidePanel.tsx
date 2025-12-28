import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, Sparkles, Globe, Trash2, Copy, Check } from 'lucide-react';
import type { Message, PageContext } from '../types';

export const SidePanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for API key
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response?.data?.apiKey) {
        setHasApiKey(true);
      }
    });

    // Get current page context
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_PAGE_CONTENT' });
        if (response && !response.error) {
          setPageContext(response);
        }
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT',
        payload: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: pageContext,
        },
      });

      if (response.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `❌ خطأ: ${response.error}`,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ خطأ: ${error.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="h-screen flex flex-col bg-comet-bg">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-comet-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-comet-accent" />
          <h1 className="text-lg font-bold text-gradient">Comet-X</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-2 hover:bg-comet-surface rounded-lg transition-colors"
            title="مسح المحادثة"
          >
            <Trash2 className="w-4 h-4 text-comet-muted" />
          </button>
          <button
            onClick={openSettings}
            className="p-2 hover:bg-comet-surface rounded-lg transition-colors"
            title="الإعدادات"
          >
            <Settings className="w-4 h-4 text-comet-muted" />
          </button>
        </div>
      </header>

      {/* Page Context Banner */}
      {pageContext && (
        <div className="px-4 py-2 bg-comet-surface/50 border-b border-comet-border">
          <div className="flex items-center gap-2 text-xs text-comet-muted">
            <Globe className="w-3 h-3" />
            <span className="truncate">{pageContext.title || pageContext.url}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasApiKey && (
          <div className="comet-card text-center">
            <p className="text-comet-muted mb-2">
              يرجى إدخال مفتاح Azure OpenAI في الإعدادات
            </p>
            <button onClick={openSettings} className="comet-button text-sm">
              فتح الإعدادات
            </button>
          </div>
        )}

        {messages.length === 0 && hasApiKey && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-comet-accent mx-auto mb-4 opacity-50" />
            <p className="text-comet-muted">
              مرحباً! كيف يمكنني مساعدتك اليوم؟
            </p>
            <div className="mt-4 space-y-2">
              <QuickAction
                icon="📝"
                text="لخص هذه الصفحة"
                onClick={() => setInput('لخص محتوى هذه الصفحة')}
              />
              <QuickAction
                icon="💡"
                text="اشرح المحتوى"
                onClick={() => setInput('اشرح لي محتوى هذه الصفحة بشكل مبسط')}
              />
              <QuickAction
                icon="🔍"
                text="استخرج المعلومات"
                onClick={() => setInput('استخرج أهم المعلومات من هذه الصفحة')}
              />
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-comet-muted">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-comet-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-comet-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-comet-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">جاري التفكير...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-comet-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="اكتب رسالتك..."
            className="comet-input flex-1"
            disabled={!hasApiKey || isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !hasApiKey}
            className="comet-button px-4"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Action Button
const QuickAction: React.FC<{
  icon: string;
  text: string;
  onClick: () => void;
}> = ({ icon, text, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-right px-4 py-2 bg-comet-surface hover:bg-comet-border/50 rounded-lg transition-colors text-sm"
  >
    <span className="ml-2">{icon}</span>
    {text}
  </button>
);

// Message Bubble Component
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyContent = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-comet-accent text-white rounded-br-md'
            : 'bg-comet-surface border border-comet-border rounded-bl-md'
        }`}
      >
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        {!isUser && (
          <div className="flex justify-end mt-1">
            <button
              onClick={copyContent}
              className="p-1 hover:bg-comet-border/50 rounded transition-colors"
              title="نسخ"
            >
              {copied ? (
                <Check className="w-3 h-3 text-comet-success" />
              ) : (
                <Copy className="w-3 h-3 text-comet-muted" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
