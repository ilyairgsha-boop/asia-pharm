# 🚀 Настройка GitHub и Деплой

## 📦 Проблема которую мы исправили

✅ **Исправлено**:
1. Дублирующиеся файлы `info.ts` и `info.tsx` - удален старый файл
2. Старые project ID в `client.ts` - обновлены на новый проект
3. Workflow файл в неправильной папке - перемещен в `/.github/workflows/`

---

## 🔧 Что было изменено

### 1. `/utils/supabase/client.ts` ✅
```typescript
// БЫЛО (старый проект):
const supabaseUrl = 'https://datoomsnmfuodecpbmpn.supabase.co';

// СТАЛО (новый проект):
const supabaseUrl = 'https://hohhzspiylssmgdivajk.supabase.co';
```

### 2. Удален дубликат ✅
```bash
❌ /utils/supabase/info.ts - УДАЛЕН (старый проект)
✅ /utils/supabase/info.tsx - ОСТАВЛЕН (новый проект)
```

### 3. Workflow перемещен ✅
```bash
❌ /workflows/deploy.yml - УДАЛЕН
✅ /.github/workflows/deploy.yml - СОЗДАН
```

---

## 🌐 Настройка GitHub Repository

### Шаг 1: Инициализация Git (если еще не сделано)

```bash
# Перейдите в папку проекта
cd /path/to/asia-pharm

# Инициализируйте git (если еще не сделано)
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit: Asia Pharm e-commerce"
```

---

### Шаг 2: Подключение к GitHub

#### Вариант А: Репозиторий уже существует

```bash
# Добавьте remote
git remote add origin https://github.com/ilyairgsha-boop/asia-pharm.git

# Если ветка main не существует на GitHub, создайте её:
git branch -M main

# Отправьте код
git push -u origin main
```

#### Вариант Б: Создать новый репозиторий

1. Откройте https://github.com/new
2. Введите имя: `asia-pharm`
3. Выберите **Private** (рекомендуется для коммерческого проекта)
4. **НЕ** создавайте README, .gitignore или license
5. Нажмите "Create repository"

Затем выполните:

```bash
git remote add origin https://github.com/ilyairgsha-boop/asia-pharm.git
git branch -M main
git push -u origin main
```

---

### Шаг 3: Создание `.gitignore`

Создайте файл `.gitignore` в корне проекта:

```bash
# .gitignore
node_modules/
dist/
.env
.env.local
.vercel
.DS_Store
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

---

### Шаг 4: Настройка GitHub Secrets (для автодеплоя)

Если вы хотите автоматический деплой на Vercel при push в main:

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

Добавьте эти secrets:

```
VITE_SUPABASE_URL
Значение: https://hohhzspiylssmgdivajk.supabase.co

VITE_SUPABASE_ANON_KEY
Значение: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvaGh6c3BpeWxzc21nZGl2YWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDcxMzMsImV4cCI6MjA3NjgyMzEzM30.3J8v2AtgsfaE8WBq9UpbVWmJyvmoJkKVcxiWSkCDK5c

VERCEL_TOKEN
Значение: Получите на https://vercel.com/account/tokens

VERCEL_ORG_ID
Значение: Найдите в настройках Vercel

VERCEL_PROJECT_ID
Значение: Найдите в настройках проекта на Vercel
```

---

## 🚨 Решение проблемы "Repository does not contain the requested branch or commit"

Эта ошибка возникает когда:

### Причина 1: Репозиторий пустой

**Решение**:
```bash
# Убедитесь что у вас есть коммиты
git log

# Если нет коммитов, сделайте первый:
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Причина 2: Ветка main не существует на GitHub

**Решение**:
```bash
# Создайте ветку main локально
git branch -M main

# Отправьте на GitHub
git push -u origin main
```

### Причина 3: Неправильный URL репозитория

**Решение**:
```bash
# Проверьте URL
git remote -v

# Если неправильный, измените:
git remote set-url origin https://github.com/ilyairgsha-boop/asia-pharm.git

# Проверьте снова
git remote -v
```

### Причина 4: Нет доступа к репозиторию

**Решение**:
```bash
# Если репозиторий приватный, аутентифицируйтесь:
# Вариант А: Personal Access Token (рекомендуется)
# 1. Создайте token: https://github.com/settings/tokens
# 2. Выберите "classic" token
# 3. Дайте права: repo, workflow
# 4. Используйте token как пароль при push

# Вариант Б: SSH ключ
# Настройте SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

---

## ✅ Проверка что всё работает

### 1. Проверьте что код на GitHub

```bash
# Откройте в браузере:
https://github.com/ilyairgsha-boop/asia-pharm

# Вы должны увидеть все файлы проекта
```

### 2. Проверьте workflow

```bash
# После push в main, проверьте:
# GitHub → Your Repository → Actions

# Вы увидите запущенный workflow "Deploy to Vercel"
```

### 3. Проверьте локальные изменения

```bash
# Посмотрите статус
git status

# Должно быть чисто:
# nothing to commit, working tree clean
```

---

## 📋 Быстрый чек-лист

Перед пушем на GitHub убедитесь:

- [ ] ✅ `info.ts` удален (остался только `info.tsx`)
- [ ] ✅ `client.ts` обновлен на новый project ID
- [ ] ✅ `.github/workflows/deploy.yml` существует
- [ ] ✅ `.gitignore` создан
- [ ] ✅ `.env` НЕ добавлен в git (только `.env.example`)
- [ ] ✅ Git инициализирован
- [ ] ✅ Remote добавлен
- [ ] ✅ Первый коммит сделан

---

## 🚀 Команды для быстрого старта

Если репозиторий уже существует на GitHub:

```bash
# Всё одной командой
git add . && \
git commit -m "Update Supabase config and fix duplicates" && \
git push -u origin main
```

Если нужно создать новый репозиторий:

```bash
# 1. Создайте репозиторий на github.com/new
# 2. Затем выполните:

git init && \
git add . && \
git commit -m "Initial commit: Asia Pharm e-commerce" && \
git remote add origin https://github.com/ilyairgsha-boop/asia-pharm.git && \
git branch -M main && \
git push -u origin main
```

---

## 🆘 Если всё еще возникают проблемы

### Проблема: "fatal: refusing to merge unrelated histories"

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Проблема: "error: failed to push some refs"

```bash
# Сначала получите изменения с GitHub
git pull origin main --rebase

# Затем отправьте
git push -u origin main
```

### Проблема: "Permission denied (publickey)"

Используйте HTTPS вместо SSH:
```bash
git remote set-url origin https://github.com/ilyairgsha-boop/asia-pharm.git
git push -u origin main
```

---

## 📚 Дополнительные ресурсы

- [GitHub Docs - Creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)
- [GitHub Actions - Vercel Deploy](https://github.com/marketplace/actions/vercel-action)
- [Vercel - GitHub Integration](https://vercel.com/docs/git/vercel-for-github)

---

**Последнее обновление**: 2025-01-23  
**Статус**: ✅ Все исправления применены
