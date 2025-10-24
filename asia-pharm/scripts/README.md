# 🛠️ Scripts для Asia Farm

Набор автоматизированных скриптов для упрощения развертывания и управления проектом.

## Доступные скрипты

### 1. setup.sh - Полная автоматизированная настройка

Автоматически выполняет все шаги настройки проекта.

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Что делает:**
- ✅ Проверяет установленные инструменты (Node.js, npm, git)
- ✅ Устанавливает зависимости проекта
- ✅ Создает .env.local из .env.example
- ✅ Устанавливает Supabase CLI
- ✅ Устанавливает Vercel CLI
- ✅ Помогает подключить проекты Supabase и Vercel
- ✅ Напоминает о настройке GitHub Secrets

### 2. create-admin.sh - Создание администратора

Помогает создать первого администратора в системе.

```bash
chmod +x scripts/create-admin.sh
./scripts/create-admin.sh
```

**Использование:**
1. Сначала зарегистрируйтесь на сайте
2. Запустите скрипт
3. Введите email зарегистрированного пользователя
4. Скрипт сгенерирует SQL команду
5. Выполните команду в Supabase SQL Editor

**Через Supabase CLI:**
Если Supabase CLI установлен, скрипт может выполнить команду автоматически.

### 3. deploy-functions.sh - Развертывание Edge Functions

Разворачивает Supabase Edge Functions.

```bash
chmod +x scripts/deploy-functions.sh
./scripts/deploy-functions.sh
```

**Что делает:**
- ✅ Проверяет установку Supabase CLI
- ✅ Проверяет авторизацию
- ✅ Разворачивает функцию `make-server-a75b5353`
- ✅ Выводит URL функции для тестирования

**Требования:**
- Supabase CLI установлен
- Выполнен `supabase login`
- Проект подключен через `supabase link`

## Подготовка

Перед использованием скриптов сделайте их исполняемыми:

```bash
chmod +x scripts/setup.sh
chmod +x scripts/create-admin.sh
chmod +x scripts/deploy-functions.sh
```

## Использование

### Полная настройка проекта (новый проект)

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/ilyairgsha-boop/asia-farm.git
cd asia-farm

# 2. Запустите автоматическую настройку
./scripts/setup.sh

# 3. Следуйте инструкциям в скрипте
```

### Быстрое развертывание функций

```bash
# Разверните Edge Functions
./scripts/deploy-functions.sh
```

### Создание админа после регистрации

```bash
# После регистрации на сайте
./scripts/create-admin.sh

# Введите email и следуйте инструкциям
```

## Требования

### Обязательные инструменты:
- **Node.js** 18+ 
- **npm** 9+
- **git**

### Опциональные инструменты (устанавливаются скриптом):
- **Supabase CLI** - для работы с базой данных и функциями
- **Vercel CLI** - для развертывания фронтенда

## Переменные окружения

Скрипты работают с следующими переменными:

### .env.local (создается автоматически)
```bash
VITE_SUPABASE_URL=https://datoomsnmfuodecpbmpn.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### GitHub Secrets (настраиваются вручную)
```bash
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_ACCESS_TOKEN=your-access-token
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

## Troubleshooting

### Скрипт не запускается

```bash
# Проверьте права доступа
ls -l scripts/

# Сделайте исполняемым
chmod +x scripts/*.sh

# Запустите с bash явно
bash scripts/setup.sh
```

### Ошибка "Command not found"

```bash
# Убедитесь, что вы в корне проекта
pwd
# Должен быть: /path/to/asia-farm

# Проверьте путь к скрипту
ls scripts/setup.sh
```

### Ошибка прав доступа

```bash
# На macOS/Linux может требоваться sudo для глобальной установки
sudo npm install -g supabase
sudo npm install -g vercel
```

### Supabase CLI не работает

```bash
# Переустановите Supabase CLI
npm uninstall -g supabase
npm install -g supabase

# Войдите заново
supabase login
```

## Кастомизация скриптов

Скрипты можно модифицировать под свои нужды:

### Изменение Project ID

Откройте скрипт и измените переменную:

```bash
# В deploy-functions.sh
PROJECT_ID="your-project-id"

# В create-admin.sh
PROJECT_ID="your-project-id"
```

### Добавление новых команд

Вы можете создать свои скрипты в папке `/scripts/`:

```bash
#!/bin/bash
# scripts/my-custom-script.sh

echo "My custom script"
# Ваши команды здесь
```

Не забудьте сделать их исполняемыми:
```bash
chmod +x scripts/my-custom-script.sh
```

## CI/CD интеграция

Эти скрипты можно использовать в GitHub Actions:

```yaml
# .github/workflows/deploy.yml
- name: Deploy Edge Functions
  run: |
    chmod +x scripts/deploy-functions.sh
    ./scripts/deploy-functions.sh
```

## Автоматизация

### Добавить в package.json

```json
{
  "scripts": {
    "setup": "bash scripts/setup.sh",
    "deploy:functions": "bash scripts/deploy-functions.sh",
    "create:admin": "bash scripts/create-admin.sh"
  }
}
```

Использование:
```bash
npm run setup
npm run deploy:functions
npm run create:admin
```

## Поддержка

При проблемах со скриптами:
1. Проверьте права доступа (`chmod +x`)
2. Проверьте установку требуемых инструментов
3. Просмотрите логи ошибок
4. См. [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)

---

**Скрипты упрощают развертывание и управление проектом Asia Farm!**
