import { useState, useEffect } from 'react';
import { useLanguage, type Language } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type PageType = 'privacy-policy' | 'terms-of-service';

export const PageEditor = () => {
  const { t, language } = useLanguage();
  const { accessToken } = useAuth();
  const [selectedPage, setSelectedPage] = useState<PageType>('privacy-policy');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [selectedPage, language]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pages')
        .select('content')
        .eq('page_key', selectedPage)
        .eq('language', language)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Error fetching page content:', error);
      } else {
        setContent(data?.content || '');
      }
    } catch (error) {
      console.warn('⚠️ Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('pages')
        .upsert({
          page_key: selectedPage,
          language,
          content,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'page_key,language'
        });

      if (error) {
        console.error('❌ Error saving page:', error);
        toast.error(t('saveError') || 'Error saving page');
      } else {
        toast.success(t('saveSuccess') || 'Saved successfully!');
      }
    } catch (error) {
      console.warn('⚠️ Error saving page:', error);
      toast.error(t('saveError') || 'Error saving page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-gray-800 mb-6">{t('pageEditor')}</h3>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-gray-700 mb-2">{t('selectPage')}</label>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value as PageType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="privacy-policy">{t('privacyPolicy')}</option>
            <option value="terms-of-service">{t('termsOfService')}</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-700 mb-2">{t('languageLabel')}</label>
          <div className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-300">
            {language.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 mb-2">{t('pageContent')}</label>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono text-sm"
            placeholder="HTML content..."
          />
        )}
        <p className="text-sm text-gray-500 mt-2">
          {t('htmlSupported') || 'HTML is supported'}
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>{t('saving') || 'Saving...'}</span>
          </>
        ) : (
          <>
            <Save size={20} />
            <span>{t('saveChanges')}</span>
          </>
        )}
      </button>
    </div>
  );
};
