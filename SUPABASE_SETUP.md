# 🗄️ Настройка базы данных Supabase для Asia Pharm

## ⚠️ ВАЖНО для Figma Make

В среде Figma Make используйте **Supabase Dashboard** для выполнения SQL команд.
CLI команды (`supabase link`, `supabase db push`) НЕ работают.

---

## 📊 Необходимые таблицы

### 1. Таблица `products`

```sql
-- Создать таблицу продуктов
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT,
  name_zh TEXT,
  name_vi TEXT,
  description_ru TEXT,
  description_en TEXT,
  description_zh TEXT,
  description_vi TEXT,
  short_description TEXT,
  short_description_en TEXT,
  short_description_zh TEXT,
  short_description_vi TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  image_url TEXT,
  country TEXT NOT NULL CHECK (country IN ('china', 'thailand', 'vietnam')),
  category_ids TEXT[] DEFAULT '{}',
  disease_categories TEXT[] DEFAULT '{}',
  in_stock BOOLEAN DEFAULT true,
  is_sample BOOLEAN DEFAULT false,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включить Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать продукты
CREATE POLICY "Products are viewable by everyone" 
  ON public.products FOR SELECT 
  USING (true);

-- Политика: только админы могут изменять продукты
CREATE POLICY "Only admins can insert products" 
  ON public.products FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update products" 
  ON public.products FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete products" 
  ON public.products FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Создать индексы для лучшей производительности
CREATE INDEX IF NOT EXISTS idx_products_country ON public.products(country);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_category_ids ON public.products USING GIN(category_ids);
CREATE INDEX IF NOT EXISTS idx_products_disease_categories ON public.products USING GIN(disease_categories);
```

### 2. Таблица `user_profiles`

```sql
-- Создать таблицу профилей пользователей
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_wholesaler BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'ru' CHECK (language IN ('ru', 'en', 'zh', 'vi')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включить Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут читать свой профиль
CREATE POLICY "Users can view own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

-- Политика: пользователи могут обновлять свой профиль
CREATE POLICY "Users can update own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Политика: админы могут видеть все профили
CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Политика: админы могут обновлять все профили
CREATE POLICY "Admins can update all profiles" 
  ON public.user_profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Создать индексы
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin);
```

### 3. Таблица `orders`

```sql
-- Создать таблицу заказов
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  items JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method TEXT,
  tracking_number TEXT,
  store_country TEXT NOT NULL CHECK (store_country IN ('china', 'thailand', 'vietnam')),
  promo_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  loyalty_points_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включить Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть свои заказы
CREATE POLICY "Users can view own orders" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = user_id);

-- Политика: пользователи могут создавать заказы
CREATE POLICY "Authenticated users can create orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Политика: админы могут видеть все заказы
CREATE POLICY "Admins can view all orders" 
  ON public.orders FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Политика: админы могут обновлять заказы
CREATE POLICY "Admins can update orders" 
  ON public.orders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Создать индексы
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
```

### 4. Таблица `promo_codes`

```sql
-- Создать таблицу промокодов
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value DECIMAL(10, 2) NOT NULL,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включить Row Level Security
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать активные промокоды
CREATE POLICY "Active promo codes are viewable by everyone" 
  ON public.promo_codes FOR SELECT 
  USING (active = true);

-- Политика: только админы могут управлять промокодами
CREATE POLICY "Only admins can manage promo codes" 
  ON public.promo_codes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Создать индексы
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(active);
```

---

## 🚀 Быстрая установка

Скопируйте и выполните все команды в **Supabase Dashboard → SQL Editor**:

```sql
-- 1. Создать все таблицы
-- (Скопируйте весь SQL выше)

-- 2. Проверить создание таблиц
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 3. Проверить что RLS включен
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

---

## 🔐 Создание первого админа

После регистрации первого пользователя через интерфейс:

```sql
-- Получить ID пользователя
SELECT id, email FROM auth.users WHERE email = 'ваш-email@example.com';

-- Сделать пользователя админом
UPDATE public.user_profiles 
SET is_admin = true 
WHERE email = 'ваш-email@example.com';

-- Проверить
SELECT id, email, name, is_admin 
FROM public.user_profiles 
WHERE is_admin = true;
```

---

## 📝 Добавление тестовых данных

### Тестовые продукты

```sql
-- Добавить тестовый продукт (требует прав админа)
INSERT INTO public.products (
  name_ru, name_en, name_zh, name_vi,
  description_ru, description_en,
  price, country,
  category_ids, disease_categories,
  in_stock, is_sample
) VALUES (
  'Тигровый бальзам', 'Tiger Balm', '老虎膏', 'Cao con hổ',
  'Классический бальзам для снятия боли в мышцах и суставах',
  'Classic balm for muscle and joint pain relief',
  150.00, 'china',
  ARRAY['ointments'], ARRAY['joints', 'skin'],
  true, false
);

-- Добавить еще продуктов
INSERT INTO public.products (name_ru, name_en, price, country, category_ids, disease_categories, in_stock)
VALUES 
  ('Пластырь обезболивающий', 'Pain Relief Patch', 200.00, 'china', ARRAY['patches'], ARRAY['joints'], true),
  ('Массажное масло', 'Massage Oil', 350.00, 'thailand', ARRAY['ointments'], ARRAY['joints', 'nervous'], true),
  ('Травяной чай', 'Herbal Tea', 120.00, 'vietnam', ARRAY['teas'], ARRAY['digestive'], true);
```

### Тестовый промокод

```sql
-- Создать тестовый промокод на 10% скидку
INSERT INTO public.promo_codes (code, discount_type, discount_value, usage_limit, active)
VALUES ('WELCOME10', 'percent', 10, 100, true);
```

---

## ✅ Проверка работы

```sql
-- Проверить количество продуктов
SELECT country, COUNT(*) as count 
FROM public.products 
WHERE in_stock = true 
GROUP BY country;

-- Проверить количество пользователей
SELECT COUNT(*) as total_users, 
       COUNT(*) FILTER (WHERE is_admin = true) as admins
FROM public.user_profiles;

-- Проверить активные промокоды
SELECT code, discount_type, discount_value, times_used, usage_limit
FROM public.promo_codes
WHERE active = true;
```

---

## 🔧 Полезные команды

```sql
-- Очистить все продукты (осторожно!)
DELETE FROM public.products;

-- Сбросить счетчик использования промокода
UPDATE public.promo_codes SET times_used = 0 WHERE code = 'WELCOME10';

-- Изменить статус всех заказов на "обработан"
UPDATE public.orders SET status = 'processing' WHERE status = 'pending';

-- Получить список последних заказов
SELECT o.id, o.total, o.status, u.email, o.created_at
FROM public.orders o
LEFT JOIN public.user_profiles u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## 📚 Дополнительная информация

- **Project ID**: `boybkoyidxwrgsayifrd`
- **Edge Function**: `https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/`
- **Dashboard**: `https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd`

---

## ⚠️ Важные замечания

1. **Row Level Security (RLS)** обязательно должен быть включен на всех таблицах
2. **Политики доступа** защищают данные от несанкционированного доступа
3. **Индексы** улучшают производительность запросов
4. Все изменения БД делайте через **Supabase Dashboard**, не через CLI

---

Готово! После выполнения этих команд ваша база данных будет полностью настроена. 🎉
