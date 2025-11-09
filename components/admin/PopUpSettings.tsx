import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Eye, EyeOff, Save } from 'lucide-react';

export const PopUpSettings = () => {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [content, setContent] = useState('');
  const [showOnce, setShowOnce] = useState(true);
  const [delay, setDelay] = useState(3);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
        const settings = data.value;
        setEnabled(settings.enabled || false);
        setContent(settings.content || '');
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
      const settings = {
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

  const exampleHTML = `<div style="text-align: center; padding: 20px;">
  <h2 style="color: #dc2626; margin-bottom: 16px;">🎉 Специальное предложение!</h2>
  <p style="font-size: 18px; margin-bottom: 20px;">Скидка 15% на все товары из Китая!</p>
  <p style="margin-bottom: 20px;">Используйте промокод: <strong style="color: #dc2626;">CHINA15</strong></p>
  <a href="/china" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Перейти в каталог</a>
</div>`;

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

          {/* HTML Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">{t('popUpContent')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertExample}
              >
                {t('insertExample')}
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('popUpContentPlaceholder')}
              rows={12}
              className="font-mono text-sm"
            />
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
          {showPreview && content && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">{t('popUpPreview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="bg-white p-6 rounded-lg shadow-lg"
                  dangerouslySetInnerHTML={{ __html: content }}
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