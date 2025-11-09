import { useState, useEffect } from 'react';
import { MessageCircle, X, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { createClient } from '../utils/supabase/client';

interface LiveChatProps {
  onNavigate?: (page: string) => void;
}

export const LiveChat = ({ onNavigate }: LiveChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { totalItemsCount } = useCart();
  const { currentTheme } = useTheme();
  const [chatSettings, setChatSettings] = useState({
    enabled: true,
    telegram: '@asiapharm',
    whatsapp: '+79001234567',
  });

  useEffect(() => {
    loadChatSettings();
    
    // Reload settings every 30 seconds to catch admin updates
    const interval = setInterval(() => {
      loadChatSettings();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadChatSettings = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'setting:chat')
        .maybeSingle();

      if (error) {
        console.log('⚠️ Error loading chat settings:', error);
      } else if (data?.value) {
        setChatSettings(data.value);
        console.log('✅ Chat settings loaded:', data.value);
      } else {
        console.log('ℹ️ No chat settings found, using defaults');
      }
    } catch (error) {
      console.log('⚠️ Error loading chat settings:', error);
      // Keep default settings if not available
    }
  };

  // Don't render chat button if disabled (but still render cart button)

  // Format Telegram link
  const telegramUsername = chatSettings.telegram.startsWith('@') 
    ? chatSettings.telegram.slice(1) 
    : chatSettings.telegram;
  const telegramLink = `https://t.me/${telegramUsername}`;

  // Format WhatsApp link - remove spaces and special characters except +
  const whatsappNumber = chatSettings.whatsapp.replace(/[\s()-]/g, '');
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  // Reload settings when chat is opened
  const handleOpenChat = () => {
    loadChatSettings(); // Refresh settings when user opens chat
    setIsOpen(true);
  };

  return (
    <>
      {/* Cart Button - Mobile only - always visible */}
      <button
        onClick={() => onNavigate?.('cart')}
        className={`live-chat-cart-button md:hidden fixed bottom-[30px] right-[84px] w-[54px] h-[54px] rounded-full shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all hover:scale-110 flex items-center justify-center p-0 ${
          currentTheme === 'blackfriday' 
            ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
            : 'bg-red-600 text-white hover:bg-red-700'
        }`}
        aria-label="Cart"
        style={{ zIndex: 9999, position: 'fixed' }}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <ShoppingCart size={24} strokeWidth={2} className="live-chat-cart-icon" />
          {totalItemsCount > 0 && (
            <span className={`live-chat-cart-badge absolute top-1 right-1 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold ${
              currentTheme === 'blackfriday'
                ? 'bg-black text-yellow-400'
                : 'bg-white text-red-600'
            }`}>
              {totalItemsCount}
            </span>
          )}
        </div>
      </button>
      
      {/* Chat Button - only if enabled */}
      {chatSettings.enabled && !isOpen && (
        <button
          onClick={handleOpenChat}
          className="chat-button fixed bottom-[30px] right-[20px] md:bottom-6 md:right-6 bg-red-600 text-white w-[54px] h-[54px] md:w-auto md:h-auto md:p-4 rounded-full shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] hover:bg-red-700 transition-all hover:scale-110 z-50 flex items-center justify-center"
          aria-label="Open chat"
        >
          <MessageCircle size={24} strokeWidth={2} />
        </button>
      )}

      {/* Chat Window - only if enabled */}
      {chatSettings.enabled && isOpen && (
        <div className="fixed bottom-[30px] right-[20px] md:bottom-6 md:right-6 w-[calc(100vw-40px)] max-w-[320px] md:w-80 bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
          {/* Header */}
          <div className="chat-header bg-red-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="text-base md:text-sm">{t('onlineSupport')}</h3>
              <p className="text-sm md:text-xs opacity-90">{t('weAreOnline')}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-red-700 p-1 rounded transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <p className="text-base md:text-sm text-gray-600">{t('chooseChatPlatform')}</p>
            
            {/* Telegram Button */}
            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-platform-button flex items-center gap-3 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg className="w-7 h-7 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-1.116 4.675-1.577 6.207-.196.65-.582.867-.954.89-.811.037-1.427-.538-2.213-1.054-1.23-.808-1.926-1.311-3.119-2.098-.977-.645-.344-1.001.213-1.582.146-.152 2.677-2.453 2.725-2.66.006-.026.012-.12-.045-.17-.057-.05-.141-.033-.202-.019-.086.019-1.455.924-4.11 2.715-.389.267-.742.397-1.058.39-.348-.008-1.016-.197-1.513-.359-.61-.199-1.096-.305-1.054-.643.022-.177.266-.357.733-.54 2.874-1.255 4.79-2.081 5.748-2.479 2.737-1.137 3.307-1.336 3.68-1.342.082-.001.265.019.384.115.1.081.128.19.141.267.013.076.03.249.017.384z"/>
              </svg>
              <div className="text-left">
                <div className="text-base md:text-sm">Telegram</div>
                <div className="text-sm md:text-xs opacity-90">{chatSettings.telegram}</div>
              </div>
            </a>

            {/* WhatsApp Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="chat-platform-button flex items-center gap-3 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <svg className="w-7 h-7 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <div className="text-left">
                <div className="text-base md:text-sm">WhatsApp</div>
                <div className="text-sm md:text-xs opacity-90">{chatSettings.whatsapp}</div>
              </div>
            </a>

            <p className="text-sm md:text-xs text-gray-500 text-center mt-3">
              {t('chatResponseTime')}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
