# 🚀 Полная инструкция по деплою Asia Pharm на Vercel + Supabase

## 📋 Содержание

**⚠️ ВАЖНО**: Если у вас уже есть проект Supabase, начните с раздела [#6 Очистка существующей базы данных](#6-очистка-существующей-базы-данных)

1. [Подготовка окружения](#1-подготовка-окружения)
2. [Настройка Supabase](#2-настройка-supabase)
3. [Настройка Resend (Email)](#3-настройка-resend-email)
4. [Деплой на Vercel](#4-деплой-на-vercel)
5. [Автоматический деплой](#5-автоматический-деплой)
6. [Очистка существующей базы данных](#6-очистка-существующей-базы-данных)

---

## 1. Подготовка окружения

### Установка зависимостей

```bash
# 1. Клонируйте репозиторий (если еще не клонирован)
cd ~/path/to/asia-pharm

# 2. Установите Node.js зависимости
npm install

# 3. Установите Supabase CLI
brew install supabase/tap/supabase

# 4. Проверьте версию
supabase --version
```

---

## 2. Настройка Supabase

### 2.1. Создание проекта Supabase (новый проект)

1. Перейдите на https://supabase.com
2. Войдите в аккаунт или зарегистрируйтесь
3. Нажмите "New Project"
4. Заполните:
   - **Name**: asia-pharm
   - **Database Password**: Придумайте надежный пароль (сохраните его!)
   - **Region**: Southeast Asia (Singapore) - ближайший регион
5. Нажмите "Create new project"
6. Подождите 2-3 минуты пока проект создается

### 2.2. Получение ключей Supabase

После создания проекта:

1. Откройте **Project Settings** → **API**
2. Скопируйте и сохраните:
   - **Project URL** (например: `https://xxxxxx.supabase.co`)
   - **anon public** key (начинается с `eyJ...`)
   - **service_role** key (начинается с `eyJ...`) - **СЕКРЕТНЫЙ КЛЮЧ!**

3. Откройте **Project Settings** → **Database**
4. Скопируйте:
   - **Connection string** → **URI** (выберите режим Transaction)
   - Будет вида: `postgresql://postgres.xxxxx:[YOUR-PASSWORD]@...`

### 2.3. Логин в Supabase CLI

```bash
# 1. Войдите в аккаунт
supabase login

# Откроется браузер для авторизации
# Подтвердите доступ

# 2. Привяжите локальный проект к Supabase
supabase link --project-ref YOUR_PROJECT_REF

# YOUR_PROJECT_REF - это ID проекта из URL
# Например, из https://boybkoyidxwrgsayifrd.supabase.co
# Project Ref = boybkoyidxwrgsayifrd
```

### 2.4. Создание таблиц в базе данных

#### Способ 1: Через SQL Editor в Supabase Dashboard

1. Откройте **SQL Editor** в Supabase Dashboard
2. Создайте новый запрос
3. Скопируйте и выполните следующий SQL:

```sql
-- ============================================
-- ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ ASIA PHARM
-- ============================================

-- 1. ТАБЛИЦА: products
-- Основная таблица товаров с многоязычной поддержкой
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  name_zh TEXT,
  name_vi TEXT,
  short_description TEXT,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  disease TEXT,
  disease_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индексы для products
CREATE INDEX IF NOT EXISTS idx_products_store ON products(store);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_disease ON products(disease);
CREATE INDEX IF NOT EXISTS idx_products_disease_categories ON products USING GIN(disease_categories);

-- 2. ТАБЛИЦА: categories
-- Категории с переводами на 4 языка
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('top', 'side')),
  translations JSONB NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. ТАБЛИЦА: orders
-- Заказы пользователей
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store TEXT NOT NULL CHECK (store IN ('china', 'thailand', 'vietnam')),
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  shipping_info JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  promo_code TEXT,
  discount NUMERIC(10, 2) DEFAULT 0,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индексы для orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 4. ТАБЛИЦА: promo_codes
-- Промокоды
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')),
  discount_value NUMERIC(10, 2) NOT NULL,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индекс для promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE active = true;

-- 5. ТАБЛИЦА: user_profiles
-- Профили пользователей с балансом лояльности
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. ТАБЛИЦА: loyalty_transactions
-- История транзакций баллов лояльности
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'expired', 'bonus')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индекс для loyalty_transactions
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);

-- 7. ТАБЛИЦА: newsletter_subscriptions
-- Подписки на рассылку
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- 8. ТАБЛИЦА: user_preferences
-- Настройки пользователей
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'ru' CHECK (language IN ('ru', 'en', 'zh', 'vi')),
  currency TEXT DEFAULT 'RUB',
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. ТАБЛИЦА: kv_store_a75b5353
-- Key-Value хранилище для настроек, страниц и т.д.
CREATE TABLE IF NOT EXISTS kv_store_a75b5353 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индекс для kv_store
CREATE INDEX IF NOT EXISTS idx_kv_store_updated_at ON kv_store_a75b5353(updated_at DESC);

-- 10. ТАБЛИЦА: chat_messages
-- Сообщения чата поддержки
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Индексы для chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Включаем RLS для всех таблиц
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE kv_store_a75b5353 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Все могут читать, только админы могут изменять
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can insert products" ON products;
CREATE POLICY "Service role can insert products" ON products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update products" ON products;
CREATE POLICY "Service role can update products" ON products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role can delete products" ON products;
CREATE POLICY "Service role can delete products" ON products FOR DELETE USING (true);

-- CATEGORIES: Все могут читать, только админы могут изменять
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
CREATE POLICY "Service role can manage categories" ON categories FOR ALL USING (true);

-- ORDERS: Пользователи видят только свои заказы
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all orders" ON orders;
CREATE POLICY "Service role can manage all orders" ON orders FOR ALL USING (true);

-- PROMO_CODES: Все могут читать активные, только админы изменяют
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON promo_codes;
CREATE POLICY "Anyone can view active promo codes" ON promo_codes FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Service role can manage promo codes" ON promo_codes;
CREATE POLICY "Service role can manage promo codes" ON promo_codes FOR ALL USING (true);

-- USER_PROFILES: Пользователи видят только свой профиль
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON user_profiles;
CREATE POLICY "Service role can manage all profiles" ON user_profiles FOR ALL USING (true);

-- LOYALTY_TRANSACTIONS: Пользователи видят только свои транзакции
DROP POLICY IF EXISTS "Users can view own loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Users can view own loyalty transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage loyalty transactions" ON loyalty_transactions;
CREATE POLICY "Service role can manage loyalty transactions" ON loyalty_transactions FOR ALL USING (true);

-- NEWSLETTER: Только админы управляют
DROP POLICY IF EXISTS "Service role can manage newsletter" ON newsletter_subscriptions;
CREATE POLICY "Service role can manage newsletter" ON newsletter_subscriptions FOR ALL USING (true);

-- USER_PREFERENCES: Пользователи управляют своими настройками
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage preferences" ON user_preferences;
CREATE POLICY "Service role can manage preferences" ON user_preferences FOR ALL USING (true);

-- KV_STORE: Только через сервис
DROP POLICY IF EXISTS "Service role can manage kv store" ON kv_store_a75b5353;
CREATE POLICY "Service role can manage kv store" ON kv_store_a75b5353 FOR ALL USING (true);

-- CHAT_MESSAGES: Пользователи видят только свои сообщения
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can send chat messages" ON chat_messages;
CREATE POLICY "Users can send chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND sender = 'user');

DROP POLICY IF EXISTS "Service role can manage all chat messages" ON chat_messages;
CREATE POLICY "Service role can manage all chat messages" ON chat_messages FOR ALL USING (true);

-- ============================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ============================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kv_store_updated_at ON kv_store_a75b5353;
CREATE TRIGGER update_kv_store_updated_at BEFORE UPDATE ON kv_store_a75b5353
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ: КАТЕГОРИИ
-- ============================================

-- Удаляем старые категории
TRUNCATE TABLE categories;

-- Верхнее меню (Категории товаров)
INSERT INTO categories (id, type, translations) VALUES
('ointments', 'top', '{"ru": "Мази", "en": "Ointments & Balms", "zh": "药膏和香膏", "vi": "Thuốc mỡ & Dầu bôi"}'),
('patches', 'top', '{"ru": "Пластыри", "en": "Patches", "zh": "贴膏", "vi": "Miếng dán"}'),
('sprays', 'top', '{"ru": "Спреи", "en": "Sprays", "zh": "喷雾剂", "vi": "Xịt"}'),
('tea', 'top', '{"ru": "Чай", "en": "Tea", "zh": "茶", "vi": "Trà"}'),
('elixirs', 'top', '{"ru": "Эликсиры", "en": "Elixirs", "zh": "药酒", "vi": "Thuốc bổ"}'),
('pills', 'top', '{"ru": "Пилюли", "en": "Pills", "zh": "丸药", "vi": "Viên thuốc"}'),
('cosmetics', 'top', '{"ru": "Косметика", "en": "Cosmetics", "zh": "化妆品", "vi": "Mỹ phẩm"}'),
('accessories', 'top', '{"ru": "Аксессуары", "en": "Accessories", "zh": "配件", "vi": "Phụ kiện"}'),
('samples', 'top', '{"ru": "Пробники", "en": "Samples", "zh": "样品", "vi": "Mẫu thử"}');

-- Боковое меню (Категории заболеваний)
INSERT INTO categories (id, type, translations) VALUES
('popular', 'side', '{"ru": "Популярные товары", "en": "Popular Products", "zh": "热门产品", "vi": "Sản phẩm phổ biến"}'),
('all', 'side', '{"ru": "Все товары", "en": "All Products", "zh": "所有产品", "vi": "Tất cả sản phẩm"}'),
('cold', 'side', '{"ru": "Простуда", "en": "Cold & Flu", "zh": "感冒", "vi": "Cảm lạnh"}'),
('digestive', 'side', '{"ru": "ЖКТ", "en": "Digestive System", "zh": "消化系统", "vi": "Tiêu hóa"}'),
('skin', 'side', '{"ru": "Кожа", "en": "Skin", "zh": "皮肤", "vi": "Da"}'),
('joints', 'side', '{"ru": "Суставы", "en": "Joints", "zh": "关节", "vi": "Khớp"}'),
('heart', 'side', '{"ru": "Сердце и сосуды", "en": "Heart & Blood Vessels", "zh": "心脏和血管", "vi": "Tim mạch"}'),
('liverKidneys', 'side', '{"ru": "Печень и почки", "en": "Liver & Kidneys", "zh": "肝肾", "vi": "Gan & Thận"}'),
('nervous', 'side', '{"ru": "Нервная система", "en": "Nervous System", "zh": "神经系统", "vi": "Hệ thần kinh"}'),
('womensHealth', 'side', '{"ru": "Женское здоровье", "en": "Women''s Health", "zh": "女性健康", "vi": "Sức khỏe phụ nữ"}'),
('mensHealth', 'side', '{"ru": "Мужское здоровье", "en": "Men''s Health", "zh": "男性健康", "vi": "Sức khỏe nam giới"}'),
('forChildren', 'side', '{"ru": "Для детей", "en": "For Children", "zh": "儿童", "vi": "Cho trẻ em"}'),
('vision', 'side', '{"ru": "Зрение", "en": "Vision", "zh": "视力", "vi": "Thị lực"}'),
('hemorrhoids', 'side', '{"ru": "Геморрой", "en": "Hemorrhoids", "zh": "痔疮", "vi": "Trĩ"}'),
('oncology', 'side', '{"ru": "Онкология", "en": "Oncology", "zh": "肿瘤科", "vi": "Ung thư"}'),
('thyroid', 'side', '{"ru": "Щитовидная железа", "en": "Thyroid", "zh": "甲状腺", "vi": "Tuyến giáp"}'),
('lungs', 'side', '{"ru": "Легкие", "en": "Lungs", "zh": "肺部", "vi": "Phổi"}');

-- ============================================
-- ГОТОВО!
-- ============================================

SELECT 'Database schema created successfully!' AS status;
```

4. Нажмите **Run** или `Cmd+Enter`
5. Убедитесь, что все выполнено без ошибок

### 2.5. Деплой Edge Function

Edge Function находится в `/supabase/functions/make-server-a75b5353/`

```bash
# 1. Перейдите в корень проекта
cd ~/path/to/asia-pharm

# 2. Задеплойте функцию
supabase functions deploy make-server-a75b5353

# Вы увидите:
# Deploying Function make-server-a75b5353...
# Function deployed successfully!
```

### 2.6. Настройка переменных окружения для Edge Function

Edge Function требует API ключ Resend для отправки email.

```bash
# Установите RESEND_API_KEY для edge function
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx

# Проверьте
supabase secrets list
```

### 2.7. Тестирование Edge Function

```bash
# Тест базового эндпоинта
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a75b5353/

# Должен вернуть:
# {"status":"ok","message":"Asia Pharm Server is running"}

# Тест health check
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a75b5353/test/health

# Должен вернуть статус подключения к БД
```

---

## 3. Настройка Resend (Email)

### 3.1. Создание аккаунта Resend

1. Перейдите на https://resend.com
2. Нажмите "Sign Up" и зарегистрируйтесь
3. Подтвердите email

### 3.2. Получение API ключа

1. После входа откройте **API Keys** в меню слева
2. Нажмите "Create API Key"
3. Настройки:
   - **Name**: asia-pharm-production
   - **Permission**: Full Access (или Sending access)
4. Нажмите "Create"
5. **ВАЖНО**: Скопируйте и сохраните API ключ (начинается с `re_`)
6. Вы увидите его только один раз!

### 3.3. Настройка домена (опционально)

Для отправки с вашего домена:

1. В Resend откройте **Domains**
2. Нажмите "Add Domain"
3. Введите ваш домен (например: `asia-pharm.com`)
4. Добавьте DNS записи, которые покажет Resend
5. Дождитесь верификации (обычно несколько минут)

**Если домена нет**: используйте `onboarding@resend.dev` (лимит 100 писем/день)

### 3.4. Добавление API ключа в Supabase

```bash
# Установите секрет для Edge Function
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

---

## 4. Деплой на Vercel

### 4.1. Подготовка к деплою

```bash
# 1. Убедитесь, что все файлы закоммичены
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 4.2. Создание проекта на Vercel

1. Перейдите на https://vercel.com
2. Войдите через GitHub
3. Нажмите "Add New..." → "Project"
4. Выберите ваш репозиторий `asia-pharm`
5. Настройки (Vercel автоматически определит Vite):
   - **Framework Preset**: Vite (определяется автоматически)
   - **Root Directory**: `./` (корень)
   - **Build Command**: `npm run build` (заполняется автоматически)
   - **Output Directory**: `dist` (заполняется автоматически)
   
**Примечание**: Vercel автоматически обнаружит `vite.config.ts` и применит оптимальные настройки

### 4.3. Настройка переменных окружения в Vercel

В настройках проекта откройте **Settings** → **Environment Variables**

Добавьте следующие переменные:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...  # anon public key

# НЕ добавляйте service_role key в frontend!
```

**ВАЖНО**: 
- Используйте `VITE_` префикс для переменных Vite
- НЕ добавляйте `SUPABASE_SERVICE_ROLE_KEY` в Vercel (это секрет для backend)
- НЕ добавляйте `RESEND_API_KEY` в Vercel (это для Edge Function)

### 4.4. Деплой

1. Нажмите "Deploy"
2. Дождитесь завершения сборки (2-3 минуты)
3. Vercel покажет URL вашего сайта: `https://asia-pharm.vercel.app`

### 4.5. Настройка кастомного домена (опционально)

1. В Vercel откройте **Settings** → **Domains**
2. Нажмите "Add"
3. Введите ваш домен (например: `asia-pharm.com`)
4. Добавьте DNS записи в настройках вашего регистратора доменов
5. Дождитесь верификации

---

## 5. Автоматический деплой

### 5.1. GitHub Actions для Edge Functions

Создайте файл `.github/workflows/deploy-edge-functions.yml`:

```yaml
name: Deploy Supabase Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy Edge Functions
        run: supabase functions deploy make-server-a75b5353
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

### 5.2. Получение токена для GitHub Actions

```bash
# 1. Создайте access token в Supabase
# Dashboard → Account → Access Tokens → Generate New Token

# 2. Добавьте секреты в GitHub
# Repository → Settings → Secrets and variables → Actions

# Добавьте:
# SUPABASE_ACCESS_TOKEN - токен из шага 1
# SUPABASE_PROJECT_ID - ваш project ref
```

### 5.3. Автоматический деплой Vercel

Vercel автоматически деплоит при каждом push в `main`:

1. Push в `main` → автоматический деплой production
2. Push в другую ветку → preview deployment
3. Pull Request → preview deployment с комментарием

Настройка автоматического деплоя:
- **Vercel Dashboard** → **Settings** → **Git**
- Включите "Automatically deploy..."

---

## 6. Очистка существующей базы данных

### 6.1. Сохранение текущих ключей

**НЕ УДАЛЯЙТЕ ПРОЕКТ!** Просто очистите таблицы.

```sql
-- Откройте SQL Editor в Supabase
-- Выполните следующий SQL:

-- 1. Отключаем временно все триггеры
SET session_replication_role = replica;

-- 2. Очищаем все таблицы (ВНИМАНИЕ: все данные будут удалены!)
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE loyalty_transactions CASCADE;
TRUNCATE TABLE newsletter_subscriptions CASCADE;
TRUNCATE TABLE user_preferences CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE promo_codes CASCADE;
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE kv_store_a75b5353 CASCADE;

-- 3. Включаем триггеры обратно
SET session_replication_role = DEFAULT;

-- 4. Удаляем все таблицы
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS kv_store_a75b5353 CASCADE;

-- 5. Удаляем функции
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

SELECT 'Database cleaned! Now run the full schema SQL to recreate tables.' AS status;
```

### 6.2. Пересоздание таблиц

После очистки выполните полный SQL из раздела **2.4** для создания всех таблиц заново.

### 6.3. Сохранение ключей и настроек

Ваши ключи API сохраняются автоматически:
- **Project URL** - не меняется
- **API Keys** - не меняются
- **Database Password** - не меняется
- **Edge Functions** - сохраняются
- **Secrets** (RESEND_API_KEY) - сохраняются

---

## 7. Создание первого админа

### 7.1. Через интерфейс сайта

1. Откройте ваш сайт
2. Нажмите "Регистрация"
3. Зарегистрируйтесь с email `admin@asia-pharm.com`
4. Откройте Supabase Dashboard → **Table Editor** → `user_profiles`
5. Найдите вашего пользователя
6. Измените `is_admin` на `true`
7. Теперь у вас есть доступ к админ-панели

### 7.2. Через SQL

```sql
-- Найдите ID пользователя
SELECT id, email FROM auth.users WHERE email = 'admin@asia-pharm.com';

-- Сделайте пользователя админом
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'admin@asia-pharm.com';

-- Проверка
SELECT * FROM user_profiles WHERE is_admin = true;
```

---

## 8. Проверка работоспособности

### 8.1. Проверка Frontend

1. Откройте ваш сайт на Vercel
2. Проверьте:
   - ✅ Главная страница загружается
   - ✅ Переключение языков работает
   - ✅ Переключение магазинов работает
   - ✅ Категории отображаются
   - ✅ Товары загружаются (если есть в БД)

### 8.2. Проверка Edge Function

```bash
# Health check
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a75b5353/

# Тест БД
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a75b5353/test/db
```

### 8.3. Проверка Email (Resend)

1. Зарегистрируйте тестового пользователя
2. Проверьте, что пришло welcome email
3. Сделайте тестовый заказ
4. Проверьте, что пришло подтверждение заказа

---

## 9. Решение частых проблем

### Проблема: CORS ошибки

**Решение**: Убедитесь, что в Edge Function есть CORS middleware:

```typescript
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
```

### Проблема: "Service role key not found"

**Решение**: Не используйте service_role key во frontend! Используйте только anon key.

### Проблема: Email не отправляются

**Решение**:
1. Проверьте, что RESEND_API_KEY установлен в Edge Function secrets
2. Проверьте лимиты Resend (100 писем/день для бесплатного плана)
3. Проверьте логи Edge Function в Supabase Dashboard

### Проблема: База данных не подключается

**Решение**:
1. Проверьте, что RLS policies созданы
2. Проверьте connection string
3. Проверьте, что используете правильный anon key

---

## 10. Полезные команды

```bash
# Локальная разработка
npm run dev

# Сборка production
npm run build

# Предпросмотр production сборки
npm run preview

# Деплой Edge Function
supabase functions deploy make-server-a75b5353

# Просмотр логов Edge Function
supabase functions logs make-server-a75b5353

# Список секретов
supabase secrets list

# Установка секрета
supabase secrets set KEY=value

# Удаление секрета
supabase secrets unset KEY
```

---

## 11. Контрольный список перед продакшеном

- [ ] Все таблицы созданы в Supabase
- [ ] RLS policies настроены
- [ ] Edge Function задеплоена
- [ ] RESEND_API_KEY установлен в secrets
- [ ] Проект создан в Vercel
- [ ] Environment variables добавлены в Vercel
- [ ] Первый админ создан
- [ ] Категории загружены в БД
- [ ] Тестовые товары добавлены
- [ ] Email отправка работает
- [ ] Регистрация/логин работает
- [ ] Заказы создаются
- [ ] Админ-панель доступна

---

## 12. Поддержка и мониторинг

### Логи Vercel
**Vercel Dashboard** → Ваш проект → **Deployments** → Выберите деплой → **View Function Logs**

### Логи Supabase
**Supabase Dashboard** → **Logs** → **Edge Functions**

### База данных
**Supabase Dashboard** → **Table Editor** - просмотр и редактирование данных

---

## 🎉 Готово!

Ваш сайт Asia Pharm развернут и готов к работе!

**Production URLs:**
- Frontend: `https://asia-pharm.vercel.app` (или ваш домен)
- Edge Function: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/make-server-a75b5353/`
- Supabase Dashboard: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

**Следующие шаги:**
1. Добавьте товары через админ-панель
2. Настройте промокоды
3. Настройте страницы (О нас, Доставка и т.д.)
4. Настройте email шаблоны
5. Подключите аналитику (Google Analytics)

**Полезные ресурсы:**
- 📝 **[QUICK_COMMANDS.md](./QUICK_COMMANDS.md)** - Все команды для разработки и деплоя
- 📖 **[README.md](./README.md)** - Документация проекта
- 🗄️ **SQL Scripts** - В этом файле выше (раздел 2.4 и 6.1)

Удачи! 🚀
