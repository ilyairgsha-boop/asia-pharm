import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const WordPressParser = () => {
  const { t } = useLanguage();
  const { accessToken } = useAuth();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const handleParse = async () => {
    if (!url.trim()) {
      setError('Введите URL WordPress сайта');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      // WordPress parser requires external API/service
      // This is a placeholder - in production you would need to implement
      // a proper WordPress XML-RPC or REST API parser
      toast.info('WordPress парсер требует настройки серверной части');
      setError('Функция временно недоступна - требуется настройка WordPress API');
      
      // Mock response for demonstration
      setResults({
        success: false,
        message: 'WordPress парсер требует настройки на сервере',
        productsFound: 0,
        productsImported: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при парсинге');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="text-blue-600" size={24} />
        <h3 className="text-gray-800">{t('wordpressParser')}</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-2">
            {t('wordpressUrl')}
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-600 mt-1">
            {t('enterWordPressUrl')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {results && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-600" size={16} />
              <span className="text-sm text-green-700">{t('parsingComplete')}</span>
            </div>
            <p className="text-sm text-gray-600">
              {results.message || 'Парсинг выполнен успешно'}
            </p>
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={isLoading || !url.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>{t('parsingInProgress')}</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>{t('startParsing')}</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm text-gray-800 mb-2">{t('parsingInstructions')}</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• {t('wpParserInstruction1')}</li>
          <li>• {t('wpParserInstruction2')}</li>
          <li>• {t('wpParserInstruction3')}</li>
          <li>• {t('wpParserInstruction4')}</li>
          <li>• {t('wpParserInstruction5')}</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm text-yellow-800 mb-2">{t('apiKeysSetup')}</h4>
        <p className="text-xs text-yellow-700">
          {t('wpParserApiKeysNote')}
        </p>
      </div>
    </div>
  );
};