# 🌿 Asia Pharm - Интернет-магазин традиционной китайской медицины

Полнофункциональный интернет-магазин на React + TypeScript + Vite + Supabase с многоязычным интерфейсом (RU, EN, CN, VI) и красно-белой темой дизайна.

## 🚀 Начать развертывание

**👉 Откройте [SETUP.md](./SETUP.md) для полной пошаговой инструкции (25 минут)**

---

## 📋 Информация о проекте

- **GitHub**: https://github.com/ilyairgsha-boop/asia-pharm
- **Supabase URL**: https://hohhzspiylssmgdivajk.supabase.co
- **Supabase Project ID**: `hohhzspiylssmgdivajk`
- **Production URL**: https://asia-pharm.vercel.app (после развертывания)

---

## ⚡ Быстрый старт (локальная разработка)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/ilyairgsha-boop/asia-pharm.git
cd asia-pharm

# 2. Установить зависимости
npm install

# 3. Создать .env.local
cp .env.example .env.local
# Обновите переменные в .env.local:
# VITE_SUPABASE_URL=https://hohhzspiylssmgdivajk.supabase.co
# VITE_SUPABASE_ANON_KEY=ваш-anon-ключ

# 4. Запустить dev сервер
npm run dev
```

Откроется http://localhost:5173

---

## 🌟 Основной функционал

### 🌍 Многоязычность
- 🇷🇺 Русский
- 🇨🇳 Китайский
- 🇬🇧 Английский
- 🇻🇳 Вьетнамский

### 🏪 Три магазина
- 🇨🇳 **Китай** - с категорией "Пробники" и оптовыми ценами в юанях
- 🇹🇭 **Таиланд**
- 🇻🇳 **Вьетнам**

### 💡 Ключевые возможности

- 📦 **Отдельные корзины** для каждого магазина
- 🎯 **Программа лояльности**
  - 5% кэшбэк (базовый уровень)
  - 10% кэшбэк (премиум от 10,000₽/месяц)
  - Автоматическое начисление при доставке
  - Использование баллов при оплате
- 🎫 **Система промокодов**
  - Процентные скидки
  - Фиксированные скидки в рублях
  - Лимиты использования и срок действия
- 💼 **Оптовые цены** (для wholesalers)
  - Специальные цены в юанях
  - Назначение через админ-панель
- 🔢 **Умная нумерация заказов**
  - Формат: DDMMNN (день + месяц + порядковый номер)
  - Автоматическая генерация
- 📧 **Email уведомления**
  - Подтверждение заказа
  - Обновление статуса
  - Трек-номер отправления
- 💬 **Онлайн чат поддержки**
  - Telegram
  - WhatsApp
  - Настройка через админ-панель
- 📊 **Административная панель**
  - Управление товарами (CRUD)
  - Управление заказами
  - Управление пользователями
  - Управление промокодами
  - Аналитика и статистика
  - Email рассылки
  - Редактор страниц (Privacy Policy, Terms)

### 🔒 Безопасность

- ✅ Row Level Security (RLS) для всех таблиц
- ✅ Защита административных эндпоинтов
- ✅ Безопасное хранение паролей (Supabase Auth)
- ✅ HTTPS для всех запросов
- ✅ Разделение публичных и приватных ключей

---

## 🛠️ Технологии

### Frontend
- **React 18** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Сборщик и dev сервер
- **Tailwind CSS v4** - Стилизация
- **ShadCN UI** - Компоненты
- **Lucide React** - Иконки
- **Recharts** - Графики
- **Motion** (Framer Motion) - Анимации

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL база данных
  - Edge Functions (Deno/Hono)
  - Authentication
  - Row Level Security
- **Hono** - Web framework для Edge Functions

### Hosting & CI/CD
- **Vercel** - Хостинг фронтенда
- **GitHub Actions** - CI/CD pipeline
  - Автоматическое тестирование
  - Автоматическое развертывание
  - Preview deployments для PR

---

## 📂 Структура проекта

```
asia-pharm/
├── components/              # React компоненты
│   ├── admin/              # Административная панель
│   ├── ui/                 # UI компоненты (ShadCN)
│   └── figma/              # Вспомогательные компоненты
├── contexts/               # React Context (Auth, Cart, Language)
├── utils/                  # Утилиты
│   ├── supabase/          # Supabase клиент
│   └── i18n.ts            # Переводы (4 языка)
├── supabase/
│   ├── functions/         # Edge Functions (API)
│   └── migrations/        # Миграции БД
├── styles/                # Глобальные стили
├── .github/workflows/     # GitHub Actions
├── SETUP.md              # 👈 Полная инструкция по развертыванию
├── CREATE_ADMIN.sql       # SQL для создания админа
├── INIT_DEMO_DATA.sql     # Демо-данные
└── package.json
```

---

## 📚 Документация

| Файл | Описание |
|------|----------|
| **[SETUP.md](./SETUP.md)** | 🔥 **Полная пошаговая инструкция** (начните здесь!) |
| [README.md](./README.md) | Общая информация о проекте (вы здесь) |
| [CREATE_ADMIN.sql](./CREATE_ADMIN.sql) | SQL для создания администратора |
| [INIT_DEMO_DATA.sql](./INIT_DEMO_DATA.sql) | Демо-данные для тестирования |
| [.env.example](./.env.example) | Пример переменных окружения |

---

## 🔧 Доступные команды

```bash
# Разработка
npm run dev              # Запуск dev сервера (localhost:5173)

# Сборка
npm run build            # Production сборка
npm run preview          # Предпросмотр production сборки

# Проверка кода
npm run lint             # ESLint проверка
npx tsc --noEmit        # TypeScript проверка типов
```

---

## 🎨 Дизайн

- **Цветовая схема**: Красно-белая тема (китайский стиль)
- **Шрифты**:
  - Ma Shan Zheng (китайский стиль)
  - Zhi Mang Xing (декоративный)
  - Marck Script (элегантный курсив)
- **UI Framework**: Tailwind CSS v4.0
- **Компоненты**: ShadCN UI
- **Адаптивность**: Полностью responsive дизайн

---

## 🚀 Развертывание

### Требования
- Node.js 18+
- npm 9+
- Аккаунт Supabase
- Аккаунт Vercel
- Аккаунт GitHub

### Пошаговая инструкция

**👉 Откройте [SETUP.md](./SETUP.md) и следуйте инструкциям**

**Время развертывания**: 25-30 минут

Шаги:
1. ⚙️ Настройка Supabase базы данных (5 мин)
2. 🔧 Развертывание Edge Functions (5 мин)
3. ⚡ Развертывание на Vercel (5 мин)
4. 🔐 Настройка GitHub CI/CD (8 мин)
5. 👤 Создание администратора (2 мин)

---

## 🌐 После развертывания

Ваш магазин будет доступен на:
- **Production**: https://asia-pharm.vercel.app
- **API**: https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
- **Admin Panel**: https://asia-pharm.vercel.app (после входа как админ)

---

## 📊 Особенности бизнес-логики

### Программа лояльности

**Уровни**:
- **Basic**: 0-9,999₽ в месяц → 5% кэшбэк
- **Premium**: 10,000₽+ в месяц → 10% кэшбэк

**Правила**:
- Кэшбэк начисляется только на стоимость товаров (без доставки)
- Начисление происходит при статусе заказа "delivered"
- Баллы можно использовать при следующем заказе
- Месячный счетчик сбрасывается 1 числа каждого месяца

### Номера заказов

**Формат**: DDMMNN
- DD - день (01-31)
- MM - месяц (01-12)
- NN - порядковый номер за день (01-99)

**Примеры**:
- 230101 - первый заказ 23 января
- 230102 - второй заказ 23 января
- 010201 - первый заказ 1 февраля

### Оптовые цены

- Доступны только для пользователей с флагом `is_wholesaler`
- Цены указаны в юанях (¥)
- Назначение оптовиков через админ-панель
- При входе оптовик видит оптовые цены вместо розничных

### Пробники (только магазин Китай)

- Специальная категория товаров
- Особые правила доставки (если настроены)
- Отображаются отдельно в каталоге

---

## 🔗 Полезные ссылки

### Проект
- **GitHub**: https://github.com/ilyairgsha-boop/asia-pharm
- **Supabase Dashboard**: https://supabase.com/dashboard/project/hohhzspiylssmgdivajk
- **Vercel Dashboard**: https://vercel.com/dashboard

### Документация технологий
- **React**: https://react.dev
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **ShadCN UI**: https://ui.shadcn.com

---

## 🆘 Помощь и поддержка

### Проблемы при развертывании?
См. раздел **"Решение проблем"** в [SETUP.md](./SETUP.md#-решение-проблем)

### Логи и мониторинг
- **Supabase**: https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/logs
- **Vercel**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/ilyairgsha-boop/asia-pharm/actions

### Создать Issue
https://github.com/ilyairgsha-boop/asia-pharm/issues/new

---

## 📄 Лицензия

Проект создан для Asia Pharm - интернет-магазина традиционной китайской медицины.

---

## 🎉 Начать развертывание

**Готовы начать? Откройте [SETUP.md](./SETUP.md) и следуйте инструкциям!**

**Время**: 25-30 минут  
**Сложность**: Средняя (подробные инструкции с скриншотами)  
**Результат**: Полностью работающий интернет-магазин
