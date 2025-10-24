import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save, Mail } from 'lucide-react';

export const EmailSettings = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'info@asia-pharm.ru',
    smtpPassword: '',
    sendWelcomeEmail: true,
    sendOrderConfirmation: true,
    sendPaymentConfirmation: true,
    sendShippingNotification: true,
    sendDeliveryConfirmation: true,
  });

  const handleSave = async () => {
    // В реальном приложении здесь будет сохранение в базу данных
    alert(t('saveSuccess'));
    console.log('Email settings saved:', settings);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="text-purple-600" size={24} />
        <h3 className="text-gray-800">{t('emailNotifications')}</h3>
      </div>

      <div className="space-y-6">
        {/* SMTP Settings */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-gray-800 mb-2">{t('smtpSettings')}</h4>
          <p className="text-sm text-gray-600 mb-4">{t('smtpDescription')}</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">SMTP Host</label>
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">SMTP Port</label>
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">SMTP {t('user')}</label>
              <input
                type="email"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">SMTP {t('password')}</label>
              <input
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* Email Types */}
        <div className="space-y-3">
          <h4 className="text-gray-800">{t('emailNotifications')}</h4>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="welcomeEmail"
              checked={settings.sendWelcomeEmail}
              onChange={(e) => setSettings({ ...settings, sendWelcomeEmail: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="welcomeEmail" className="text-gray-700">
              {t('sendWelcomeEmail')}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="orderConfirmation"
              checked={settings.sendOrderConfirmation}
              onChange={(e) => setSettings({ ...settings, sendOrderConfirmation: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="orderConfirmation" className="text-gray-700">
              {t('sendOrderConfirmation')}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="paymentConfirmation"
              checked={settings.sendPaymentConfirmation}
              onChange={(e) => setSettings({ ...settings, sendPaymentConfirmation: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="paymentConfirmation" className="text-gray-700">
              {t('sendPaymentConfirmation')}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="shippingNotification"
              checked={settings.sendShippingNotification}
              onChange={(e) => setSettings({ ...settings, sendShippingNotification: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="shippingNotification" className="text-gray-700">
              {t('sendShippingNotification')}
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="deliveryConfirmation"
              checked={settings.sendDeliveryConfirmation}
              onChange={(e) => setSettings({ ...settings, sendDeliveryConfirmation: e.target.checked })}
              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="deliveryConfirmation" className="text-gray-700">
              {t('sendDeliveryConfirmation')}
            </label>
          </div>
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
