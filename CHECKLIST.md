# ✅ Чеклист перед деплоем Asia-Pharm

Используйте этот чеклист для проверки перед деплоем проекта.

---

## 📋 Перед началом

- [ ] Node.js 18+ установлен (`node --version`)
- [ ] Git установлен (`git --version`)
- [ ] Supabase CLI установлен (`supabase --version`)
- [ ] Аккаунт на Supabase создан
- [ ] Аккаунт на Vercel создан
- [ ] Аккаунт на GitHub создан

---

## 🗄️ База данных Supabase

### Подключение
- [ ] Проект Supabase создан (ID: hohhzspiylssmgdivajk)
- [ ] `supabase link` выполнен успешно
- [ ] Таблицы созданы:
  - [ ] `profiles`
  - [ ] `products`
  - [ ] `kv_store_a75b5353`

### Проверка таблиц
```sql
-- В SQL Editor выполните:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Должны быть:
- [ ] profiles
- [ ] products
- [ ] kv_store_a75b5353

### RLS (Row Level Security)
- [ ] RLS включен для всех таблиц
- [ ] Политики созданы для profiles
- [ ] Политики созданы для products
- [ ] Политики созданы для kv_store

---

## ⚡ Edge Functions

### Деплой
- [ ] Функция `server` задеплоена
- [ ] Health check работает:
```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

Ожидаемый ответ:
```json
{"status":"OK","message":"Asia-Pharm Store API"}
```

### Проверка эндпоинтов
- [ ] GET `/products` возвращает пустой массив или продукты
- [ ] POST `/signup` работает (создать тестового пользователя)
- [ ] OPTIONS запросы возвращают 200 (CORS)

---

## 📁 GitHub

### Репозиторий
- [ ] Репозиторий создан: https://github.com/ilyairgsha-boop/asia-pharm
- [ ] `.gitignore` настроен
- [ ] Ненужные файлы удалены
- [ ] Код залит на GitHub:
```bash
git status
git add .
git commit -m "Ready for deploy"
git push origin main
```

### Проверка файлов
Убедитесь, что эти файлы НЕ в репозитории:
- [ ] `.env` и `.env.local` отсутствуют
- [ ] `node_modules/` отсутствует
- [ ] `.supabase/` отсутствует
- [ ] Временные файлы (.txt, .sh) отсутствуют

---

## 🌐 Vercel

### Деплой
- [ ] Проект подключен к GitHub
- [ ] Переменные окружения добавлены:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Первый деплой успешен
- [ ] Сайт открывается (проверьте URL)

### Проверка функционала
- [ ] Главная страница загружается
- [ ] Каталог товаров открывается
- [ ] Переключение языков работает
- [ ] Переключение магазинов работает

---

## 👤 Администратор

### Создание первого админа
- [ ] Зарегистрировались на сайте через UI
- [ ] Получили свой email из профиля
- [ ] Выполнили SQL для установки `is_admin = true`:
```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'ваш@email.com';
```

### Проверка админ-панели
- [ ] Можете войти на `/admin`
- [ ] Видите все вкладки админ-панели
- [ ] Можете создать тестовый товар
- [ ] Товар отображается в каталоге

---

## 🔍 Финальная проверка

### Frontend (Production)
```bash
# Откройте ваш Vercel URL
open https://ваш-проект.vercel.app
```

Проверьте:
- [ ] Главная страница загружается
- [ ] Нет ошибок в консоли браузера
- [ ] Регистрация работает
- [ ] Вход работает
- [ ] Каталог товаров загружается
- [ ] Добавление в корзину работает
- [ ] Переключение языков работает
- [ ] Админ-панель доступна (для админа)

### Backend (Edge Functions)
```bash
# Проверьте API
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/products
```

- [ ] API отвечает
- [ ] Нет CORS ошибок
- [ ] Продукты загружаются

### База данных
В Supabase Dashboard → Table Editor:
- [ ] Таблица `profiles` содержит вашего пользователя
- [ ] Таблица `products` готова к работе (пустая или с товарами)
- [ ] Таблица `kv_store_a75b5353` создана

---

## 📊 Тестовые сценарии

### Регистрация нового пользователя
1. - [ ] Перейти на сайт
2. - [ ] Нажать "Войти/Регистрация"
3. - [ ] Зарегистрироваться с новым email
4. - [ ] Проверить, что профиль создан в БД

### Оформление заказа
1. - [ ] Добавить товар в корзину
2. - [ ] Перейти в корзину
3. - [ ] Заполнить данные доставки
4. - [ ] Оформить заказ
5. - [ ] Проверить, что заказ появился в KV Store

### Админ-панель
1. - [ ] Войти как админ
2. - [ ] Открыть админ-панель
3. - [ ] Создать новый товар
4. - [ ] Проверить, что товар появился в каталоге
5. - [ ] Удалить товар
6. - [ ] Проверить, что товар исчез из каталога

---

## 🚨 Если что-то не работает

### CORS ошибки
```bash
# Проверьте деплой функции
supabase functions deploy server --project-ref hohhzspiylssmgdivajk --no-verify-jwt

# Проверьте логи
supabase functions logs server --project-ref hohhzspiylssmgdivajk
```

### База данных недоступна
```bash
# Проверьте подключение
supabase db ping --project-ref hohhzspiylssmgdivajk
```

### Vercel не собирается
- Проверьте переменные окружения
- Проверьте логи сборки в Vercel Dashboard
- Убедитесь, что `package.json` корректен

---

## ✅ Готово!

Если все пункты отмечены ✅, ваш проект готов к работе!

**Что дальше:**
- Добавьте товары через админ-панель
- Настройте email рассылку (если нужно)
- Настройте онлайн-чат (Telegram/WhatsApp)
- Добавьте демо-данные

**Поддержка:**
- [DEPLOY.md](./DEPLOY.md) - Полная инструкция
- [GitHub Issues](https://github.com/ilyairgsha-boop/asia-pharm/issues)
- [Supabase Docs](https://supabase.com/docs)
