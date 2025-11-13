import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase, getServerUrl } from '../../utils/supabase/client';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Eye, EyeOff, Save, Languages } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { Language } from '../../utils/i18n';

interface PopUpContent {
  ru: string;
  en: string;
  zh: string;
  vi: string;
}

interface PopUpSettings {
  enabled: boolean;
  content: PopUpContent;
  showOnce: boolean;
  delay: number;
}

export const PopUpSettings = () => {
  const { t, language } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [content, setContent] = useState<PopUpContent>({
    ru: '',
    en: '',
    zh: '',
    vi: '',
  });
  const [showOnce, setShowOnce] = useState(true);
  const [delay, setDelay] = useState(3);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<Language>('ru');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'popup_settings')
        .single();

      if (error) {
        console.log('No popup settings found, using defaults');
        return;
      }

      if (data?.value) {
        const settings = data.value as PopUpSettings;
        setEnabled(settings.enabled || false);
        
        // Если старый формат (строка), конвертируем в новый
        if (typeof settings.content === 'string') {
          setContent({
            ru: settings.content,
            en: '',
            zh: '',
            vi: '',
          });
        } else {
          setContent(settings.content || {
            ru: '',
            en: '',
            zh: '',
            vi: '',
          });
        }
        
        setShowOnce(settings.showOnce !== undefined ? settings.showOnce : true);
        setDelay(settings.delay || 3);
      }
    } catch (error) {
      console.error('Error loading popup settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settings: PopUpSettings = {
        enabled,
        content,
        showOnce,
        delay,
      };

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'popup_settings',
          value: settings,
        });

      if (error) throw error;

      toast.success(t('settingsSaved'));
    } catch (error) {
      console.error('Error saving popup settings:', error);
      toast.error(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTranslate = async (sourceLang: Language) => {
    const sourceContent = content[sourceLang];
    
    if (!sourceContent) {
      toast.error(t('popUpTranslateError'));
      return;
    }

    setTranslating(true);
    
    try {
      const targetLanguages: Language[] = ['ru', 'en', 'zh', 'vi'].filter(
        (lang) => lang !== sourceLang
      ) as Language[];

      const newContent = { ...content };

      console.log(`🌍 Starting auto-translation from ${sourceLang} to:`, targetLanguages);

      // Используем серверный endpoint с поддержкой бесплатного перевода
      for (const targetLang of targetLanguages) {
        try {
          // Получаем токен пользователя
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.access_token) {
            console.error('❌ No access token available');
            toast.error('Authentication required. Please sign in again.');
            return;
          }
          
          const response = await fetch(getServerUrl('/api/translate/text'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: sourceContent,
              targetLanguage: targetLang,
              sourceLanguage: sourceLang,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Translation failed for ${targetLang}:`, errorData);
            continue;
          }

          const data = await response.json();
          console.log(`✅ Translation to ${targetLang}:`, data.translatedText?.substring(0, 50));
          if (data.translatedText) {
            newContent[targetLang] = data.translatedText;
          }
        } catch (error) {
          console.error(`❌ Error translating to ${targetLang}:`, error);
        }
      }

      setContent(newContent);
      toast.success(t('popUpTranslated'));
    } catch (error) {
      console.error('Error auto-translating:', error);
      toast.error(t('popUpTranslateError'));
    } finally {
      setTranslating(false);
    }
  };

  const exampleHTML: PopUpContent = {
    ru: `<div style="text-align: center; padding: 20px;">
  <h2 style="color: #dc2626; margin-bottom: 16px;">🎉 Специальное предложение!</h2>
  <p style="font-size: 18px; margin-bottom: 20px;">Скидка 15% на все товары из Китая!</p>
  <p style="margin-bottom: 20px;">Используйте промокод: <strong style="color: #dc2626;">CHINA15</strong></p>
  <a href="/china" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Перейти в каталог</a>
</div>`,
    en: `<div style="text-align: center; padding: 20px;">
  <h2 style="color: #dc2626; margin-bottom: 16px;">🎉 Special Offer!</h2>
  <p style="font-size: 18px; margin-bottom: 20px;">15% discount on all products from China!</p>
  <p style="margin-bottom: 20px;">Use promo code: <strong style="color: #dc2626;">CHINA15</strong></p>
  <a href="/china" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to catalog</a>
</div>`,
    zh: `<div style="text-align: center; padding: 20px;">
  <h2 style="color: #dc2626; margin-bottom: 16px;">🎉 特别优惠！</h2>
  <p style="font-size: 18px; margin-bottom: 20px;">中国商品全场85折！</p>
  <p style="margin-bottom: 20px;">使用促销代码：<strong style="color: #dc2626;">CHINA15</strong></p>
  <a href="/china" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">前往目录</a>
</div>`,
    vi: `<div style="text-align: center; padding: 20px;">
  <h2 style="color: #dc2626; margin-bottom: 16px;">🎉 Ưu đãi đặc biệt!</h2>
  <p style="font-size: 18px; margin-bottom: 20px;">Giảm 15% cho tất cả sản phẩm từ Trung Quốc!</p>
  <p style="margin-bottom: 20px;">Sử dụng mã khuyến mãi: <strong style="color: #dc2626;">CHINA15</strong></p>
  <a href="/china" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Đến danh mục</a>
</div>`,
  };

  const insertExample = () => {
    setContent(exampleHTML);
    toast.success(t('exampleInserted'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('popUpTitle')}</CardTitle>
          <CardDescription>{t('popUpDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-popup">{t('enablePopUp')}</Label>
              <div className="text-sm text-gray-500">
                {enabled ? t('popUpEnabled') : t('popUpDisabled')}
              </div>
            </div>
            <Switch
              id="enable-popup"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Show Once Setting */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-once">{t('popUpShowOnce')}</Label>
              <div className="text-sm text-gray-500">
                {t('popUpShowOnceDescription')}
              </div>
            </div>
            <Switch
              id="show-once"
              checked={showOnce}
              onCheckedChange={setShowOnce}
            />
          </div>

          {/* Delay Setting */}
          <div className="space-y-2">
            <Label htmlFor="delay">{t('popUpDelay')}</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              max="60"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              placeholder="3"
            />
            <p className="text-sm text-gray-500">{t('popUpDelayDescription')}</p>
          </div>

          {/* Language Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label>{t('popUpContent')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={insertExample}
                >
                  {t('insertExample')}
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as Language)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ru">{t('popUpRussian')}</TabsTrigger>
                <TabsTrigger value="en">{t('popUpEnglish')}</TabsTrigger>
                <TabsTrigger value="zh">{t('popUpChinese')}</TabsTrigger>
                <TabsTrigger value="vi">{t('popUpVietnamese')}</TabsTrigger>
              </TabsList>

              {(['ru', 'en', 'zh', 'vi'] as Language[]).map((lang) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAutoTranslate(lang)}
                      disabled={translating || !content[lang]}
                      className="gap-2"
                    >
                      <Languages size={16} />
                      {translating ? t('popUpTranslating') : t('popUpAutoTranslate')}
                    </Button>
                  </div>

                  <Textarea
                    value={content[lang]}
                    onChange={(e) =>
                      setContent({ ...content, [lang]: e.target.value })
                    }
                    placeholder={t('popUpContentPlaceholder')}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </TabsContent>
              ))}
            </Tabs>

            <p className="text-sm text-gray-500">{t('htmlSupported')}</p>
          </div>

          {/* Preview Button */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              {showPreview ? t('hidePreview') : t('showPreview')}
            </Button>
          </div>

          {/* Preview */}
          {showPreview && content[activeTab] && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">{t('popUpPreview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-white p-6 rounded-lg shadow-lg"
                  dangerouslySetInnerHTML={{ __html: content[activeTab] }}
                />
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={saveSettings}
              disabled={loading}
              className="gap-2"
            >
              <Save size={16} />
              {loading ? t('saving') : t('saveSettings')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};