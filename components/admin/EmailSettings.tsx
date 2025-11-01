import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Save, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const EmailSettings = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'info@asia-pharm.com',
    smtpPassword: '',
    fromName: 'Азия Фарм',
    sendWelcomeEmail: true,
    sendOrderConfirmation: true,
    sendPaymentConfirmation: true,
    sendShippingNotification: true,
    sendDeliveryConfirmation: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'setting:email')
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading email settings:', error);
      } else if (data?.value) {
        setSettings(data.value);
        console.log('✅ Email settings loaded');
      } else {
        console.log('ℹ️ No saved email settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('kv_store_a75b5353')
        .upsert({
          key: 'setting:email',
          value: settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ Failed to save settings:', error);
        toast.error(t('saveError') || 'Failed to save settings');
      } else {
        toast.success(t('saveSuccess'));
        console.log('✅ Email settings saved:', settings);
      }
    } catch (error) {
      console.error('❌ Error saving email settings:', error);
      toast.error(t('saveError') || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

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

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">{t('emailSenderName')}</label>
              <input
                type="text"
                value={settings.fromName || ''}
                onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Азия Фарм"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('emailSenderNameDescription')}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 {t('emailResendNote')}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {t('emailFormatExample')}
            </p>
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
            disabled={saving}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>{t('saving') || 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save size={20} />
                <span>{t('saveSettings')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
