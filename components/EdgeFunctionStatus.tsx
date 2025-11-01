import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { getServerUrl } from '../utils/supabase/client';

interface EdgeFunctionInfo {
  status?: string;
  message?: string;
  version?: string;
  routes?: any;
  env?: any;
}

export const EdgeFunctionStatus = () => {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<EdgeFunctionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = getServerUrl('');
      console.log('🔍 Проверка Edge Function:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Edge Function ответила:', data);
      setInfo(data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Ошибка проверки Edge Function:', err);
      setError(err.message || 'Не удалось подключиться к Edge Function');
      setInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Проверка Edge Function...</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <div className="font-semibold mb-1">❌ Edge Function не доступна</div>
            <div className="text-sm">{error}</div>
            <div className="text-sm mt-2 opacity-80">
              📋 Следуйте инструкциям в файле <code className="bg-black/10 px-1 rounded">EDGE_FUNCTIONS_FIX.md</code>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Проверить снова
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (info && info.status === 'OK') {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-900 mb-1">
                ✅ Edge Function работает
              </div>
              <div className="text-sm text-green-800">
                {info.message} • Версия: {info.version || 'неизвестна'}
              </div>
              {info.routes && (
                <div className="text-xs text-green-700 mt-2">
                  <details>
                    <summary className="cursor-pointer hover:underline">
                      Доступные маршруты
                    </summary>
                    <pre className="mt-1 text-xs bg-white/50 p-2 rounded">
                      {JSON.stringify(info.routes, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Обновить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold mb-1">⚠️ Неожиданный ответ от Edge Function</div>
            <pre className="text-xs bg-black/10 p-2 rounded mt-1">
              {JSON.stringify(info, null, 2)}
            </pre>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Проверить снова
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
