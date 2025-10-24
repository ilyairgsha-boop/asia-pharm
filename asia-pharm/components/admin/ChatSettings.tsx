import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save, MessageCircle } from 'lucide-react';

export const ChatSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    enabled: true,
    telegram: '@asiapharm',
    whatsapp: '+79001234567',
  });

  const handleSave = async () => {
    // В реальном приложении здесь будет сохранение в базу данных
    alert(t('saveSuccess'));
    console.log('Chat settings saved:', settings);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="text-blue-600" size={24} />
        <h3 className="text-gray-800">{t('chatSettings')}</h3>
      </div>

      <div className="space-y-6">
        {/* Enable Chat */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="chatEnabled"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="chatEnabled" className="text-gray-700">
            {t('enableChatSupport')}
          </label>
        </div>

        {/* Telegram */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('telegramUsername')}
          </label>
          <input
            type="text"
            value={settings.telegram}
            onChange={(e) => setSettings({ ...settings, telegram: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            placeholder="@username"
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('whatsappNumber')}
          </label>
          <input
            type="text"
            value={settings.whatsapp}
            onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            placeholder="+7..."
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSave}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Save size={20} />
            <span>{t('saveSettings')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
