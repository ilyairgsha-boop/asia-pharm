# 🏥 Asia Pharm - Интернет-магазин традиционной китайской медицины

Многоязычный интернет-магазин препаратов традиционной китайской медицины с 3 отдельными магазинами (Китай, Таиланд, Вьетнам), программой лояльности и полной административной панелью.

## 🌟 Особенности

### 🌐 Многоязычность
- 🇷🇺 Русский
- 🇨🇳 Китайский
- 🇬🇧 Английский
- 🇻🇳 Вьетнамский

### 🏪 Три независимых магазина
- 🇨🇳 **Китай** - с категорией "Пробники"
- 🇹🇭 **Таиланд**
- 🇻🇳 **Вьетнам**

Каждый магазин имеет:
- Отдельную корзину
- Собственный каталог товаров
- Независимую систему заказов

### 📂 Двойная система категорий

**Верхнее меню (Типы товаров):**
1. Мази
2. Пластыри
3. Спреи
4. Чай
5. Эликсиры
6. Пилюли
7. Косметика
8. Аксессуары
9. Пробники (только для Китая)

**Боковое меню (Категории заболеваний):**
1. Популярные товары
2. Все товары
3. Простуда
4. ЖКТ
5. Кожа
6. Суставы
7. Сердце и сосуды
8. Печень и почки
9. Нервная система
10. Женское здоровье
11. Мужское здоровье
12. Для детей
13. Зрение
14. Геморрой
15. Онкология
16. Щитовидная железа
17. Легкие

### 💎 Программа лояльности
- Начисление баллов за покупки
- Использование баллов для скидок
- История транзакций
- Бонусные баллы от администратора

### 🎫 Система промокодов
- Процентные скидки
- Фиксированные скидки
- Ограничение количества использований
- Срок действия

### 💬 Онлайн чат поддержки
- Реальное время общение
- История сообщений
- Админ-панель для операторов

### 📧 Email рассылка (Resend)
- Приветственные письма
- Подтверждение заказа
- Массовые рассылки
- HTML шаблоны

### 🎨 Дизайн
- Красно-белая тема
- Адаптивный дизайн
- Современный UI с Tailwind CSS
- Shadcn/ui компоненты

---

## 🚀 Быстрый старт (Figma Make)

### 📋 Предварительные требования

```bash
# Node.js 18+
node --version

# npm или yarn
npm --version
```

### 🔧 Установка

```bash
# 1. Установите зависимости
npm install

# 2. Запустите dev сервер
npm run dev

# 3. Откройте в браузере
http://localhost:5173
```

### ⚙️ Настройка

**В Figma Make все уже настроено автоматически!**

Переменные окружения предоставлены:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `RESEND_API_KEY`

**Не создавайте `.env` файл** - все работает через автоматически предоставленные переменные.

---

## 📚 Документация

### Для пользователей Figma Make

👉 **[FIGMA_MAKE_SETUP.md](./FIGMA_MAKE_SETUP.md)** - Полная инструкция для Figma Make

Включает:
- Работа с KV Store
- Структура данных
- Edge Functions
- Аутентификация
- Email настройка

### Для стандартного деплоя

👉 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Деплой на Vercel + Supabase

---

## 🏗️ Технологический стек

### Frontend
- **React 18** - UI фреймворк
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **Tailwind CSS** - Стилизация
- **Shadcn/ui** - UI компоненты
- **Lucide React** - Иконки
- **Recharts** - Графики и аналитика

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL база данных
  - Authentication
  - Edge Functions (Deno)
  - Storage
- **Hono** - Web фреймворк для Edge Functions
- **Resend** - Email сервис

### Хранение данных
- **KV Store** - Гибкое key-value хранилище для товаров, категорий, настроек
- **PostgreSQL** - Для пользователей и заказов (опционально)

---

## 📁 Структура проекта

```
asia-pharm/
├── App.tsx                      # Главный компонент
├── components/                  # React компоненты
│   ├── admin/                   # Админ-панель
│   │   ├── AdminPanelNew.tsx
│   │   ├── ProductManagement.tsx
│   │   ├── OrderManagement.tsx
│   │   ├── CategoryManagement.tsx
│   │   ├── PromoCodeManagement.tsx
│   │   ├── UserManagement.tsx
│   │   ├── EmailBroadcast.tsx
│   │   ├── Analytics.tsx
│   │   └── ...
│   ├── ui/                      # Shadcn/ui компоненты
│   ├── Auth.tsx                 # Аутентификация
│   ├── Header.tsx               # Шапка сайта
│   ├── CategoryMenu.tsx         # Меню категорий
│   ├── ProductList.tsx          # Список товаров
│   ├── CartMultiStore.tsx       # Корзина для 3 магазинов
│   ├── CheckoutNew.tsx          # Оформление заказа
│   ├── ProfileNew.tsx           # Профиль пользователя
│   ├── LoyaltyProgram.tsx       # Программа лояльности
│   └── LiveChat.tsx             # Онлайн чат
├── contexts/                    # React контексты
│   ├── AuthContext.tsx          # Контекст аутентификации
│   ├── CartContext.tsx          # Контекст корзины
│   └── LanguageContext.tsx      # Контекст языка
├── utils/                       # Утилиты
│   ├── supabase/
│   │   ├── client.ts            # Supabase клиент
│   │   └── info.tsx             # Project ID и Keys (автогенерированный)
│   ├── categories.ts            # Определение категорий
│   ├── i18n.ts                  # Переводы
│   └── mockData.ts              # Демо-данные
├── supabase/
│   └── functions/
│       └── make-server-a75b5353/  # Edge Function
│           ├── index.ts           # Основной сервер
│           ├── kv_store.tsx       # KV Store утилиты
│           └── email-templates.tsx # Email шаблоны
├── styles/
│   └── globals.css              # Глобальные стили
└── package.json
```

---

## 🔑 Ключевые компоненты

### CartContext
Управляет 3 независимыми корзинами для каждого магазина.

```typescript
const { carts, addToCart, removeFromCart, clearCart } = useCart();
// carts = { china: [...], thailand: [...], vietnam: [...] }
```

### LanguageContext
Переключение между 4 языками.

```typescript
const { language, setLanguage, t } = useLanguage();
// t('key') - переводит ключ на текущий язык
```

### AuthContext
Управление аутентификацией пользователя.

```typescript
const { user, accessToken, isAdmin, signIn, signOut } = useAuth();
```

---

## 🎯 Основные функции

### Для покупателей
- Просмотр товаров по категориям
- Фильтрация по стране, типу, заболеванию
- Добавление в корзину
- Оформление заказа
- Применение промокодов
- Программа лояльности
- История заказов
- Онлайн чат с поддержкой

### Для администраторов
- **Управление товарами**: добавление, редактирование, удаление
- **Управление категориями**: создание и настройка
- **Управление заказами**: просмотр, изменение статуса
- **Управление пользователями**: просмотр, баллы лояльности
- **Промокоды**: создание и управление
- **Email рассылки**: массовые уведомления
- **Аналитика**: продажи, популярные товары, статистика
- **Настройки**: оплата, доставка, SEO
- **Чат**: ответы клиентам

---

## 🔐 Аутентификация

### Регистрация
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});
```

### Вход
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

### Создание админа
После регистрации установите `is_admin: true` в профиле пользователя через Supabase Dashboard или Edge Function.

---

## 🗄️ Работа с данными

### KV Store (Рекомендуется для Figma Make)

```typescript
import * as kv from './kv_store.tsx';

// Сохранить товары
await kv.set('products', productsArray);

// Получить товары
const products = await kv.get('products') || [];

// Сохранить категории
await kv.set('categories', categoriesArray);

// Множественные операции
await kv.mset({
  products: [],
  categories: [],
  settings: {},
});
```

### API эндпоинты (Edge Function)

```bash
# Получить все товары
GET /make-server-a75b5353/products

# Добавить товар (админ)
POST /make-server-a75b5353/admin/products

# Обновить товар (админ)
PUT /make-server-a75b5353/admin/products/:id

# Удалить товар (админ)
DELETE /make-server-a75b5353/admin/products/:id

# Создать заказ
POST /make-server-a75b5353/orders

# Отправить email
POST /make-server-a75b5353/email/send
```

---

## 📧 Email настройка

### Шаблоны

1. **Приветственное письмо** - при регистрации
2. **Подтверждение заказа** - после оформления
3. **Изменение статуса заказа** - при обновлении
4. **Массовые рассылки** - акции и новости

### Отправка

```typescript
import { Resend } from 'npm:resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'Asia Pharm <noreply@yourdomain.com>',
  to: ['user@example.com'],
  subject: 'Ваш заказ #12345',
  html: orderEmailHTML,
});
```

---

## 🎨 Кастомизация

### Цветовая схема

Отредактируйте `styles/globals.css`:

```css
:root {
  --primary: #DC2626; /* Красный */
  --secondary: #FFFFFF; /* Белый */
  /* ... другие переменные */
}
```

### Переводы

Отредактируйте `utils/i18n.ts`:

```typescript
export const translations = {
  header: {
    ru: 'Главная',
    en: 'Home',
    zh: '主页',
    vi: 'Trang chủ',
  },
  // ...
};
```

### Категории

Отредактируйте `utils/categories.ts`:

```typescript
export const topCategories = [
  { id: 'ointments', ... },
  { id: 'patches', ... },
  // ...
];
```

---

## 🐛 Отладка

### Проверка подключения

```bash
# Откройте консоль браузера
const response = await fetch('https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/');
console.log(await response.json());
# Ожидается: { status: 'ok', message: 'Asia Pharm Server is running' }
```

### Логи Edge Function

1. Откройте Supabase Dashboard
2. Перейдите в **Edge Functions** → **make-server-a75b5353**
3. Откройте вкладку **Logs**
4. Смотрите `console.log()` из функции

### Распространенные ошибки

| Ошибка | Решение |
|--------|---------|
| CORS error | Проверьте CORS middleware в Edge Function |
| 401 Unauthorized | Проверьте access token в запросе |
| KV Store не работает | Убедитесь что используете правильный путь к kv_store.tsx |
| Email не отправляются | Проверьте RESEND_API_KEY в Supabase secrets |

---

## 📊 Производительность

- ⚡ Vite для быстрой сборки
- 🚀 Edge Functions для низкой задержки
- 🗄️ KV Store для быстрого доступа к данным
- 📦 Code splitting для оптимизации загрузки

---

## 🔒 Безопасность

- 🔐 Row Level Security (RLS) в Supabase
- 🛡️ JWT токены для аутентификации
- 🔑 Секретные ключи в environment variables
- ✅ Валидация данных на сервере

---

## 🤝 Вклад

Проект разработан для Figma Make.

---

## 📄 Лицензия

Проект создан для коммерческого использования.

---

## 📞 Поддержка

Для вопросов и помощи:
- 📖 Читайте [FIGMA_MAKE_SETUP.md](./FIGMA_MAKE_SETUP.md)
- 📖 Читайте [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🐛 Используйте логи в Supabase Dashboard

---

## ✅ Чеклист готовности

- [x] Проект настроен в Figma Make
- [x] Supabase подключен
- [x] Edge Function развернута
- [x] Email сервис настроен
- [ ] Инициализированы категории
- [ ] Добавлены товары
- [ ] Создан первый админ
- [ ] Протестированы основные функции

---

**Готово к запуску!** 🎉

Откройте [FIGMA_MAKE_SETUP.md](./FIGMA_MAKE_SETUP.md) для следующих шагов.
