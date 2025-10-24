# 🚀 Полная инструкция по развертыванию Asia Pharm с нуля

## 📋 Информация о проекте

- **Название**: Asia Pharm (Азия Фарм)
- **GitHub**: https://github.com/ilyairgsha-boop/asia-pharm
- **Supabase URL**: https://hohhzspiylssmgdivajk.supabase.co
- **Supabase Project ID**: hohhzspiylssmgdivajk

## ⏱️ Время на развертывание

**Общее время**: ~25-30 минут

```
📦 Шаг 1: Supabase База данных     → 5 минут
🔧 Шаг 2: Supabase Edge Functions  → 5 минут
⚡ Шаг 3: Vercel Хостинг          → 5 минут
🔐 Шаг 4: GitHub CI/CD            → 8 минут
👤 Шаг 5: Первый администратор     → 2 минуты
```

---

## 📦 ШАГ 1: Настройка Supabase базы данных (5 минут)

### 1.1 Открытие SQL Editor

Откройте Supabase SQL Editor:
```
https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/editor
```

### 1.2 Выполнение миграции

1. В SQL Editor нажмите **"New query"**

2. Откройте файл в вашем проекте:
   ```
   /supabase/migrations/20250123_initial_schema.sql
   ```

3. Скопируйте **ВСЁ** содержимое файла (более 500 строк)

4. Вставьте в SQL Editor

5. Нажмите **"Run"** (или `Ctrl/Cmd + Enter`)

6. Дождитесь сообщения **"Success. No rows returned"**

### 1.3 Проверка созданных таблиц

В левой панели SQL Editor должны появиться 8 таблиц:

- ✅ `profiles` - Профили пользователей
- ✅ `products` - Товары
- ✅ `orders` - Заказы
- ✅ `promo_codes` - Промокоды
- ✅ `loyalty_transactions` - История кэшбэка
- ✅ `pages` - Редактируемые страницы
- ✅ `settings` - Настройки сайта
- ✅ `kv_store_a75b5353` - KV хранилище

### 1.4 Получение API ключей

1. Откройте настройки API:
   ```
   https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/settings/api
   ```

2. **Скопируйте и сохраните следующие значения**:

   **Project URL**:
   ```
   https://hohhzspiylssmgdivajk.supabase.co
   ```

   **anon / public key** (для клиента):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ Это публичный ключ, безопасен для фронтенда

   **service_role key** (для сервера):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **СЕКРЕТНЫЙ КЛЮЧ!** Никогда не используйте в клиентском коде!

3. Сохраните эти ключи в безопасное место (понадобятся позже)

### 1.5 Создание Access Token (для CI/CD)

1. Откройте:
   ```
   https://supabase.com/dashboard/account/tokens
   ```

2. Нажмите **"Generate New Token"**

3. Параметры:
   - **Name**: `Asia Pharm Deployment`
   - **Permissions**: Оставьте по умолчанию

4. Нажмите **"Generate Token"**

5. **ВАЖНО**: Скопируйте токен (начинается с `sbp_...`)
   
   ⚠️ Токен показывается только один раз!

6. Сохраните токен (понадобится для GitHub Actions)

✅ **Шаг 1 завершен!** База данных создана, ключи получены.

---

## 🔧 ШАГ 2: Развертывание Supabase Edge Functions (5 минут)

Edge Functions - это серверный API для вашего магазина.

### 2.1 Установка Supabase CLI

Откройте терминал и выполните:

**Windows**:
```bash
npm install -g supabase
```

**macOS/Linux**:
```bash
npm install -g supabase
```

**Проверка установки**:
```bash
supabase --version
```

### 2.2 Авторизация в Supabase

```bash
supabase login
```

- Откроется браузер для авторизации
- Подтвердите доступ
- Вернитесь в терминал

### 2.3 Подключение проекта

В папке вашего проекта выполните:

```bash
cd /path/to/asia-pharm
supabase link --project-ref hohhzspiylssmgdivajk
```

**Примечание**: Замените `/path/to/asia-pharm` на реальный путь к папке проекта

Если попросит пароль БД:
- Можете ввести любой пароль (не критично для deployment)
- Или нажмите Enter для пропуска

### 2.4 Развертывание Edge Function

```bash
supabase functions deploy make-server-a75b5353 --no-verify-jwt
```

Флаг `--no-verify-jwt` отключает проверку JWT (нужно для нашей архитектуры)

### 2.5 Проверка работоспособности

Выполните тест:

```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

**Ожидаемый ответ**:
```json
{"status":"OK","message":"Asia-Pharm Store API"}
```

### 2.6 Альтернативный способ (через Dashboard)

Если CLI не работает, можно развернуть через веб-интерфейс:

1. Откройте:
   ```
   https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/functions
   ```

2. Нажмите **"Create a new function"**

3. Параметры:
   - **Name**: `make-server-a75b5353`
   - **Verify JWT**: ❌ **Отключить!**

4. В редакторе создайте два файла:

   **Файл 1: index.ts**
   - Скопируйте содержимое `/supabase/functions/server/index.tsx`
   
   **Файл 2: kv_store.ts**
   - Скопируйте содержимое `/supabase/functions/server/kv_store.tsx`

5. Нажмите **"Deploy"**

6. Проверьте работоспособность (см. п. 2.5)

✅ **Шаг 2 завершен!** API сервер развернут и работает.

---

## ⚡ ШАГ 3: Развертывание на Vercel (5 минут)

### 3.1 Создание проекта Vercel

1. Откройте Vercel:
   ```
   https://vercel.com/new
   ```

2. Если не авторизованы - войдите через GitHub

3. Нажмите **"Import Git Repository"**

4. Если репозиторий не видно:
   - Нажмите **"Adjust GitHub App Permissions"**
   - Выберите репозиторий: `ilyairgsha-boop/asia-pharm`
   - Сохраните

5. Найдите репозиторий `asia-pharm` и нажмите **"Import"**

### 3.2 Настройка проекта

На странице конфигурации:

**Framework Preset**:
```
Vite
```

**Root Directory**:
```
./
```

**Build Command**:
```
npm run build
```

**Output Directory**:
```
dist
```

**Install Command**:
```
npm install
```

### 3.3 Добавление Environment Variables

⚠️ **НЕ НАЖИМАЙТЕ Deploy ещё!**

Нажмите **"Environment Variables"** и добавьте:

#### Переменная 1: VITE_SUPABASE_URL

```
Name: VITE_SUPABASE_URL
Value: https://hohhzspiylssmgdivajk.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Переменная 2: VITE_SUPABASE_ANON_KEY

```
Name: VITE_SUPABASE_ANON_KEY
Value: <ваш anon ключ из Шага 1.4>
Environments: ✅ Production ✅ Preview ✅ Development
```

### 3.4 Первое развертывание

Теперь нажмите **"Deploy"**

- Процесс займет 2-3 минуты
- Следите за логами сборки
- Дождитесь сообщения "Your project has been successfully deployed"

### 3.5 Получение URL сайта

После успешного развертывания:

1. Скопируйте URL вашего сайта (например: `https://asia-pharm.vercel.app`)

2. Откройте сайт и проверьте:
   - ✅ Главная страница загружается
   - ✅ Нет ошибок в консоли браузера (F12 → Console)
   - ✅ Переключение языков работает

### 3.6 Обновление Supabase Redirect URLs

**Важно!** Добавьте URL Vercel в Supabase:

1. Откройте:
   ```
   https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/auth/url-configuration
   ```

2. В поле **"Site URL"** укажите:
   ```
   https://asia-pharm.vercel.app
   ```
   (замените на ваш реальный URL)

3. В поле **"Redirect URLs"** добавьте (каждый с новой строки):
   ```
   http://localhost:5173/**
   https://asia-pharm.vercel.app/**
   https://*.vercel.app/**
   ```

4. Нажмите **"Save"**

### 3.7 Получение токенов Vercel (для CI/CD)

#### 3.7.1 Vercel Token

1. Откройте:
   ```
   https://vercel.com/account/tokens
   ```

2. Нажмите **"Create Token"**

3. Параметры:
   - **Token Name**: `Asia Pharm GitHub Actions`
   - **Scope**: Full Account
   - **Expiration**: No Expiration

4. Нажмите **"Create"**

5. **Скопируйте токен** (показывается один раз!)

#### 3.7.2 Project ID и Org ID

**Способ 1: Через CLI**

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# В папке проекта
cd /path/to/asia-pharm

# Подключите проект
vercel link

# Посмотрите IDs
cat .vercel/project.json
```

В файле найдите:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",      ← VERCEL_ORG_ID
  "projectId": "prj_xxxxxxxxxxxxx"    ← VERCEL_PROJECT_ID
}
```

**Способ 2: Через Dashboard**

1. Откройте ваш проект в Vercel

2. Перейдите в **Settings → General**

3. Найдите:
   - **Project ID** - в разделе "Project ID"
   - **Team ID** (это Org ID) - в разделе "Team"

4. Скопируйте оба значения

✅ **Шаг 3 завершен!** Сайт развернут на Vercel, токены получены.

---

## 🔐 ШАГ 4: Настройка GitHub CI/CD (8 минут)

### 4.1 Создание GitHub Secrets

Откройте настройки секретов:
```
https://github.com/ilyairgsha-boop/asia-pharm/settings/secrets/actions
```

Добавьте **5 секретов** (нажимайте "New repository secret" для каждого):

#### Secret 1: SUPABASE_ANON_KEY

```
Name: SUPABASE_ANON_KEY
Secret: <ваш anon ключ из Шага 1.4>
```

#### Secret 2: SUPABASE_ACCESS_TOKEN

```
Name: SUPABASE_ACCESS_TOKEN
Secret: <ваш access token из Шага 1.5>
```

#### Secret 3: VERCEL_TOKEN

```
Name: VERCEL_TOKEN
Secret: <ваш vercel token из Шага 3.7.1>
```

#### Secret 4: VERCEL_ORG_ID

```
Name: VERCEL_ORG_ID
Secret: <ваш org id из Шага 3.7.2>
```

#### Secret 5: VERCEL_PROJECT_ID

```
Name: VERCEL_PROJECT_ID
Secret: <ваш project id из Шага 3.7.2>
```

### 4.2 Проверка GitHub Actions

1. В вашем репозитории уже есть файл:
   ```
   /.github/workflows/deploy.yml
   ```

2. Убедитесь что GitHub Actions включены:
   - Откройте: https://github.com/ilyairgsha-boop/asia-pharm/actions
   - Если Actions отключены, нажмите **"Enable Actions"**

### 4.3 Тестирование CI/CD

Запустите первое автоматическое развертывание:

```bash
# В папке проекта
git add .
git commit --allow-empty -m "Test CI/CD pipeline"
git push origin main
```

### 4.4 Проверка выполнения

1. Откройте:
   ```
   https://github.com/ilyairgsha-boop/asia-pharm/actions
   ```

2. Вы увидите запущенный workflow: **"Deploy Asia Farm to Vercel & Supabase"**

3. Кликните на него и следите за выполнением

4. Должны выполниться 4 job'а:
   - ✅ **test** - Проверка TypeScript и линтинг
   - ✅ **deploy-frontend** - Развертывание на Vercel
   - ✅ **deploy-supabase** - Развертывание Edge Functions
   - ✅ **notify** - Уведомление о статусе

5. Дождитесь зеленых галочек ✅ на всех jobs

### 4.5 Что дает CI/CD?

Теперь при каждом `git push origin main`:
- ✅ Автоматически проверяется код
- ✅ Автоматически деплоится на Vercel
- ✅ Автоматически обновляются Edge Functions

При создании Pull Request:
- ✅ Запускаются тесты
- ✅ Vercel создает preview deployment

✅ **Шаг 4 завершен!** CI/CD настроен и работает.

---

## 👤 ШАГ 5: Создание первого администратора (2 минуты)

### 5.1 Регистрация на сайте

1. Откройте ваш сайт:
   ```
   https://asia-pharm.vercel.app
   ```
   (замените на ваш URL)

2. Нажмите **"Вход / Регистрация"** в правом верхнем углу

3. Перейдите на вкладку **"Регистрация"**

4. Заполните форму:
   - **Имя**: Ваше имя
   - **Email**: Ваш email
   - **Пароль**: Надежный пароль (минимум 6 символов)

5. Нажмите **"Зарегистрироваться"**

6. Должно появиться сообщение об успешной регистрации

### 5.2 Назначение прав администратора

1. Откройте Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/editor
   ```

2. Создайте новый запрос

3. Вставьте следующий SQL (замените email на ваш):

   ```sql
   UPDATE public.profiles 
   SET is_admin = TRUE 
   WHERE email = 'your-email@example.com';
   ```

4. Нажмите **"Run"**

5. Должно появиться: **"Success. Rows affected: 1"**

### 5.3 Проверка админ-панели

1. Вернитесь на сайт

2. Обновите страницу (F5)

3. В правом верхнем углу должна появиться иконка **⚙️ "Панель администратора"**

4. Кликните на неё

5. Вы должны увидеть административную панель с разделами:
   - 📦 Управление товарами
   - 📋 Управление заказами
   - 👥 Управление пользователями
   - 🎫 Управление промокодами
   - 📊 Аналитика
   - ✉️ Email рассылки
   - 💬 Настройки чата
   - 📄 Редактор страниц

✅ **Шаг 5 завершен!** Вы администратор системы!

---

## 🎉 ПОЗДРАВЛЯЕМ! Развертывание завершено!

Ваш интернет-магазин **Asia Pharm** полностью развернут и работает!

### 📊 Что теперь доступно:

✅ **Фронтенд на Vercel**
- URL: https://asia-pharm.vercel.app
- Автоматические обновления при push
- Preview для Pull Requests

✅ **База данных в Supabase**
- 8 таблиц с данными
- Row Level Security включен
- Автоматические триггеры работают

✅ **API сервер (Edge Functions)**
- Полнофункциональный REST API
- Регистрация и авторизация
- Управление товарами и заказами
- Система лояльности и промокодов

✅ **CI/CD через GitHub Actions**
- Автоматическое тестирование
- Автоматическое развертывание
- Уведомления о статусе

✅ **Административная панель**
- Управление товарами
- Управление заказами
- Управление пользователями
- Аналитика

---

## 🚀 Следующие шаги

### 1. Добавление товаров

1. Откройте админ-панель на сайте
2. Перейдите в **"Управление товарами"**
3. Нажмите **"Добавить товар"**
4. Заполните информацию на всех языках
5. Сохраните

### 2. Создание промокодов

1. В админ-панели откройте **"Управление промокодами"**
2. Нажмите **"Создать промокод"**
3. Настройте:
   - Код (например: `WELCOME10`)
   - Тип скидки (процент или сумма)
   - Значение скидки
   - Срок действия
   - Лимит использований
4. Сохраните

### 3. Настройка чата поддержки

1. В админ-панели откройте **"Настройки чата"**
2. Добавьте ссылки:
   - **Telegram**: `https://t.me/your_username`
   - **WhatsApp**: `https://wa.me/YOUR_PHONE`
3. Сохраните

### 4. Добавление демо-данных (опционально)

Если хотите загрузить тестовые товары:

1. Откройте Supabase SQL Editor
2. Откройте файл `/INIT_DEMO_DATA.sql` в проекте
3. Скопируйте содержимое
4. Выполните в SQL Editor

Это создаст:
- ✅ 20+ тестовых товаров
- ✅ 5 промокодов
- ✅ Настройки сайта

---

## 📚 Справочная информация

### Основные URL

| Сервис | URL |
|--------|-----|
| **Сайт** | https://asia-pharm.vercel.app |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/hohhzspiylssmgdivajk |
| **GitHub Repository** | https://github.com/ilyairgsha-boop/asia-pharm |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **API Endpoint** | https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/ |

### Ключевые файлы проекта

| Файл | Назначение |
|------|------------|
| `/SETUP.md` | Эта инструкция |
| `/README.md` | Общая информация о проекте |
| `/CREATE_ADMIN.sql` | SQL для создания администратора |
| `/DATABASE_SETUP.sql` | Резервная копия миграции БД |
| `/INIT_DEMO_DATA.sql` | Демо-данные для тестирования |
| `/.env.example` | Пример переменных окружения |
| `/supabase/migrations/20250123_initial_schema.sql` | Миграция базы данных |
| `/.github/workflows/deploy.yml` | GitHub Actions workflow |

### Команды для локальной разработки

```bash
# Клонирование репозитория
git clone https://github.com/ilyairgsha-boop/asia-pharm.git
cd asia-pharm

# Установка зависимостей
npm install

# Создание .env.local
cp .env.example .env.local
# Обновите переменные в .env.local

# Запуск dev сервера
npm run dev
# Откроется http://localhost:5173

# Сборка для production
npm run build

# Предпросмотр production сборки
npm run preview
```

---

## 🆘 Решение проблем

### Проблема: База данных не создается

**Возможные причины:**
- Синтаксическая ошибка в SQL
- Недостаточно прав

**Решение:**
1. Проверьте что выполняете SQL от лица владельца проекта
2. Попробуйте выполнять миграцию по частям:
   - Сначала создание таблиц (до раздела "Functions and Triggers")
   - Затем функции и триггеры
   - Затем индексы

### Проблема: Edge Function не работает

**Проверка:**
```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

**Если ошибка:**
1. Откройте Supabase Functions → Logs
2. Проверьте логи на ошибки
3. Убедитесь что `Verify JWT` отключен
4. Попробуйте переразвернуть:
   ```bash
   supabase functions deploy make-server-a75b5353 --no-verify-jwt
   ```

### Проблема: Vercel build fails

**Решение:**
1. Откройте Vercel → Deployments → последний deployment
2. Посмотрите Build Logs
3. Проверьте что переменные окружения добавлены правильно
4. Убедитесь что в названиях переменных нет опечаток
5. Попробуйте Redeploy

### Проблема: GitHub Actions падает

**Решение:**
1. Откройте Actions → Failed workflow
2. Посмотрите какой job упал
3. Проверьте логи этого job
4. Убедитесь что все 5 secrets добавлены в GitHub
5. Проверьте что значения secrets правильные

### Проблема: Не могу войти как админ

**Решение:**
1. Откройте Supabase SQL Editor
2. Выполните:
   ```sql
   SELECT * FROM public.profiles WHERE email = 'your-email@example.com';
   ```
3. Проверьте что `is_admin` = `true`
4. Если `false`, выполните:
   ```sql
   UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your-email@example.com';
   ```
5. Обновите страницу на сайте

### Проблема: CORS ошибки

**Решение:**
1. Убедитесь что URL Vercel добавлен в Supabase Redirect URLs
2. Откройте: https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/auth/url-configuration
3. Добавьте ваш URL с `/**` в конце
4. Сохраните

---

## 📞 Поддержка

### Документация проекта
- **README.md** - Общая информация
- **CREATE_ADMIN.sql** - Создание администратора
- **INIT_DEMO_DATA.sql** - Демо-данные

### Логи и мониторинг
- **Supabase Logs**: https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/logs
- **Vercel Logs**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/ilyairgsha-boop/asia-pharm/actions

### Создание Issue
Если проблема не решена:
```
https://github.com/ilyairgsha-boop/asia-pharm/issues/new
```

---

## ✅ Чек-лист успешного развертывания

Отметьте что выполнено:

### Supabase
- [ ] База данных создана (8 таблиц)
- [ ] Edge Function развернута
- [ ] API работает (curl тест прошел)
- [ ] Все ключи сохранены

### Vercel
- [ ] Проект создан
- [ ] Environment Variables добавлены
- [ ] Первое развертывание успешно
- [ ] Сайт открывается без ошибок
- [ ] Redirect URLs обновлены в Supabase

### GitHub
- [ ] Репозиторий доступен
- [ ] Все 5 secrets добавлены
- [ ] GitHub Actions включены
- [ ] Первый workflow выполнен успешно

### Администратор
- [ ] Зарегистрирован на сайте
- [ ] Права администратора назначены
- [ ] Админ-панель доступна
- [ ] Все разделы админ-панели работают

---

## 🎓 Дополнительные ресурсы

### Официальная документация
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### Видео-туториалы
- **Supabase**: https://www.youtube.com/c/Supabase
- **Vercel**: https://www.youtube.com/c/VercelHQ
- **React**: https://react.dev/learn

---

**Дата создания инструкции**: 2025-01-23  
**Версия**: 1.0  
**Проект**: Asia Pharm  
**Автор**: AI Assistant

**Удачи с вашим интернет-магазином! 🎉**
