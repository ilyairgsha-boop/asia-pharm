import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Save, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ChatSettings = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    telegram: '@asiapharm',
    whatsapp: '+79001234567',
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
        .eq('key', 'setting:chat')
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading chat settings:', error);
      } else if (data?.value) {
        setSettings(data.value);
        console.log('✅ Chat settings loaded');
      } else {
        console.log('ℹ️ No saved chat settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading chat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    
    setSaving(true);
    try {
      console.log('💾 Saving chat settings:', settings);
      
      const supabase = createClient();
      const { error } = await supabase
        .from('kv_store_a75b5353')
        .upsert({
          key: 'setting:chat',
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
        console.log('✅ Chat settings saved successfully:', settings);
      }
    } catch (error) {
      console.error('❌ Error saving chat settings:', error);
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
