#!/bin/bash

# 🚀 Quick Start Script для Asia-Pharm
# Автоматический деплой проекта на Supabase

set -e  # Остановка при ошибке

echo "🌿 Asia-Pharm - Quick Start Script"
echo "====================================="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Проверка наличия Supabase CLI
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI не установлен!"
    echo "Установите: brew install supabase/tap/supabase"
    exit 1
fi

print_success "Supabase CLI установлен"

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js не установлен!"
    echo "Установите: https://nodejs.org/"
    exit 1
fi

print_success "Node.js установлен ($(node --version))"

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    print_error "npm не установлен!"
    exit 1
fi

print_success "npm установлен ($(npm --version))"

echo ""
print_info "Начинаем деплой..."
echo ""

# 1. Установка зависимостей
echo "📦 Шаг 1/4: Установка зависимостей..."
if [ ! -d "node_modules" ]; then
    npm install
    print_success "Зависимости установлены"
else
    print_info "Зависимости уже установлены (пропущено)"
fi

echo ""

# 2. Связывание с Supabase проектом
echo "🔗 Шаг 2/4: Связывание с Supabase..."
PROJECT_REF="hohhzspiylssmgdivajk"

if [ ! -f ".supabase/config.toml" ]; then
    print_info "Выполняется supabase link..."
    supabase link --project-ref $PROJECT_REF
    print_success "Связь с Supabase установлена"
else
    print_info "Проект уже связан с Supabase (пропущено)"
fi

echo ""

# 3. Деплой Edge Function
echo "⚡ Шаг 3/4: Деплой Edge Function..."
print_info "Деплой функции 'server'..."
supabase functions deploy server --project-ref $PROJECT_REF --no-verify-jwt

print_success "Edge Function задеплоена"

echo ""

# 4. Проверка работы API
echo "🔍 Шаг 4/4: Проверка работы API..."
API_URL="https://${PROJECT_REF}.supabase.co/functions/v1/make-server-a75b5353/"

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$response" = "200" ]; then
    print_success "API работает! (HTTP $response)"
else
    print_error "API не отвечает (HTTP $response)"
    print_info "Проверьте логи: supabase functions logs server --project-ref $PROJECT_REF"
fi

echo ""
echo "====================================="
print_success "Деплой завершен!"
echo ""

print_info "Следующие шаги:"
echo "1. Примените миграции БД (см. DEPLOY.md)"
echo "2. Создайте первого админа (см. DEPLOY.md)"
echo "3. Задеплойте на Vercel (см. DEPLOY.md)"
echo ""

print_info "Полезные команды:"
echo "  supabase functions logs server --project-ref $PROJECT_REF  # Логи функции"
echo "  curl $API_URL                                               # Проверка API"
echo "  npm run dev                                                 # Локальный запуск"
echo ""

print_info "Документация:"
echo "  DEPLOY.md     - Полная инструкция"
echo "  CHECKLIST.md  - Чеклист перед деплоем"
echo "  README.md     - Информация о проекте"
echo ""
