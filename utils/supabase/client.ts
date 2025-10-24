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
  'https://hohhzspiylssmgdivajk.supabase.co'
);

const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaGh6c3BpeWxzc21nZGl2YWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDcxMzMsImV4cCI6MjA3NjgyMzEzM30.3J8v2AtgsfaE8WBq9UpbVWmJyvmoJkKVcxiWSkCDK5c'
);

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export const getServerUrl = (route: string) => {
  const projectId = 'hohhzspiylssmgdivajk';
  return `https://${projectId}.supabase.co/functions/v1/make-server-a75b5353${route}`;
};
