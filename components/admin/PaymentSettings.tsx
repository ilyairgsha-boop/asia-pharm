import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Save, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const PaymentSettings = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    cardNumber: '2202 2004 3395 7386',
    contractNumber: '505 518 5408',
    qrCodeUrl: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!accessToken) return;
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'setting:payment')
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading payment settings:', error);
      } else if (data?.value) {
        setSettings(data.value);
        console.log('✅ Payment settings loaded');
      } else {
        console.log('ℹ️ No saved payment settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading payment settings:', error);
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
          key: 'setting:payment',
          value: settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ Failed to save settings:', error);
        toast.error(t('saveFailed') || 'Failed to save settings');
      } else {
        toast.success(t('saveSuccess'));
        console.log('✅ Payment settings saved:', settings);
      }
    } catch (error) {
      console.error('❌ Error saving payment settings:', error);
      toast.error(t('saveFailed') || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleQRUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, qrCodeUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
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
      <h3 className="text-gray-800 mb-6">{t('paymentSettings')}</h3>

      <div className="space-y-6">
        {/* Card Number */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('cardNumber')} {t('sberbankParenthesis')}
          </label>
          <input
            type="text"
            value={settings.cardNumber}
            onChange={(e) => setSettings({ ...settings, cardNumber: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('cardNumberDescription')}
          </p>
        </div>

        {/* Contract Number */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('contractNumber')} {t('tbankParenthesis')}
          </label>
          <input
            type="text"
            value={settings.contractNumber}
            onChange={(e) => setSettings({ ...settings, contractNumber: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <p className="text-sm text-gray-500 mt-1">
            {t('contractNumberDescription')}
          </p>
        </div>

        {/* QR Code */}
        <div>
          <label className="block text-gray-700 mb-2">
            {t('qrCodeImage')} {t('sbpParenthesis')}
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Upload size={20} />
              <span>{t('uploadQRCode')}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleQRUpload}
                className="hidden"
              />
            </label>
          </div>
          {settings.qrCodeUrl && (
            <div className="mt-4">
              <img
                src={settings.qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48 object-contain border rounded"
              />
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {t('qrCodeDescription')}
          </p>
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
                <span>{t('save')}</span>
              </>
            )}
          </button>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <strong>ℹ️ {t('note')}:</strong> {t('paymentSettingsNote')}
        </div>
      </div>
    </div>
  );
};
