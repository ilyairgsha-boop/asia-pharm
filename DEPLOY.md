# 🚀 Инструкция по деплою Asia-Pharm на Supabase

## 📋 Содержание
1. [Требования](#требования)
2. [Настройка локального окружения](#настройка-локального-окружения)
3. [Очистка и настройка GitHub](#очистка-и-настройка-github)
4. [Настройка Supabase](#настройка-supabase)
5. [Деплой на Vercel](#деплой-на-vercel)
6. [Создание первого админа](#создание-первого-админа)
7. [Проверка работы](#проверка-работы)

---

## 🔧 Требования

Убедитесь, что у вас установлено:
- **Node.js** v18+ ([скачать](https://nodejs.org/))
- **Git** ([скачать](https://git-scm.com/))
- **Supabase CLI** (установка ниже)

---

## 💻 Настройка локального окружения

### 1. Установка Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Вход в Supabase

```bash
supabase login
```

### 3. Клонирование проекта

```bash
git clone https://github.com/ilyairgsha-boop/asia-pharm.git
cd asia-pharm
```

### 4. Установка зависимостей

```bash
npm install
```

**✅ Важно:** Все импорты уже исправлены для локальной разработки! Версионные импорты (например, `sonner@2.0.3`) заменены на обычные (`sonner`). См. подробности в [LOCAL_DEV_FIX.md](./LOCAL_DEV_FIX.md).

---

## 🧹 Очистка и настройка GitHub

### Вариант A: Очистка истории (рекомендуется для нового старта)

```bash
# 1. Перейдите в директорию проекта
cd /path/to/asia-pharm

# 2. Удалите старый Git репозиторий
rm -rf .git

# 3. Инициализируйте новый репозиторий
git init

# 4. Создайте .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env
.env.local
.env.production
*.log

# IDE
.vscode/
.idea/

# Supabase local
.supabase/
EOF

# 5. Добавьте все файлы
git add .

# 6. Сделайте первый коммит
git commit -m "Initial commit: Asia-Pharm e-commerce platform"

# 7. Подключите к GitHub
git remote add origin https://github.com/ilyairgsha-boop/asia-pharm.git

# 8. Отправьте изменения (force push для перезаписи истории)
git push -u origin main --force
```

### Вариант B: Сохранение истории

```bash
# 1. Перейдите в директорию проекта
cd /path/to/asia-pharm

# 2. Добавьте все изменения
git add .

# 3. Сделайте коммит
git commit -m "Clean up project structure"

# 4. Отправьте на GitHub
git push origin main
```

---

## 🗄️ Настройка Supabase

### 1. Данные для подключения

```bash
SUPABASE_URL=https://hohhzspiylssmgdivajk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaGh6c3BpeWxzc21nZGl2YWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NDQzNzgsImV4cCI6MjA1MzIyMDM3OH0.Jp6xxxx (используйте свой ключ)
PROJECT_ID=hohhzspiylssmgdivajk
```

### 2. Связывание с проектом

```bash
supabase link --project-ref hohhzspiylssmgdivajk
```

### 3. Применение миграций базы данных

```bash
# Применить все миграции
supabase db push

# Или вручную в Supabase Dashboard > SQL Editor:
# Выполните файлы из /supabase/migrations/ в правильном порядке
```

### 4. Создание таблиц вручную (если миграции не работают)

Перейдите в **Supabase Dashboard → SQL Editor** и выполните:

```sql
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

-- Таблица KV Store
CREATE TABLE IF NOT EXISTS public.kv_store_a75b5353 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включить RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kv_store_a75b5353 ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Политики для products (все могут читать, только админы - изменять)
CREATE POLICY "Anyone can read products"
  ON public.products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Политики для kv_store (только через Edge Functions)
CREATE POLICY "Service role can manage kv_store"
  ON public.kv_store_a75b5353 FOR ALL
  TO service_role
  USING (true);
```

### 5. Деплой Edge Function

```bash
# Деплой функции server
supabase functions deploy server --project-ref hohhzspiylssmgdivajk --no-verify-jwt

# Проверка статуса
supabase functions list --project-ref hohhzspiylssmgdivajk
```

**Проверка функции:**
```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

Ожидаемый ответ:
```json
{"status":"OK","message":"Asia-Pharm Store API"}
```

---

## 🌐 Деплой на Vercel

### 1. Установка Vercel CLI (опционально)

```bash
npm i -g vercel
```

### 2. Деплой через GitHub (рекомендуется)

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **New Project**
3. Выберите репозиторий `ilyairgsha-boop/asia-pharm`
4. Настройте переменные окружения:

```
VITE_SUPABASE_URL=https://hohhzspiylssmgdivajk.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_key
```

5. Нажмите **Deploy**

### 3. Деплой через CLI

```bash
# Войдите в Vercel
vercel login

# Деплой
vercel --prod

# Добавьте переменные окружения
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

## 👤 Создание первого админа

### Способ 1: Через SQL (рекомендуется)

1. Зарегистрируйтесь на сайте через UI
2. Перейдите в **Supabase Dashboard → SQL Editor**
3. Выполните:

```sql
-- Замените 'ваш@email.com' на ваш email
UPDATE public.profiles
SET is_admin = true
WHERE email = 'ваш@email.com';
```

### Способ 2: Через Edge Function

```bash
# После регистрации на сайте, получите свой user_id из profiles
curl -X POST https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/admin/users/[USER_ID]/role \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isAdmin": true}'
```

---

## ✅ Проверка работы

### 1. Проверка фронтенда

```bash
# Локальный запуск
npm run dev

# Откройте http://localhost:5173
```

### 2. Проверка Edge Function

```bash
# Health check
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/

# Получение продуктов
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/products \
  -H "apikey: YOUR_ANON_KEY"
```

### 3. Проверка базы данных

```bash
# Локально
supabase db diff

# Или в Supabase Dashboard → Database → Tables
```

### 4. Тестирование функционала

- ✅ Регистрация/вход
- ✅ Просмотр каталога товаров
- ✅ Добавление в корзину
- ✅ Оформление заказа
- ✅ Админ-панель (после установки is_admin = true)

---

## 🐛 Решение проблем

### CORS ошибки

Если видите `CORS policy` ошибки, проверьте:

1. Edge Function задеплоена корректно
2. В `/supabase/functions/server/index.tsx` есть CORS middleware
3. OPTIONS запросы возвращают 200

### База данных недоступна

```bash
# Проверьте подключение
supabase db ping --project-ref hohhzspiylssmgdivajk

# Проверьте таблицы
supabase db remote list --project-ref hohhzspiylssmgdivajk
```

### Edge Function не работает

```bash
# Посмотрите логи
supabase functions logs server --project-ref hohhzspiylssmgdivajk

# Повторный деплой
supabase functions deploy server --project-ref hohhzspiylssmgdivajk --no-verify-jwt
```

---

## 📞 Поддержка

- **GitHub Issues**: https://github.com/ilyairgsha-boop/asia-pharm/issues
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

## 📝 Важные ссылки

- **Продакшн сайт**: (будет после деплоя на Vercel)
- **Supabase Dashboard**: https://app.supabase.com/project/hohhzspiylssmgdivajk
- **GitHub Repo**: https://github.com/ilyairgsha-boop/asia-pharm
- **Edge Function URL**: https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/

---

**Создано**: 2025-01-24  
**Версия**: 1.0.0
