# ⚡ Быстрые команды для развертывания

## 📦 Установка Supabase CLI

**macOS/Linux**:
```bash
npm install -g supabase
```

**Проверка установки**:
```bash
supabase --version
```

---

## 🔗 Подключение к проекту

### Способ 1: С линковкой (рекомендуется)

#### 1. Авторизация в Supabase

```bash
supabase login
```

#### 2. Переход в папку проекта

```bash
cd /path/to/asia-pharm
```

⚠️ **ВАЖНО**: Замените `/path/to/asia-pharm` на реальный путь к вашей папке!

**Примеры**:
- macOS: `cd ~/Projects/asia-pharm`
- Linux: `cd ~/projects/asia-pharm`
- Windows: `cd C:\Projects\asia-pharm`

#### 3. Подключение проекта

```bash
supabase link --project-ref hohhzspiylssmgdivajk
```

**Если возникает ошибка**, попробуйте с debug:

```bash
supabase link --project-ref hohhzspiylssmgdivajk --debug
```

### Способ 2: Без линковки (альтернативный)

Если `supabase link` не работает, можно развернуть напрямую:

#### 1. Получите Access Token

Откройте: https://supabase.com/dashboard/account/tokens

Создайте новый токен и скопируйте его (начинается с `sbp_...`)

#### 2. Установите токен в переменную окружения

**macOS/Linux**:
```bash
export SUPABASE_ACCESS_TOKEN="ваш-токен-здесь"
```

**Windows (PowerShell)**:
```powershell
$env:SUPABASE_ACCESS_TOKEN="ваш-токен-здесь"
```

#### 3. Разверните функцию

```bash
cd /path/to/asia-pharm
supabase functions deploy make-server-a75b5353 \
  --project-ref hohhzspiylssmgdivajk \
  --no-verify-jwt
```

---

## 🚀 Развертывание Edge Functions

```bash
supabase functions deploy make-server-a75b5353 --no-verify-jwt
```

---

## ✅ Проверка развертывания

### Проверка Edge Function

```bash
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

**Ожидаемый ответ**:
```json
{"status":"OK","message":"Asia-Pharm Store API"}
```

---

## 🔐 Vercel CLI (опционально)

### Установка

```bash
npm install -g vercel
```

### Авторизация

```bash
vercel login
```

### Подключение проекта

```bash
cd /path/to/asia-pharm
vercel link
```

### Получение Project ID

```bash
cat .vercel/project.json
```

---

## 📊 Полезные команды

### Просмотр логов Edge Functions

```bash
supabase functions logs make-server-a75b5353
```

### Проверка статуса Supabase

```bash
supabase status
```

### Список функций

```bash
supabase functions list
```

---

## 🆘 Команды для отладки

### Проверка Supabase CLI версии

```bash
supabase --version
```

### Проверка Node.js версии

```bash
node --version
npm --version
```

### Просмотр текущей директории

```bash
pwd  # macOS/Linux
cd   # Windows
```

### Список файлов в папке

```bash
ls -la                    # macOS/Linux
dir                       # Windows
ls -la supabase/          # Проверка папки supabase
```

---

## 📝 Пример полного процесса

```bash
# 1. Установка Supabase CLI
npm install -g supabase

# 2. Авторизация
supabase login

# 3. Переход в папку проекта
cd ~/Projects/asia-pharm

# 4. Подключение к Supabase
supabase link --project-ref hohhzspiylssmgdivajk

# 5. Развертывание Edge Function
supabase functions deploy make-server-a75b5353 --no-verify-jwt

# 6. Проверка
curl https://hohhzspiylssmgdivajk.supabase.co/functions/v1/make-server-a75b5353/
```

---

## 🔍 Частые ошибки

### Ошибка: "command not found: supabase"

**Решение**:
```bash
# Установите Supabase CLI
npm install -g supabase

# Или обновите PATH
export PATH="$PATH:$(npm config get prefix)/bin"
```

### Ошибка: "Not logged in"

**Решение**:
```bash
supabase login
```

### Ошибка: "Project not found"

**Решение**:
Проверьте Project ID:
```bash
# Должен быть: hohhzspiylssmgdivajk
supabase link --project-ref hohhzspiylssmgdivajk
```

### Ошибка: "No such file or directory"

**Решение**:
Убедитесь что вы в правильной папке:
```bash
pwd                      # Показать текущую папку
ls -la supabase/         # Должна быть папка supabase
cd /correct/path/        # Перейдите в правильную папку
```

---

## 🔗 Следующие шаги

После успешного выполнения команд:

1. ✅ Edge Function развернута
2. ➡️ Переходите к **Шагу 3** в [SETUP.md](./SETUP.md#-шаг-3-развертывание-на-vercel-5-минут)

---

**Полная инструкция**: [SETUP.md](./SETUP.md)
