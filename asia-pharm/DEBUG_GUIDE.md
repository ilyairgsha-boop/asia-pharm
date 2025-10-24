# 🔍 Руководство по отладке ошибок

## Текущая проблема: Config.toml ошибки

### ✅ РЕШЕНО (обновлено 2 раза)

Файл `supabase/config.toml` был исправлен дважды:

1. **Первое исправление**: Убрана секция `[project]`, добавлен `project_id`
2. **Второе исправление**: Убран `port` из секции `[edge_runtime]`

**Текущий рабочий формат** в `supabase/config.toml`:

```toml
project_id = "hohhzspiylssmgdivajk"

[api]
enabled = true
port = 54321

[db]
port = 54322

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:5173"

[edge_runtime]
enabled = true  # ← БЕЗ port!

[analytics]
enabled = false
```

---

## 🚀 Попробуйте команду снова

```bash
cd /path/to/asia-pharm
supabase link --project-ref hohhzspiylssmgdivajk
```

---

## 🛠️ Методы отладки

### 1. Проверка версии Supabase CLI

```bash
supabase --version
```

**Рекомендуемая версия**: 1.x.x или выше

**Если версия старая**, обновите:
```bash
npm update -g supabase
```

### 2. Проверка структуры проекта

```bash
# Убедитесь что вы в корневой папке проекта
pwd

# Проверьте наличие папки supabase
ls -la supabase/

# Проверьте наличие config.toml
cat supabase/config.toml
```

**Ожидается**:
- Папка `supabase/` существует ✅
- Файл `supabase/config.toml` существует ✅
- В config.toml есть `project_id = "hohhzspiylssmgdivajk"` ✅

### 3. Debug режим

Запустите команду с флагом `--debug`:

```bash
supabase link --project-ref hohhzspiylssmgdivajk --debug
```

Это покажет:
- Детальные логи выполнения
- Точное место возникновения ошибки
- Конфликтующие ключи в config

### 4. Проверка авторизации

```bash
# Проверьте что вы авторизованы
supabase projects list
```

**Если ошибка "Not logged in"**:
```bash
supabase login
```

### 5. Пересоздание config.toml

Если ничего не помогает:

```bash
# Удалите старый config
rm supabase/config.toml

# Инициализируйте заново
supabase init

# Откройте и вручную добавьте project_id
nano supabase/config.toml
```

Добавьте в начало файла:
```toml
project_id = "hohhzspiylssmgdivajk"
```

---

## 🔄 Альтернативный метод развертывания

Если `supabase link` упорно не работает, можно развернуть **БЕЗ линковки**:

### Шаг 1: Получите Access Token

1. Откройте: https://supabase.com/dashboard/account/tokens
2. Нажмите **"Generate New Token"**
3. Name: `Asia Pharm Deploy`
4. Скопируйте токен (начинается с `sbp_...`)

### Шаг 2: Установите в переменную окружения

**macOS/Linux**:
```bash
export SUPABASE_ACCESS_TOKEN="sbp_ваш_токен_здесь"
```

**Windows PowerShell**:
```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_ваш_токен_здесь"
```

**Windows CMD**:
```cmd
set SUPABASE_ACCESS_TOKEN=sbp_ваш_токен_здесь
```

### Шаг 3: Разверните напрямую

```bash
cd /path/to/asia-pharm

supabase functions deploy make-server-a75b5353 \
  --project-ref hohhzspiylssmgdivajk \
  --no-verify-jwt
```

### Шаг 4: Проверка

```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

**Ожидаемый ответ**:
```json
{"status":"OK","message":"Asia-Pharm Store API"}
```

---

## 📊 Типичные ошибки и решения

### Ошибка: "failed to parse config"

**Причина**: Неправильный формат `config.toml`

**Решение**: 
1. Откройте `supabase/config.toml`
2. Убедитесь что первая строка: `project_id = "hohhzspiylssmgdivajk"`
3. Убедитесь что в `[edge_runtime]` только `enabled = true` (без `port`)

### Ошибка: "command not found: supabase"

**Причина**: Supabase CLI не установлен или не в PATH

**Решение**:
```bash
# Установите заново
npm install -g supabase

# Проверьте PATH
echo $PATH

# Добавьте npm bin в PATH (macOS/Linux)
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Ошибка: "Not logged in"

**Причина**: Не выполнена авторизация

**Решение**:
```bash
supabase login
```

### Ошибка: "Project not found"

**Причина**: Неправильный Project ID или нет доступа

**Решение**:
1. Проверьте Project ID: `hohhzspiylssmgdivajk`
2. Убедитесь что вы владелец/член проекта в Supabase Dashboard
3. Попробуйте список проектов: `supabase projects list`

### Ошибка: "No such file or directory: supabase/config.toml"

**Причина**: Вы в неправильной папке

**Решение**:
```bash
# Проверьте текущую папку
pwd

# Перейдите в правильную папку
cd /path/to/asia-pharm

# Убедитесь что config.toml есть
ls -la supabase/config.toml
```

---

## 🆘 Последнее средство

Если ничего не работает, разверните через Supabase Dashboard:

### 1. Откройте Functions в Dashboard

```
https://supabase.com/dashboard/project/hohhzspiylssmgdivajk/functions
```

### 2. Создайте новую функцию

1. Нажмите **"Create a new function"**
2. Name: `make-server-a75b5353`
3. ✅ **Важно**: Отключите **"Verify JWT"**

### 3. Скопируйте код

Создайте два файла в редакторе Dashboard:

**index.ts**:
- Скопируйте содержимое из `/supabase/functions/server/index.tsx`

**kv_store.ts**:
- Скопируйте содержимое из `/supabase/functions/server/kv_store.tsx`

### 4. Deploy

Нажмите **"Deploy function"**

### 5. Проверка

```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

---

## 📞 Нужна помощь?

Если проблема не решена:

1. Скопируйте **полный вывод ошибки** (с --debug)
2. Создайте Issue: https://github.com/ilyairgsha-boop/asia-pharm/issues
3. Приложите:
   - Вывод `supabase --version`
   - Вывод `node --version`
   - Вывод `npm --version`
   - Операционная система

---

## ✅ Чек-лист перед запуском команды

Перед выполнением `supabase link`:

- [ ] Supabase CLI установлен (`supabase --version` работает)
- [ ] Выполнена авторизация (`supabase login`)
- [ ] Вы в корневой папке проекта (`pwd` показывает правильный путь)
- [ ] Папка `supabase/` существует
- [ ] Файл `supabase/config.toml` существует
- [ ] В `config.toml` есть `project_id = "hohhzspiylssmgdivajk"`
- [ ] В `config.toml` секция `[edge_runtime]` имеет только `enabled = true`

---

**Следующие шаги**: [SETUP.md](./SETUP.md) или [QUICK_COMMANDS.md](./QUICK_COMMANDS.md)
