import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl p-4 md:p-6" style={{ zIndex: 10000 }}>
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="cookie-message text-sm text-gray-700">
            {t('cookieMessage')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="cookie-decline-button px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {t('decline')}
          </button>
          <button
            onClick={handleAccept}
            className="cookie-accept-button px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('acceptCookies')}
          </button>
        </div>
      </div>
    </div>
  );
};
