-- ============================================
-- Скрипт для создания первого администратора
-- ============================================
-- 
-- ИНСТРУКЦИЯ:
-- 1. Откройте Supabase SQL Editor:
--    https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/editor
-- 2. ЗАМЕНИТЕ email и пароль ниже на свои данные
-- 3. Выполните скрипт
-- 4. Войдите на сайт с этими данными
-- 5. СРАЗУ СМЕНИТЕ ПАРОЛЬ через профиль!
--
-- ============================================

-- Создаем пользователя в auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@asia-pharm.ru',  -- ⚠️ ЗАМЕНИТЕ НА СВОЙ EMAIL
  crypt('admin123456', gen_salt('bf')),  -- ⚠️ ЗАМЕНИТЕ НА СВОЙ ПАРОЛЬ (минимум 6 символов)
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin","isAdmin":true}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Создаем профиль в public.profiles с правами администратора
INSERT INTO public.profiles (id, email, name, is_admin)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', 'Admin'), 
  TRUE
FROM auth.users
WHERE email = 'admin@asia-pharm.ru'  -- ⚠️ ЗАМЕНИТЕ НА СВОЙ EMAIL
ON CONFLICT (id) DO UPDATE 
SET is_admin = TRUE;

-- Проверка создания администратора
SELECT 
  p.id,
  p.email,
  p.name,
  p.is_admin,
  p.created_at
FROM public.profiles p
WHERE p.email = 'admin@asia-pharm.ru';  -- ⚠️ ЗАМЕНИТЕ НА СВОЙ EMAIL

-- Результат должен показать одну строку с is_admin = true
