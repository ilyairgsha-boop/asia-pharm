# ✅ Чек-лист развертывания Asia Pharm

## 📋 Текущий статус

### ✅ Уже сделано автоматически

- [x] ✅ Supabase config исправлен (config.toml)
- [x] ✅ Supabase link выполнен успешно
- [x] ✅ Дублирующие файлы удалены (info.ts)
- [x] ✅ Project ID обновлен везде (hohhzspiylssmgdivajk)
- [x] ✅ GitHub workflow перемещен в правильную папку
- [x] ✅ .gitignore создан
- [x] ✅ .env.example создан
- [x] ✅ Документация обновлена

---

## 🎯 Что нужно сделать

### Шаг 1: Разверните Edge Function

- [ ] Создайте папку `supabase/functions/make-server-a75b5353/`
- [ ] Скопируйте `index.ts` с заменой импорта
- [ ] Скопируйте `kv_store.ts` с правильным project_id
- [ ] Выполните `supabase functions deploy make-server-a75b5353 --no-verify-jwt`
- [ ] Проверьте что API отвечает

**Команды**:
```bash
mkdir -p supabase/functions/make-server-a75b5353
sed 's/kv_store\.tsx/kv_store.ts/g' supabase/functions/server/index.tsx > supabase/functions/make-server-a75b5353/index.ts
sed 's/datoomsnmfuodecpbmpn/hohhzspiylssmgdivajk/g' supabase/functions/server/kv_store.tsx > supabase/functions/make-server-a75b5353/kv_store.ts
supabase functions deploy make-server-a75b5353 --no-verify-jwt
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

**Инструкция**: [NEXT_STEPS.md](./NEXT_STEPS.md)

---

### Шаг 2: Отправьте код на GitHub

- [ ] Инициализируйте git (если не сделано)
- [ ] Добавьте все файлы
- [ ] Сделайте первый коммит
- [ ] Подключите remote к GitHub
- [ ] Отправьте код на GitHub

**Команды** (если репозиторий уже существует):
```bash
git add .
git commit -m "Fix: Update Supabase config and remove duplicates"
git push
```

**Команды** (если репозиторий новый):
```bash
git init
git add .
git commit -m "Initial commit: Asia Pharm e-commerce"
git remote add origin https://github.com/ilyairgsha-boop/asia-pharm.git
git branch -M main
git push -u origin main
```

**Инструкция**: [GITHUB_SETUP.md](./GITHUB_SETUP.md)

---

### Шаг 3: Разверните на Vercel

- [ ] Подключите GitHub к Vercel
- [ ] Создайте новый проект на Vercel
- [ ] Настройте переменные окружения
- [ ] Разверните проект
- [ ] Проверьте что сайт работает

**Переменные окружения для Vercel**:
```
VITE_SUPABASE_URL=https://hohhzspiylssmgdivajk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaGh6c3BpeWxzc21nZGl2YWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDcxMzMsImV4cCI6MjA3NjgyMzEzM30.3J8v2AtgsfaE8WBq9UpbVWmJyvmoJkKVcxiWSkCDK5c
```

**Инструкция**: [SETUP.md - Шаг 3](./SETUP.md)

---

### Шаг 4: Создайте первого админа

- [ ] Откройте ваш сайт на Vercel
- [ ] Перейдите на страницу создания админа
- [ ] Создайте первого пользователя-админа
- [ ] Войдите в систему
- [ ] Проверьте доступ к админ-панели

**Инструкция**: [SETUP.md - Шаг 4](./SETUP.md)

---

### Шаг 5: (Опционально) Добавьте демо-данные

- [ ] Войдите как админ
- [ ] Откройте админ-панель
- [ ] Нажмите "Инициализировать демо-данные"
- [ ] Проверьте что товары появились

**Или через SQL**:
```bash
# Подключитесь к БД через Supabase Dashboard
# Выполните скрипт из INIT_DEMO_DATA.sql
```

**Инструкция**: [SETUP.md - Шаг 5](./SETUP.md)

---

## 🔍 Проверочные команды

### Проверка 1: Нет старого project ID

```bash
grep -r "datoomsnmfuodecpbmpn" utils/ components/ contexts/ 2>/dev/null
# Должно быть пусто или "No matches found"
```

### Проверка 2: Edge Function развернута

```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
# Должно вернуть: {"status":"OK","message":"Asia-Pharm Store API"}
```

### Проверка 3: Код на GitHub

```bash
git remote -v
# Должно показать: origin https://github.com/ilyairgsha-boop/asia-pharm.git

git log --oneline -1
# Должен показать последний коммит
```

### Проверка 4: Сайт на Vercel работает

```bash
# Откройте в браузере URL вашего проекта на Vercel
# Например: https://asia-pharm.vercel.app
```

---

## ⏱️ Примерное время

| Шаг | Время |
|-----|-------|
| 1. Edge Function | 3 минуты |
| 2. GitHub | 5 минут |
| 3. Vercel | 5 минут |
| 4. Создать админа | 2 минуты |
| 5. Демо-данные | 1 минута |
| **ИТОГО** | **~16 минут** |

---

## 🆘 Если возникли проблемы

### Edge Function не разворачивается

**Решение**: [NEXT_STEPS.md - Раздел "Если что-то пошло не так"](./NEXT_STEPS.md)

### GitHub выдает ошибку

**Решение**: [GITHUB_SETUP.md - Раздел "Решение проблемы"](./GITHUB_SETUP.md)

### Vercel не работает

**Решение**: [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

### Общие проблемы

**Решение**: [DEBUG_GUIDE.md](./DEBUG_GUIDE.md) - полное руководство по отладке

---

## 📊 Прогресс

```
[████████████████████░░] 80% - Готов к развертыванию
```

**Что сделано**: 8 из 10 задач  
**Что осталось**: 2 задачи (Edge Function + GitHub)  
**До запуска**: ~8 минут

---

## 🎯 Быстрый старт

Если нужно быстро запустить ВСЁ одной командой:

```bash
# ⚠️ ВНИМАНИЕ: Выполняйте только если понимаете что делаете

# 1. Edge Function
mkdir -p supabase/functions/make-server-a75b5353 && \
sed 's/kv_store\.tsx/kv_store.ts/g' supabase/functions/server/index.tsx > supabase/functions/make-server-a75b5353/index.ts && \
sed 's/datoomsnmfuodecpbmpn/hohhzspiylssmgdivajk/g' supabase/functions/server/kv_store.tsx > supabase/functions/make-server-a75b5353/kv_store.ts && \
supabase functions deploy make-server-a75b5353 --no-verify-jwt && \

# 2. GitHub
git add . && \
git commit -m "Update: Supabase config and Edge Function deployment" && \
git push

# 3. Проверка
echo "✅ Edge Function:" && \
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/ && \
echo "\n✅ GitHub:" && \
git log --oneline -1
```

Затем вручную:
- Разверните на Vercel через веб-интерфейс
- Создайте первого админа через сайт

---

**Последнее обновление**: 2025-01-23  
**Готовность**: 80%  
**Следующий шаг**: [WHAT_NOW.md](./WHAT_NOW.md)
