import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';
import { createClient } from '../utils/supabase/client';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ru');

  // Загружаем язык из профиля при монтировании
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.language) {
            console.log('🌐 Loading user language from profile:', profile.language);
            setLanguage(profile.language as Language);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error loading user language:', error);
      }
    };
    
    loadUserLanguage();
  }, []);

  const handleSetLanguage = useCallback(async (lang: Language) => {
    console.log(`🌐 Language changed to: ${lang}`);
    setLanguage(lang);
    
    // Сохраняем язык в профиль пользователя, если он авторизован
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('💾 Saving language to user profile:', lang);
        const { error } = await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('id', session.user.id);
        
        if (error) {
          console.warn('⚠️ Failed to save language to profile:', error);
        } else {
          console.log('✅ Language saved to profile successfully');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error saving language:', error);
    }
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
  // Добавляем алиас currentLanguage для совместимости с компонентами
  return {
    ...context,
    currentLanguage: context.language
  };
};

// Экспортируем тип Language для использования в других компонентах
export type { Language };