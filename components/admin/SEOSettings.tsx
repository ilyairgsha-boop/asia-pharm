import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Save, Globe, FileText, Image, Link, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SEOSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteAuthor: string;
  siteUrl: string;
  ogImage: string;
  facebookAppId: string;
  instagramHandle: string;
  vkHandle: string;
  productTitleTemplate: string;
  productDescriptionTemplate: string;
  enableSitemap: boolean;
  enableRobotsTxt: boolean;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
  yandexMetrikaId: string;
}

export const SEOSettings = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [settings, setSettings] = useState<SEOSettings>({
    siteName: 'Азия Фарм',
    siteDescription: 'Интернет-магазин препаратов традиционной китайской медицины',
    siteKeywords: 'китайская медицина, китайские препараты, тайские препараты',
    siteAuthor: 'Asia Pharm',
    siteUrl: 'https://asia-pharm.ru',
    ogImage: '',
    facebookAppId: '',
    instagramHandle: '@asiapharm',
    vkHandle: 'asiapharm',
    productTitleTemplate: '{product_name} - {store} | {site_name}',
    productDescriptionTemplate: '{product_name}. {description}. Доставка по России.',
    enableSitemap: true,
    enableRobotsTxt: true,
    googleAnalyticsId: '',
    googleSearchConsoleId: '',
    yandexMetrikaId: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'setting:seo')
        .maybeSingle();

      if (error) {
        console.error('Failed to load SEO settings:', error);
      } else if (data?.value) {
        setSettings(data.value);
      }
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage('');

      const supabase = createClient();
      const { error } = await supabase
        .from('kv_store_a75b5353')
        .upsert({
          key: 'setting:seo',
          value: settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('Failed to save SEO settings:', error);
        toast.error(t('seoSaveError'));
        setMessage(t('seoSaveError'));
      } else {
        toast.success(t('seoSaved'));
        setMessage(t('seoSaved'));
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      toast.error(t('seoSaveError'));
      setMessage(t('seoSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="text-red-600" size={28} />
          <div>
            <h2 className="text-gray-800">{t('seoSettings')}</h2>
            <p className="text-sm text-gray-600">
              {t('seoSettingsDescription')}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
        >
          <Save size={16} />
          {isSaving ? t('saving') : t('save')}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('успешно') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-blue-600" size={20} />
          <h3 className="text-gray-800">{t('basicSettings')}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('siteName')}
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('siteNameHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('siteDescription')}
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('siteDescriptionHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('siteKeywords')}
            </label>
            <input
              type="text"
              value={settings.siteKeywords}
              onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('siteKeywordsHint')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                {t('siteUrl')}
              </label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                {t('siteAuthor')}
              </label>
              <input
                type="text"
                value={settings.siteAuthor}
                onChange={(e) => setSettings({ ...settings, siteAuthor: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="text-purple-600" size={20} />
          <h3 className="text-gray-800">{t('socialNetworks')}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('ogImage')}
            </label>
            <input
              type="url"
              value={settings.ogImage}
              onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('ogImageHint')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                {t('facebookAppId')}
              </label>
              <input
                type="text"
                value={settings.facebookAppId}
                onChange={(e) => setSettings({ ...settings, facebookAppId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                {t('instagramHandle')}
              </label>
              <input
                type="text"
                value={settings.instagramHandle}
                onChange={(e) => setSettings({ ...settings, instagramHandle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="@asiapharm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                {t('vkHandle')}
              </label>
              <input
                type="text"
                value={settings.vkHandle}
                onChange={(e) => setSettings({ ...settings, vkHandle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="asiapharm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link className="text-green-600" size={20} />
          <h3 className="text-gray-800">{t('productTemplates')}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('titleTemplate')}
            </label>
            <input
              type="text"
              value={settings.productTitleTemplate}
              onChange={(e) => setSettings({ ...settings, productTitleTemplate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('titleTemplateHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('descriptionTemplate')}
            </label>
            <textarea
              value={settings.productDescriptionTemplate}
              onChange={(e) => setSettings({ ...settings, productDescriptionTemplate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('descriptionTemplateHint')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="text-orange-600" size={20} />
          <h3 className="text-gray-800">{t('analyticsSection')}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('googleAnalyticsId')}
            </label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder={t('googleAnalyticsPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('googleSearchConsole')}
            </label>
            <input
              type="text"
              value={settings.googleSearchConsoleId}
              onChange={(e) => setSettings({ ...settings, googleSearchConsoleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder={t('googleSearchConsolePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              {t('yandexMetrikaId')}
            </label>
            <input
              type="text"
              value={settings.yandexMetrikaId}
              onChange={(e) => setSettings({ ...settings, yandexMetrikaId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder={t('yandexMetrikaPlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-gray-600" size={20} />
          <h3 className="text-gray-800">{t('technicalSettings')}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-gray-800">{t('enableSitemap')}</p>
              <p className="text-xs text-gray-600">{t('sitemapDescription')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSitemap}
                onChange={(e) => setSettings({ ...settings, enableSitemap: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-gray-800">{t('enableRobotsTxt')}</p>
              <p className="text-xs text-gray-600">{t('robotsTxtDescription')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableRobotsTxt}
                onChange={(e) => setSettings({ ...settings, enableRobotsTxt: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2">
          <Info className="text-blue-600" size={20} />
          {t('seoRecommendations')}
        </h3>
        
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ {t('seoRec1')}</p>
          <p>✓ {t('seoRec2')}</p>
          <p>✓ {t('seoRec3')}</p>
          <p>✓ {t('seoRec4')}</p>
          <p>✓ {t('seoRec5')}</p>
        </div>
      </div>
    </div>
  );
};
