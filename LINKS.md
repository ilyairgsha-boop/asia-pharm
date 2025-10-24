# 🔗 Asia-Pharm - Все важные ссылки

Централизованный список всех ссылок проекта.

---

## 🌐 Production URLs (после деплоя)

```
Веб-сайт:        (будет после деплоя на Vercel)
Админ-панель:    (ваш-сайт)/admin
API Health:      https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
API Products:    https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/products
```

---

## 📁 GitHub

```
Репозиторий:     https://github.com/ilyairgsha-boop/asia-pharm
Issues:          https://github.com/ilyairgsha-boop/asia-pharm/issues
Releases:        https://github.com/ilyairgsha-boop/asia-pharm/releases
```

---

## 🗄️ Supabase

```
Dashboard:       https://app.supabase.com/project/hohhzspiylssmgdivajk
Project URL:     https://hohhzspiylssmgdivajk.supabase.co

--- Разделы Dashboard ---
Database:        https://app.supabase.com/project/hohhzspiylssmgdivajk/database/tables
Table Editor:    https://app.supabase.com/project/hohhzspiylssmgdivajk/editor
SQL Editor:      https://app.supabase.com/project/hohhzspiylssmgdivajk/sql
Auth:            https://app.supabase.com/project/hohhzspiylssmgdivajk/auth/users
Edge Functions:  https://app.supabase.com/project/hohhzspiylssmgdivajk/functions
Logs:            https://app.supabase.com/project/hohhzspiylssmgdivajk/logs
Settings:        https://app.supabase.com/project/hohhzspiylssmgdivajk/settings/api
```

### Supabase Credentials

```
Project ID:      hohhzspiylssmgdivajk
URL:             https://hohhzspiylssmgdivajk.supabase.co
Anon Key:        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (см. /utils/supabase/info.tsx)
Service Role:    ⚠️ Только в Dashboard > Settings > API
```

---

## 🌐 Vercel

```
Dashboard:       https://vercel.com/dashboard
Deploy:          (будет после подключения GitHub)
Settings:        (ваш-проект)/settings
Environment:     (ваш-проект)/settings/environment-variables
Deployments:     (ваш-проект)/deployments
```

---

## 📚 Документация проекта

```
START_HERE.md    - 🎯 Начальная точка
DEPLOY.md        - 📖 Полная инструкция
CHECKLIST.md     - ✅ Чеклист
CHEATSHEET.md    - ⚡ Шпаргалка
SUMMARY.md       - 📊 Резюме
ROADMAP.md       - 🗺️ Дорожная карта
LINKS.md         - 🔗 Этот файл
README.md        - 📝 О проекте
Attributions.md  - 📜 Авторство
```

---

## 🛠️ Инструменты

```
Node.js:         https://nodejs.org/
Git:             https://git-scm.com/
Supabase CLI:    https://supabase.com/docs/guides/cli

--- Установка Supabase CLI ---
macOS:           brew install supabase/tap/supabase
Windows:         scoop install supabase
```

---

## 📖 Внешняя документация

### Основные технологии
```
React:           https://react.dev/
TypeScript:      https://www.typescriptlang.org/docs/
Vite:            https://vitejs.dev/
Supabase:        https://supabase.com/docs
Vercel:          https://vercel.com/docs
```

### UI & Styling
```
Tailwind CSS:    https://tailwindcss.com/docs
ShadCN UI:       https://ui.shadcn.com/
Lucide Icons:    https://lucide.dev/
Recharts:        https://recharts.org/
Motion:          https://motion.dev/
```

### Backend
```
Deno:            https://deno.land/
Hono:            https://hono.dev/
PostgreSQL:      https://www.postgresql.org/docs/
```

---

## 🎓 Обучающие материалы

### Supabase
```
Getting Started: https://supabase.com/docs/guides/getting-started
Auth Guide:      https://supabase.com/docs/guides/auth
Database:        https://supabase.com/docs/guides/database
Edge Functions:  https://supabase.com/docs/guides/functions
RLS Policies:    https://supabase.com/docs/guides/auth/row-level-security
```

### React & TypeScript
```
React Tutorial:  https://react.dev/learn
TS Handbook:     https://www.typescriptlang.org/docs/handbook/
```

### Tailwind CSS
```
Utility-First:   https://tailwindcss.com/docs/utility-first
Responsive:      https://tailwindcss.com/docs/responsive-design
Dark Mode:       https://tailwindcss.com/docs/dark-mode
```

---

## 🔧 API Endpoints

### Public (без авторизации)
```
GET /                        Health check
GET /products                Список товаров
```

### Authenticated (требуется токен)
```
POST /signup                 Регистрация
POST /orders                 Создать заказ
GET  /orders                 Мои заказы
GET  /loyalty/info           Инфо о программе лояльности
GET  /promo-codes/validate   Проверить промокод
```

### Admin (требуется админ)
```
GET    /admin/users          Список пользователей
PUT    /admin/users/:id/wholesaler  Изменить статус оптовика
POST   /products             Создать товар
PUT    /products/:id         Обновить товар
DELETE /products/:id         Удалить товар
GET    /admin/orders         Все заказы
PUT    /admin/orders/:id/status     Обновить статус
PUT    /admin/orders/:id/tracking   Добавить трек-номер
GET    /promo-codes          Все промокоды
POST   /promo-codes          Создать промокод
PUT    /promo-codes/:code    Обновить промокод
DELETE /promo-codes/:code    Удалить промокод
POST   /translate            Перевод текста
```

### База URL
```
https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353
```

---

## 🐛 Отладка и логи

### Supabase Logs
```
Edge Functions:  https://app.supabase.com/project/hohhzspiylssmgdivajk/logs/edge-functions
Database:        https://app.supabase.com/project/hohhzspiylssmgdivajk/logs/postgres-logs
Auth:            https://app.supabase.com/project/hohhzspiylssmgdivajk/logs/auth-logs

--- CLI ---
supabase functions logs server --project-ref hohhzspiylssmgdivajk
```

### Vercel Logs
```
Dashboard:       https://vercel.com/(ваш-проект)/deployments
Real-time:       vercel logs (в терминале)
```

### Browser DevTools
```
Chrome:          F12 или Cmd+Option+I (Mac)
Console:         Tab "Console"
Network:         Tab "Network"
Application:     Tab "Application" → Local Storage
```

---

## 🆘 Получить помощь

### Официальная поддержка
```
Supabase:        https://supabase.com/support
                 https://github.com/supabase/supabase/discussions
                 
Vercel:          https://vercel.com/help
                 https://github.com/vercel/vercel/discussions

React:           https://github.com/facebook/react/issues
Tailwind:        https://github.com/tailwindlabs/tailwindcss/discussions
```

### Сообщество
```
Supabase Discord: https://discord.supabase.com
Stack Overflow:   https://stackoverflow.com/questions/tagged/supabase
Reddit:           https://reddit.com/r/supabase
```

### Проект Asia-Pharm
```
Issues:          https://github.com/ilyairgsha-boop/asia-pharm/issues
Discussions:     https://github.com/ilyairgsha-boop/asia-pharm/discussions (если включено)
```

---

## 📊 Мониторинг и аналитика

### Supabase
```
Usage:           https://app.supabase.com/project/hohhzspiylssmgdivajk/settings/billing
Database:        https://app.supabase.com/project/hohhzspiylssmgdivajk/reports/database
API:             https://app.supabase.com/project/hohhzspiylssmgdivajk/reports/api
```

### Vercel
```
Analytics:       https://vercel.com/(ваш-проект)/analytics
Speed Insights:  https://vercel.com/(ваш-проект)/speed-insights
```

---

## 🔐 Безопасность

### Supabase
```
API Keys:        https://app.supabase.com/project/hohhzspiylssmgdivajk/settings/api
Auth Providers:  https://app.supabase.com/project/hohhzspiylssmgdivajk/auth/providers
RLS Policies:    https://app.supabase.com/project/hohhzspiylssmgdivajk/auth/policies
```

### Best Practices
```
OWASP:           https://owasp.org/www-project-top-ten/
Supabase RLS:    https://supabase.com/docs/guides/auth/row-level-security
```

---

## 📱 Тестирование

### Инструменты
```
Postman:         https://www.postman.com/
Insomnia:        https://insomnia.rest/
cURL:            (встроен в терминал)
```

### Онлайн сервисы
```
JSONLint:        https://jsonlint.com/
Regex101:        https://regex101.com/
```

---

## 🎨 Дизайн ресурсы

### Шрифты
```
Google Fonts:    https://fonts.google.com/
Ma Shan Zheng:   https://fonts.google.com/specimen/Ma+Shan+Zheng
Zhi Mang Xing:   https://fonts.google.com/specimen/Zhi+Mang+Xing
Marck Script:    https://fonts.google.com/specimen/Marck+Script
```

### Иконки
```
Lucide:          https://lucide.dev/icons/
Heroicons:       https://heroicons.com/
```

### Цвета
```
Tailwind Colors: https://tailwindcss.com/docs/customizing-colors
Coolors:         https://coolors.co/
```

---

## 📦 Зависимости проекта

```
package.json:    См. в корне проекта
npm:             https://www.npmjs.com/
```

### Основные пакеты
```
React:           https://www.npmjs.com/package/react
TypeScript:      https://www.npmjs.com/package/typescript
Vite:            https://www.npmjs.com/package/vite
Tailwind:        https://www.npmjs.com/package/tailwindcss
Supabase:        https://www.npmjs.com/package/@supabase/supabase-js
```

---

## 🔄 CI/CD

### GitHub Actions
```
Workflows:       https://github.com/ilyairgsha-boop/asia-pharm/actions
Marketplace:     https://github.com/marketplace?type=actions
```

### Vercel Integration
```
GitHub App:      https://vercel.com/docs/concepts/git/vercel-for-github
```

---

## 📞 Контакты

```
Проект:          Asia-Pharm E-commerce
Репозиторий:     https://github.com/ilyairgsha-boop/asia-pharm
Владелец:        ilyairgsha-boop
```

---

**Последнее обновление:** 2025-01-24  
**Версия:** 1.0.0

**💡 Совет:** Добавьте эту страницу в закладки для быстрого доступа к ссылкам!
