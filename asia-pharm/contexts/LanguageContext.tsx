import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ru');

  const handleSetLanguage = useCallback((lang: Language) => {
    console.log(`🌐 Language changed to: ${lang}`);
    setLanguage(lang);
  }, []);

  // Функция t должна пересоздаваться при изменении языка
  const t = useCallback((key: string): string => {
    // Получаем перевод для текущего языка
    const translation = translations[language]?.[key as keyof typeof translations.ru];
    
    // Дебаг логирование (можно закомментировать после отладки)
    if (!translation) {
      console.warn(`🔍 Translation missing for key "${key}" in language "${language}"`);
    }
    
    // Если перевод не найден, возвращаем ключ
    return translation || key;
  }, [language]); // Зависимость от language - функция будет пересоздаваться при изменении языка

  // Логирование при изменении языка
  useEffect(() => {
    console.log(`✅ Language context updated to: ${language}`);
  }, [language]);

  // Мемоизируем значение контекста, чтобы оно пересоздавалось только при изменении зависимостей
  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Экспортируем тип Language для использования в других компонентах
export type { Language };
