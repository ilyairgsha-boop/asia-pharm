# ⚡ Быстрый старт - Asia Pharm

## 🎯 3 простых шага до запуска

### Шаг 1: Настройка базы данных (5 минут)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd)
2. Нажмите **SQL Editor** в боковом меню
3. Скопируйте весь SQL код из файла `/SUPABASE_SETUP.md`
4. Вставьте в редактор и нажмите **RUN**

**Проверка**: Выполните
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```
Должны появиться: `products`, `user_profiles`, `orders`, `promo_codes`

---

### Шаг 2: Запуск проекта (1 минута)

```bash
npm install
npm run dev
```

Откройте: http://localhost:5173

---

### Шаг 3: Создание админа (2 минуты)

1. На сайте нажмите **Регистрация**
2. Зарегистрируйтесь (например: `admin@test.com` / `admin123`)
3. В [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/boybkoyidxwrgsayifrd/sql) выполните:

```sql
UPDATE public.user_profiles 
SET is_admin = true 
WHERE email = 'admin@test.com';
```

4. Обновите страницу (F5)
5. Появится кнопка **"Админ-панель"** ✅

---

## 🎉 Готово!

Теперь вы можете:
- ✅ Добавлять товары через админ-панель
- ✅ Управлять категориями и заказами
- ✅ Создавать промокоды
- ✅ Настраивать email рассылки

---

## 🆘 Что-то не работает?

### ❌ Ошибка "Not Found" при регистрации
**Решение**: Убедитесь что таблица `user_profiles` создана (Шаг 1)

### ❌ Товары не отображаются
**Решение**: Добавьте тестовые товары через админ-панель или SQL (см. `/SUPABASE_SETUP.md`)

### ❌ Нет кнопки "Админ-панель"
**Решение**: Выполните SQL из Шага 3 еще раз и обновите страницу

---

## 📚 Полная документация

- [NEXT_STEPS.md](/NEXT_STEPS.md) - Подробная инструкция
- [SUPABASE_SETUP.md](/SUPABASE_SETUP.md) - SQL команды для БД
- [FIGMA_MAKE_SETUP.md](/FIGMA_MAKE_SETUP.md) - Настройка для Figma Make
- [README.md](/README.md) - Обзор проекта

---

**Project ID**: `boybkoyidxwrgsayifrd`  
**Edge Function**: `https://boybkoyidxwrgsayifrd.supabase.co/functions/v1/make-server-a75b5353/`
