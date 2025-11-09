// Google Translate API Integration
// Использует Google Cloud Translation API v2

export type SupportedLanguage = 'ru' | 'en' | 'zh' | 'vi';

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

export interface TranslateRequest {
  text: string;
  targetLanguage: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
}

export interface TranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface BatchTranslateRequest {
  texts: string[];
  targetLanguage: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
}

export interface BatchTranslateResponse {
  translations: TranslateResponse[];
}

/**
 * Переводит текст с использованием Google Translate API
 * @param apiKey - Google Cloud API ключ
 * @param request - Запрос на перевод
 * @returns Переведенный текст
 */
export async function translateText(
  apiKey: string,
  request: TranslateRequest
): Promise<TranslateResponse> {
  if (!apiKey) {
    throw new Error('API ключ Google Translate не установлен');
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: request.text,
    target: mapLanguageCode(request.targetLanguage),
    format: 'text',
  });

  if (request.sourceLanguage) {
    params.append('source', mapLanguageCode(request.sourceLanguage));
  }

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Google Translate API error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    
    if (!data.data?.translations?.[0]) {
      throw new Error('Неверный формат ответа от Google Translate API');
    }

    return {
      translatedText: data.data.translations[0].translatedText,
      detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка перевода: ${error.message}`);
    }
    throw new Error('Неизвестная ошибка при переводе');
  }
}

/**
 * Переводит несколько текстов одновременно
 * @param apiKey - Google Cloud API ключ
 * @param request - Запрос на пакетный перевод
 * @returns Массив переведенных текстов
 */
export async function translateBatch(
  apiKey: string,
  request: BatchTranslateRequest
): Promise<BatchTranslateResponse> {
  if (!apiKey) {
    throw new Error('API ключ Google Translate не установлен');
  }

  const params = new URLSearchParams({
    key: apiKey,
    target: mapLanguageCode(request.targetLanguage),
    format: 'text',
  });

  if (request.sourceLanguage) {
    params.append('source', mapLanguageCode(request.sourceLanguage));
  }

  // Добавляем все тексты как отдельные 'q' параметры
  request.texts.forEach(text => {
    params.append('q', text);
  });

  try {
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Google Translate API error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    
    if (!data.data?.translations) {
      throw new Error('Неверный формат ответа от Google Translate API');
    }

    return {
      translations: data.data.translations.map((t: any) => ({
        translatedText: t.translatedText,
        detectedSourceLanguage: t.detectedSourceLanguage,
      })),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка пакетного перевода: ${error.message}`);
    }
    throw new Error('Неизвестная ошибка при пакетном переводе');
  }
}

/**
 * Получает список доступных языков
 * @param apiKey - Google Cloud API ключ
 * @param targetLanguage - Язык для отображения названий языков (опционально)
 * @returns Список доступных языков
 */
export async function getSupportedLanguages(
  apiKey: string,
  targetLanguage?: SupportedLanguage
): Promise<Array<{ language: string; name?: string }>> {
  if (!apiKey) {
    throw new Error('API ключ Google Translate не установлен');
  }

  const params = new URLSearchParams({
    key: apiKey,
  });

  if (targetLanguage) {
    params.append('target', mapLanguageCode(targetLanguage));
  }

  try {
    const response = await fetch(
      `${GOOGLE_TRANSLATE_API_URL}/languages?${params.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Google Translate API error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    return data.data.languages;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка получения списка языков: ${error.message}`);
    }
    throw new Error('Неизвестная ошибка при получении списка языков');
  }
}

/**
 * Маппинг кодов языков приложения на коды Google Translate
 * ru -> ru (Russian)
 * en -> en (English)
 * zh -> zh-CN (Chinese Simplified)
 * vi -> vi (Vietnamese)
 */
function mapLanguageCode(language: SupportedLanguage): string {
  const mapping: Record<SupportedLanguage, string> = {
    ru: 'ru',
    en: 'en',
    zh: 'zh-CN', // Используем упрощенный китайский
    vi: 'vi',
  };
  return mapping[language];
}

/**
 * Обратный маппинг кодов языков Google Translate на коды приложения
 */
export function reverseMapLanguageCode(googleCode: string): SupportedLanguage | null {
  const mapping: Record<string, SupportedLanguage> = {
    'ru': 'ru',
    'en': 'en',
    'zh': 'zh',
    'zh-CN': 'zh',
    'zh-TW': 'zh',
    'vi': 'vi',
  };
  return mapping[googleCode] || null;
}

/**
 * Проверяет валидность API ключа
 * @param apiKey - Google Cloud API ключ
 * @returns true если ключ валиден
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await translateText(apiKey, {
      text: 'test',
      targetLanguage: 'en',
    });
    return true;
  } catch {
    return false;
  }
}
