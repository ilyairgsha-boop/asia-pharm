# 🎯 Следующие шаги - Asia Pharm в Figma Make

## ✅ Что уже сделано

- ✅ Проект очищен от ненужных миграций
- ✅ Документация обновлена для Figma Make
- ✅ Supabase автоматически настроен
- ✅ Edge Function готова к использованию
- ✅ KV Store работает
- ✅ Email сервис (Resend) настроен

---

## 🚀 Что делать дальше?

### 1️⃣ Запустите проект локально

```bash
# Убедитесь что вы в корне проекта
cd ~/Desktop/Asianew/wp/src

# Запустите dev сервер
npm run dev
```

Откройте: http://localhost:5173

---

### 2️⃣ Проверьте работу сайта

В браузере проверьте:

- ✅ Главная страница загружается
- ✅ Переключение языков работает (RU/EN/ZH/VI)
- ✅ Переключение магазинов работает (Китай/Таиланд/Вьетнам)
- ✅ Меню категорий отображается
- ✅ Можно открыть регистрацию/вход

---

### 3️⃣ Создайте первого админа

#### Вариант A: Через интерфейс сайта (проще)

1. На сайте нажмите "Регистрация"
2. Зарегистрируйтесь с любым email (например: `admin@test.com`)
3. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd
4. Перейдите в **SQL Editor**
5. Выполните SQL:

```sql
-- Проверьте, что пользователь создан
SELECT id, email FROM auth.users WHERE email = 'admin@test.com';

-- Получите user_id из результата выше и выполните:
INSERT INTO user_profiles (id, email, name, is_admin, loyalty_points, total_spent)
VALUES (
  'USER_ID_FROM_ABOVE', 
  'admin@test.com', 
  'Admin', 
  true, 
  0, 
  0
)
ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

Или используйте KV Store через Edge Function (рекомендуется для Figma Make).

#### Вариант B: Через Edge Function endpoint

Создайте временный эндпоинт для инициализации админа:

```bash
# Откройте консоль браузера на вашем сайте
# После регистрации выполните:

const response = await fetch('https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/admin/init-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@test.com',
  }),
});

console.log(await response.json());
```

---

### 4️⃣ Инициализируйте категории

Категории уже определены в `/utils/categories.ts`, но нужно сохранить их в KV Store.

#### Создайте эндпоинт для инициализации:

В файле `/supabase/functions/make-server-a75b5353/index.ts` добавьте:

```typescript
// Импортируйте категории
import { topCategories, sideCategories } from '../../../utils/categories.ts';

// Добавьте эндпоинт
app.post('/make-server-a75b5353/admin/init-categories', async (c) => {
  try {
    // Объедините все категории
    const allCategories = [...topCategories, ...sideCategories];
    
    // Сохраните в KV Store
    await kv.set('categories', allCategories);
    
    return c.json({ 
      success: true, 
      message: 'Categories initialized',
      count: allCategories.length 
    });
  } catch (error) {
    console.error('Init categories error:', error);
    return c.json({ error: error.message }, 500);
  }
});
```

Затем вызовите из консоли браузера:

```javascript
const response = await fetch('https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/admin/init-categories', {
  method: 'POST',
});
console.log(await response.json());
```

---

### 5️⃣ Добавьте демо-товары (опционально)

Создайте несколько тестовых товаров для проверки.

#### Через админ-панель:

1. Войдите на сайт как админ
2. Откройте **Админ-панель**
3. Перейдите в **Управление товарами**
4. Нажмите **Добавить товар**
5. Заполните форму и сохраните

#### Или через код:

```javascript
const demoProducts = [
  {
    id: '1',
    name_ru: 'Тигровый бальзам',
    name_en: 'Tiger Balm',
    name_zh: '老虎膏',
    name_vi: 'Cao con hổ',
    description_ru: 'Классический тигровый бальзам от болей в мышцах и суставах',
    price: 150,
    country: 'china',
    category_ids: ['ointments'],
    disease_category_ids: ['joints', 'skin'],
    in_stock: true,
    is_sample: false,
    image_url: 'https://via.placeholder.com/400',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name_ru: 'Пластырь обезболивающий',
    name_en: 'Pain Relief Patch',
    name_zh: '止痛贴',
    name_vi: 'Miếng dán giảm đau',
    description_ru: 'Пластырь для снятия боли в суставах',
    price: 200,
    country: 'china',
    category_ids: ['patches'],
    disease_category_ids: ['joints'],
    in_stock: true,
    is_sample: false,
    image_url: 'https://via.placeholder.com/400',
    created_at: new Date().toISOString(),
  },
];

// Сохраните через Edge Function
const response = await fetch('https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/admin/init-products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ products: demoProducts }),
});
console.log(await response.json());
```

---

### 6️⃣ Протестируйте основные функции

#### Для покупателя:
- ✅ Просмотр товаров
- ✅ Переключение категорий
- ✅ Добавление в корзину
- ✅ Оформление заказа
- ✅ Применение промокода
- ✅ Программа лояльности

#### Для админа:
- ✅ Управление товарами
- ✅ Управление категориями
- ✅ Управление заказами
- ✅ Управление пользователями
- ✅ Создание промокодов
- ✅ Email рассылки
- ✅ Аналитика

---

## 📚 Полезные ссылки

- **Supabase Dashboard**: https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd
- **Edge Function Logs**: https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd/functions/make-server-a75b5353/logs
- **Resend Dashboard**: https://resend.com/emails

---

## 🆘 Если что-то не работает

### Проблема: Не могу зарегистрироваться

**Решение**: 
1. Проверьте консоль браузера на ошибки
2. Проверьте логи Edge Function в Supabase Dashboard
3. Убедитесь, что auth включен в Supabase

### Проблема: Категории не отображаются

**Решение**: 
1. Инициализируйте категории через эндпоинт (шаг 4)
2. Проверьте консоль браузера
3. Убедитесь, что KV Store доступен

### Проблема: Товары не загружаются

**Решение**:
1. Добавьте демо-товары (шаг 5)
2. Проверьте эндпоинт `/products` в Edge Function
3. Проверьте логи на ошибки

### Проблема: Email не отправляются

**Решение**:
1. Убедитесь, что `RESEND_API_KEY` установлен в Supabase secrets
2. Проверьте лимиты Resend (100 писем/день на бесплатном плане)
3. Проверьте логи Edge Function

---

## ⚠️ НЕ ЗАБУДЬТЕ

```bash
# ❌ НЕ используйте эти команды в Figma Make:
supabase link
supabase db push
supabase migration up

# ✅ Вместо этого используйте:
# - Supabase Dashboard для SQL
# - KV Store для данных
# - Edge Functions для API
```

---

## 🎉 Готово!

После выполнения этих шагов ваш интернет-магазин будет полностью готов к использованию!

**Следующий этап**: Добавьте реальные товары, настройте дизайн и запустите в production!

---

**Вопросы?** 

Читайте:
- [FIGMA_MAKE_SETUP.md](./FIGMA_MAKE_SETUP.md) - Полная документация
- [README.md](./README.md) - Обзор проекта
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Деплой на Vercel
