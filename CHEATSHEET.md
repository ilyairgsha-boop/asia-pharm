# ⚡ Asia-Pharm Шпаргалка

Быстрые команды и ссылки для работы с проектом.

---

## 🔗 Важные ссылки

```
Production:      (будет после деплоя на Vercel)
GitHub:          https://github.com/ilyairgsha-boop/asia-pharm
Supabase:        https://app.supabase.com/project/hohhzspiylssmgdivajk
API Endpoint:    https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

---

## 🚀 Быстрый старт

```bash
# Клонирование
git clone https://github.com/ilyairgsha-boop/asia-pharm.git
cd asia-pharm

# Установка
npm install

# Запуск
npm run dev
```

---

## 🗄️ Supabase Commands

```bash
# Вход
supabase login

# Связать с проектом
supabase link --project-ref hohhzspiylssmgdivajk

# Деплой функции
supabase functions deploy server --project-ref hohhzspiylssmgdivajk --no-verify-jwt

# Логи функции
supabase functions logs server --project-ref hohhzspiylssmgdivajk

# Проверка БД
supabase db ping --project-ref hohhzspiylssmgdivajk

# Список функций
supabase functions list --project-ref hohhzspiylssmgdivajk
```

---

## 📦 NPM Scripts

```bash
npm run dev         # Локальный dev сервер (http://localhost:5173)
npm run build       # Production сборка
npm run preview     # Предпросмотр production сборки
npm run lint        # ESLint проверка
npx tsc --noEmit   # TypeScript проверка
```

---

## 🔍 Проверка работы

```bash
# API Health Check
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/

# Получить продукты
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/products

# С API ключом
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/products \
  -H "apikey: YOUR_ANON_KEY"
```

---

## 🗃️ SQL Команды

```sql
-- Создать админа (замените email)
UPDATE public.profiles
SET is_admin = true
WHERE email = 'ваш@email.com';

-- Проверить админов
SELECT email, is_admin FROM public.profiles WHERE is_admin = true;

-- Сделать оптовиком
UPDATE public.profiles
SET is_wholesaler = true
WHERE email = 'оптовик@email.com';

-- Список всех таблиц
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Количество продуктов
SELECT COUNT(*) FROM public.products;

-- Количество пользователей
SELECT COUNT(*) FROM public.profiles;
```

---

## 🐙 Git Commands

```bash
# Проверка статуса
git status

# Добавить все изменения
git add .

# Коммит
git commit -m "Your message"

# Отправить на GitHub
git push origin main

# Очистить историю (для нового старта)
rm -rf .git
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ilyairgsha-boop/asia-pharm.git
git push -u origin main --force
```

---

## 🌐 Vercel Commands

```bash
# Вход
vercel login

# Деплой
vercel --prod

# Добавить env переменные
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Список проектов
vercel projects list

# Логи
vercel logs
```

---

## 📁 Структура файлов

```
asia-pharm/
├── DEPLOY.md              👈 Полная инструкция
├── CHECKLIST.md           👈 Чеклист
├── CHEATSHEET.md          👈 Вы здесь
├── setup.sql              👈 SQL для БД
├── QUICK_START.sh         👈 Скрипт автодеплоя
│
├── components/            React компоненты
│   ├── admin/            Админ-панель
│   └── ui/               ShadCN компоненты
│
├── supabase/
│   ├── functions/
│   │   └── server/       Edge Function API
│   └── migrations/       Миграции БД
│
├── utils/
│   └── supabase/         Supabase клиент
│
└── package.json
```

---

## 🔑 Переменные окружения

```bash
# .env.local (для локальной разработки)
VITE_SUPABASE_URL=https://hohhzspiylssmgdivajk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ ВАЖНО:** Не коммитьте `.env.local` в Git!

---

## 🐛 Решение проблем

### CORS ошибки
```bash
# Передеплой функции
supabase functions deploy server --project-ref hohhzspiylssmgdivajk --no-verify-jwt

# Проверьте логи
supabase functions logs server --project-ref hohhzspiylssmgdivajk
```

### База данных не работает
```bash
# Проверьте подключение
supabase db ping --project-ref hohhzspiylssmgdivajk

# Выполните setup.sql в Supabase Dashboard
```

### Vercel не собирается
- Проверьте переменные окружения в Vercel Dashboard
- Проверьте логи сборки
- Убедитесь, что `package.json` корректен

---

## 📚 Документация

| Файл | Назначение |
|------|-----------|
| [DEPLOY.md](./DEPLOY.md) | Полная инструкция по деплою |
| [CHECKLIST.md](./CHECKLIST.md) | Чеклист перед деплоем |
| [CHEATSHEET.md](./CHEATSHEET.md) | Эта шпаргалка |
| [README.md](./README.md) | Общая информация |
| [Attributions.md](./Attributions.md) | Авторство |

---

## 🆘 Получить помощь

- **Issues**: https://github.com/ilyairgsha-boop/asia-pharm/issues
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Последнее обновление**: 2025-01-24
