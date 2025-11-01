# 🎨 Настройка Asia Pharm в Figma Make

## ⚠️ ВАЖНО: Особенности Figma Make

В среде Figma Make НЕ ИСПОЛЬЗУЙТЕ:
- ❌ `supabase link`
- ❌ `supabase db push`
- ❌ `supabase migration up`
- ❌ Локальный Supabase CLI для работы с БД

**Почему?** В Figma Make база данных уже настроена автоматически!

---

## ✅ Что уже работает

Ваш проект автоматически настроен:
- ✅ **Supabase Project ID**: `boybkoyidxwrgsayifrd`
- ✅ **Anon Key**: Уже предоставлен в `/utils/supabase/info.tsx`
- ✅ **KV Store**: Готов к использованию
- ✅ **Edge Function**: Настроена в `/supabase/functions/make-server-a75b5353/`

---

## 📦 Структура хранения данных

### KV Store (Рекомендуется)

**Файл**: `/supabase/functions/make-server-a75b5353/kv_store.tsx`

```typescript
import * as kv from './kv_store.tsx';

// Сохранить товары
await kv.set('products', [
  { id: '1', name: 'Товар 1', price: 100 },
  { id: '2', name: 'Товар 2', price: 200 },
]);

// Получить товары
const products = await kv.get('products') || [];

// Сохранить категории
await kv.set('categories', categoriesArray);

// Множественные операции
await kv.mset({
  products: productsArray,
  categories: categoriesArray,
  settings: settingsObject,
});

const data = await kv.mget(['products', 'categories']);
```

### Использование в Edge Function

```typescript
// /supabase/functions/make-server-a75b5353/index.ts

import * as kv from './kv_store.tsx';

// Получить все товары
app.get('/make-server-a75b5353/products', async (c) => {
  const products = await kv.get('products') || [];
  return c.json(products);
});

// Добавить товар (админ)
app.post('/make-server-a75b5353/admin/products', async (c) => {
  // Проверка прав админа
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  
  const newProduct = await c.req.json();
  const products = await kv.get('products') || [];
  products.push(newProduct);
  await kv.set('products', products);
  
  return c.json({ success: true, product: newProduct });
});

// Обновить товар
app.put('/make-server-a75b5353/admin/products/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  
  const products = await kv.get('products') || [];
  const index = products.findIndex(p => p.id === id);
  
  if (index === -1) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  products[index] = { ...products[index], ...updates };
  await kv.set('products', products);
  
  return c.json({ success: true, product: products[index] });
});

// Удалить товар
app.delete('/make-server-a75b5353/admin/products/:id', async (c) => {
  const id = c.req.param('id');
  
  const products = await kv.get('products') || [];
  const filtered = products.filter(p => p.id !== id);
  await kv.set('products', filtered);
  
  return c.json({ success: true });
});
```

---

## 🚀 Запуск проекта

### Локально (для разработки)

```bash
# 1. Установите зависимости
npm install

# 2. Запустите dev сервер
npm run dev

# 3. Откройте в браузере
# http://localhost:5173
```

**Важно**: Локально работает только frontend. Edge Function работает только в production (Figma Make).

### В Figma Make

1. Откройте ваш проект в Figma Make
2. Все переменные окружения уже настроены
3. Edge Function уже развернута
4. KV Store готов к использованию

---

## 📊 Структура данных в KV Store

### Товары (products)

```typescript
interface Product {
  id: string;
  name_ru: string;
  name_en?: string;
  name_zh?: string;
  name_vi?: string;
  description_ru: string;
  description_en?: string;
  description_zh?: string;
  description_vi?: string;
  price: number;
  old_price?: number;
  image_url?: string;
  country: 'china' | 'thailand' | 'vietnam';
  category_ids: string[]; // ['ointments', 'patches']
  disease_category_ids: string[]; // ['joints', 'skin']
  in_stock: boolean;
  is_sample: boolean;
  sku?: string;
  created_at: string;
}

// Сохранить
await kv.set('products', products);
```

### Категории (categories)

```typescript
interface Category {
  id: string;
  name_ru: string;
  name_en?: string;
  name_zh?: string;
  name_vi?: string;
  type: 'top' | 'side';
  icon?: string;
  display_order: number;
  show_for_countries: string[]; // ['china', 'thailand', 'vietnam']
}

// Уже инициализированы в /utils/categories.ts
await kv.set('categories', categories);
```

### Заказы (orders)

```typescript
interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
  }>;
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  payment_method: string;
  tracking_number?: string;
  created_at: string;
}

// Сохранить
const orders = await kv.get('orders') || [];
orders.push(newOrder);
await kv.set('orders', orders);
```

### Пользователи (user_profiles)

```typescript
interface UserProfile {
  id: string; // user ID from auth.users
  email: string;
  name?: string;
  phone?: string;
  loyalty_points: number;
  total_spent: number;
  is_admin: boolean;
  created_at: string;
}

// Сохранить профили
const profiles = await kv.get('user_profiles') || [];
profiles.push(profile);
await kv.set('user_profiles', profiles);
```

### Промокоды (promo_codes)

```typescript
interface PromoCode {
  code: string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  usage_limit?: number;
  times_used: number;
  valid_until?: string;
  active: boolean;
}

// Сохранить
await kv.set('promo_codes', promoCodes);
```

---

## 🔐 Аутентификация

### Регистрация

```typescript
// Frontend: components/Auth.tsx
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
});

// Затем создать профиль в KV Store через Edge Function
```

### Вход

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
});

// Получить access token
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session.access_token;
```

### Проверка прав админа

```typescript
// В Edge Function
const accessToken = c.req.header('Authorization')?.split(' ')[1];
const { data: { user } } = await supabase.auth.getUser(accessToken);

if (!user) {
  return c.json({ error: 'Unauthorized' }, 401);
}

// Проверить, является ли админом
const profiles = await kv.get('user_profiles') || [];
const profile = profiles.find(p => p.id === user.id);

if (!profile?.is_admin) {
  return c.json({ error: 'Forbidden' }, 403);
}
```

---

## 📧 Email через Resend

API ключ уже установлен: `RESEND_API_KEY`

### Отправка email

```typescript
// В Edge Function
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

await resend.emails.send({
  from: 'Asia Pharm <noreply@yourdomain.com>',
  to: [userEmail],
  subject: 'Ваш заказ принят',
  html: orderEmailHTML,
});
```

---

## 🐛 Отладка

### Проверка подключения к Supabase

```bash
# Откройте консоль браузера
# Выполните:
const response = await fetch('https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/');
const data = await response.json();
console.log(data);

# Должен вернуть: { status: 'ok', message: 'Asia Pharm Server is running' }
```

### Проверка KV Store

```bash
# В консоли браузера (с access token)
const response = await fetch('https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/products', {
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  }
});
const products = await response.json();
console.log(products);
```

### Логи Edge Function

1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd
2. Перейдите в **Edge Functions** → **make-server-a75b5353**
3. Откройте вкладку **Logs**
4. Смотрите `console.log()` из вашей функции

---

## 📝 Частые вопросы

### Q: Как создать таблицы в БД?

**A**: В Figma Make используйте KV Store! Таблицы не нужны для большинства случаев.

### Q: Можно ли использовать SQL таблицы?

**A**: Да, но только через Supabase Dashboard → SQL Editor. Локальные миграции не работают.

### Q: Как инициализировать начальные данные?

**A**: Создайте эндпоинт в Edge Function для инициализации:

```typescript
app.post('/make-server-a75b5353/admin/init', async (c) => {
  // Проверка прав админа
  
  // Инициализация категорий
  await kv.set('categories', defaultCategories);
  
  // Инициализация демо-товаров
  await kv.set('products', demoProducts);
  
  return c.json({ success: true, message: 'Data initialized' });
});
```

### Q: Где хранить изображения?

**A**: 
1. Используйте Supabase Storage (уже включен)
2. Или используйте внешний CDN (Cloudinary, imgix)
3. Или используйте Unsplash для демо-изображений

---

## ✅ Чеклист готовности

- [x] Проект создан в Figma Make
- [x] Supabase автоматически настроен
- [x] KV Store готов к использованию
- [x] Edge Function развернута
- [x] Email API (Resend) настроен
- [x] Frontend запускается локально
- [ ] Инициализированы категории
- [ ] Добавлены тестовые товары
- [ ] Создан первый админ
- [ ] Протестированы основные функции

---

## 🚀 Следующие шаги

1. **Инициализируйте данные**: Создайте эндпоинт для загрузки категорий и товаров
2. **Создайте админа**: Зарегистрируйтесь и установите `is_admin: true`
3. **Добавьте товары**: Используйте админ-панель для управления каталогом
4. **Протестируйте**: Проверьте регистрацию, заказы, email
5. **Деплой**: Опубликуйте на production

---

Проект готов к разработке! 🎉
