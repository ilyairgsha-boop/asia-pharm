import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { performHealthCheck, type HealthCheckResult } from '../utils/supabase/health-check';

export const DatabaseStatus = () => {
  const [status, setStatus] = useState<HealthCheckResult | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const result = await performHealthCheck();
    setStatus(result);
    
    // Показываем баннер только если есть проблемы
    if (result.status !== 'healthy') {
      setVisible(true);
    }
  };

  if (!visible || !status || dismissed) {
    return null;
  }

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'border-green-200 bg-green-50',
      iconColor: 'text-green-600',
      title: 'Подключение к базе данных установлено',
      description: 'Все системы работают нормально',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'border-yellow-200 bg-yellow-50',
      iconColor: 'text-yellow-600',
      title: 'Ограниченная функциональность',
      description: 'Некоторые функции могут работать с задержкой',
    },
    unhealthy: {
      icon: AlertCircle,
      color: 'border-red-200 bg-red-50',
      iconColor: 'text-red-600',
      title: 'Используются демо-данные',
      description: 'База данных временно недоступна. Приложение работает с демонстрационными данными.',
    },
  };

  const config = statusConfig[status.status];
  const Icon = config.icon;

  return (
    <div className="fixed top-[160px] md:top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-[13px] md:px-4">
      <Alert className={`${config.color} border shadow-lg relative rounded-[8px]`}>
        <Icon className={`h-[13px] w-[13px] md:h-5 md:w-5 ${config.iconColor}`} />
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-[7px] right-[7px] md:top-2 md:right-2 p-[3px] rounded-full hover:bg-black/5 transition-colors"
          aria-label="Закрыть"
        >
          <X className="h-[13px] w-[13px] md:h-4 md:w-4" />
        </button>
        <AlertDescription>
          <div className="pr-6">
            <p className="font-medium mb-1 text-[11.4px] leading-[18.5px] md:text-sm">{config.title}</p>
            <p className="text-[11.4px] leading-[18.5px] md:text-sm opacity-90">{config.description}</p>
            {status.errors.length > 0 && (
              <details className="mt-2 text-[9.75px] leading-[13px] md:text-xs opacity-75">
                <summary className="cursor-pointer hover:opacity-100">
                  Технические детали
                </summary>
                <ul className="list-disc pl-[13px] mt-1 space-y-[1.6px]">
                  {status.errors.slice(0, 3).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
