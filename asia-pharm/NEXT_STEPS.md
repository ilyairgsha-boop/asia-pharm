# ⚡ Следующие шаги - Краткая инструкция

## ✅ Что уже сделано:

1. ✅ `supabase link` выполнен успешно
2. ✅ `config.toml` исправлен (версия БД 17)
3. ✅ Создан скрипт копирования функций

---

## 🚀 Что делать дальше (3 минуты):

### Шаг 1: Скопируйте файлы Edge Function

Выполните эти команды **по очереди** в терминале:

```bash
# Создайте папку
mkdir -p supabase/functions/make-server-a75b5353

# Скопируйте index.ts (с заменой импорта)
sed 's/kv_store\.tsx/kv_store.ts/g' supabase/functions/server/index.tsx > supabase/functions/make-server-a75b5353/index.ts

# Скопируйте kv_store.ts (с правильным project_id)
sed 's/datoomsnmfuodecpbmpn/hohhzspiylssmgdivajk/g' supabase/functions/server/kv_store.tsx > supabase/functions/make-server-a75b5353/kv_store.ts
```

**Проверьте** что файлы созданы:
```bash
ls -la supabase/functions/make-server-a75b5353/
```

Должно быть:
```
-rw-r--r--  index.ts
-rw-r--r--  kv_store.ts
```

---

### Шаг 2: Разверните Edge Function

```bash
supabase functions deploy make-server-a75b5353 --no-verify-jwt
```

**Ожидается**:
```
Deploying make-server-a75b5353 (project ref: hohhzspiylssmgdivajk)
Bundling make-server-a75b5353
Deploying make-server-a75b5353 (100%)
✅ Deployed make-server-a75b5353
```

---

### Шаг 3: Проверьте что всё работает

```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

**Должен вернуть**:
```json
{"status":"OK","message":"Asia-Pharm Store API"}
```

---

## ✅ Если всё прошло успешно:

Переходите к **Шагу 3** в [SETUP.md](./SETUP.md#-шаг-3-развертывание-на-vercel-5-минут) - Развертывание на Vercel

---

## 🆘 Если что-то пошло не так:

Откройте [FIX_APPLIED.md](./FIX_APPLIED.md) - там подробные инструкции по решению всех проблем.

---

## 📋 Полный список команд (для копирования целиком):

```bash
# Все команды одним блоком
mkdir -p supabase/functions/make-server-a75b5353 && \
sed 's/kv_store\.tsx/kv_store.ts/g' supabase/functions/server/index.tsx > supabase/functions/make-server-a75b5353/index.ts && \
sed 's/datoomsnmfuodecpbmpn/hohhzspiylssmgdivajk/g' supabase/functions/server/kv_store.tsx > supabase/functions/make-server-a75b5353/kv_store.ts && \
echo "✅ Файлы скопированы!" && \
supabase functions deploy make-server-a75b5353 --no-verify-jwt
```

Затем проверьте:
```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

---

**Время выполнения**: ~3 минуты  
**Сложность**: Простая (copy-paste команд)  
**Следующий файл**: [SETUP.md - Шаг 3](./SETUP.md)
