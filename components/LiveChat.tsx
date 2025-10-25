import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [chatSettings, setChatSettings] = useState({
    enabled: true,
    telegram: '@asiapharm',
    whatsapp: '+79001234567',
  });

  useEffect(() => {
    loadChatSettings();
    
    const interval = setInterval(() => {
      loadChatSettings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadChatSettings = async () => {
    try {
      const { publicAnonKey } = await import('../utils/supabase/info');

      const projectId = 'hohhzspiylssmgdivajk';
      const publicUrl = `https://${projectId}.supabase.co/functions/v1/make-server-a75b5353/public/settings/chat`;
      
      console.log('🔄 Loading chat settings from:', publicUrl);
      
      const response = await fetch(publicUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey, // Only public key now (no Authorization)
        },
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setChatSettings(data.value);
          console.log('✅ Chat settings loaded:', data.value);
        } else {
          console.log('⚠️ No custom settings on server, using defaults');
        }
      } else {
        const errorText = await response.text();
        console.log('⚠️ Failed to load chat settings:', response.status, errorText);
      }
    } catch (error) {
      console.log('⚠️ Error loading chat settings:', error);
    }
  };

  if (!chatSettings.enabled) return null;

  const telegramUsername = chatSettings.telegram.startsWith('@') 
    ? chatSettings.telegram.slice(1) 
    : chatSettings.telegram;
  const telegramLink = `https://t.me/${telegramUsername}`;

  const whatsappNumber = chatSettings.whatsapp.replace(/[\s()-]/g, '');
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  const handleOpenChat = () => {
    loadChatSettings(); 
    setIsOpen(true);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
          <div className="bg-red-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="text-sm">{t('onlineSupport')}</h3>
              <p className="text-xs opacity-90">{t('weAreOnline')}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-red-700 p-1 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-600">{t('chooseChatPlatform')}</p>

            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Telegram: {chatSettings.telegram}
            </a>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              WhatsApp: {chatSettings.whatsapp}
            </a>

            <p className="text-xs text-gray-500 text-center mt-3">
              {t('chatResponseTime')}
            </p>
          </div>
        </div>
      )}
    </>
  );
};