import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient, getServerUrl, getAnonKey } from '../../utils/supabase/client';
import { toast } from 'sonner';
import { Send, Mail, Users, Loader2, Eye } from 'lucide-react';

export const EmailBroadcast = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  // Load subscriber count on mount
  useEffect(() => {
    loadSubscriberCount();
  }, [accessToken]);

  const loadSubscriberCount = async () => {
    if (!accessToken) return;

    try {
      const supabase = createClient();
      // Count users subscribed to newsletter from profiles table
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed_to_newsletter', true);

      if (error) {
        console.error('Error loading subscriber count:', error);
      } else {
        setSubscriberCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading subscriber count:', error);
    }
  };

  const handleSendBroadcast = async () => {
    if (!accessToken) {
      toast.error(t('authRequired'));
      return;
    }

    if (!subject || !htmlContent) {
      toast.error(t('fillSubjectAndContent'));
      return;
    }

    // Calculate estimated time (0.6 seconds per email)
    const estimatedTimeSeconds = Math.ceil((subscriberCount || 0) * 0.6);
    const estimatedTimeMinutes = Math.ceil(estimatedTimeSeconds / 60);
    const timeEstimate = estimatedTimeSeconds < 60 
      ? `~${estimatedTimeSeconds} секунд` 
      : `~${estimatedTimeMinutes} минут${estimatedTimeMinutes > 1 ? 'ы' : 'а'}`;

    // Confirmation dialog
    const confirmed = window.confirm(
      `${t('confirmSendBroadcast')} ${subscriberCount} ${t('subscribers')}?\n\n${t('subject')}: ${subject}\n\nПримерное время отправки: ${timeEstimate}\n\n⚠️ Не закрывайте эту страницу до завершения отправки!`
    );

    if (!confirmed) return;

    setLoading(true);
    toast.info(`${t('startingBroadcast')} Ожидайте ${timeEstimate}...`);

    try {
      // Send broadcast via Edge Function
      const broadcastUrl = getServerUrl('/api/email/broadcast');
      const response = await fetch(broadcastUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': getAnonKey(),
        },
        body: JSON.stringify({
          subject,
          htmlContent,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Broadcast error:', result);
        toast.error(`${t('broadcastError')}: ${result.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      console.log('✅ Broadcast complete:', result);
      toast.success(`✅ Рассылка завершена! Отправлено: ${result.sent}, Ошибок: ${result.failed}`);
      
      // Очищаем форму
      setSubject('');
      setHtmlContent('');
      
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error(`${t('broadcastError')}: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const exampleHTML = `<div style="padding: 20px; font-family: Arial, sans-serif;">
  <h2 style="color: #ef1010;">Новое поступление товаров!</h2>
  <p style="font-size: 16px; line-height: 1.6;">
    Дорогие покупатели! Мы рады сообщить вам о поступлении новых препаратов традиционной китайской медицины.
  </p>
  <p style="font-size: 16px; line-height: 1.6;">
    ✨ Специальное предложение: скидка 15% на все новинки при использовании промокода <strong>NEW15</strong>
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://asia-pharm.com" style="display: inline-block; padding: 15px 40px; background: #ef1010; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
      Перейти в каталог
    </a>
  </div>
</div>`;

  const insertExample = () => {
    setHtmlContent(exampleHTML);
    toast.success(t('exampleInserted'));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-800 flex items-center gap-2">
              <Mail className="w-6 h-6 text-red-600" />
              {t('broadcastToSubscribers')}
            </h2>
            {subscriberCount !== null && (
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('subscribersCount')}: <strong>{subscriberCount}</strong>
              </p>
            )}
          </div>
          <button
            onClick={loadSubscriberCount}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title={t('refreshCount')}
          >
            🔄
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-gray-700 mb-2">
              {t('emailSubject')} *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('subjectPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          {/* HTML Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-700">
                {t('emailHTMLContent')} *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={insertExample}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  📝 {t('insertExample')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? t('hidePreview') : t('showPreview')} {t('preview')}
                </button>
              </div>
            </div>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={12}
              placeholder={t('htmlPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 font-mono text-sm"
            />
            <p className="text-sm text-gray-500 mt-2">
              💡 {t('autoHeaderFooterNote')}
            </p>
          </div>

          {/* Preview */}
          {showPreview && htmlContent && (
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-gray-700 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t('emailPreview')}
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="bg-red-600 text-white text-center py-3 rounded-t-lg mb-4">
                  <strong>{t('headerAuto')}</strong>
                </div>
                <div
                  className="bg-white p-4 rounded"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <div className="bg-gray-800 text-white text-center py-3 rounded-b-lg mt-4">
                  <strong>{t('footerAuto')}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSendBroadcast}
              disabled={loading || !subject || !htmlContent}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t('sendBroadcast')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setSubject('');
                setHtmlContent('');
                setShowPreview(false);
              }}
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('clearForm')}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="text-blue-800 mb-2">ℹ️ {t('emailInfoTitle')}</h3>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• {t('emailInfoSubscribers')}</li>
          <li>• {t('emailInfoHeaderFooter')}</li>
          <li>• {t('emailInfoSender')}</li>
          <li>• {t('emailInfoHTML')}</li>
          <li>• {t('emailInfoTest')}</li>
        </ul>
      </div>

      {/* Rate Limiting Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <h3 className="text-yellow-800 mb-2">⏱️ {t('emailRateLimitTitle')}</h3>
        <ul className="text-yellow-700 space-y-1 text-sm">
          <li>• <strong>{t('emailRateLimitAPI')}</strong></li>
          <li>• <strong>{t('emailRateLimitTime')}</strong></li>
          <li className="ml-4">- {t('emailRateLimit10')}</li>
          <li className="ml-4">- {t('emailRateLimit50')}</li>
          <li className="ml-4">- {t('emailRateLimit100')}</li>
          <li className="ml-4">- {t('emailRateLimit500')}</li>
          <li>• <strong>{t('emailRateLimitWarning')}</strong></li>
          <li>• {t('emailRateLimitLogs')}</li>
        </ul>
      </div>

      {/* HTML Tips */}
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
        <h3 className="text-green-800 mb-2">💡 {t('htmlTipsTitle')}</h3>
        <ul className="text-green-700 space-y-1 text-sm">
          <li>• {t('htmlTipsInline')}</li>
          <li>• {t('htmlTipsBrandColor')} <code className="bg-white px-2 py-1 rounded">#ef1010</code></li>
          <li>• {t('htmlTipsWidth')}</li>
          <li>• {t('htmlTipsAlt')}</li>
          <li>• {t('htmlTipsLinks')}</li>
        </ul>
      </div>
    </div>
  );
};
