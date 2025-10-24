import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getServerUrl } from '../../utils/supabase/client';
import { Save, Globe, FileText, Image, Link, Info } from 'lucide-react';

interface SEOSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  siteAuthor: string;
  siteUrl: string;
  ogImage: string;
  twitterHandle: string;
  facebookAppId: string;
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
    twitterHandle: '@asiapharm',
    facebookAppId: '',
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
      const response = await fetch(getServerUrl('/admin/settings/seo'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          setSettings(data.value);
        }
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

      const response = await fetch(getServerUrl('/admin/settings/seo'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ value: settings }),
      });

      if (response.ok) {
        setMessage('SEO настройки успешно сохранены');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setMessage('Ошибка при сохранении');
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
            <h2 className="text-gray-800">SEO Настройки</h2>
            <p className="text-sm text-gray-600">
              Настройте параметры для поисковой оптимизации
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
        >
          <Save size={16} />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
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
          <h3 className="text-gray-800">Основные настройки</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Название сайта
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Используется в заголовке страницы и мета-тегах
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Описание сайта
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Идеальная длина: 150-160 символов
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Ключевые слова
            </label>
            <input
              type="text"
              value={settings.siteKeywords}
              onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Через запятую
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                URL сайта
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
                Автор
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
          <h3 className="text-gray-800">Социальные сети</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              OG Image
            </label>
            <input
              type="url"
              value={settings.ogImage}
              onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Размер: 1200x630px
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Twitter Handle
              </label>
              <input
                type="text"
                value={settings.twitterHandle}
                onChange={(e) => setSettings({ ...settings, twitterHandle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Facebook App ID
              </label>
              <input
                type="text"
                value={settings.facebookAppId}
                onChange={(e) => setSettings({ ...settings, facebookAppId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link className="text-green-600" size={20} />
          <h3 className="text-gray-800">Шаблоны товаров</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Шаблон заголовка
            </label>
            <input
              type="text"
              value={settings.productTitleTemplate}
              onChange={(e) => setSettings({ ...settings, productTitleTemplate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Переменные: product_name, store, category, site_name
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Шаблон описания
            </label>
            <textarea
              value={settings.productDescriptionTemplate}
              onChange={(e) => setSettings({ ...settings, productDescriptionTemplate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Переменные: product_name, category, description, price
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="text-orange-600" size={20} />
          <h3 className="text-gray-800">Аналитика</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Google Analytics ID
            </label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Google Search Console
            </label>
            <input
              type="text"
              value={settings.googleSearchConsoleId}
              onChange={(e) => setSettings({ ...settings, googleSearchConsoleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="google-site-verification=xxxxx"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Яндекс.Метрика ID
            </label>
            <input
              type="text"
              value={settings.yandexMetrikaId}
              onChange={(e) => setSettings({ ...settings, yandexMetrikaId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder="12345678"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-gray-600" size={20} />
          <h3 className="text-gray-800">Технические настройки</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-gray-800">Включить Sitemap.xml</p>
              <p className="text-xs text-gray-600">Карта сайта для поисковых систем</p>
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
              <p className="text-gray-800">Включить Robots.txt</p>
              <p className="text-xs text-gray-600">Правила для поисковых роботов</p>
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
          Рекомендации по SEO
        </h3>
        
        <div className="space-y-2 text-sm text-gray-700">
          <p>✓ Заголовок: 50-60 символов, ключевые слова в начале</p>
          <p>✓ Описание: 150-160 символов, призыв к действию</p>
          <p>✓ Ключевые слова: 5-10 релевантных фраз</p>
          <p>✓ OG изображение: яркое, 1200x630px</p>
          <p>✓ Настройте Google Analytics для отслеживания трафика</p>
        </div>
      </div>
    </div>
  );
};
