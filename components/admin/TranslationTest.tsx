import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, XCircle, Languages, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase, getServerUrl } from '../../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

export const TranslationTest = () => {
  const { language, t } = useLanguage();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(false);
  
  // Translation state
  const [sourceText, setSourceText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<'ru' | 'en' | 'zh' | 'vi'>('en');
  const [sourceLanguage, setSourceLanguage] = useState<'ru' | 'en' | 'zh' | 'vi' | 'auto'>('auto');
  const [translatedText, setTranslatedText] = useState('');
  const [translating, setTranslating] = useState(false);
  
  // Check if API key exists on mount
  useState(() => {
    checkApiKey();
  });

  const checkApiKey = async () => {
    setCheckingKey(true);
    try {
      const response = await fetch(getServerUrl('/api/translate/key'), {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHasKey(data.hasKey);
        setKeyPreview(data.keyPreview);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    } finally {
      setCheckingKey(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(t('translateApiKeyRequired') || 'API ключ обязателен');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getServerUrl('/api/translate/key'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save API key');
      }

      toast.success(t('translateApiKeySaved') || 'API ключ сохранен успешно');
      setApiKey('');
      setShowKey(false);
      await checkApiKey();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error(error instanceof Error ? error.message : t('translateApiKeyError') || 'Ошибка сохранения API ключа');
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async () => {
    if (!confirm(t('translateConfirmDeleteKey') || 'Вы уверены, что хотите удалить API ключ?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getServerUrl('/api/translate/key'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete API key');
      }

      toast.success(t('translateApiKeyDeleted') || 'API ключ удален');
      setHasKey(false);
      setKeyPreview(null);
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error(t('translateApiKeyError') || 'Ошибка удаления API ключа');
    } finally {
      setLoading(false);
    }
  };

  const translateTextNow = async () => {
    if (!sourceText.trim()) {
      toast.error(t('translateSourceRequired') || 'Введите текст для перевода');
      return;
    }

    // Теперь можно переводить и без API ключа
    // if (!hasKey) {
    //   toast.error(t('translateApiKeyNotSet') || 'API ключ не установлен');
    //   return;
    // }

    setTranslating(true);
    try {
      const response = await fetch(getServerUrl('/api/translate/text'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          targetLanguage,
          sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Translation failed');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText);
      toast.success(t('translateSuccess') || 'Перевод выполнен успешно');
    } catch (error) {
      console.error('Error translating:', error);
      toast.error(error instanceof Error ? error.message : t('translateError') || 'Ошибка перевода');
    } finally {
      setTranslating(false);
    }
  };
  
  const keysToTest = [
    'saveSettings',
    'enableChatSupport',
    'smtpSettings',
    'smtpDescription',
    'ordersToday',
    'revenueToday',
    'newCustomers',
    'loyaltyPointsIssued',
    'issuedToday',
    'forToday',
    'fromYesterday',
    'storeStatistics',
    'orders',
    'storeChina',
    'storeThailand',
    'storeVietnam',
  ];

  return (
    <div className="space-y-6">
      {/* Google Translate API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="w-5 h-5" />
            {t('translateApiSettings') || 'Настройки Google Translate API'}
          </CardTitle>
          <CardDescription>
            {t('translateApiDescription') || 'Автоматический перевод работает без API ключа через публичный endpoint. API ключ опционален для повышенной стабильности.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkingKey ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('checking') || 'Проверка...'}
            </div>
          ) : hasKey ? (
            <Alert>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription>
                {t('translateApiKeySet') || 'API ключ установлен'}: {keyPreview}
                <div className="mt-2">
                  <Button
                    onClick={deleteApiKey}
                    disabled={loading}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('translateDeleteKey') || 'Удалить ключ'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">{t('translateApiKey') || 'Google Cloud API ключ'}</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={t('translateApiKeyPlaceholder') || 'Введите ваш Google Cloud API ключ'}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={saveApiKey} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {t('save') || 'Сохранить'}
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertDescription className="text-sm">
                  {t('translateApiKeyHelp') || 'API ключ опционален. Перевод работает и без него через публичный Google Translate endpoint. Для получения API ключа: Google Cloud Console → APIs & Services → Credentials. Включите Cloud Translation API для вашего проекта.'}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Tool */}
      <Card>
        <CardHeader>
          <CardTitle>{t('translateTool') || 'Инструмент перевода'}</CardTitle>
          <CardDescription>
            {t('translateToolDescription') || 'Переводите текст с одного языка на другой'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sourceLanguage">{t('translateSourceLanguage') || 'Исходный язык'}</Label>
              <Select value={sourceLanguage} onValueChange={(value: any) => setSourceLanguage(value)}>
                <SelectTrigger id="sourceLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">{t('translateAutoDetect') || 'Автоопределение'}</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="targetLanguage">{t('translateTargetLanguage') || 'Целевой язык'}</Label>
              <Select value={targetLanguage} onValueChange={(value: any) => setTargetLanguage(value)}>
                <SelectTrigger id="targetLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="sourceText">{t('translateSourceText') || 'Текст для перевода'}</Label>
            <Textarea
              id="sourceText"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={t('translateSourcePlaceholder') || 'Введите текст для перевода'}
              rows={4}
              className="mt-2"
            />
          </div>

          <Button 
            onClick={translateTextNow} 
            disabled={translating}
            className="w-full"
          >
            {translating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Languages className="w-4 h-4 mr-2" />}
            {t('translate') || 'Перевести'}
          </Button>

          {translatedText && (
            <div>
              <Label>{t('translateResult') || 'Результат перевода'}</Label>
              <Textarea
                value={translatedText}
                readOnly
                rows={4}
                className="mt-2 bg-gray-50"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Translation Test */}
      <Card>
        <CardHeader>
          <CardTitle>{t('translateTest') || 'Тест переводов'}</CardTitle>
          <CardDescription>
            {t('translateTestDescription') || 'Текущий язык'}: {language}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {keysToTest.map((key) => (
              <div key={key} className="flex gap-4 p-2 border-b">
                <span className="text-gray-600 w-48">{key}:</span>
                <span className="text-gray-900">{t(key)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};