import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { ThemeType, getTheme, applyTheme } from '../utils/themes';

interface ThemeContextType {
  currentTheme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'site_theme')
        .single();

      if (!error && data?.value) {
        const theme = data.value as ThemeType;
        setCurrentTheme(theme);
        applyTheme(getTheme(theme));
      } else {
        // Apply default theme
        applyTheme(getTheme('default'));
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      applyTheme(getTheme('default'));
    } finally {
      setLoading(false);
    }
  };

  const setTheme = async (theme: ThemeType) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'site_theme',
          value: theme,
        });

      if (error) throw error;

      setCurrentTheme(theme);
      applyTheme(getTheme(theme));
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
