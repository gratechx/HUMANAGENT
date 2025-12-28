import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { Settings } from '../types';
import { AZURE_MODELS } from '../lib/azure-client';

const defaultSettings: Settings = {
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

export const OptionsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load settings
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response?.success && response.data) {
        setSettings({ ...defaultSettings, ...response.data });
      }
    });
  }, []);

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        payload: settings,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  };

  const testConnection = async () => {
    if (!settings.apiKey) {
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    try {
      const response = await fetch(
        `${settings.apiEndpoint}/openai/deployments/${settings.defaultModel}/chat/completions?api-version=2024-08-01-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': settings.apiKey,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'قل مرحبا' }],
            max_tokens: 10,
          }),
        }
      );

      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch {
      setTestStatus('error');
    }
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen bg-comet-bg p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-10 h-10 text-comet-accent" />
          <div>
            <h1 className="text-2xl font-bold text-gradient">إعدادات Comet-X</h1>
            <p className="text-comet-muted text-sm">
              قم بتهيئة مساعدك الذكي
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* API Settings */}
          <section className="comet-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔑</span>
              إعدادات Azure OpenAI
            </h2>

            <div className="space-y-4">
              {/* Endpoint */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  نقطة النهاية (Endpoint)
                </label>
                <input
                  type="text"
                  value={settings.apiEndpoint}
                  onChange={(e) =>
                    setSettings({ ...settings, apiEndpoint: e.target.value })
                  }
                  className="comet-input"
                  placeholder="https://your-resource.openai.azure.com/"
                  dir="ltr"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  مفتاح API
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) =>
                      setSettings({ ...settings, apiKey: e.target.value })
                    }
                    className="comet-input pl-10"
                    placeholder="أدخل مفتاح Azure OpenAI"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-comet-muted hover:text-comet-text"
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  النموذج الافتراضي
                </label>
                <select
                  value={settings.defaultModel}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultModel: e.target.value })
                  }
                  className="comet-input"
                >
                  {Object.entries(AZURE_MODELS).map(([id, model]) => (
                    <option key={id} value={id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Connection */}
              <div className="flex items-center gap-3">
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                  className="comet-button-secondary"
                >
                  {testStatus === 'testing' ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                </button>
                {testStatus === 'success' && (
                  <span className="flex items-center gap-1 text-comet-success text-sm">
                    <CheckCircle className="w-4 h-4" />
                    الاتصال ناجح!
                  </span>
                )}
                {testStatus === 'error' && (
                  <span className="flex items-center gap-1 text-comet-error text-sm">
                    <AlertCircle className="w-4 h-4" />
                    فشل الاتصال
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Model Parameters */}
          <section className="comet-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚙️</span>
              معلمات النموذج
            </h2>

            <div className="space-y-4">
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  درجة الإبداع (Temperature): {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-comet-muted mt-1">
                  <span>دقيق</span>
                  <span>إبداعي</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  الحد الأقصى للرموز
                </label>
                <select
                  value={settings.maxTokens}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                  className="comet-input"
                >
                  <option value={1024}>1,024 (قصير)</option>
                  <option value={2048}>2,048 (متوسط)</option>
                  <option value={4096}>4,096 (طويل)</option>
                  <option value={8192}>8,192 (طويل جداً)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="comet-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>✨</span>
              الميزات
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableContextMenu}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableContextMenu: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-comet-border bg-comet-surface text-comet-accent focus:ring-comet-accent"
                />
                <span>تفعيل قائمة السياق (النقر بالزر الأيمن)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableKeyboardShortcuts}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableKeyboardShortcuts: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-comet-border bg-comet-surface text-comet-accent focus:ring-comet-accent"
                />
                <span>تفعيل اختصارات لوحة المفاتيح (Ctrl+Shift+X)</span>
              </label>
            </div>
          </section>

          {/* Quick Setup */}
          <section className="comet-card bg-comet-accent/10 border-comet-accent/30">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🚀</span>
              إعداد سريع - Azure OpenAI (UAE North)
            </h2>
            <p className="text-sm text-comet-muted mb-4">
              انقر لملء الإعدادات الافتراضية من Azure OpenAI في منطقة الإمارات
            </p>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  apiEndpoint: 'https://uaenorth.api.cognitive.microsoft.com/',
                  defaultModel: 'gpt-4o',
                })
              }
              className="comet-button-secondary"
            >
              استخدام الإعدادات الافتراضية
            </button>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={saveSettings}
              disabled={saveStatus === 'saving'}
              className="comet-button flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saveStatus === 'saving' && 'جاري الحفظ...'}
              {saveStatus === 'saved' && 'تم الحفظ ✓'}
              {saveStatus === 'error' && 'فشل الحفظ'}
              {saveStatus === 'idle' && 'حفظ الإعدادات'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-comet-border text-center text-sm text-comet-muted">
          <p>Comet-X v1.0.0 - البديل المفتوح المصدر</p>
          <p className="mt-1">
            مدعوم بـ Azure OpenAI | صُنع بـ 💙 للمجتمع
          </p>
        </footer>
      </div>
    </div>
  );
};
