-- 🗄️ Asia-Pharm Database Setup
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- ============================================
-- 1. СОЗДАНИЕ ТАБЛИЦ
-- ============================================

-- Таблица профилей пользователей
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_wholesaler BOOLEAN DEFAULT FALSE,
  loyalty_points INTEGER DEFAULT 0,
  loyalty_tier TEXT DEFAULT 'basic',
  monthly_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description TEXT,
  description_en TEXT,
  description_zh TEXT,
  description_vi TEXT,
  composition TEXT,
  composition_en TEXT,
  composition_zh TEXT,
  composition_vi TEXT,
  usage TEXT,
  usage_en TEXT,
  usage_zh TEXT,
  usage_vi TEXT,
  price NUMERIC NOT NULL,
  wholesale_price_cny NUMERIC,
  category TEXT NOT NULL,
  disease TEXT NOT NULL,
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  image_url TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  is_sample BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица KV Store для заказов и промокодов
CREATE TABLE IF NOT EXISTS public.kv_store_a75b5353 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ВКЛЮЧЕНИЕ ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store_a75b5353 ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. ПОЛИТИКИ ДЛЯ PROFILES
-- ============================================

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Пользователи могут читать свой профиль
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Пользователи могут создавать свой профиль при регистрации
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. ПОЛИТИКИ ДЛЯ PRODUCTS
-- ============================================

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Все могут читать продукты (даже неавторизованные)
CREATE POLICY "Anyone can read products"
  ON public.products FOR SELECT
  TO public
  USING (true);

-- Только админы могут управлять продуктами
CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================
-- 5. ПОЛИТИКИ ДЛЯ KV_STORE
-- ============================================

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Service role can manage kv_store" ON public.kv_store_a75b5353;

-- Только service role (Edge Functions) может управлять KV Store
CREATE POLICY "Service role can manage kv_store"
  ON public.kv_store_a75b5353 FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 6. ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- Индексы для profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_is_wholesaler ON public.profiles(is_wholesaler);

-- Индексы для products
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_disease ON public.products(disease);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_sample ON public.products(is_sample);

-- Индекс для kv_store
CREATE INDEX IF NOT EXISTS idx_kv_store_key_pattern ON public.kv_store_a75b5353(key text_pattern_ops);

-- ============================================
-- 7. ТРИГГЕРЫ ДЛЯ UPDATED_AT
-- ============================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kv_store_updated_at ON public.kv_store_a75b5353;
CREATE TRIGGER update_kv_store_updated_at
    BEFORE UPDATE ON public.kv_store_a75b5353
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. ДЕМО ДАННЫЕ (ОПЦИОНАЛЬНО)
-- ============================================

-- Раскомментируйте, если хотите добавить тестовые продукты

/*
INSERT INTO public.products (
  name, name_en, name_zh, name_vi,
  description, description_en, description_zh, description_vi,
  price, category, disease, store, in_stock
) VALUES
(
  'Крем для суставов',
  'Joint Cream',
  '关节霜',
  'Kem khớp',
  'Эффективный крем для лечения болей в суставах',
  'Effective cream for joint pain relief',
  '有效缓解关节疼痛的乳霜',
  'Kem hiệu quả giảm đau khớp',
  850,
  'Кремы и мази',
  'Боли в суставах',
  'china',
  true
),
(
  'Женьшеневая настойка',
  'Ginseng Tincture',
  '人参酊',
  'Thuốc ngâm sâm',
  'Натуральная настойка женьшеня для повышения энергии',
  'Natural ginseng tincture for energy boost',
  '天然人参酊，提高能量',
  'Thuốc ngâm sâm tự nhiên tăng năng lượng',
  1200,
  'Настойки',
  'Усталость',
  'china',
  true
);
*/

-- ============================================
-- ЗАВЕРШЕНО
-- ============================================

-- Проверка созданных таблиц
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('profiles', 'products', 'kv_store_a75b5353')
ORDER BY table_name;

-- Сообщение об успешном выполнении
DO $$
BEGIN
  RAISE NOTICE '✅ База данных Asia-Pharm настроена успешно!';
  RAISE NOTICE 'Следующие шаги:';
  RAISE NOTICE '1. Задеплойте Edge Function: supabase functions deploy server';
  RAISE NOTICE '2. Зарегистрируйтесь на сайте';
  RAISE NOTICE '3. Выполните SQL для создания админа (см. ниже)';
END $$;

-- ============================================
-- СОЗДАНИЕ ПЕРВОГО АДМИНА (ПОСЛЕ РЕГИСТРАЦИИ)
-- ============================================

-- ВНИМАНИЕ: Замените 'ваш@email.com' на ваш реальный email!
-- Сначала зарегистрируйтесь на сайте, затем выполните:

/*
UPDATE public.profiles
SET is_admin = true
WHERE email = 'ваш@email.com';

-- Проверка
SELECT id, email, name, is_admin, is_wholesaler, created_at
FROM public.profiles
WHERE is_admin = true;
*/
