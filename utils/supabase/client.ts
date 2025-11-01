import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Получаем переменные окружения с fallback значениями
const getEnvVar = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return fallback;
};

const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL',
  'https://boybkoyidxwrgsayifrd.supabase.co'
);

const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveWJrb3lpZHh3cmdzYXlpZnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDI3ODEsImV4cCI6MjA3NzQxODc4MX0.1R7AMGegpzlJL45AaeT2BJHQi4-Oswe1tMcAYXK8e2Y'
);

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'asia-pharm@1.0.0',
        },
      },
      db: {
        schema: 'public',
      },
      // Добавляем настройки для лучшей обработки сетевых ошибок
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    
    console.log('✅ Supabase client initialized', {
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey,
      keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
      projectId: supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown',
      serverUrl: `https://${supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown'}.supabase.co/functions/v1/server`,
    });
  }
  return supabaseInstance;
};

export const getServerUrl = (route: string) => {
  const projectId = 'boybkoyidxwrgsayifrd';
  // Use server function with routes
  return `https://${projectId}.supabase.co/functions/v1/server${route}`;
};

export const getAnonKey = () => {
  return supabaseAnonKey;
};

// Экспортируем supabase для обратной совместимости
export const supabase = createClient();
